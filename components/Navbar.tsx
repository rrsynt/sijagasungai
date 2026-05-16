'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { Menu, X, Droplets, CloudOff } from 'lucide-react';
import { LanguageSwitcher } from './ui/LanguageSwitcher';
import { useLanguage } from './LanguageContext';
import { getGamificationState, getRankForCount } from '@/lib/gamification';
import { getOfflineCount, syncOfflineReports } from '@/lib/offline-sync';

export function Navbar() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { t } = useLanguage();

  const navLinks = [
    { href: '/identify', labelId: 'Identifikasi', labelEn: 'Identify' },
    { href: '/map', labelId: 'Peta', labelEn: 'Map' },
    { href: '/economy', labelId: 'Ekonomi', labelEn: 'Economy' },
    { href: '/education', labelId: 'Edukasi', labelEn: 'Education' },
    { href: '/prevention', labelId: 'Pencegahan', labelEn: 'Prevention' },
    { href: '/about', labelId: 'Tentang', labelEn: 'About' },
  ];

  const [reportCount, setReportCount] = useState(0);
  const [offlineCount, setOfflineCount] = useState(0);
  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIsOnline(navigator.onLine);
    const updateRank = () => {
      const state = getGamificationState();
      setReportCount(state.reportCount);
    };

    const updateOffline = () => {
      setOfflineCount(getOfflineCount());
    };
    
    const handleOnline = () => {
      setIsOnline(true);
      syncOfflineReports();
    };

    const handleOffline = () => {
      setIsOnline(false);
    };
    
    updateRank(); // Initial load
    updateOffline();

    window.addEventListener('gamification_update', updateRank);
    window.addEventListener('offline_sync_update', updateOffline);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    return () => {
      window.removeEventListener('gamification_update', updateRank);
      window.removeEventListener('offline_sync_update', updateOffline);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const currentRank = getRankForCount(reportCount);

  return (
    <nav className="bg-emerald-900/95 backdrop-blur-lg border-b border-emerald-700/50 text-white shadow-lg sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <Droplets className="h-8 w-8 mr-2 text-white" />
            <Link href="/" className="font-bold text-xl tracking-tight">
              SiJaga Sungai
            </Link>
          </div>
          
          <div className="hidden md:flex items-center space-x-6">
            {navLinks.map((link) => (
              <Link key={link.href} href={link.href} className="text-white hover:text-amber-500 transition-colors font-medium">
                {t(link.labelId, link.labelEn)}
              </Link>
            ))}
            {offlineCount > 0 && (
              <div className="flex items-center px-3 py-1.5 rounded-full bg-red-500/20 border border-red-400 text-xs font-bold text-red-100" title="Ada laporan menunggu sinkronisasi">
                <CloudOff className="w-3.5 h-3.5 mr-1.5" />
                {offlineCount} {t('Tertunda', 'Pending')}
              </div>
            )}
            <div className={`flex items-center px-3 py-1.5 rounded-full border text-xs font-bold transition-all ${currentRank.color}`} title={`Level: ${reportCount} Laporan`}>
              <span className="mr-1.5">{currentRank.icon}</span>
              {t(currentRank.name, currentRank.en)}
            </div>
            <LanguageSwitcher />
          </div>

            <div className="md:hidden flex items-center gap-2">
            {offlineCount > 0 && (
              <div className="flex items-center px-2 py-1 rounded-full bg-red-500/20 border border-red-400 text-[10px] font-bold text-red-100">
                <CloudOff className="w-3 h-3 mr-1" />
                {offlineCount}
              </div>
            )}
            <div className={`flex items-center px-2 py-1 rounded-full border text-[10px] font-bold ${currentRank.color}`}>
              <span className="mr-1">{currentRank.icon}</span>
              {reportCount}
            </div>
            <LanguageSwitcher />
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="text-white hover:text-amber-500 focus:outline-none p-2 min-h-[44px] min-w-[44px] flex items-center justify-center"
              aria-label="Toggle menu"
            >
              {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>
      </div>

      {isMobileMenuOpen && (
        <div className="md:hidden bg-secondary-air border-t border-white/10">
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="block px-3 py-3 rounded-md text-base font-medium text-white hover:bg-white/10"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                {t(link.labelId, link.labelEn)}
              </Link>
            ))}
          </div>
        </div>
      )}
    </nav>
  );
}
