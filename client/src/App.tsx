import React, { useState, useEffect, useCallback } from 'react';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import type { Session } from './types';
import Header from './components/Header';
import SessionManager from './components/SessionManager';
import PDFUploader from './components/PdfUploader';
import ChatInterface from './components/ChatInterface';

const STORAGE_KEYS = {
  SESSIONS: 'askpdf-sessions',
  CURRENT_SESSION: 'askpdf-current-session',
  USER_ID: 'askpdf-user-id'
};

const MAX_SESSIONS_PER_USER = 3;

const App: React.FC = () => {
  const [currentSession, setCurrentSession] = useState<Session | null>(null);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showUploader, setShowUploader] = useState(false);
  const [dataLoaded, setDataLoaded] = useState(false); // Track loading state

  // Enhanced localStorage utilities with error handling
  const getStorageItem = useCallback(<T,>(key: string, defaultValue: T): T => {
    try {
      const item = localStorage.getItem(key);
      if (item === null) return defaultValue;

      const parsed = JSON.parse(item);
      return parsed;
    } catch {
      localStorage.removeItem(key); // Clean up corrupted data
      return defaultValue;
    }
  }, []);

  const setStorageItem = useCallback((key: string, value: any): boolean => {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch {
      toast.error(`Failed to save ${key.replace('askpdf-', '')}`);
      return false;
    }
  }, []);

  // Generate or retrieve user ID
  useEffect(() => {
    let userId = localStorage.getItem(STORAGE_KEYS.USER_ID);
    if (!userId) {
      userId = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      localStorage.setItem(STORAGE_KEYS.USER_ID, userId);
    }
  }, []);

  // 🔧 FIXED: Single useEffect for data loading with proper synchronization
  useEffect(() => {
    const loadPersistedData = async () => {

      try {
        // Load both pieces of data synchronously
        const loadedSessions = getStorageItem<Session[]>(STORAGE_KEYS.SESSIONS, []);
        const loadedCurrentSession = getStorageItem<Session | null>(STORAGE_KEYS.CURRENT_SESSION, null);

        // Validate current session exists in sessions array
        let validCurrentSession = loadedCurrentSession;
        if (loadedCurrentSession && loadedSessions.length > 0) {
          const sessionExists = loadedSessions.some(s => s.id === loadedCurrentSession.id);
          if (!sessionExists) {
            validCurrentSession = null;
            localStorage.removeItem(STORAGE_KEYS.CURRENT_SESSION);
          }
        }

        // Batch state updates using functional updates
        setSessions(() => {
          return loadedSessions;
        });

        setCurrentSession(() => {
          return validCurrentSession;
        });

        // Mark data as loaded
        setDataLoaded(true);

      } catch {

        // Reset to clean state
        setSessions([]);
        setCurrentSession(null);

        // Clear potentially corrupted localStorage
        Object.values(STORAGE_KEYS).forEach(key => {
          if (key !== STORAGE_KEYS.USER_ID) {
            localStorage.removeItem(key);
          }
        });

        setDataLoaded(true);
        toast.error('Failed to load saved data. Starting fresh.');
      }
    };

    loadPersistedData();
  }, []); // Run only once on mount

  // 🔧 FIXED: Separate useEffect for saving sessions with dependency on dataLoaded
  useEffect(() => {
    if (!dataLoaded) return; // Don't save during initial load

    setStorageItem(STORAGE_KEYS.SESSIONS, sessions);
  }, [sessions, dataLoaded, setStorageItem]);

  // 🔧 FIXED: Separate useEffect for saving current session with dependency on dataLoaded
  useEffect(() => {
    if (!dataLoaded) return; // Don't save during initial load

    if (currentSession) {
      setStorageItem(STORAGE_KEYS.CURRENT_SESSION, currentSession);
    } else {
      localStorage.removeItem(STORAGE_KEYS.CURRENT_SESSION);
    }
  }, [currentSession, dataLoaded, setStorageItem]);

  // Enhanced session creation with better state management
  const handleSessionCreated = useCallback((session: Session) => {
    if (sessions.length >= MAX_SESSIONS_PER_USER) {
      toast.error(`Maximum ${MAX_SESSIONS_PER_USER} sessions allowed. Please delete an existing session first.`);
      return;
    }

    const enhancedSession = {
      ...session,
      createdAt: new Date().toISOString(),
      lastActivity: new Date().toISOString()
    };


    // Use functional updates for better state consistency
    setSessions(prevSessions => {
      const newSessions = [enhancedSession, ...prevSessions];
      return newSessions;
    });

    setCurrentSession(enhancedSession);
    setShowUploader(false);
    toast.success(`Session "${session.name}" created successfully!`);
  }, [sessions.length]);

  // Enhanced session deletion with cleanup
  const handleSessionDeleted = useCallback((sessionId: string) => {

    setSessions(prevSessions => {
      const updatedSessions = prevSessions.filter(s => s.id !== sessionId);
      return updatedSessions;
    });

    // Clear current session if it's the one being deleted
    if (currentSession?.id === sessionId) {
      setCurrentSession(null);
    }

    toast.success('Session deleted successfully');
  }, [currentSession?.id]);

  const handleSessionSelect = useCallback((session: Session) => {
    setCurrentSession(session);
    setShowUploader(false);
  }, []);

  const handleNewSessionRequest = useCallback(() => {
    if (sessions.length >= MAX_SESSIONS_PER_USER) {
      toast.error(`You can only have ${MAX_SESSIONS_PER_USER} sessions maximum. Please delete an existing session first.`);
      return;
    }

    setShowUploader(true);
    setCurrentSession(null);
  }, [sessions.length]);

  const handleSessionUpdate = useCallback((updatedSession: Session) => {

    setCurrentSession(updatedSession);
    setSessions(prevSessions =>
      prevSessions.map(s => s.id === updatedSession.id ? updatedSession : s)
    );
  }, []);

  const shouldShowUploader = !currentSession && (sessions.length === 0 || showUploader);

  // Show loading state while data is being loaded
  if (!dataLoaded) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="bg-white rounded-xl shadow-lg p-8 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <h3 className="text-lg font-medium text-gray-800">Loading your sessions...</h3>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <Header />
      <div className="container mx-auto px-4 py-8">
        {/* Debug info - remove in production */}
        <div className="mb-4 p-2 rounded text-xs text-gray-600">
          Sessions: {sessions.length} | Current: {currentSession?.name || 'None'} | Data Loaded: {dataLoaded ? '✅' : '⏳'}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar */}
          <div className="lg:col-span-1">
            <SessionManager
              sessions={sessions}
              currentSession={currentSession}
              onSessionSelect={handleSessionSelect}
              onSessionDeleted={handleSessionDeleted}
              onNewSessionRequest={handleNewSessionRequest}
              isLoading={isLoading}
            />

            {/* Session limit info */}
            <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
              <h4 className="text-sm font-medium text-blue-800 mb-2">Session Status</h4>
              <div className="text-xs text-blue-700 space-y-1">
                <p>• Sessions: {sessions.length}/{MAX_SESSIONS_PER_USER}</p>
                <p>• Data synced with localStorage</p>
                <p>• Persistent across refreshes</p>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            {shouldShowUploader ? (
              <div className="space-y-8">
                <div className="text-center">
                  <h2 className="text-3xl font-bold text-gray-800 mb-4">
                    {sessions.length === 0 ? 'Welcome to AskPDF' : 'Create New Session'}
                  </h2>
                  <p className="text-lg text-gray-600 mb-8">
                    {sessions.length === 0
                      ? 'Upload a PDF document and start asking questions about its content'
                      : `Upload a new PDF to create another session (${sessions.length}/${MAX_SESSIONS_PER_USER} used)`
                    }
                  </p>
                </div>
                <PDFUploader
                  onSessionCreated={handleSessionCreated}
                  isLoading={isLoading}
                  setIsLoading={setIsLoading}
                  maxSessions={MAX_SESSIONS_PER_USER}
                  currentSessionCount={sessions.length}
                />
                {sessions.length > 0 && showUploader && (
                  <div className="text-center">
                    <button
                      onClick={() => setShowUploader(false)}
                      className="px-6 py-2 text-gray-600 hover:text-gray-800 transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                )}
              </div>
            ) : currentSession ? (
              <ChatInterface
                session={currentSession}
                onSessionUpdate={handleSessionUpdate}
              />
            ) : (
              <div className="bg-white rounded-xl shadow-lg p-8 text-center">
                <h3 className="text-xl font-semibold text-gray-800 mb-4">
                  Select a Session
                </h3>
                <p className="text-gray-600 mb-6">
                  Choose an existing session from the sidebar or create a new one to get started.
                </p>
                <button
                  onClick={handleNewSessionRequest}
                  disabled={sessions.length >= MAX_SESSIONS_PER_USER}
                  className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 
                           disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {sessions.length >= MAX_SESSIONS_PER_USER
                    ? `Session Limit Reached (${MAX_SESSIONS_PER_USER}/${MAX_SESSIONS_PER_USER})`
                    : 'Create New Session'
                  }
                </button>
              </div>
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
