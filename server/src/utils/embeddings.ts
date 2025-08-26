import { VertexAIEmbeddings } from "@langchain/google-vertexai";

export const embeddings = new VertexAIEmbeddings({
    model: "text-embedding-005"
});