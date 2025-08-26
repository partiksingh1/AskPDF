import { RecursiveCharacterTextSplitter } from "langchain/text_splitter";
import type { Document } from "langchain/document";

export const splitIntoChunks = async (docs: Document[]) => {
    try {
        const splitter = new RecursiveCharacterTextSplitter({
            chunkSize: 1000,
            chunkOverlap: 200,
        });

        const chunks = await splitter.splitDocuments(docs);
        return chunks;
    } catch (err) {
        console.error("Error splitting documents:", err);
        throw new Error("Failed to split document into chunks.");
    }
};
