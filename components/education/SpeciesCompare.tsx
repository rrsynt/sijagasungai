'use client';

import { useState } from 'react';
import { useLanguage } from '@/components/LanguageContext';
import { SPECIES_DATABASE } from '@/lib/species-database';
import { LoadingSpinner } from '../ui/LoadingSpinner';
import { AlertCircle, ArrowLeftRight, Check, HelpCircle, AlertTriangle } from 'lucide-react';

const NATIVE_SPECIES = [
  { name: 'Bawal Tawar', scientific: 'Piaractus brachypomus', label: 'Bawal Air Tawar' },
  { name: 'Nila Merah', scientific: 'Oreochromis niloticus', label: 'Ikan Nila' },
  { name: 'Gurame', scientific: 'Osphronemus goramy', label: 'Ikan Gurame' },
  { name: 'Gabus Toman', scientific: 'Channa micropeltes', label: 'Ikan Toman' },
  { name: 'Lele Lokal', scientific: 'Clarias batrachus', label: 'Lele Lokal' },
  { name: 'Mujair', scientific: 'Oreochromis mossambicus', label: 'Ikan Mujair' },
  { name: 'Ikan Mas / Karper', scientific: 'Cyprinus carpio', label: 'Ikan Mas' },
  { name: 'Ikan Tawes', scientific: 'Barbonymus gonionotus', label: 'Ikan Tawes' },
  { name: 'Ikan Nilem', scientific: 'Osteochilus vittatus', label: 'Ikan Nilem' },
  { name: 'Ikan Betok', scientific: 'Anabas testudineus', label: 'Ikan Betok' }
];

export function SpeciesCompare() {
  const { t, language } = useLanguage();
  const [speciesA, setSpeciesA] = useState(Object.values(SPECIES_DATABASE)[0].namaLokal[0]);
  const [speciesB, setSpeciesB] = useState(NATIVE_SPECIES[0].label);
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<any | null>(null);
  const [error, setError] = useState<string | null>(null);

  const invasiveList = Object.values(SPECIES_DATABASE);

  const handleCompare = async () => {
    setIsLoading(true);
    setError(null);
    setResult(null);

    try {
      const res = await fetch('/api/compare', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ speciesA, speciesB, lang: language }),
      });
      const data = await res.json();
      if (data.success) {
        setResult(data.data);
      } else {
        setError(data.error || 'Failed to fetch comparison.');
      }
    } catch (err) {
      setError(t('Terjadi kesalahan jaringan.', 'Network error occurred.'));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-12">
      {/* Selection Panel */}
      <div className="bg-white border-2 border-gray-900 p-6 sm:p-10 shadow-md">
        <h3 className="text-xl font-black uppercase tracking-tight text-gray-900 mb-6 flex items-center gap-2">
          <ArrowLeftRight className="w-5 h-5 text-primary-sunai" />
          {t('Bandingkan Spesies Ikan (AI)', 'Compare Fish Species (AI)')}
        </h3>
        <p className="text-sm text-gray-600 mb-8 leading-relaxed">
          {t(
            'Bingung membedakan ikan tangkapanmu? Pilih dua spesies ikan untuk membandingkan ciri fisik, status invasif, dan bahaya ekologinya secara instan menggunakan Gemini AI.',
            'Confused about your catch? Choose two fish species to compare physical traits, invasive status, and ecological impact instantly using Gemini AI.'
          )}
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
          <div>
            <label className="block text-xs font-bold text-gray-900 uppercase tracking-widest mb-3">
              {t('Spesies A (Invasif)', 'Species A (Invasive)')}
            </label>
            <select
              value={speciesA}
              onChange={(e) => setSpeciesA(e.target.value)}
              className="block w-full px-4 py-3 border-b-2 border-gray-900 focus:outline-none focus:border-primary-sunai transition-colors bg-transparent rounded-none"
              disabled={isLoading}
            >
              {invasiveList.map((sp) => (
                <option key={sp.id} value={sp.namaLokal[0]}>
                  {sp.namaLokal[0]} ({sp.namaIlmiah})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-900 uppercase tracking-widest mb-3">
              {t('Spesies B (Native/Lainnya)', 'Species B (Native/Other)')}
            </label>
            <select
              value={speciesB}
              onChange={(e) => setSpeciesB(e.target.value)}
              className="block w-full px-4 py-3 border-b-2 border-gray-900 focus:outline-none focus:border-primary-sunai transition-colors bg-transparent rounded-none"
              disabled={isLoading}
            >
              <optgroup label={t('Ikan Invasif', 'Invasive Fish')}>
                {invasiveList.map((sp) => (
                  <option key={`inv-${sp.id}`} value={sp.namaLokal[0]}>
                    {sp.namaLokal[0]} ({sp.namaIlmiah})
                  </option>
                ))}
              </optgroup>
              <optgroup label={t('Ikan Asli / Budidaya', 'Native / Cultured')}>
                {NATIVE_SPECIES.map((sp) => (
                  <option key={`nat-${sp.name}`} value={sp.label}>
                    {sp.label} ({sp.scientific})
                  </option>
                ))}
              </optgroup>
            </select>
          </div>
        </div>

        {error && (
          <div className="p-4 bg-red-50 text-red-800 text-sm border-l-4 border-red-600 font-medium mb-6">
            <AlertCircle className="w-5 h-5 inline mr-2 shrink-0" /> {error}
          </div>
        )}

        <button
          onClick={handleCompare}
          disabled={isLoading || speciesA === speciesB}
          className="w-full flex items-center justify-center py-5 px-4 bg-gray-900 text-white text-sm font-bold uppercase tracking-widest hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {isLoading ? (
            <>
              <LoadingSpinner text={t('Menganalisis perbandingan...', 'Analyzing comparison...')} />
            </>
          ) : speciesA === speciesB ? (
            t('Pilih Dua Spesies yang Berbeda', 'Select Two Different Species')
          ) : (
            t('Bandingkan dengan AI', 'Compare with AI')
          )}
        </button>
      </div>

      {/* Result Section */}
      {result && (
        <div className="space-y-8 animate-in fade-in duration-500">
          
          {/* Side-by-side Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Species A */}
            <div className="border-2 border-gray-900 bg-white p-6 sm:p-8 flex flex-col justify-between">
              <div>
                <div className="flex justify-between items-start mb-4 border-b border-gray-200 pb-4">
                  <div>
                    <h4 className="text-2xl font-black text-gray-900 uppercase tracking-tight">{result.spesiesA.nama}</h4>
                    <p className="text-sm italic text-gray-500">{result.spesiesA.namaIlmiah}</p>
                  </div>
                  <span className={`text-[10px] font-black px-2 py-1 uppercase tracking-widest ${
                    result.spesiesA.status.toLowerCase().includes('invasif') 
                      ? 'bg-red-100 text-red-800 border border-red-200' 
                      : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                  }`}>
                    {result.spesiesA.status}
                  </span>
                </div>
                
                <div className="space-y-4">
                  <div>
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-2">{t('Ciri Fisik Utama', 'Main Physical Traits')}</span>
                    <ul className="text-sm text-gray-700 space-y-2 list-disc pl-4">
                      {result.spesiesA.ciriFisik.map((trait: string, idx: number) => (
                        <li key={idx} className="leading-relaxed">{trait}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
              
              <div className="mt-6 pt-6 border-t border-gray-200 text-sm">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-2">{t('Dampak Ekologi', 'Ecological Impact')}</span>
                <p className="text-gray-600 leading-relaxed">{result.spesiesA.dampak}</p>
              </div>
            </div>

            {/* Species B */}
            <div className="border-2 border-gray-900 bg-white p-6 sm:p-8 flex flex-col justify-between">
              <div>
                <div className="flex justify-between items-start mb-4 border-b border-gray-200 pb-4">
                  <div>
                    <h4 className="text-2xl font-black text-gray-900 uppercase tracking-tight">{result.spesiesB.nama}</h4>
                    <p className="text-sm italic text-gray-500">{result.spesiesB.namaIlmiah}</p>
                  </div>
                  <span className={`text-[10px] font-black px-2 py-1 uppercase tracking-widest ${
                    result.spesiesB.status.toLowerCase().includes('invasif') 
                      ? 'bg-red-100 text-red-800 border border-red-200' 
                      : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                  }`}>
                    {result.spesiesB.status}
                  </span>
                </div>
                
                <div className="space-y-4">
                  <div>
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-2">{t('Ciri Fisik Utama', 'Main Physical Traits')}</span>
                    <ul className="text-sm text-gray-700 space-y-2 list-disc pl-4">
                      {result.spesiesB.ciriFisik.map((trait: string, idx: number) => (
                        <li key={idx} className="leading-relaxed">{trait}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
              
              <div className="mt-6 pt-6 border-t border-gray-200 text-sm">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-2">{t('Dampak Ekologi', 'Ecological Impact')}</span>
                <p className="text-gray-600 leading-relaxed">{result.spesiesB.dampak}</p>
              </div>
            </div>
          </div>

          {/* Differences Table */}
          {result.perbedaanUtama && result.perbedaanUtama.length > 0 && (
            <div className="bg-white border-2 border-gray-900 p-6 sm:p-8 shadow-md">
              <h4 className="text-lg font-black uppercase tracking-wider mb-6 pb-2 border-b border-gray-200">
                {t('Tabel Perbandingan Karakteristik', 'Characteristics Comparison Table')}
              </h4>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b-2 border-gray-900">
                      <th className="py-3 font-extrabold text-gray-900 w-1/4">{t('Aspek Perbedaan', 'Aspect')}</th>
                      <th className="py-3 font-extrabold text-gray-900 w-3/8">{result.spesiesA.nama}</th>
                      <th className="py-3 font-extrabold text-gray-900 w-3/8">{result.spesiesB.nama}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {result.perbedaanUtama.map((diff: any, idx: number) => (
                      <tr key={idx} className="hover:bg-gray-50">
                        <td className="py-4 font-bold text-gray-900">{diff.aspek}</td>
                        <td className="py-4 text-gray-700 leading-relaxed pr-4">{diff.detailA}</td>
                        <td className="py-4 text-gray-700 leading-relaxed">{diff.detailB}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Quick Identification Tip */}
          <div className="border-l-4 border-gray-900 bg-gray-50 p-6">
            <h4 className="font-bold text-gray-900 uppercase tracking-widest text-xs mb-2">
              💡 {t('Cara Membedakan Cepat di Lapangan', 'How to Tell Them Apart Quickly in the Field')}
            </h4>
            <p className="text-gray-700 text-sm leading-relaxed">{result.caraMembedakanCepat}</p>
          </div>

          {/* Recommended Action */}
          <div className="border-l-4 border-primary-sunai bg-primary-sunai/5 p-6">
            <h4 className="font-bold text-primary-sunai uppercase tracking-widest text-xs mb-2">
              🚨 {t('Rekomendasi Tindakan SiJaga', 'SiJaga Action Recommendation')}
            </h4>
            <p className="text-gray-700 text-sm leading-relaxed">{result.rekomendasiAksi}</p>
          </div>
        </div>
      )}
    </div>
  );
}
