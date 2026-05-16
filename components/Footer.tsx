'use client';

import Link from 'next/link';
import { useLanguage } from './LanguageContext';

export function Footer() {
  const { t } = useLanguage();
  return (
    <footer className="bg-gray-900 text-gray-300 py-8 border-t border-gray-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row justify-between items-center gap-4">
        <div>
          <span className="font-semibold text-lg tracking-tight text-white">SiJaga Sungai</span>
          <p className="text-xs text-gray-500 mt-1">Satu Foto. Tiga Dampak. 🐟</p>
          <p className="text-xs text-gray-600 mt-0.5">© 2026 Tim SiJaga Sungai</p>
        </div>
        <div className="text-sm text-center">
          <p className="text-amber-400 font-semibold">#JuaraVibeCoding 2026</p>
          <p className="text-gray-500 text-xs mt-0.5">Built with Gemini AI + Google Cloud Run</p>
        </div>
        <div className="flex items-center space-x-4 text-sm">
          <Link href="/about" className="hover:text-amber-500 transition-colors py-2 min-h-[44px] flex items-center">{t('Tentang', 'About')}</Link>
          <Link href="/map" className="hover:text-amber-500 transition-colors py-2 min-h-[44px] flex items-center">{t('Peta Nasional', 'National Map')}</Link>
          <Link href="/identify" className="hover:text-amber-500 transition-colors py-2 min-h-[44px] flex items-center">{t('Identifikasi', 'Identify')}</Link>
        </div>
      </div>
    </footer>
  );
}

