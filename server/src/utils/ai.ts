import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
export const model = new ChatGoogleGenerativeAI({
    model: "gemini-2.0-flash",
    temperature: 0
})
