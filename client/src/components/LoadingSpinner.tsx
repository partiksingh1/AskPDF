// src/components/LoadingSpinner.tsx
import React from 'react';

interface LoadingSpinnerProps {
    size?: 'sm' | 'md' | 'lg';
    color?: 'blue' | 'gray' | 'white';
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
    size = 'md',
    color = 'blue'
}) => {
    const sizeClasses = {
        sm: 'h-4 w-4 border-2',
        md: 'h-8 w-8 border-3',
        lg: 'h-12 w-12 border-4'
    };

    const colorClasses = {
        blue: 'border-blue-600 border-t-transparent',
        gray: 'border-gray-600 border-t-transparent',
        white: 'border-white border-t-transparent'
    };

    return (
        <div className={`animate-spin rounded-full ${sizeClasses[size]} ${colorClasses[color]}`} />
    );
};

export default LoadingSpinner;