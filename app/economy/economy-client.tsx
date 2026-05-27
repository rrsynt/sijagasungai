'use client';

import { Suspense, useState, useEffect, useCallback } from 'react';
import { SPECIES_DATABASE } from '@/lib/species-database';
import { useLanguage } from '@/components/LanguageContext';
import { EconomyTable } from '@/components/economy/EconomyTable';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { TrendingUp, RefreshCw, AlertCircle, MapPin } from 'lucide-react';
import { useSearchParams } from 'next/navigation';

function EconomyForm() {
  const { t, language } = useLanguage();
  const searchParams = useSearchParams();
  const prefilledSpecies = searchParams.get('species');

  const [speciesId, setSpeciesId] = useState(prefilledSpecies || Object.keys(SPECIES_DATABASE)[0]);
  const [quantityKg, setQuantityKg] = useState<number>(5);
  const [location, setLocation] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const speciesList = Object.values(SPECIES_DATABASE);

  const handleCalculate = useCallback(async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (quantityKg <= 0 || quantityKg >= 1000) {
      setError(t('Jumlah harus antara 1 - 999 kg', 'Quantity must be between 1 - 999 kg'));
      return;
    }

    setIsLoading(true);
    setError(null);
    setResult(null);

    try {
      const res = await fetch('/api/economy/calculate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ speciesId, quantityKg, location, lang: language }),
      });
      const data = await res.json();
      if (data.success) {
        setResult(data.data);
      } else {
        setError(data.error || 'Failed to calculate');
      }
    } catch (err) {
      setError(t('Terjadi kesalahan jaringan.', 'Network error occurred.'));
    } finally {
      setIsLoading(false);
    }
  }, [quantityKg, t, speciesId, location, language]);

  useEffect(() => {
    // If prefilled species from URL is valid, trigger calculation immediately
    if (prefilledSpecies && SPECIES_DATABASE[prefilledSpecies]) {
      handleCalculate(new Event('submit') as any);
    }
  }, [prefilledSpecies, handleCalculate]);

  return (
    <>
        <div className="bg-white border-y sm:border sm:border-gray-300 p-6 sm:p-10 mb-12 max-w-4xl">
          <form onSubmit={handleCalculate} className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div>
                <label className="block text-xs font-bold text-gray-900 uppercase tracking-widest mb-3">
                  {t('Pilih Spesies', 'Select Species')}
                </label>
                <select 
                  value={speciesId}
                  onChange={(e) => setSpeciesId(e.target.value)}
                  className="block w-full px-4 py-3 border-b-2 border-gray-900 focus:outline-none focus:border-primary-sunai transition-colors bg-transparent rounded-none"
                  disabled={isLoading}
                >
                  {speciesList.map((sp) => (
                    <option key={sp.id} value={sp.id}>{sp.namaLokal[0]} ({sp.namaIlmiah})</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-xs font-bold text-gray-900 uppercase tracking-widest mb-3">
                  {t('Lokasi (Pasar Utama)', 'Location (Market)')}
                </label>
                <div className="relative">
                  <MapPin className="absolute left-0 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input 
                    type="text"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder={t('Opsional', 'Optional')}
                    className="block w-full pl-8 pr-4 py-3 border-b-2 border-gray-900 focus:outline-none focus:border-primary-sunai transition-colors bg-transparent rounded-none"
                    disabled={isLoading}
                  />
                </div>
              </div>
            </div>

            <div>
              <div className="flex justify-between items-end mb-4">
                <label className="text-xs font-bold text-gray-900 uppercase tracking-widest">
                  {t('Estimasi Tangkapan', 'Estimated Catch')}
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min="1"
                    max="999"
                    value={quantityKg}
                    onChange={(e) => {
                      const val = parseInt(e.target.value);
                      if (!isNaN(val)) setQuantityKg(Math.min(999, Math.max(1, val)));
                    }}
                    className="w-20 text-right border-b-2 border-gray-900 focus:outline-none focus:border-primary-sunai bg-transparent font-extrabold text-2xl text-gray-900"
                    disabled={isLoading}
                  />
                  <span className="text-sm font-normal text-gray-500">kg</span>
                </div>
              </div>
              <input
                type="range"
                min="1"
                max="500"
                value={Math.min(quantityKg, 500)}
                onChange={(e) => setQuantityKg(parseInt(e.target.value))}
                className="w-full h-1 bg-gray-300 appearance-none cursor-pointer accent-gray-900"
                disabled={isLoading}
              />
              <div className="flex justify-between text-xs font-bold text-gray-400 mt-3 uppercase">
                <span>1 kg</span>
                <span>250 kg</span>
                <span>500 kg+</span>
              </div>
            </div>

            {error && (
              <div className="p-4 bg-red-50 text-red-800 text-sm border-l-4 border-red-600 font-medium">
                <AlertCircle className="w-5 h-5 inline mr-2 shrink-0" /> {error}
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex items-center justify-center py-5 px-4 bg-gray-900 text-white text-sm font-bold uppercase tracking-widest hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isLoading ? (
                <><RefreshCw className="w-5 h-5 mr-3 animate-spin" /> {t('Menghitung...', 'Calculating...')}</>
              ) : (
                <>{t('Hitung Potensi Ekonomi', 'Calculate Economic Potential')}</>
              )}
            </button>
          </form>
        </div>

        {isLoading ? (
           <div className="py-20">
             <LoadingSpinner text={t('Memuat analisis ekonomi...', 'Loading economic analysis...')} />
           </div>
        ) : result ? (
          <div className="animate-in fade-in duration-500 max-w-4xl">
            <EconomyTable result={result} speciesId={speciesId} />
          </div>
        ) : null}
    </>
  );
}

export default function EconomyPageClient() {
  const { t } = useLanguage();

  return (
    <div className="min-h-screen bg-[#fafaf8] py-16 sm:py-24">
      {/* Hero Section */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 mb-16 border-b border-gray-200 pb-10">
        <p className="text-sm font-bold text-gray-500 uppercase tracking-widest mb-2">{t('Kalkulator Cerdas', 'Smart Calculator')}</p>
        <h1 className="text-4xl sm:text-6xl font-extrabold text-gray-900 leading-tight mb-6">
          {t('Nilai Ekonomi Invasif', 'Invasive Economic Value')}
        </h1>
        <p className="text-xl text-gray-600 max-w-3xl leading-relaxed">
          {t('Temukan potensi penghasilan riil dari tangkapan spesies invasif Anda.', 'Discover the real income potential of your invasive species catches.')}
        </p>
      </section>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-16">
          <div className="lg:col-span-8">
            <Suspense fallback={<LoadingSpinner text="Memuat Form..." />}>
              <EconomyForm />
            </Suspense>

            {/* PANDUAN PROSES */}
            <div className="mt-20">
              <h2 className="text-2xl font-extrabold text-gray-900 mb-8 border-b border-gray-200 pb-4">{t('Panduan Memproses Tangkapan', 'Processing Guide')}</h2>
              
              <div className="space-y-12">
                {[
                  {
                    emoji: '🪨', titleId: 'Biochar (Arang Aktif)', titleEn: 'Biochar (Activated Charcoal)',
                    steps: [
                      { id: 'Keringkan ikan di bawah sinar matahari (2-3 hari) atau oven 80°C.', en: 'Sun-dry fish (2-3 days) or oven at 80°C.' },
                      { id: 'Masukkan ke dalam wadah besi tertutup dengan sedikit lubang udara.', en: 'Place in closed iron container with small air holes.' },
                      { id: 'Bakar dengan api sedang selama 2-4 jam hingga asap biru muncul.', en: 'Burn at medium heat for 2-4 hours until blue smoke appears.' },
                      { id: 'Tutup rapat semua lubang, biarkan dingin 12 jam.', en: 'Seal all holes, cool for 12 hours.' },
                      { id: 'Haluskan dan campur ke tanah (1 kg/m²).', en: 'Crush and mix into soil (1 kg/m²).' },
                    ],
                    tip: { id: 'Pirolisis suhu >300°C menghancurkan logam berat & parasit.', en: 'Pyrolysis at >300°C destroys heavy metals & parasites.' },
                  },
                  {
                    emoji: '🌱', titleId: 'Pupuk Cair Organik (POC)', titleEn: 'Liquid Organic Fertilizer (LOF)',
                    steps: [
                      { id: 'Cacah ikan kasar, isi wadah 30-50%.', en: 'Coarsely chop fish, fill container 30-50%.' },
                      { id: 'Tambahkan EM4 10 ml/liter dan tetes tebu 20 ml/liter.', en: 'Add EM4 10 ml/liter and molasses 20 ml/liter.' },
                      { id: 'Isi air hingga 80%, tutup tidak kedap total.', en: 'Fill water to 80%, seal not fully airtight.' },
                      { id: 'Fermentasi 14-21 hari. Aduk tiap 2-3 hari.', en: 'Ferment 14-21 days. Stir every 2-3 days.' },
                      { id: 'Saring ampas. Encerkan 1:10 sebelum pakai.', en: 'Strain solids. Dilute 1:10 before use.' },
                    ],
                    tip: { id: 'Harga POC ikan Rp 15.000–35.000/liter.', en: 'Fish LOF price Rp 15,000–35,000/liter.' },
                  },
                ].map((guide) => (
                  <div key={guide.titleId}>
                    <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                      <span>{guide.emoji}</span> {t(guide.titleId, guide.titleEn)}
                    </h3>
                    <ol className="list-decimal list-inside space-y-2 mb-4 text-gray-700">
                      {guide.steps.map((step, i) => (
                        <li key={i}>{t(step.id, step.en)}</li>
                      ))}
                    </ol>
                    <p className="text-sm text-gray-500 italic pl-5 border-l-2 border-gray-300">
                      Catatan: {t(guide.tip.id, guide.tip.en)}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="lg:col-span-4">
            {/* JUAL KE MANA? */}
            <div className="bg-gray-100 p-6 sm:p-8">
              <h2 className="text-xl font-extrabold text-gray-900 mb-6">{t('Jual ke Mana?', 'Where to Sell?')}</h2>
              
              <div className="space-y-6">
                {[
                  {
                    titleId: 'Pabrik Tepung Ikan', titleEn: 'Fish Meal Factories',
                    descId: 'Terima ikan segar/sisa tanpa syarat spesies.', descEn: 'Accept fresh fish/scraps without species requirement.',
                  },
                  {
                    titleId: 'Peternak Lele & Unggas', titleEn: 'Catfish & Poultry Farmers',
                    descId: 'Cincang sebagai pakan segar.', descEn: 'Chop as fresh feed.',
                  },
                  {
                    titleId: 'Pengepul Pupuk', titleEn: 'Fertilizer Collectors',
                    descId: 'Beli hasil fermentasi (POC).', descEn: 'Buy fermented liquid fertilizer.',
                  },
                  {
                    titleId: 'Komunitas Aquascape', titleEn: 'Aquascape Communities',
                    descId: 'Khusus predator hias (Peacock Bass, Louhan).', descEn: 'Specific ornamental predators only.',
                  },
                  {
                    titleId: 'BRIN & Universitas', titleEn: 'BRIN & Universities',
                    descId: 'Butuh spesimen penelitian (Piranha, Arapaima).', descEn: 'Need research specimens.',
                  },
                ].map((item, i) => (
                  <div key={i} className="border-b border-gray-200 pb-4 last:border-0 last:pb-0">
                    <p className="font-bold text-gray-900 text-sm uppercase tracking-wide mb-1">{t(item.titleId, item.titleEn)}</p>
                    <p className="text-sm text-gray-600">{t(item.descId, item.descEn)}</p>
                  </div>
                ))}
              </div>

              <div className="mt-8 pt-8 border-t border-gray-300">
                <a
                  href="https://www.infoikan.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block text-center px-4 py-3 bg-gray-900 text-white font-bold text-xs uppercase tracking-widest hover:bg-gray-800 transition-colors"
                >
                  {t('Cek Harga infoikan.com', 'Check infoikan.com Prices')}
                </a>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
