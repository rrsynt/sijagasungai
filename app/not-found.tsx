import Link from 'next/link';
import { Home, Compass } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-6">
      <div className="max-w-md w-full bg-white rounded-3xl p-10 text-center shadow-xl border border-gray-100 animate-in slide-in-from-bottom-5">
        <div className="flex justify-center mb-6">
          <div className="w-24 h-24 bg-blue-50 rounded-full flex items-center justify-center">
            <Compass className="w-12 h-12 text-blue-500" />
          </div>
        </div>
        <h1 className="text-8xl font-black text-gray-200 mb-4">404</h1>
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Tersesat di Sungai?</h2>
        <p className="text-gray-600 mb-8">
          Halaman yang Anda cari sudah hanyut terbawa arus atau memang tidak pernah ada.
        </p>
        <Link 
          href="/" 
          className="w-full flex items-center justify-center px-6 py-4 border border-transparent rounded-2xl shadow-md text-lg font-bold text-white bg-primary-sunai hover:bg-primary-sunai/90 transition-all"
        >
          <Home className="w-5 h-5 mr-2" />
          Kembali ke Beranda
        </Link>
      </div>
    </div>
  );
}
