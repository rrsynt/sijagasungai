'use client';

import { useLanguage } from '@/components/LanguageContext';

export function LanguageSwitcher() {
  const { language, setLanguage } = useLanguage();

  return (
    <button
      onClick={() => setLanguage(language === 'id' ? 'en' : 'id')}
      className="flex items-center space-x-1 px-3 py-1.5 rounded-full bg-white/20 hover:bg-white/30 transition-colors"
      title="Toggle Language"
    >
      <span className="sr-only">Toggle language between Indonesian and English</span>
      <span aria-hidden="true" className={`text-sm font-bold ${language === 'id' ? 'text-white' : 'text-gray-300'}`}>ID</span>
      <span aria-hidden="true" className="text-gray-400">|</span>
      <span aria-hidden="true" className={`text-sm font-bold ${language === 'en' ? 'text-white' : 'text-gray-300'}`}>EN</span>
    </button>
  );
}
