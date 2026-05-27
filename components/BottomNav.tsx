'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Map, BookOpen, Info, Camera } from 'lucide-react';
import { useLanguage } from './LanguageContext';

export function BottomNav() {
  const pathname = usePathname();
  const { t } = useLanguage();

  const tabs = [
    { href: '/', icon: Home, labelId: 'Beranda', labelEn: 'Home' },
    { href: '/map', icon: Map, labelId: 'Peta', labelEn: 'Map' },
    { isFab: true },
    { href: '/education', icon: BookOpen, labelId: 'Edukasi', labelEn: 'Learn' },
    { href: '/about', icon: Info, labelId: 'Tentang', labelEn: 'About' },
  ];

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 z-30 bg-white/90 backdrop-blur-md border-t border-gray-200 pb-safe">
      {/* Nav bar */}
      <div className="relative">
        <div className="flex justify-around items-center h-16">
          {tabs.map((tab) => {
            if (tab.isFab) {
              return (
                <div key="fab" className="flex flex-col items-center justify-end pb-2 w-16 h-full">
                  <Link
                    href="/map?open=report"
                    className="flex items-center justify-center w-14 h-14 -mt-7 rounded-full bg-primary-sunai ring-4 ring-white shadow-lg shadow-primary-sunai/30 text-white active:scale-95 transition-transform"
                    aria-label={t('Laporkan Ikan', 'Report Fish')}
                  >
                    <Camera className="w-6 h-6" />
                  </Link>
                  <span className="text-[10px] font-bold text-primary-sunai leading-none mt-1">{t('Lapor', 'Report')}</span>
                </div>
              );
            }

          const isActive = pathname === tab.href || (tab.href === '/map' && pathname === '/map');
          const Icon = tab.icon!;

          return (
            <Link
              key={tab.href}
              href={tab.href!}
              className={`flex flex-col items-center justify-center w-full h-full space-y-1 transition-colors ${
                isActive ? 'text-primary-sunai' : 'text-gray-400 hover:text-gray-600'
              }`}
            >
              <Icon className={`w-5 h-5 ${isActive ? 'fill-blue-100' : ''}`} />
              <span className="text-[10px] font-medium">{t(tab.labelId!, tab.labelEn!)}</span>
            </Link>
          );
        })}
        </div>
      </div>
    </div>
  );
}
