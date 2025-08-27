// src/App.tsx
import React, { useState, useEffect } from 'react';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import type { Session } from './types';
import Header from './components/Header';
import SessionManager from './components/SessionManager';
import PDFUploader from './components/PdfUploader';
import ChatInterface from './components/ChatInterface';

const App: React.FC = () => {
  const [currentSession, setCurrentSession] = useState<Session | null>(null);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // Load sessions from localStorage on app start
    const savedSessions = localStorage.getItem('askpdf-sessions');
    if (savedSessions) {
      const parsedSessions = JSON.parse(savedSessions);
      setSessions(parsedSessions);
    }
  }, []);

  useEffect(() => {
    // Save sessions to localStorage whenever sessions change
    localStorage.setItem('askpdf-sessions', JSON.stringify(sessions));
  }, [sessions]);

  const handleSessionCreated = (session: Session) => {
    setSessions(prev => [session, ...prev]);
    setCurrentSession(session);
  };

  const handleSessionDeleted = (sessionId: string) => {
    setSessions(prev => prev.filter(s => s.id !== sessionId));
    if (currentSession?.id === sessionId) {
      setCurrentSession(null);
    }
  };

  const handleSessionSelect = (session: Session) => {
    setCurrentSession(session);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <Header />

      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar */}
          <div className="lg:col-span-1">
            <SessionManager
              sessions={sessions}
              currentSession={currentSession}
              onSessionSelect={handleSessionSelect}
              onSessionDeleted={handleSessionDeleted}
              isLoading={isLoading}
            />
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            {!currentSession ? (
              <div className="space-y-8">
                <div className="text-center">
                  <h2 className="text-3xl font-bold text-gray-800 mb-4">
                    Welcome to AskPDF
                  </h2>
                  <p className="text-lg text-gray-600 mb-8">
                    Upload a PDF document and start asking questions about its content
                  </p>
                </div>

                <PDFUploader
                  onSessionCreated={handleSessionCreated}
                  isLoading={isLoading}
                  setIsLoading={setIsLoading}
                />
              </div>
            ) : (
              <ChatInterface
                session={currentSession}
                onSessionUpdate={(updatedSession) => {
                  setCurrentSession(updatedSession);
                  setSessions(prev =>
                    prev.map(s => s.id === updatedSession.id ? updatedSession : s)
                  );
                }}
              />
            )}
          </div>
        </div>
      </div>

      <ToastContainer
        position="top-right"
        autoClose={5000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="light"
      />
    </div>
  );
};

export default App;