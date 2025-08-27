import { LucideStars, TextSearch } from 'lucide-react';
import React from 'react';

const Header: React.FC = () => {
    return (
        <header className="bg-white shadow-lg border-b border-gray-200">
            <div className="container mx-auto px-4 py-6">
                <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                        <div className="p-2 bg-blue-600 rounded-lg">
                            <LucideStars className="h-8 w-8 text-white" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold text-gray-800">AskPDF</h1>
                            <p className="text-sm text-gray-600">Chat with your documents</p>
                        </div>
                    </div>

                    <div className="flex items-center space-x-2 text-gray-600">
                        <TextSearch className="h-5 w-5" />
                        <span className="text-sm">AI-Powered Document Analysis</span>
                    </div>
                </div>
            </div>
        </header>
    );
};

export default Header;