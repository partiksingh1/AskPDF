import { embeddings } from "../utils/embeddings.js";
import { NeonPostgres } from '@langchain/community/vectorstores/neon';
import dotenv from 'dotenv';
dotenv.config();

export async function loadVectorStore() {
    return await NeonPostgres.initialize(embeddings, {
        connectionString: process.env.POSTGRES_URL as string,
    });
}

export const vectorStore = await loadVectorStore();