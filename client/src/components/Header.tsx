import { LucideStars, TextSearch } from 'lucide-react';
import React from 'react';

const Header: React.FC = () => {
    return (
        <header className="bg-white shadow-lg border-b border-gray-200">
            <div className="container mx-auto px-4 py-4">
                <div className="flex flex-wrap items-center justify-between gap-4">
                    {/* Left: Logo + Title */}
                    <div className="flex items-center space-x-3 flex-shrink-0">
                        <div className="p-2 bg-blue-600 rounded-lg">
                            <LucideStars className="h-8 w-8 text-white" />
                        </div>
                        <div>
                            <h1 className="text-xl sm:text-2xl font-bold text-gray-800">
                                AskPDF
                            </h1>
                            <p className="text-sm sm:text-base text-gray-600">
                                Chat with your documents
                            </p>
                        </div>
                    </div>
                    {/* Right: Description - hidden on small screens */}
                    <div className="hidden md:flex items-center space-x-2 text-gray-600 text-sm md:text-base">
                        <TextSearch className="h-5 w-5" />
                        <span className="text-left">
                            AI-Powered Document Analysis
                        </span>
                    </div>

                </div>
            </div>
        </header>
    );
};

export default Header;
