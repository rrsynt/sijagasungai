'use client';

import { useState } from 'react';
import { useLanguage } from '@/components/LanguageContext';
import { findSpeciesByName } from '@/lib/species-database';
import { Search, RefreshCw, AlertCircle, CheckCircle, HelpCircle, X, Mic, MicOff } from 'lucide-react';
import Link from 'next/link';

interface TextResult {
  kandidat: Array<{
    namaLokal: string;
    namaIlmiah: string;
    kemungkinanPersen: number;
    alasan: string;
    isInvasif: boolean;
    statusInvasif: string;
  }>;
  rekomendasi: string;
  saranKonfirmasi: string;
}

// Quick-pick options per field
const OPTIONS = {
  warna: [
    { id: 'Hitam', en: 'Black' },
    { id: 'Abu-abu', en: 'Gray' },
    { id: 'Coklat / Kecoklatan', en: 'Brown' },
    { id: 'Kuning keemasan', en: 'Golden yellow' },
    { id: 'Merah / Oranye', en: 'Red / Orange' },
    { id: 'Hijau zaitun', en: 'Olive green' },
    { id: 'Perak / Putih keperakan', en: 'Silver / Silvery white' },
    { id: 'Bintik-bintik hitam putih', en: 'Black & white spotted' },
    { id: 'Loreng hitam kuning', en: 'Black yellow striped' },
  ],
  mulut: [
    { id: 'Penghisap di bawah (sucker)', en: 'Sucker-type (bottom)' },
    { id: 'Lebar seperti bass', en: 'Wide bass-like' },
    { id: 'Moncong panjang / lancip', en: 'Long / pointed snout' },
    { id: 'Bergigi tajam terlihat', en: 'Visible sharp teeth' },
    { id: 'Kecil di ujung moncong', en: 'Small at tip of snout' },
    { id: 'Normal / Biasa', en: 'Normal / Standard' },
  ],
  ciriKhas: [
    { id: 'Sisik keras seperti zirah / armor', en: 'Hard armored scales' },
    { id: 'Jenong / Tonjolan di kepala (nukhal)', en: 'Hump / nuchal hump on head' },
    { id: 'Sirip punggung besar seperti layar', en: 'Large sail-like dorsal fin' },
    { id: 'Badan sangat pipih', en: 'Very flat body' },
    { id: 'Badan bulat memanjang', en: 'Rounded elongated body' },
    { id: 'Ekor berlekuk dalam', en: 'Deeply forked tail' },
    { id: 'Tidak ada sisik (licin)', en: 'No scales (smooth)' },
    { id: 'Kumis / Sungut panjang', en: 'Long whiskers / barbels' },
    { id: 'Pola seperti macan tutul', en: 'Leopard-like pattern' },
  ],
  ukuran: [
    { id: 'Kecil (<15 cm)', en: 'Small (<15 cm)' },
    { id: 'Sedang (15–40 cm)', en: 'Medium (15–40 cm)' },
    { id: 'Besar (40–70 cm)', en: 'Large (40–70 cm)' },
    { id: 'Sangat besar (>70 cm)', en: 'Very large (>70 cm)' },
  ],
  habitat: [
    { id: 'Dasar sungai berlumpur', en: 'Muddy river bottom' },
    { id: 'Tengah perairan, berenang aktif', en: 'Mid-water, actively swimming' },
    { id: 'Dekat permukaan', en: 'Near surface' },
    { id: 'Dekat bebatuan / tebing sungai', en: 'Near rocks / riverbank' },
    { id: 'Tambak / kolam', en: 'Fish pond' },
    { id: 'Danau / Waduk', en: 'Lake / Reservoir' },
    { id: 'Muara / Air payau', en: 'Estuary / Brackish water' },
  ],
};

function ChipSelector({
  field,
  options,
  value,
  onChange,
  placeholder,
  disabled,
}: {
  field: string;
  options: { id: string; en: string }[];
  value: string;
  onChange: (val: string) => void;
  placeholder: string;
  disabled: boolean;
}) {
  const { t } = useLanguage();

  const toggle = (opt: string) => {
    // If already in value string, remove it; otherwise append
    const parts = value.split(',').map(s => s.trim()).filter(Boolean);
    const idx = parts.indexOf(opt);
    if (idx >= 0) {
      parts.splice(idx, 1);
    } else {
      parts.push(opt);
    }
    onChange(parts.join(', '));
  };

  const isSelected = (opt: string) =>
    value.split(',').map(s => s.trim()).includes(opt);

  return (
    <div>
      <div className="flex flex-wrap gap-1.5 mt-2">
        {options.map(opt => {
          const label = t(opt.id, opt.en);
          const sel = isSelected(t(opt.id, opt.en)) || isSelected(opt.id) || isSelected(opt.en);
          return (
            <button
              key={opt.id}
              type="button"
              disabled={disabled}
              onClick={() => toggle(label)}
              className={`text-[11px] px-3 py-1.5 uppercase tracking-widest font-bold transition-all border ${
                sel
                  ? 'bg-gray-900 text-white border-gray-900'
                  : 'bg-white text-gray-500 border-gray-300 hover:border-gray-900 hover:text-gray-900'
              }`}
            >
              {sel && <span className="mr-1.5">✓</span>}
              {label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export function TextIdentifier() {
  const { t, language } = useLanguage();
  const [isLoading, setIsLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [result, setResult] = useState<TextResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [form, setForm] = useState({
    warna: '',
    mulut: '',
    ciriKhas: '',
    ukuran: '',
    habitat: '',
    location: '',
    tambahan: '',
  });

  const set = (field: string, val: string) => setForm(p => ({ ...p, [field]: val }));

  const toggleListening = () => {
    if (isListening) {
      setIsListening(false);
      return;
    }
    
    // @ts-ignore
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert(t('Browser Anda tidak mendukung fitur input suara.', 'Your browser does not support voice input.'));
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = language === 'id' ? 'id-ID' : 'en-US';
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => setIsListening(true);
    
    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      setForm(p => ({ ...p, tambahan: p.tambahan ? p.tambahan + ' ' + transcript : transcript }));
    };

    recognition.onerror = (event: any) => {
      console.error('Speech recognition error', event.error);
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognition.start();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.warna && !form.ciriKhas) {
      setError(t('Isi minimal warna tubuh atau ciri khas.', 'Fill in at least body color or distinctive features.'));
      return;
    }
    setIsLoading(true);
    setError(null);
    setResult(null);

    try {
      const res = await fetch('/api/identify-text', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          deskripsi: {
            warna: form.warna || t('Tidak diketahui', 'Unknown'),
            mulut: form.mulut || t('Tidak diketahui', 'Unknown'),
            ciriKhas: `${form.ciriKhas} ${form.tambahan ? '(Tambahan: ' + form.tambahan + ')' : ''}` || t('Tidak diketahui', 'Unknown'),
            ukuran: form.ukuran || t('Tidak diketahui', 'Unknown'),
            habitat: form.habitat || t('Tidak diketahui', 'Unknown'),
          },
          location: form.location || t('Tidak diketahui', 'Unknown'),
          lang: language,
        }),
      });
      const data = await res.json();
      if (data.success) setResult(data.data);
      else setError(data.error || t('Terjadi kesalahan.', 'An error occurred.'));
    } catch {
      setError(t('Koneksi terputus.', 'Connection lost.'));
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    if (status === 'DARURAT' || status === 'KRITIS') return 'bg-red-100 text-red-800 border-red-200';
    if (status === 'TINGGI') return 'bg-orange-100 text-orange-800 border-orange-200';
    if (status === 'TIDAK INVASIF') return 'bg-emerald-100 text-emerald-800 border-emerald-200';
    return 'bg-amber-100 text-amber-800 border-amber-200';
  };

  const fields: Array<{
    field: keyof typeof form;
    labelId: string;
    labelEn: string;
    placeholderId: string;
    placeholderEn: string;
    options?: { id: string; en: string }[];
  }> = [
    { field: 'warna', labelId: 'Warna tubuh dominan *', labelEn: 'Dominant body color *', placeholderId: 'Pilih di bawah atau ketik...', placeholderEn: 'Pick below or type...', options: OPTIONS.warna },
    { field: 'mulut', labelId: 'Bentuk mulut', labelEn: 'Mouth shape', placeholderId: 'Pilih di bawah atau ketik...', placeholderEn: 'Pick below or type...', options: OPTIONS.mulut },
    { field: 'ciriKhas', labelId: 'Ciri khas / Tanda unik *', labelEn: 'Distinctive features *', placeholderId: 'Pilih di bawah atau ketik...', placeholderEn: 'Pick below or type...', options: OPTIONS.ciriKhas },
    { field: 'ukuran', labelId: 'Perkiraan ukuran', labelEn: 'Estimated size', placeholderId: 'Pilih di bawah atau ketik...', placeholderEn: 'Pick below or type...', options: OPTIONS.ukuran },
    { field: 'habitat', labelId: 'Ditemukan di mana', labelEn: 'Where found', placeholderId: 'Pilih di bawah atau ketik...', placeholderEn: 'Pick below or type...', options: OPTIONS.habitat },
    { field: 'location', labelId: 'Lokasi (Kota/Sungai)', labelEn: 'Location (City/River)', placeholderId: 'Contoh: Sungai Ciliwung, Jakarta', placeholderEn: 'e.g. Ciliwung River, Jakarta' },
  ];

  return (
    <div className="w-full max-w-4xl space-y-8">
      <div className="bg-blue-50 border-l-4 border-blue-600 p-5 flex items-start gap-4">
        <HelpCircle className="w-6 h-6 text-blue-600 shrink-0 mt-0.5" />
        <p className="text-sm text-blue-900 font-medium leading-relaxed">
          {t(
            'Ikan sudah lepas atau tidak sempat difoto? Pilih ciri-ciri yang sesuai atau ketik deskripsi sendiri — AI akan menebak kemungkinan spesiesnya.',
            "Fish escaped or couldn't photograph? Pick matching features or type your own description — AI will guess the possible species."
          )}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="bg-white border border-gray-200 p-8 sm:p-10 space-y-10">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
          {fields.slice(0, -1).map(({ field, labelId, labelEn, placeholderId, placeholderEn, options }) => (
            <div key={field} className="space-y-3">
              <label className="block text-xs font-bold text-gray-900 uppercase tracking-widest">
                {t(labelId, labelEn)}
              </label>
              <input
                type="text"
                value={form[field]}
                onChange={e => set(field, e.target.value)}
                placeholder={t(placeholderId, placeholderEn)}
                disabled={isLoading}
                className="block w-full py-2 border-b-2 border-gray-900 bg-transparent focus:outline-none focus:border-primary-sunai transition-colors text-sm"
              />
              {options && (
                <ChipSelector
                  field={field}
                  options={options}
                  value={form[field]}
                  onChange={val => set(field, val)}
                  placeholder={t(placeholderId, placeholderEn)}
                  disabled={isLoading}
                />
              )}
            </div>
          ))}
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <label className="block text-xs font-bold text-gray-900 uppercase tracking-widest">
              {t('Catatan Tambahan (Bebas)', 'Additional Notes (Free text)')}
            </label>
            <button
              type="button"
              onClick={toggleListening}
              className={`flex items-center gap-2 px-4 py-2 text-xs font-bold uppercase tracking-widest transition-colors border ${
                isListening 
                  ? 'bg-red-600 text-white border-red-600 animate-pulse' 
                  : 'bg-gray-100 text-gray-900 border-gray-300 hover:bg-gray-200'
              }`}
              title={t('Mulai bicara', 'Start speaking')}
            >
              {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
              {isListening ? t('Mendengarkan...', 'Listening...') : t('Bicara', 'Speak')}
            </button>
          </div>
          <textarea
            value={form.tambahan}
            onChange={e => set('tambahan', e.target.value)}
            placeholder={t('Ada ciri lain yang tidak ada di pilihan atas? Ketik atau ucapkan di sini...', 'Any other features not in the options above? Type or speak here...')}
            disabled={isLoading}
            className="block w-full py-3 border-b-2 border-gray-900 bg-gray-50 focus:outline-none focus:border-primary-sunai transition-colors text-sm min-h-[100px] resize-y px-3"
          />
        </div>

        {/* Lokasi */}
        <div className="space-y-3">
          <label className="block text-xs font-bold text-gray-900 uppercase tracking-widest">
            {t(fields[fields.length - 1].labelId, fields[fields.length - 1].labelEn)}
          </label>
          <div className="flex flex-col sm:flex-row gap-4">
            <input
              type="text"
              value={form.location}
              onChange={e => set('location', e.target.value)}
              placeholder={t(fields[fields.length - 1].placeholderId, fields[fields.length - 1].placeholderEn)}
              disabled={isLoading}
              className="block w-full flex-1 py-3 border-b-2 border-gray-900 bg-transparent focus:outline-none focus:border-primary-sunai transition-colors text-sm"
            />
            <button
              type="button"
              onClick={() => {
                if (navigator.geolocation) {
                  navigator.geolocation.getCurrentPosition(
                    pos => set('location', `${pos.coords.latitude}, ${pos.coords.longitude}`),
                    () => alert(t('Gagal mendapatkan lokasi. Pastikan izin lokasi aktif.', 'Failed to get location. Ensure location permission is active.'))
                  );
                }
              }}
              className="px-6 py-3 bg-gray-200 hover:bg-gray-300 text-gray-900 font-bold text-xs uppercase tracking-widest transition-colors w-full sm:w-auto"
              title={t('Gunakan GPS', 'Use GPS')}
            >
              📍 {t('Deteksi', 'Detect')}
            </button>
          </div>
        </div>

        {error && (
          <div className="p-5 bg-red-50 border-l-4 border-red-600 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
            <p className="text-sm font-medium text-red-900">{error}</p>
          </div>
        )}

        <button
          type="submit"
          disabled={isLoading}
          className="w-full flex items-center justify-center py-5 px-4 bg-gray-900 text-white text-sm font-bold uppercase tracking-widest hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {isLoading ? (
            <><RefreshCw className="animate-spin h-5 w-5 mr-3" />{t('Menganalisis deskripsi...', 'Analyzing description...')}</>
          ) : (
            <><Search className="h-5 w-5 mr-3" />{t('Tebak Spesies!', 'Guess Species!')}</>
          )}
        </button>
      </form>

      {result && (
        <div className="bg-white border border-gray-200 p-8 sm:p-10 animate-in fade-in duration-500 space-y-8 mt-12">
          <h3 className="text-2xl font-extrabold text-gray-900 uppercase tracking-widest border-b border-gray-200 pb-4">{t('Kemungkinan Spesies', 'Possible Species')}</h3>

          <div className="space-y-6">
            {result.kandidat.map((k, i) => {
              const matched = findSpeciesByName(k.namaIlmiah) || findSpeciesByName(k.namaLokal);
              return (
                <div key={i} className="border border-gray-200 p-6">
                  <div className="flex flex-col sm:flex-row items-start justify-between gap-4 mb-4">
                    <div>
                      <p className="font-extrabold text-xl text-gray-900">{k.namaLokal}</p>
                      <p className="text-sm italic text-gray-500">{k.namaIlmiah}</p>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <span className={`text-[10px] font-black uppercase tracking-widest px-3 py-1 border ${getStatusColor(k.statusInvasif)}`}>
                        {k.statusInvasif}
                      </span>
                      <span className="text-xl font-extrabold text-gray-900">{k.kemungkinanPersen}%</span>
                    </div>
                  </div>
                  <div className="w-full bg-gray-200 h-2 mb-4">
                    <div className="h-2 bg-gray-900 transition-all" style={{ width: `${k.kemungkinanPersen}%` }} />
                  </div>
                  <p className="text-sm text-gray-700 leading-relaxed">{k.alasan}</p>
                  {matched && (
                    <div className="mt-6 flex flex-col sm:flex-row gap-3">
                      <Link href={`/economy?species=${matched.id}`} className="px-6 py-3 bg-white border border-gray-300 text-gray-900 text-xs font-bold uppercase tracking-widest hover:bg-gray-50 text-center transition-colors">
                        💰 {t('Nilai Ekonomi', 'Economic Value')}
                      </Link>
                      <Link href={`/education?species=${matched.id}`} className="px-6 py-3 bg-gray-900 text-white text-xs font-bold uppercase tracking-widest hover:bg-gray-800 text-center transition-colors">
                        📚 {t('Pelajari', 'Learn More')}
                      </Link>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <div className="bg-blue-50 border-l-4 border-blue-600 p-5 space-y-3">
            <p className="text-sm font-bold text-blue-900">{result.rekomendasi}</p>
            <p className="text-xs font-medium text-blue-800 flex items-center gap-2">
              <CheckCircle className="w-4 h-4 shrink-0" /> {result.saranKonfirmasi}
            </p>
          </div>

          <Link
            href="/identify"
            className="flex items-center justify-center gap-2 w-full py-4 bg-gray-100 text-gray-900 font-bold uppercase tracking-widest text-xs hover:bg-gray-200 transition-colors border border-gray-300"
          >
            📸 {t('Konfirmasi dengan Foto', 'Confirm with Photo')}
          </Link>
        </div>
      )}
    </div>
  );
}
