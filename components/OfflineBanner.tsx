'use client';

import { useState, useEffect } from 'react';
import { WifiOff } from 'lucide-react';

export function OfflineBanner() {
  const [isOffline, setIsOffline] = useState(false);
  const [showBanner, setShowBanner] = useState(false);

  useEffect(() => {
    const handleOffline = () => { setIsOffline(true); setShowBanner(true); };
    const handleOnline = () => {
      setIsOffline(false);
      // Sembunyikan banner setelah 3 detik saat kembali online
      setTimeout(() => setShowBanner(false), 3000);
    };

    // Cek status awal setelah browser siap — navigator.onLine reliable di sini
    if (!navigator.onLine) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setIsOffline(true);
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setShowBanner(true);
    }

    window.addEventListener('offline', handleOffline);
    window.addEventListener('online', handleOnline);
    return () => {
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('online', handleOnline);
    };
  }, []);

  if (!showBanner) return null;

  return (
    <div
      className={`fixed top-16 inset-x-0 z-40 flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-semibold transition-all duration-500 ${
        isOffline
          ? 'bg-red-600 text-white'
          : 'bg-emerald-600 text-white'
      }`}
    >
      <WifiOff className="w-4 h-4 shrink-0" />
      {isOffline
        ? 'Tidak ada koneksi — laporan akan disimpan & dikirim saat online kembali'
        : '✓ Koneksi pulih — laporan tersimpan sedang disinkronisasi...'}
    </div>
  );
}
