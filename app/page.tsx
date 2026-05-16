'use client';

import { Hero } from '@/components/home/Hero';
import { RecentReports } from '@/components/home/RecentReports';
import { SpeciesSpotlight } from '@/components/home/SpeciesSpotlight';
import { useLanguage } from '@/components/LanguageContext';
import { useState, useEffect } from 'react';
import Link from 'next/link';

function useCountUp(target: number, duration = 1200) {
  const [display, setDisplay] = useState(0);
  useEffect(() => {
    if (target === 0) return;
    const steps = 40;
    const increment = target / steps;
    const delay = duration / steps;
    let current = 0;
    const timer = setInterval(() => {
      current += increment;
      if (current >= target) {
        setDisplay(target);
        clearInterval(timer);
      } else {
        setDisplay(Math.floor(current));
      }
    }, delay);
    return () => clearInterval(timer);
  }, [target, duration]);
  return display;
}

export default function HomePage() {
  const { t } = useLanguage();
  const [reportCount, setReportCount] = useState<number>(0);
  const [pulse, setPulse] = useState(false);
  const animatedCount = useCountUp(reportCount);

  const fetchStats = () => {
    fetch('/api/stats')
      .then(r => r.json())
      .then(d => {
        const newCount = d.count ?? 0;
        setReportCount(prev => {
          if (newCount > prev) setPulse(true);
          return newCount;
        });
      })
      .catch(() => {});
  };

  useEffect(() => {
    fetchStats();
    const interval = setInterval(fetchStats, 60_000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (pulse) {
      const t = setTimeout(() => setPulse(false), 1000);
      return () => clearTimeout(t);
    }
  }, [pulse]);

  return (
    <div className="flex flex-col min-h-screen bg-[#fafaf8]">
      <Hero />

      {/* STATS STRIP - Minimal text inline */}
      <section className="border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-12">
            <div>
              <p className="text-sm text-gray-500 font-medium mb-1 uppercase tracking-wide">{t('Area Terdampak', 'Affected Areas')}</p>
              <p className="text-2xl font-bold text-gray-900">150+ <span className="font-normal text-gray-500 text-base">sungai</span></p>
            </div>
            <div>
              <p className="text-sm text-gray-500 font-medium mb-1 uppercase tracking-wide">{t('Teridentifikasi', 'Identified')}</p>
              <p className="text-2xl font-bold text-gray-900">10+ <span className="font-normal text-gray-500 text-base">spesies invasif</span></p>
            </div>
          </div>
          <div className="md:text-right">
            <p className="text-sm text-gray-500 font-medium mb-1 uppercase tracking-wide">{t('Aktivitas Komunitas', 'Community Activity')}</p>
            <p className={`text-2xl font-bold text-primary-sunai transition-transform ${pulse ? 'scale-110' : 'scale-100'}`}>
              {animatedCount > 0 ? `${animatedCount}+` : '—'}{' '}
              <span className="font-normal text-gray-500 text-base">laporan masuk</span>
              {animatedCount > 0 && <span className="ml-2 inline-block w-2 h-2 rounded-full bg-emerald-400 animate-pulse" title="Live" />}
            </p>
          </div>
        </div>
      </section>

      {/* TEXT DRIVEN ASYMMETRIC FEATURES */}
      <section className="py-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 lg:gap-24">
          <div className="lg:col-span-5">
            <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900 leading-tight mb-6">
              {t('Satu platform.', 'One platform.')} <br/>
              {t('Tiga solusi nyata.', 'Three real solutions.')}
            </h2>
            <p className="text-lg text-gray-600 mb-8 leading-relaxed">
              {t(
                'Kerugian ekologi akibat ikan invasif di Indonesia mencapai miliaran rupiah per tahun. SiJaga Sungai menjembatani kesenjangan informasi antara nelayan, pemerintah, dan pemerhati lingkungan.',
                'Ecological losses due to invasive fish in Indonesia reach billions of rupiah per year. SiJaga Sungai bridges the information gap between fishermen, government, and environmentalists.'
              )}
            </p>
            <div className="inline-flex flex-col gap-2 border-l-2 border-primary-sunai pl-6 py-2">
              <span className="text-sm font-bold text-gray-900">Sumber Data KKP</span>
              <span className="text-sm text-gray-500">Kementerian Kelautan dan Perikanan Republik Indonesia</span>
            </div>
          </div>
          
          <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-x-12 gap-y-16">
            <div>
              <h3 className="text-lg font-bold text-gray-900 border-b border-gray-200 pb-4 mb-4">{t('01. Identifikasi Cerdas', '01. Smart Identification')}</h3>
              <p className="text-gray-600 leading-relaxed text-sm">
                {t('Analisis foto instan berbasis AI. Cukup arahkan kamera, biarkan sistem memvalidasi spesies, status invasif, dan risikonya.', 'Instant AI-based photo analysis. Just point your camera, let the system validate species, invasive status, and risk.')}
              </p>
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900 border-b border-gray-200 pb-4 mb-4">{t('02. Pemetaan Real-time', '02. Real-time Mapping')}</h3>
              <p className="text-gray-600 leading-relaxed text-sm">
                {t('Setiap laporan terekam dengan GPS akurat. Menyediakan data distribusi langsung bagi peneliti dan pemerintah daerah.', 'Every report is recorded with accurate GPS. Providing live distribution data for researchers and local government.')}
              </p>
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900 border-b border-gray-200 pb-4 mb-4">{t('03. Sirkular Ekonomi', '03. Circular Economy')}</h3>
              <p className="text-gray-600 leading-relaxed text-sm">
                {t('Jangan dibuang begitu saja. Temukan jalur pengolahan tangkapan menjadi produk bernilai jual seperti pakan ternak atau pupuk organik.', 'Don\'t just throw it away. Find processing pathways to turn catches into marketable products like animal feed or organic fertilizer.')}
              </p>
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900 border-b border-gray-200 pb-4 mb-4">{t('04. Tindakan Cepat', '04. Rapid Action')}</h3>
              <p className="text-gray-600 leading-relaxed text-sm">
                {t('Panduan pemusnahan spesies kategori darurat. Terintegrasi langsung dengan hotline pelaporan otoritas setempat.', 'Disposal guides for emergency category species. Integrated directly with local authority reporting hotlines.')}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* SPECIES SPOTLIGHT */}
      <section className="bg-gray-100 py-24 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="mb-12">
            <p className="text-sm font-bold text-gray-500 uppercase tracking-widest mb-2">{t('Katalog', 'Catalog')}</p>
            <h2 className="text-3xl font-extrabold text-gray-900">{t('Fokus Spesies', 'Target Species')}</h2>
          </div>
          <SpeciesSpotlight />
        </div>
      </section>

      {/* RECENT REPORTS */}
      <section className="py-24 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="mb-12 flex justify-between items-end border-b border-gray-200 pb-6">
            <div>
              <h2 className="text-3xl font-extrabold text-gray-900">{t('Laporan Terbaru', 'Latest Reports')}</h2>
              <p className="text-gray-500 mt-2">{t('Aktivitas terkini dari komunitas SiJaga.', 'Recent activity from the SiJaga community.')}</p>
            </div>
            <Link href="/map" className="hidden sm:block text-sm font-bold text-gray-900 hover:underline">
              {t('Buka Peta Penuh →', 'Open Full Map →')}
            </Link>
          </div>
          <RecentReports />
          <div className="mt-8 sm:hidden">
            <Link href="/map" className="text-sm font-bold text-gray-900 hover:underline">
              {t('Buka Peta Penuh →', 'Open Full Map →')}
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
