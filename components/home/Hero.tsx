'use client';

import { useLanguage } from '../LanguageContext';
import Link from 'next/link';

export function Hero() {
  const { t } = useLanguage();

  return (
    <div className="relative overflow-hidden bg-white text-gray-900 border-b border-gray-100 pb-16 pt-24 sm:pb-24 sm:pt-32 lg:pb-32 lg:pt-40">
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl">
          <h1 className="text-4xl sm:text-5xl lg:text-7xl font-extrabold tracking-tighter mb-8 leading-tight">
            {t('Satu Foto.', 'One Photo.')} <br />
            <span className="text-primary-sunai">{t('Tiga Dampak.', 'Three Impacts.')}</span>
          </h1>
          <p className="text-lg sm:text-xl text-gray-600 mb-12 max-w-2xl leading-relaxed tracking-tight">
            {t(
              'Bantu lindungi perairan Indonesia dari spesies ikan invasif. Kenali, laporkan, dan temukan potensi nilai ekonominya.',
              'Help protect Indonesian waters from invasive fish species. Identify, report, and discover their economic potential.'
            )}
          </p>
          <div className="flex flex-col sm:flex-row gap-5 items-start">
            <Link 
              href="/identify" 
              className="inline-flex justify-center items-center px-8 py-4 text-sm font-bold text-white bg-gray-900 hover:bg-gray-800 transition-colors shadow-sm w-full sm:w-auto"
            >
              {t('Identifikasi Ikan', 'Identify Fish')}
            </Link>
            <Link 
              href="/map" 
              className="inline-flex justify-center items-center px-8 py-4 text-sm font-medium text-gray-700 bg-gray-50 hover:bg-gray-100 transition-colors border border-gray-200 w-full sm:w-auto"
            >
              {t('Lihat Peta', 'View Map')}
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
