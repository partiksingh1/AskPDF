import type { Request, Response } from "express";
import fs from 'fs';
import { loadPdfContent } from "../services/pdfLoader.js";
import { splitIntoChunks } from "../services/textSplitter.js";
import { vectorStore } from "../services/vectorStore.js";
import { createChatWorkflow } from "../utils/graph.js";
import { v4 as uuidv4 } from 'uuid';
import { redis } from "../utils/redisClient.js";
export const upload_pdf = async (req: Request, res: Response) => {
    if (!req.file || req.file.mimetype !== 'application/pdf') {
        return res.status(400).json({ message: "Invalid file type. Only PDFs allowed." });
    }

    try {
        const sessionId = uuidv4();
        const docs = await loadPdfContent(req.file.path);
        const chunks = await splitIntoChunks(docs);
        if (chunks.length > 5000) {
            return res.status(400).json({ message: "File too large to process" });
        }
        const chunksWithSession = chunks.map((chunk) => {
            chunk.metadata = {
                ...chunk.metadata,
                sessionId: sessionId,
            };
            return chunk;
        });
        await vectorStore.addDocuments(chunksWithSession);
        await redis.set(`chat_history:${sessionId}`, JSON.stringify([]));
        res.status(200).json({
            message: "PDF uploaded and processed.",
            sessionId: sessionId,
            chunks: chunks.length,
        });
    } catch (err) {
        res.status(500).json({ message: "Failed to process PDF." });
    } finally {
        fs.promises.unlink(req.file.path)
    }
};

export const search = async (req: Request, res: Response) => {
    try {
        const { question, sessionId } = req.body;

        if (!question) {
            return res.status(400).json({
                message: "Missing 'question' in request body"
            });
        }

        if (typeof question !== 'string') {
            return res.status(400).json({
                message: "Question must be a string"
            });
        }

        // Fetch history from Redis or DB
        const historyJson = await redis.get(`chat_history:${sessionId}`);
        if (!historyJson) {
            return res.status(404).json({ message: "Session not found." });
        }

        if (!question || typeof question !== 'string') {
            return res.status(400).json({ message: "Invalid question" });
        }

        // Create and run the workflow
        const app = createChatWorkflow();

        const result = await app.invoke({
            question: question.trim(),
            sessionId: sessionId
        });

        // Save question and answer in history
        const history = JSON.parse(historyJson);
        history.push({ type: "human", content: question });
        history.push({ type: "ai", content: result.answer });

        // Save updated history back
        await redis.set(`chat_history:${sessionId}`, JSON.stringify(history));

        return res.status(200).json({
            message: "Search successful",
            answer: result.answer,
            sessionId: sessionId,
            conversationLength: history.length,
        });

    } catch (error) {
        return res.status(500).json({
            message: "Internal server error in search",
            error: (error as Error).message || "Unknown error"
        });
    }
};

// Additional endpoint to get chat history
export const get_chat_history = async (req: Request, res: Response) => {
    try {
        const { sessionId } = req.params;
        if (!sessionId) {
            return res.status(400).json({ message: "Missing sessionId parameter" });
        }
        const historyJson = await redis.get(`chat_history:${sessionId}`);
        const history = historyJson ? JSON.parse(historyJson) : [];
        return res.status(200).json({
            sessionId,
            history: history
        });
    } catch (error) {
        return res.status(500).json({
            message: "Failed to retrieve chat history",
            error: (error as Error).message || "Unknown error"
        });
    }
};

// Clear chat history for a session
export const clear_chat_history = async (req: Request, res: Response) => {
    try {
        const { sessionId } = req.params;
        if (!sessionId) {
            return res.status(400).json({ message: "Missing sessionId parameter" });
        }
        await redis.set(`chat_history:${sessionId}`, JSON.stringify([]));

        return res.status(200).json({
            message: "Chat history cleared successfully",
            sessionId
        });
    } catch (error) {
        return res.status(500).json({
            message: "Failed to clear chat history",
            error: (error as Error).message || "Unknown error"
        });
    }
};
// Delete an entire session (chat + vector data)
export const delete_session = async (req: Request, res: Response) => {
    try {
        const { sessionId } = req.params;

        if (!sessionId) {
            return res.status(400).json({ message: "Missing sessionId parameter" });
        }

        // 2. Delete chat history from in-memory store (if applicable)
        await redis.del(`chat_history:${sessionId}`);

        // 3. Delete embeddings from vector store
        await vectorStore.delete({
            filter: {
                sessionId: sessionId
            }
        });

        return res.status(200).json({
            message: "Session deleted successfully",
            sessionId
        });

    } catch (error) {
        return res.status(500).json({
            message: "Failed to delete session",
            error: (error as Error).message || "Unknown error"
        });
    }
};

