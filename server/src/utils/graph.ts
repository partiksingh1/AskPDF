import { ChatPromptTemplate } from "@langchain/core/prompts";
import { model } from "../utils/ai.js";
import { vectorStore } from "../services/vectorStore.js"; // use existing initialized vectorStore
import { StateGraph, Annotation } from "@langchain/langgraph";
import { BaseMessage, HumanMessage, AIMessage } from "@langchain/core/messages";
import { Document } from "@langchain/core/documents";
import { redis } from "./redisClient.js";

// Define the LangGraph state using Annotation
const StateAnnotation = Annotation.Root({
    messages: Annotation<BaseMessage[]>({
        reducer: (x, y) => x.concat(y),
        default: () => [],
    }),
    question: Annotation<string>({
        reducer: (x, y) => y ?? x,
        default: () => "",
    }),
    context: Annotation<string>({
        reducer: (x, y) => y ?? x,
        default: () => "",
    }),
    answer: Annotation<string>({
        reducer: (x, y) => y ?? x,
        default: () => "",
    }),
    sessionId: Annotation<string>({
        reducer: (x, y) => y ?? x,
        default: () => "default",
    }),
});

type ConversationState = typeof StateAnnotation.State;

const retrieveDocuments = async (state: ConversationState) => {
    try {
        const retriever = vectorStore.asRetriever({
            k: 5,
            filter: { sessionId: state.sessionId } // <-- Important for session-specific context
        });

        const docs = await retriever.invoke(state.question);
        const context = docs.map((doc: Document) => doc.pageContent).join('\n\n');

        return { context };
    } catch (error) {
        throw error;
    }
};

const generateAnswer = async (state: ConversationState) => {
    try {
        const redisKey = `chat_history:${state.sessionId}`;
        const historyJson = await redis.get(redisKey);
        const rawHistory = historyJson ? JSON.parse(historyJson) : [];

        // Fix: Deserialize into HumanMessage / AIMessage
        const chatHistory: BaseMessage[] = rawHistory.map((msg: any) => {
            if (msg.type === "human") return new HumanMessage(msg.content);
            if (msg.type === "ai") return new AIMessage(msg.content);
            throw new Error(`Unknown message type: ${msg.type}`);
        });

        const recentHistory = chatHistory.slice(-6);

        const conversationContext = recentHistory.length > 0
            ? recentHistory.map(msg => `${msg._getType()}: ${msg.content}`).join('\n')
            : '';
        const prompt = ChatPromptTemplate.fromTemplate(`
You are a helpful AI assistant that answers questions based on the provided context and conversation history.

Conversation History:
{conversationHistory}

Current Context from Documents:
{context}

Current Question: {question}

Instructions:
1. Answer based primarily on the document context provided
2. Consider the conversation history for better understanding
3. If the information is not in the context, say so clearly
4. Be concise but comprehensive
5. Reference specific parts of the documents when relevant

Answer:`);

        const formattedPrompt = await prompt.invoke({
            conversationHistory: conversationContext,
            context: state.context,
            question: state.question
        });

        const response = await model.invoke(formattedPrompt);
        const answer = typeof response.content === 'string' ? response.content : response.content.toString();

        // Update history
        const updatedHistory = [
            ...recentHistory,
            new HumanMessage(state.question),
            new AIMessage(answer)
        ];

        await redis.set(redisKey, JSON.stringify(updatedHistory));

        return {
            answer,
            messages: [new HumanMessage(state.question), new AIMessage(answer)]
        };
    } catch (error) {
        throw error;
    }
};

// Create and export the LangGraph workflow
export const createChatWorkflow = () => {
    const workflow = new StateGraph(StateAnnotation)
        .addNode("retrieve", retrieveDocuments)
        .addNode("generate", generateAnswer)
        .addEdge("__start__", "retrieve")
        .addEdge("retrieve", "generate")
        .addEdge("generate", "__end__");

    return workflow.compile();
};
