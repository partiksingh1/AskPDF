// src/components/SessionManager.tsx
import React, { useState } from 'react';
import { toast } from 'react-toastify';
import type { Session } from '../types';
import { deleteSession } from '../api';
import { Clock, CloudCheck, Paperclip, TrashIcon } from 'lucide-react';

interface SessionManagerProps {
    sessions: Session[];
    currentSession: Session | null;
    onSessionSelect: (session: Session) => void;
    onSessionDeleted: (sessionId: string) => void;
    isLoading: boolean;
}

const SessionManager: React.FC<SessionManagerProps> = ({
    sessions,
    currentSession,
    onSessionSelect,
    onSessionDeleted,
    isLoading
}) => {
    const [deletingSession, setDeletingSession] = useState<string | null>(null);

    const handleDeleteSession = async (session: Session, e: React.MouseEvent) => {
        e.stopPropagation();

        if (window.confirm(`Are you sure you want to delete "${session.name}"? This will remove all chat history and processed data.`)) {
            setDeletingSession(session.id);
            try {
                await deleteSession(session.id);
                onSessionDeleted(session.id);
                toast.success('Session deleted successfully');
            } catch (error) {
                toast.error('Failed to delete session');
                console.error('Delete session error:', error);
            } finally {
                setDeletingSession(null);
            }
        }
    };

    const formatTimeAgo = (dateString: string) => {
        const now = new Date();
        const date = new Date(dateString);
        const diffMs = now.getTime() - date.getTime();
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);

        if (diffMins < 1) return 'Just now';
        if (diffMins < 60) return `${diffMins}m ago`;
        if (diffHours < 24) return `${diffHours}h ago`;
        if (diffDays < 7) return `${diffDays}d ago`;
        return date.toLocaleDateString();
    };

    return (
        <div className="bg-white rounded-xl shadow-lg">
            <div className="p-6 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-800 flex items-center space-x-2">
                    <Paperclip className="h-5 w-5" />
                    <span>Chat Sessions</span>
                </h3>
                <p className="text-sm text-gray-600 mt-1">
                    {sessions.length} session{sessions.length !== 1 ? 's' : ''}
                </p>
            </div>

            <div className="max-h-96 overflow-y-auto">
                {sessions.length === 0 ? (
                    <div className="p-6 text-center text-gray-500">
                        <CloudCheck className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                        <p className="text-sm">No sessions yet</p>
                        <p className="text-xs mt-1">Upload a PDF to get started</p>
                    </div>
                ) : (
                    <div className="space-y-2 p-4">
                        {sessions.map((session) => (
                            <div
                                key={session.id}
                                onClick={() => onSessionSelect(session)}
                                className={`p-4 rounded-lg border-2 cursor-pointer transition-all duration-200 group ${currentSession?.id === session.id
                                    ? 'border-blue-500 bg-blue-50'
                                    : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                                    }`}
                            >
                                <div className="flex justify-between items-start">
                                    <div className="flex-1 min-w-0">
                                        <h4 className="font-medium text-gray-800 truncate mb-1">
                                            {session.name}
                                        </h4>
                                        <div className="flex items-center space-x-3 text-xs text-gray-500">
                                            <div className="flex items-center space-x-1">
                                                <Paperclip className="h-3 w-3" />
                                                <span>{session.chunks} chunks</span>
                                            </div>
                                            <div className="flex items-center space-x-1">
                                                <Clock className="h-3 w-3" />
                                                <span>{formatTimeAgo(session.lastActivity)}</span>
                                            </div>
                                        </div>
                                    </div>

                                    <button
                                        onClick={(e) => handleDeleteSession(session, e)}
                                        disabled={deletingSession === session.id}
                                        className="opacity-0 group-hover:opacity-100 p-1 text-gray-400 hover:text-red-600 
                             hover:bg-red-50 rounded transition-all duration-200 ml-2"
                                        title="Delete session"
                                    >
                                        {deletingSession === session.id ? (
                                            <div className="animate-spin h-4 w-4 border-2 border-red-600 border-t-transparent rounded-full" />
                                        ) : (
                                            <TrashIcon className="h-4 w-4" />
                                        )}
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default SessionManager;