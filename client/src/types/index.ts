// src/types/index.ts
export interface Session {
    id: string;
    name: string;
    createdAt: string;
    chunks: number;
    lastActivity: string;
}

export interface ChatMessage {
    type: 'human' | 'ai';
    content: string;
    timestamp?: string;
}

export interface ChatHistory {
    sessionId: string;
    history: ChatMessage[];
}

export interface UploadResponse {
    message: string;
    sessionId: string;
    chunks: number;
}

export interface SearchResponse {
    message: string;
    answer: string;
    sessionId: string;
    conversationLength: number;
}

export interface ApiError {
    message: string;
    error?: string;
}