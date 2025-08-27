import React, { useState, useRef } from 'react';
import { toast } from 'react-toastify';
import type { Session } from '../types';
import { uploadPDF } from '../api';
import { CloudIcon, Paperclip, PaperclipIcon, AlertTriangle } from 'lucide-react';
import LoadingSpinner from './LoadingSpinner';

interface PDFUploaderProps {
    onSessionCreated: (session: Session) => void;
    isLoading: boolean;
    setIsLoading: (loading: boolean) => void;
    maxSessions: number;
    currentSessionCount: number;
}

const PDFUploader: React.FC<PDFUploaderProps> = ({
    onSessionCreated,
    isLoading,
    setIsLoading,
    maxSessions,
    currentSessionCount
}) => {
    const [dragOver, setDragOver] = useState(false);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const canUpload = currentSessionCount < maxSessions;

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        if (canUpload) {
            setDragOver(true);
        }
    };

    const handleDragLeave = (e: React.DragEvent) => {
        e.preventDefault();
        setDragOver(false);
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setDragOver(false);

        if (!canUpload) {
            toast.error(`Maximum ${maxSessions} sessions allowed. Delete an existing session first.`);
            return;
        }

        const files = Array.from(e.dataTransfer.files);
        const pdfFile = files.find(file => file.type === 'application/pdf');

        if (pdfFile) {
            setSelectedFile(pdfFile);
        } else {
            toast.error('Please select a valid PDF file');
        }
    };

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!canUpload) {
            toast.error(`Maximum ${maxSessions} sessions allowed. Delete an existing session first.`);
            return;
        }

        const file = e.target.files?.[0];
        if (file && file.type === 'application/pdf') {
            setSelectedFile(file);
        } else {
            toast.error('Please select a valid PDF file');
        }
    };

    const handleUpload = async () => {
        if (!selectedFile) {
            toast.error('Please select a PDF file first');
            return;
        }

        if (!canUpload) {
            toast.error(`Maximum ${maxSessions} sessions allowed. Delete an existing session first.`);
            return;
        }

        setIsLoading(true);

        try {
            const response = await uploadPDF(selectedFile);

            const session: Session = {
                id: response.sessionId,
                name: selectedFile.name.replace('.pdf', ''),
                createdAt: new Date().toISOString(),
                chunks: response.chunks,
                lastActivity: new Date().toISOString()
            };

            onSessionCreated(session);
            setSelectedFile(null);
            toast.success(`PDF uploaded successfully! ${response.chunks} chunks processed.`);
        } catch (error) {
            toast.error('Failed to upload PDF. Please try again.');
            console.error('Upload error:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const removeSelectedFile = () => {
        setSelectedFile(null);
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    if (!canUpload) {
        return (
            <div className="bg-white rounded-xl shadow-lg p-8">
                <div className="border-2 border-dashed border-red-300 bg-red-50 rounded-lg p-8 text-center">
                    <AlertTriangle className="h-16 w-16 text-red-400 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-red-800 mb-2">
                        Session Limit Reached
                    </h3>
                    <p className="text-red-700 mb-4">
                        You've reached the maximum of {maxSessions} sessions ({currentSessionCount}/{maxSessions}).
                    </p>
                    <p className="text-sm text-red-600">
                        Please delete an existing session before creating a new one.
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-xl shadow-lg p-8">
            {/* Session counter */}
            <div className="mb-4 p-3 bg-blue-50 rounded-lg">
                <div className="flex items-center justify-between text-sm">
                    <span className="text-blue-700">
                        Sessions: {currentSessionCount}/{maxSessions}
                    </span>
                    <span className="text-blue-600">
                        {maxSessions - currentSessionCount} remaining
                    </span>
                </div>
            </div>

            <div
                className={`border-2 border-dashed rounded-lg p-8 text-center transition-all duration-300 ${dragOver
                    ? 'border-blue-400 bg-blue-50'
                    : selectedFile
                        ? 'border-green-400 bg-green-50'
                        : 'border-gray-300 hover:border-gray-400'
                    }`}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
            >
                {selectedFile ? (
                    <div className="space-y-4">
                        <Paperclip className="h-16 w-16 text-green-500 mx-auto" />
                        <div>
                            <h3 className="text-lg font-semibold text-gray-800">
                                {selectedFile.name}
                            </h3>
                            <p className="text-sm text-gray-600">
                                {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                            </p>
                        </div>
                        <div className="flex justify-center space-x-4">
                            <button
                                onClick={handleUpload}
                                disabled={isLoading}
                                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 
                                         disabled:opacity-50 disabled:cursor-not-allowed transition-colors
                                         flex items-center space-x-2"
                            >
                                {isLoading ? (
                                    <LoadingSpinner size="sm" />
                                ) : (
                                    <CloudIcon className="h-5 w-5" />
                                )}
                                <span>{isLoading ? 'Processing...' : 'Create Session'}</span>
                            </button>
                            <button
                                onClick={removeSelectedFile}
                                disabled={isLoading}
                                className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 
                                         disabled:opacity-50 transition-colors"
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                ) : (
                    <div className="space-y-4">
                        <CloudIcon className="h-16 w-16 text-gray-400 mx-auto" />
                        <div>
                            <h3 className="text-lg font-semibold text-gray-800">
                                Upload your PDF document
                            </h3>
                            <p className="text-gray-600">
                                Drag and drop your PDF here, or click to select a file
                            </p>
                        </div>
                        <button
                            onClick={() => fileInputRef.current?.click()}
                            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 
                                     transition-colors inline-flex items-center space-x-2"
                        >
                            <PaperclipIcon className="h-5 w-5" />
                            <span>Select PDF File</span>
                        </button>
                    </div>
                )}
            </div>

            <input
                ref={fileInputRef}
                type="file"
                accept=".pdf"
                onChange={handleFileSelect}
                className="hidden"
            />

            <div className="mt-6 text-sm text-gray-500 text-center space-y-1">
                <p>Supported format: PDF files up to 50MB</p>
                <p>Your document will be processed and ready for questions in seconds</p>
                <p className="text-xs">
                    Session {currentSessionCount + 1} of {maxSessions} •
                    {maxSessions - currentSessionCount - 1} more sessions available after this
                </p>
            </div>
        </div>
    );
};

export default PDFUploader;