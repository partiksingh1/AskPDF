import { ChatPromptTemplate } from "@langchain/core/prompts";
import { model } from "../utils/ai.js";
import { vectorStore } from "../services/vectorStore.js"; // use existing initialized vectorStore
import { StateGraph, Annotation } from "@langchain/langgraph";
import { BaseMessage, HumanMessage, AIMessage, type HumanMessageFields } from "@langchain/core/messages";
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
    const retriever = vectorStore.asRetriever({
        k: 5,
        filter: { sessionId: state.sessionId } // <-- Important for session-specific context
    });

    const docs = await retriever.invoke(state.question);
    const context = docs.map((doc: Document) => doc.pageContent).join('\n\n');

    return { context };
};

const generateAnswer = async (state: ConversationState) => {
    try {
        const redisKey = `chat_history:${state.sessionId}`;
        const historyJson = await redis.get(redisKey);
        const rawHistory = historyJson ? JSON.parse(historyJson) : [];

        // Fix: Deserialize into HumanMessage / AIMessage
        const chatHistory: BaseMessage[] = rawHistory.map((msg: { type: string; content: string | HumanMessageFields; }) => {
            if (msg.type === "human") return new HumanMessage(msg.content);
            if (msg.type === "ai") return new AIMessage(msg.content);
            throw new Error(`Unknown message type: ${msg.type}`);
        });

        const recentHistory = chatHistory.slice(-6);

        const conversationContext = recentHistory.length > 0
            ? recentHistory.map(msg => `${msg._getType()}: ${msg.content}`).join('\n')
            : '';
        const prompt = ChatPromptTemplate.fromTemplate(`
                You are an AI assistant that answers questions based only on the provided document context and prior conversation history.
                
                Conversation History:
                {conversationHistory}
                
                Document Context:
                {context}
                
                User Question:
                {question}
                
                Instructions:
                1. Use only the Document Context to answer the question.
                2. If the answer is not found in the Document Context, respond with: "The provided documents do not contain enough information to answer this question."
                3. Use the Conversation History to understand user intent or clarify ambiguities, but not as a source of factual information.
                4. Do not use information outside the Document Context.
                5. Keep your answers concise and relevant.
                6. If appropriate, refer directly to phrases or sections from the Document Context.
                7. Do not make assumptions or invent facts.
                
                Answer:
                `);

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
        console.error(error);

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
