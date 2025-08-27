import type { ApiError, ChatHistory, SearchResponse, UploadResponse } from "../types";

const API_BASE_URL = 'http://localhost:3000/api/v1';

class ApiClient {
    private async request<T>(
        endpoint: string,
        options: RequestInit = {}
    ): Promise<T> {
        const url = `${API_BASE_URL}${endpoint}`;

        const response = await fetch(url, {
            headers: {
                'Content-Type': 'application/json',
                ...options.headers,
            },
            ...options,
        });

        if (!response.ok) {
            const errorData: ApiError = await response.json().catch(() => ({
                message: 'Network error occurred'
            }));
            throw new Error(errorData.message || `HTTP ${response.status}`);
        }

        return response.json();
    }

    async uploadPDF(file: File): Promise<UploadResponse> {
        const formData = new FormData();
        formData.append('pdfFile', file);

        const response = await fetch(`${API_BASE_URL}/upload-pdf`, {
            method: 'POST',
            body: formData,
        });

        if (!response.ok) {
            const errorData: ApiError = await response.json().catch(() => ({
                message: 'Upload failed'
            }));
            throw new Error(errorData.message || `HTTP ${response.status}`);
        }

        return response.json();
    }

    async searchDocument(question: string, sessionId: string): Promise<SearchResponse> {
        return this.request<SearchResponse>('/search', {
            method: 'POST',
            body: JSON.stringify({ question, sessionId }),
        });
    }

    async getChatHistory(sessionId: string): Promise<ChatHistory> {
        return this.request<ChatHistory>(`/history/${sessionId}`);
    }

    async clearChatHistory(sessionId: string): Promise<{ message: string; sessionId: string }> {
        return this.request(`/history/${sessionId}`, {
            method: 'DELETE',
        });
    }

    async deleteSession(sessionId: string): Promise<{ message: string; sessionId: string }> {
        return this.request(`/session/${sessionId}`, {
            method: 'DELETE',
        });
    }
}

const apiClient = new ApiClient();

export const uploadPDF = apiClient.uploadPDF.bind(apiClient);
export const searchDocument = apiClient.searchDocument.bind(apiClient);
export const getChatHistory = apiClient.getChatHistory.bind(apiClient);
export const clearChatHistory = apiClient.clearChatHistory.bind(apiClient);
export const deleteSession = apiClient.deleteSession.bind(apiClient);