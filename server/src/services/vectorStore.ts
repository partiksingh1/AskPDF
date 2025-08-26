import { PGVectorStore, type DistanceStrategy } from "@langchain/community/vectorstores/pgvector";
import { embeddings } from "../utils/embeddings.js";
import type { PoolConfig } from "pg";
// Sample config
const config = {
    postgresConnectionOptions: {
        type: "postgres",
        host: "127.0.0.1",
        port: 6024,
        user: "langchain",
        password: "langchain",
    } as PoolConfig,
    tableName: "testlangchainjs",
    columns: {
        idColumnName: "id",
        vectorColumnName: "vector",
        contentColumnName: "content",
        metadataColumnName: "metadata",
    },
    // supported distance strategies: cosine (default), innerProduct, or euclidean
    distanceStrategy: "cosine" as DistanceStrategy,
};


export const vectorStore = await PGVectorStore.initialize(embeddings, config);