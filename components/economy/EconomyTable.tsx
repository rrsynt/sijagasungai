'use client';

import React, { useState } from 'react';
import { useLanguage } from '@/components/LanguageContext';
import { EconomyResult } from '@/lib/types';
import { ChevronDown, ChevronUp, Check, PlayCircle, Clock, Wrench, RefreshCw, AlertTriangle } from 'lucide-react';
import { LoadingSpinner } from '../ui/LoadingSpinner';
import { trackEvent } from '@/lib/analytics';

interface EconomyTableProps {
  result: EconomyResult;
  speciesId: string;
}

const NON_HUMAN_KEYWORDS = ['tepung', 'fillet', 'filet', 'pangan', 'olahan', 'konsumsi', 'daging', 'food', 'meal', 'flour'];

function isNonHumanPathway(nama: string, proses: string): boolean {
  const text = (nama + ' ' + proses).toLowerCase();
  return NON_HUMAN_KEYWORDS.some(k => text.includes(k));
}

export function EconomyTable({ result, speciesId }: EconomyTableProps) {
  const { t, language } = useLanguage();
  const [openGuideIndex, setOpenGuideIndex] = useState<number | null>(null);
  const [guides, setGuides] = useState<Record<number, any | 'error'>>({});
  const [loadingGuide, setLoadingGuide] = useState<number | null>(null);

  const fetchGuide = async (index: number, pathwayName: string, forceRetry = false) => {
    if (!forceRetry && openGuideIndex === index) {
      setOpenGuideIndex(null);
      return;
    }

    setOpenGuideIndex(index);
    if (guides[index] && guides[index] !== 'error' && !forceRetry) return;

    setLoadingGuide(index);
    // Clear previous error on retry
    if (forceRetry) setGuides(prev => { const n = {...prev}; delete n[index]; return n; });

    try {
      const res = await fetch('/api/economy/guide', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ speciesId, pathway: pathwayName, lang: language }),
      });
      const data = await res.json();
      if (data.success && data.data?.steps?.length > 0) {
        setGuides(prev => ({ ...prev, [index]: data.data }));
        trackEvent('economy_guide_opened', { species: speciesId, pathway: pathwayName });
      } else {
        setGuides(prev => ({ ...prev, [index]: 'error' }));
      }
    } catch {
      setGuides(prev => ({ ...prev, [index]: 'error' }));
    } finally {
      setLoadingGuide(null);
    }
  };

  // --- Empty state: spesies dilarang / tidak ada jalur ekonomi ---
  if (!result.jalurPemanfaatan || result.jalurPemanfaatan.length === 0) {
    return (
      <div className="space-y-6">
        <div className="border-l-4 border-red-600 bg-red-50 p-6">
          <div className="flex items-start gap-4">
            <AlertTriangle className="w-7 h-7 text-red-700 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-black text-red-900 uppercase tracking-widest mb-2">
                {t('Spesies Ini Dilarang Diperjualbelikan', 'This Species Cannot Be Traded')}
              </p>
              <p className="text-sm text-red-800 leading-relaxed">
                {result.rekomendasiTerbaik?.alasan || t(
                  'Berdasarkan Permen KP No. 19/2020, spesies ini termasuk kategori berbahaya dan dilarang untuk dipelihara, diperdagangkan, atau dimanfaatkan secara komersial.',
                  'Based on MKP Regulation No. 19/2020, this species is classified as dangerous and prohibited from being kept, traded, or commercially utilized.'
                )}
              </p>
              {result.rekomendasiTerbaik?.langkahPertama && result.rekomendasiTerbaik.langkahPertama !== '-' && (
                <div className="mt-4 flex items-start gap-3 pt-4 border-t border-red-200">
                  <PlayCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
                  <p className="text-sm font-semibold text-red-900">{result.rekomendasiTerbaik.langkahPertama}</p>
                </div>
              )}
            </div>
          </div>
        </div>

        <a
          href="https://wa.me/628111262220"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-3 w-full py-4 px-6 bg-red-600 hover:bg-red-700 text-white font-black text-sm uppercase tracking-widest transition-colors"
        >
          📞 {t('Lapor ke KKP Hotline (0811-1262-220)', 'Report to KKP Hotline (0811-1262-220)')}
        </a>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Health warning — always shown */}
      <div className="flex items-start gap-3 bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-800">
        <span className="text-lg leading-none">⚠️</span>
        <span>
          <strong>{t('Peringatan Kesehatan:', 'Health Warning:')}</strong>{' '}
          {t(
            'Ikan invasif dari perairan liar Indonesia berpotensi mengandung logam berat dan patogen. Semua jalur pengolahan di bawah ini HANYA untuk pemanfaatan non-pangan (pakan ternak, pupuk, kerajinan), bukan untuk konsumsi manusia.',
            'Invasive fish from wild Indonesian waterways may contain heavy metals and pathogens. All processing pathways below are for NON-FOOD use only (animal feed, fertilizer, crafts) — not for human consumption.'
          )}
        </span>
      </div>
      <div className="overflow-x-auto bg-white rounded-2xl shadow-sm border border-gray-200 relative mb-6">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                {t('Jalur', 'Pathway')}
              </th>
              <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                {t('Harga/Kg', 'Price/Kg')}
              </th>
              <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                {t('Est. Nilai', 'Est. Value')}
              </th>
              <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                {t('Tingkat', 'Difficulty')}
              </th>
              <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                {t('Status', 'Status')}
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {result.jalurPemanfaatan.map((pathway, idx) => {
              const isBest = result.rekomendasiTerbaik && result.rekomendasiTerbaik.jalur.toLowerCase().includes(pathway.nama.toLowerCase());
              const isRecommended = isBest || (idx === 0 && !result.rekomendasiTerbaik);
              return (
                <React.Fragment key={idx}>
                  <tr
                    className={`hover:bg-gray-50 transition-colors cursor-pointer ${isRecommended ? 'bg-primary-sunai/5 relative' : ''}`}
                    onClick={() => fetchGuide(idx, pathway.nama)}
                  >
                    <td className={`px-6 py-4 whitespace-nowrap ${isRecommended ? 'border-l-4 border-primary-sunai' : ''}`}>
                      <div className="flex items-center">
                        <div className="text-sm font-bold text-gray-900">{pathway.nama}</div>
                        {isRecommended && (
                          <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-primary-sunai text-white">
                            {t('Terbaik', 'Best')}
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-gray-500 max-w-xs truncate">{pathway.prosesSingkat}</div>
                      {isNonHumanPathway(pathway.nama, pathway.prosesSingkat) && (
                        <span className="mt-1 inline-flex items-center gap-1 text-xs font-semibold text-red-700 bg-red-50 border border-red-200 rounded px-1.5 py-0.5">
                          ⚠️ {t('Bukan untuk manusia', 'Not for human consumption')}
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 font-medium">
                      Rp {pathway.hargaPerKg.toLocaleString('id-ID')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900">
                      Rp {pathway.estimasiNilai.toLocaleString('id-ID')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                       <span className={`px-2 py-1 rounded-sm text-xs font-medium ${
                         pathway.kemudahan === 'MUDAH' ? 'bg-green-100 text-green-800' :
                         pathway.kemudahan === 'SEDANG' ? 'bg-yellow-100 text-yellow-800' :
                         'bg-red-100 text-red-800'
                       }`}>
                         {pathway.kemudahan}
                       </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                       {pathway.tersedia ? (
                         <span className="flex items-center text-green-600 font-medium"><Check className="w-4 h-4 mr-1" /> {t('Bisa', 'Yes')}</span>
                       ) : (
                         <span className="text-gray-400 font-medium">{t('Tidak', 'No')}</span>
                       )}
                    </td>
                  </tr>

                  {/* Expanding Guide Accordion */}
                  {openGuideIndex === idx && (
                    <tr>
                      <td colSpan={5} className="bg-gray-50 p-0 border-b-0">
                        <div className="px-6 py-6 border-b border-gray-200 animate-in slide-in-from-top-2">
                          {loadingGuide === idx ? (
                             <LoadingSpinner text={t('Memuat panduan...', 'Loading guide...')} />
                          ) : guides[idx] === 'error' ? (
                            <div className="flex items-center gap-4 text-red-600">
                              <AlertTriangle className="w-5 h-5 shrink-0" />
                              <span className="text-sm font-medium">{t('Gagal memuat panduan.', 'Failed to load guide.')}</span>
                              <button
                                onClick={(e) => { e.stopPropagation(); fetchGuide(idx, pathway.nama, true); }}
                                className="ml-auto flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold border border-red-300 hover:bg-red-50 transition-colors rounded"
                              >
                                <RefreshCw className="w-3.5 h-3.5" />
                                {t('Coba Lagi', 'Retry')}
                              </button>
                            </div>
                          ) : guides[idx] ? (
                            <div className="max-w-4xl space-y-6">
                              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                                <h4 className="text-lg font-bold text-gray-900">{guides[idx].title}</h4>
                                <div className="flex gap-3 text-sm text-gray-600 bg-white px-3 py-1.5 rounded-lg border border-gray-200 inline-flex items-center w-fit">
                                  <span className="flex items-center"><Clock className="w-4 h-4 mr-1"/> {guides[idx].estimated_time}</span>
                                  <span className="text-gray-300">|</span>
                                  <span className="flex items-center"><Wrench className="w-4 h-4 mr-1"/> {guides[idx].difficulty}</span>
                                </div>
                              </div>

                              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <div className="md:col-span-2 space-y-4">
                                  <h5 className="font-semibold text-gray-800">{t('Langkah-Langkah', 'Steps')}</h5>
                                  <ol className="space-y-3">
                                    {guides[idx].steps.map((step: any, i: number) => (
                                      <li key={i} className="flex">
                                        <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary-sunai/10 text-primary-sunai flex items-center justify-center text-xs font-bold mr-3 mt-0.5">
                                          {step.step_number}
                                        </span>
                                        <span className="text-sm text-gray-700">{step.instruction}</span>
                                      </li>
                                    ))}
                                  </ol>
                                </div>
                                <div className="space-y-4">
                                  <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
                                    <h5 className="font-semibold text-gray-800 mb-2">{t('Peralatan', 'Tools')}</h5>
                                    <ul className="text-sm text-gray-600 list-disc pl-4 space-y-1">
                                      {guides[idx].tools_needed.map((tool: string, i: number) => <li key={i}>{tool}</li>)}
                                    </ul>
                                  </div>
                                  {guides[idx].safety_warnings && guides[idx].safety_warnings.length > 0 && (
                                    <div className="bg-red-50 p-4 rounded-xl border border-red-100">
                                      <h5 className="font-semibold text-red-800 mb-2">{t('Peringatan Keselamatan', 'Safety Warnings')}</h5>
                                      <ul className="text-sm text-red-700 list-disc pl-4 space-y-1">
                                        {guides[idx].safety_warnings.map((warn: string, i: number) => <li key={i}>{warn}</li>)}
                                      </ul>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          ) : null}
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
          <h3 className="text-lg font-bold text-gray-900 mb-4">{t('Rekomendasi Terbaik', 'Best Recommendation')}</h3>
          <div className="bg-amber-50 p-4 rounded-xl border border-amber-100 space-y-2">
            <p className="font-semibold text-amber-900">{result.rekomendasiTerbaik?.jalur}</p>
            <p className="text-sm text-amber-800">{result.rekomendasiTerbaik?.alasan}</p>
            <div className="mt-4 flex items-start pt-3 border-t border-amber-200/50">
              <PlayCircle className="w-5 h-5 text-amber-600 mr-2 mt-0.5 shrink-0" />
              <p className="text-sm font-medium text-amber-900">{result.rekomendasiTerbaik?.langkahPertama}</p>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-primary-sunai to-primary-sunai/90 p-6 rounded-2xl shadow-sm border border-transparent text-white">
          <h3 className="text-lg font-bold mb-4">{t('Potensi Bulanan', 'Monthly Potential')}</h3>
          <div className="space-y-4">
            <div>
              <p className="text-white/80 text-sm mb-1">{t('Asumsi Tangkapan', 'Assumed Catch')} ({result.estimasiBulanan?.asumsiTangkapanKg} kg/bulan)</p>
              <p className="text-3xl font-black">Rp {result.estimasiBulanan?.estimasiPenghasilan.toLocaleString('id-ID')}</p>
            </div>
            <p className="text-sm text-white/90 bg-white/10 p-3 rounded-lg backdrop-blur-sm shadow-inner">
              {result.estimasiBulanan?.catatan}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
