'use client';
import { useEffect } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

export default function MapError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => console.error(error), [error]);

  return (
    <div className="flex flex-col h-[calc(100vh-64px)] items-center justify-center bg-gray-50 p-6 text-center">
      <div className="bg-red-50 p-6 rounded-full mb-6 border border-red-100">
        <AlertTriangle className="w-16 h-16 text-red-500" />
      </div>
      <h2 className="text-2xl font-bold text-gray-900 mb-4">Peta Gagal Dimuat</h2>
      <button onClick={() => reset()} className="px-6 py-3 bg-primary-sunai text-white font-bold rounded-xl flex items-center justify-center gap-2">
        <RefreshCw className="w-5 h-5" /> Coba Lagi
      </button>
    </div>
  );
}
