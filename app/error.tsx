'use client';
import { useEffect } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error(error);
  }, [error]);

  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center p-6 text-center animate-in fade-in">
      <div className="bg-red-50 p-6 rounded-full mb-6 relative border border-red-100">
        <AlertTriangle className="w-16 h-16 text-red-500" />
      </div>
      <h2 className="text-3xl font-extrabold text-gray-900 mb-4">Waduh, Ada Masalah!</h2>
      <p className="text-gray-600 mb-8 max-w-md">
        Sepertinya pancingan kita tersangkut. Jangan khawatir, mari kita coba lemparkan ulang.
      </p>
      <button
        onClick={() => reset()}
        className="px-6 py-3 bg-primary-sunai hover:bg-primary-sunai/90 text-white font-bold rounded-xl transition-all shadow-md flex items-center justify-center gap-2"
      >
        <RefreshCw className="w-5 h-5" />
        Coba Lagi
      </button>
    </div>
  );
}
