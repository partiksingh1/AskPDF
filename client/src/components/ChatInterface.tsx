import { useEffect, useRef, useState } from "react";
import type { ChatMessage, Session } from "../types";
import { clearChatHistory, getChatHistory, searchDocument } from "../api";
import { toast } from "react-toastify";
import LoadingSpinner from "./LoadingSpinner";
import { SendHorizonal, TrashIcon } from "lucide-react";
import ChatMessageComponent from "./ChatMessage";

interface ChatInterfaceProps {
  session: Session;
  onSessionUpdate: (session: Session) => void;
}

const ChatInterface: React.FC<ChatInterfaceProps> = ({ session, onSessionUpdate }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    loadChatHistory();
  }, [session.id]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const loadChatHistory = async () => {
    setIsLoadingHistory(true);
    try {
      const history = await getChatHistory(session.id);
      setMessages(history.history || []);
    } catch (error) {
      toast.error('Failed to load chat history');
    } finally {
      setIsLoadingHistory(false);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!inputValue.trim() || isLoading) return;

    const question = inputValue.trim();
    setInputValue('');
    setIsLoading(true);

    // Add user message immediately
    const userMessage: ChatMessage = {
      type: 'human',
      content: question,
      timestamp: new Date().toISOString()
    };

    setMessages(prev => [...prev, userMessage]);

    try {
      const response = await searchDocument(question, session.id);

      const aiMessage: ChatMessage = {
        type: 'ai',
        content: response.answer,
        timestamp: new Date().toISOString()
      };

      setMessages(prev => [...prev, aiMessage]);

      // Update session last activity
      const updatedSession = {
        ...session,
        lastActivity: new Date().toISOString()
      };
      onSessionUpdate(updatedSession);

    } catch (error) {
      const errorMessage: ChatMessage = {
        type: 'ai',
        content: 'Sorry, I encountered an error processing your question. Please try again.',
        timestamp: new Date().toISOString()
      };
      setMessages(prev => [...prev, errorMessage]);
      toast.error('Failed to get response. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearHistory = async () => {
    if (window.confirm('Are you sure you want to clear the chat history? This action cannot be undone.')) {
      try {
        await clearChatHistory(session.id);
        setMessages([]);
        toast.success('Chat history cleared successfully');
      } catch (error) {
        toast.error('Failed to clear chat history');
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e as any);
    }
  };

  const adjustTextareaHeight = () => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`;
    }
  };

  useEffect(() => {
    adjustTextareaHeight();
  }, [inputValue]);

  return (
    <div className="bg-white rounded-xl shadow-lg h-[600px] flex flex-col">
      {/* Header */}
      <div className="p-6 border-b border-gray-200 flex justify-between items-center">
        <div>
          <h2 className="text-xl font-semibold text-gray-800">{session.name}</h2>
        </div>
        <button
          onClick={handleClearHistory}
          className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
          title="Clear chat history"
        >
          <TrashIcon className="h-5 w-5" />
        </button>
      </div>

      {/* Messages Container */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        {isLoadingHistory ? (
          <div className="flex justify-center py-8">
            <LoadingSpinner />
          </div>
        ) : messages.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <p className="text-lg mb-2">👋 Ready to chat!</p>
            <p>Ask any question about your PDF document.</p>
          </div>
        ) : (
          messages.map((message, index) => (
            <ChatMessageComponent key={index} message={message} />
          ))
        )}

        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-gray-100 rounded-lg p-4 max-w-[80%]">
              <div className="flex items-center space-x-2">
                <LoadingSpinner size="sm" />
                <span className="text-gray-600">AI is thinking...</span>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Form */}
      <form onSubmit={handleSubmit} className="p-6 border-t border-gray-200">
        <div className="flex space-x-4">
          <div className="flex-1">
            <textarea
              ref={textareaRef}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask a question about your PDF..."
              className="w-full p-3 border border-gray-300 rounded-lg resize-none focus:ring-2 
                       focus:ring-blue-500 focus:border-transparent transition-all duration-200"
              rows={1}
              disabled={isLoading}
            />
          </div>
          <button
            type="submit"
            disabled={!inputValue.trim() || isLoading}
            className="px-6 bg-blue-600 text-white rounded-lg hover:bg-blue-700 
                     disabled:opacity-50 disabled:cursor-not-allowed transition-colors
                     flex items-center space-x-2"
          >
            <SendHorizonal />
          </button>
        </div>
        <div className="mt-2 text-xs text-gray-500">
          Press Enter to send, Shift+Enter for new line
        </div>
      </form>
    </div>
  );
};

export default ChatInterface;