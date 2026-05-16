'use client';

import { Loader2 } from 'lucide-react';

interface LoadingSpinnerProps {
  text?: string;
  className?: string;
}

export function LoadingSpinner({ text, className = '' }: LoadingSpinnerProps) {
  return (
    <div className={`flex flex-col items-center justify-center p-4 ${className}`}>
      <Loader2 className="h-8 w-8 text-primary-sunai animate-spin mb-2" />
      {text && <p className="text-gray-500 font-medium text-sm animate-pulse">{text}</p>}
    </div>
  );
}
