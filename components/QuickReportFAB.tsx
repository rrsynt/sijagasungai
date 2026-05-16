'use client';

import { Camera } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export function QuickReportFAB() {
  const pathname = usePathname();
  
  // Sembunyikan tombol jika pengguna sudah berada di halaman identifikasi
  if (pathname === '/identify') return null;

  return (
    <div className="md:hidden fixed bottom-6 left-1/2 -translate-x-1/2 z-40 animate-in slide-in-from-bottom-10 fade-in duration-500">
      <Link 
        href="/identify"
        className="flex items-center justify-center w-[72px] h-[72px] bg-gradient-to-tr from-emerald-600 to-cyan-500 text-white rounded-full shadow-[0_8px_30px_rgba(8,145,178,0.5)] border-[5px] border-white hover:from-emerald-500 hover:to-cyan-400 hover:scale-105 active:scale-95 transition-all"
        title="Lapor Cepat (Kamera)"
        aria-label="Identifikasi ikan - buka kamera"
      >
        <Camera className="w-8 h-8" />
      </Link>
    </div>
  );
}
