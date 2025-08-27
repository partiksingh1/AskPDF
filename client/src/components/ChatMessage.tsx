// src/components/ChatMessage.tsx
import { CpuIcon, UserIcon } from 'lucide-react';
import React from 'react';
import type { ChatMessage } from '../types';

interface ChatMessageProps {
    message: ChatMessage;
}

const ChatMessageComponent: React.FC<ChatMessageProps> = ({ message }) => {
    const isHuman = message.type === 'human';

    return (
        <div className={`flex ${isHuman ? 'justify-end' : 'justify-start'} mb-4`}>
            <div className={`flex max-w-[80%] ${isHuman ? 'flex-row-reverse' : 'flex-row'} items-start space-x-3`}>
                {/* Avatar */}
                <div className={`flex-shrink-0 ${isHuman ? 'ml-3' : 'mr-3'}`}>
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${isHuman ? 'bg-blue-600' : 'bg-green-600'
                        }`}>
                        {isHuman ? (
                            <UserIcon className="h-5 w-5 text-white" />
                        ) : (
                            <CpuIcon className="h-5 w-5 text-white" />
                        )}
                    </div>
                </div>

                {/* Message Bubble */}
                <div className={`rounded-lg p-4 ${isHuman
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-800 border border-gray-200'
                    }`}>
                    <div className="whitespace-pre-wrap break-words">{message.content}</div>
                    {message.timestamp && (
                        <div className={`text-xs mt-2 ${isHuman ? 'text-blue-100' : 'text-gray-500'
                            }`}>
                            {new Date(message.timestamp).toLocaleTimeString()}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ChatMessageComponent;