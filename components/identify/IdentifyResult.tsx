'use client';

import { IdentificationResult } from '@/lib/types';
import { useLanguage } from '@/components/LanguageContext';
import { MapPin, DollarSign, BookOpen, ChevronDown, ChevronUp, AlertTriangle, CheckCircle, Info, Copy, Check, Share2, Volume2 } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import html2canvas from 'html2canvas';
import { SPECIES_DATABASE } from '@/lib/species-database';

interface IdentifyResultProps {
  result: IdentificationResult;
  speciesId: string | null;
  uploadedImage?: string | null;
}

export function IdentifyResult({ result, speciesId, uploadedImage }: IdentifyResultProps) {
  const { t } = useLanguage();
  const [showEcology, setShowEcology] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isCapturing, setIsCapturing] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);
  const shareCardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      if (result.statusInvasif === 'DARURAT' || result.statusInvasif === 'KRITIS') {
        // Long-short-long vibration for critical warning
        navigator.vibrate([200, 100, 200, 100, 400]);
      } else if (result.statusInvasif !== 'TIDAK INVASIF') {
        // Short double vibration for warning
        navigator.vibrate([100, 50, 100]);
      } else {
        // Single gentle vibration for safe
        navigator.vibrate([100]);
      }
    }
  }, [result.statusInvasif]);

  const handleSpeak = () => {
    if (typeof window === 'undefined' || !window.speechSynthesis) return;
    
    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      return;
    }

    const textToSpeak = `Ini adalah ikan ${result.namaLokal}. Status invasif: ${result.statusInvasif}. ${result.alasanInvasif}. Rekomendasi tindakan: ${result.rekomendasiAksi}`;
    const utterance = new SpeechSynthesisUtterance(textToSpeak);
    utterance.lang = 'id-ID';
    
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);
    
    setIsSpeaking(true);
    window.speechSynthesis.speak(utterance);
  };

  const handleShare = async () => {
    if (!shareCardRef.current) return;
    
    try {
      setIsCapturing(true);
      
      // Tunggu font dan image load
      await new Promise(resolve => setTimeout(resolve, 800));
      
      const canvas = await html2canvas(shareCardRef.current, { 
        scale: 2, // Kualitas tinggi
        useCORS: true, // Mengizinkan gambar external/lokal
        backgroundColor: '#ffffff',
        logging: false,
      });

      const blob = await new Promise<Blob | null>(resolve => canvas.toBlob(resolve, 'image/png'));
      if (!blob) throw new Error('Canvas to Blob failed');

      const fileName = `SiJagaSungai-${result.namaLokal.replace(/\s+/g, '-')}.png`;
      const file = new File([blob], fileName, { type: blob.type });

      const shareText = `Saya telah mengidentifikasi spesies invasif ${result.namaLokal} menggunakan AI SiJaga Sungai! Bantu jaga perairan kita.`;

      // Instagram dan beberapa sosmed memblokir teks otomatis dari Web Share API.
      // Jadi kita "hack" dengan menyalin teks ke clipboard pengguna terlebih dahulu!
      try {
        await navigator.clipboard.writeText(shareText);
      } catch (e) {
        // Abaikan jika clipboard gagal
      }

      // Mencoba menggunakan Web Share API native (untuk memunculkan opsi IG, FB, WA, dll di HP/Desktop)
      if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          title: 'Laporan SiJaga Sungai',
          text: shareText,
          files: [file]
        });
      } else {
        // Fallback: Trigger download jika native share tidak didukung
        const dataUrl = canvas.toDataURL('image/png');
        const link = document.createElement('a');
        link.download = fileName;
        link.href = dataUrl;
        link.click();
      }

      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch (error) {
      console.error('Failed to generate image', error);
      // Fallback text copy jika gagal
      const text = `🐟 ${result.namaLokal} (${result.namaIlmiah})\nStatus: ${result.statusInvasif}\n📍 Laporkan di SiJaga Sungai`;
      navigator.clipboard.writeText(text);
    } finally {
      setIsCapturing(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'DARURAT':
      case 'KRITIS':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'TINGGI':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'SEDANG':
        return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'RENDAH':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'TIDAK INVASIF':
      default:
        return 'bg-emerald-100 text-emerald-800 border-emerald-200';
    }
  };

  const getStatusIcon = (status: string) => {
    if (status === 'TIDAK INVASIF') return <CheckCircle className="w-5 h-5 mr-1.5" />;
    if (status === 'DARURAT' || status === 'KRITIS') return <AlertTriangle className="w-5 h-5 mr-1.5" />;
    return <Info className="w-5 h-5 mr-1.5" />;
  };

  const getGradientForStatus = (status: string) => {
    switch (status) {
      case 'DARURAT':
      case 'KRITIS':
        return 'from-red-600 via-rose-700 to-red-950';
      case 'TINGGI':
        return 'from-orange-500 via-red-500 to-orange-900';
      case 'SEDANG':
        return 'from-amber-400 via-orange-400 to-amber-800';
      case 'RENDAH':
        return 'from-yellow-400 via-amber-500 to-yellow-800';
      case 'TIDAK INVASIF':
      default:
        return 'from-emerald-400 via-teal-600 to-emerald-900';
    }
  };

  const speciesData = speciesId ? SPECIES_DATABASE[speciesId] : null;

  const getConfidenceLevel = (confidence: string) => {
    switch (confidence) {
      case 'SANGAT YAKIN': return 95;
      case 'CUKUP YAKIN': return 75;
      case 'KURANG YAKIN': return 40;
      default: return 10;
    }
  };

  const confidencePercentage = getConfidenceLevel(result.tingkatKeyakinan);

  return (
    <div 
      ref={cardRef} 
      className="bg-white border border-gray-200 p-8 sm:p-10 animate-in fade-in slide-in-from-bottom-4 duration-500 relative"
    >
      <div className="flex flex-col sm:flex-row justify-between items-start gap-6 mb-10 border-b border-gray-200 pb-8">
        <div>
          <div className="flex items-center gap-4 mb-2">
            <h2 className="text-4xl font-extrabold text-gray-900 uppercase tracking-tight">{result.namaLokal}</h2>
            <button
              onClick={handleSpeak}
              className={`p-3 border transition-colors ${
                isSpeaking 
                  ? 'bg-gray-900 text-white border-gray-900 animate-pulse' 
                  : 'bg-white text-gray-900 border-gray-300 hover:border-gray-900 hover:bg-gray-50'
              }`}
              title={t('Bacakan hasil', 'Read aloud')}
            >
              <Volume2 className="w-5 h-5" />
            </button>
          </div>
          <p className="text-xl italic text-gray-600">{result.namaIlmiah}</p>
        </div>
        <div className={`px-5 py-3 border-2 flex items-center font-black text-sm tracking-widest uppercase ${getStatusColor(result.statusInvasif)}`}>
          {getStatusIcon(result.statusInvasif)}
          {result.statusInvasif === 'TIDAK INVASIF' ? t('AMAN', 'SAFE') : result.statusInvasif}
        </div>
      </div>



      <div className="grid grid-cols-1 md:grid-cols-2 gap-12 mb-10 border-b border-gray-200 pb-10">
        <div className="space-y-8">
          <div>
            <div className="flex justify-between items-end mb-3">
              <span className="text-xs font-bold text-gray-900 uppercase tracking-widest">{t('Tingkat Keyakinan AI', 'AI Confidence Level')}</span>
              <span className="text-sm font-extrabold text-gray-900">{result.tingkatKeyakinan}</span>
            </div>
            <div className="w-full bg-gray-200 h-2">
              <div 
                className={`h-2 transition-all ${confidencePercentage > 70 ? 'bg-gray-900' : confidencePercentage > 40 ? 'bg-amber-500' : 'bg-red-600'}`}
                style={{ width: `${confidencePercentage}%` }}
              ></div>
            </div>
          </div>

          <div>
            <h3 className="text-xs font-bold text-gray-900 uppercase tracking-widest mb-3">{t('Asal Negara', 'Origin')}</h3>
            <p className="flex items-center text-gray-900 font-bold bg-gray-50 px-5 py-4 border-l-4 border-gray-900 text-sm">
              🌍 <span className="ml-3 uppercase tracking-widest">{result.asalNegara}</span>
            </p>
          </div>
          
          <div>
             <h3 className="text-xs font-bold text-gray-900 uppercase tracking-widest mb-3">{t('Penjelasan SiJaga', 'SiJaga Explanation')}</h3>
             <div className="bg-gray-50 border border-gray-200 p-5 text-gray-700 leading-relaxed text-sm">
               {result.penjelasanSiJaga}
             </div>
          </div>

          {result.rekomendasiAksi && (
            <div className="bg-amber-50 border-l-4 border-amber-500 p-5 flex items-start gap-4">
              <AlertTriangle className="w-6 h-6 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-black text-amber-900 uppercase tracking-widest mb-2">{t('Rekomendasi Aksi', 'Recommended Action')}</p>
                <p className="text-sm text-amber-900 leading-relaxed">{result.rekomendasiAksi}</p>
              </div>
            </div>
          )}

          {result.fotoKurangJelas && result.panduanFotoUlang && (
            <div className="bg-red-50 border-l-4 border-red-600 p-5 mt-6">
              <div className="flex items-start gap-4">
                <AlertTriangle className="w-6 h-6 text-red-600 shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-xs font-black text-red-900 uppercase tracking-widest mb-2">{t('Kualitas Foto Kurang Optimal', 'Suboptimal Photo Quality')}</h4>
                  <p className="text-sm text-red-800 leading-relaxed">{result.panduanFotoUlang}</p>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="space-y-6">
          <button 
            onClick={() => setShowEcology(!showEcology)}
            className="w-full flex items-center justify-between p-5 bg-gray-50 hover:bg-gray-100 border border-gray-200 transition-colors"
          >
            <span className="font-bold text-gray-900 uppercase tracking-widest text-sm">{t('Dampak Ekologi', 'Ecological Impact')}</span>
            {showEcology ? <ChevronUp className="w-5 h-5 text-gray-900" /> : <ChevronDown className="w-5 h-5 text-gray-900" />}
          </button>
          
          {showEcology && (
            <div className="p-5 bg-white border border-gray-200 animate-in slide-in-from-top-2">
              <ul className="space-y-4">
                {result.dampakEkologi.length > 0 ? (
                  result.dampakEkologi.map((impact, idx) => (
                    <li key={idx} className="flex items-start border-b border-gray-100 pb-3 last:border-0 last:pb-0">
                      <span className="text-gray-900 font-black mr-3 mt-0.5">/</span>
                      <span className="text-gray-700 text-sm leading-relaxed">{impact}</span>
                    </li>
                  ))
                ) : (
                  <p className="text-sm text-gray-500 italic">{t('Tidak ada data.', 'No data available.')}</p>
                )}
              </ul>
            </div>
          )}

          {result.isInvasif && (
            <div className="flex flex-col gap-4">
              <h3 className="text-xs font-bold text-gray-900 uppercase tracking-widest mb-2">{t('Aksi Cepat', 'Quick Actions')}</h3>
              
              <Link 
                href={`/map?report=${encodeURIComponent(result.namaLokal)}`}
                className="flex items-center p-4 bg-white border-2 border-gray-200 hover:border-gray-900 transition-all group"
                onClick={() => {
                  // Pre-fill report modal with identification data
                  try {
                    sessionStorage.setItem('reportPrefill', JSON.stringify({
                      speciesName: result.namaLokal,
                      scientificName: result.namaIlmiah,
                      imageUrl: uploadedImage || null,
                    }));
                  } catch {}
                }}
              >
                <div className="w-12 h-12 bg-gray-100 flex items-center justify-center mr-4 group-hover:bg-gray-900 transition-colors">
                  <MapPin className="w-5 h-5 text-gray-900 group-hover:text-white transition-colors" />
                </div>
                <div>
                  <p className="font-black text-gray-900 uppercase tracking-widest text-sm mb-1">{t('Laporkan Temuan', 'Report Sighting')}</p>
                  <p className="text-xs text-gray-500">{t('Tambahkan ke peta nasional', 'Add to national map')}</p>
                </div>
              </Link>

              {speciesId && (
                <>
                  <Link 
                    href={`/economy?species=${speciesId}`}
                    className="flex items-center p-4 bg-white border-2 border-gray-200 hover:border-gray-900 transition-all group"
                  >
                    <div className="w-12 h-12 bg-gray-100 flex items-center justify-center mr-4 group-hover:bg-gray-900 transition-colors">
                      <DollarSign className="w-5 h-5 text-gray-900 group-hover:text-white transition-colors" />
                    </div>
                    <div>
                      <p className="font-black text-gray-900 uppercase tracking-widest text-sm mb-1">{t('Cek Nilai Ekonomi', 'Check Economic Value')}</p>
                      <p className="text-xs text-gray-500">{t('Potensi pemanfaatan', 'Utilization potential')}</p>
                    </div>
                  </Link>

                  <Link 
                    href={`/education?species=${speciesId}`}
                    className="flex items-center p-4 bg-white border-2 border-gray-200 hover:border-gray-900 transition-all group"
                  >
                    <div className="w-12 h-12 bg-gray-100 flex items-center justify-center mr-4 group-hover:bg-gray-900 transition-colors">
                      <BookOpen className="w-5 h-5 text-gray-900 group-hover:text-white transition-colors" />
                    </div>
                    <div>
                      <p className="font-black text-gray-900 uppercase tracking-widest text-sm mb-1">{t('Pelajari Spesies', 'Study Species')}</p>
                      <p className="text-xs text-gray-500">{t('Kartu fakta dan kuis', 'Fact cards and quizzes')}</p>
                    </div>
                  </Link>

                  <Link
                    href="/map"
                    className="flex items-center p-4 bg-white border-2 border-gray-200 hover:border-gray-900 transition-all group"
                  >
                    <div className="w-12 h-12 bg-gray-100 flex items-center justify-center mr-4 group-hover:bg-gray-900 transition-colors">
                      <Share2 className="w-5 h-5 text-gray-900 group-hover:text-white transition-colors" />
                    </div>
                    <div>
                      <p className="font-black text-gray-900 uppercase tracking-widest text-sm mb-1">{t('Lihat Persebaran di Peta', 'View Distribution Map')}</p>
                      <p className="text-xs text-gray-500">{t('Zona merah & titik laporan', 'Red zones & report points')}</p>
                    </div>
                  </Link>
                </>
              )}

              {/* WhatsApp Share */}
              <a
                href={`https://wa.me/?text=${encodeURIComponent(`🐟 Saya baru mengidentifikasi *${result.namaLokal}* (${result.namaIlmiah}) menggunakan SiJaga Sungai!\n\nStatus: *${result.statusInvasif}*\n${result.penjelasanSiJaga ?? ''}\n\nCek di: https://sijaga-sungai.a.run.app`)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center p-4 bg-white border-2 border-[#25D366] hover:bg-[#25D366] hover:text-white transition-all group"
              >
                <div className="w-12 h-12 bg-[#25D366]/10 flex items-center justify-center mr-4 group-hover:bg-white transition-colors">
                  <svg className="w-6 h-6 text-[#128C7E]" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/><path d="M12 0C5.374 0 0 5.373 0 12c0 2.108.549 4.086 1.508 5.808L.057 23.999l6.337-1.44A11.947 11.947 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.946a9.93 9.93 0 01-5.031-1.356l-.361-.214-3.741.981.999-3.648-.237-.375A9.95 9.95 0 012.054 12C2.054 6.501 6.502 2.054 12 2.054S21.946 6.501 21.946 12 17.498 21.946 12 21.946z"/></svg>
                </div>
                <div>
                  <p className="font-black uppercase tracking-widest text-sm mb-1 group-hover:text-white transition-colors">{t('Bagikan via WhatsApp', 'Share via WhatsApp')}</p>
                  <p className="text-xs text-gray-500 group-hover:text-white/80 transition-colors">{t('Sebarkan info ke komunitasmu', 'Spread the word to your community')}</p>
                </div>
              </a>
              
            </div>
          )}
        </div>
      </div>

      {/* PEMANFAATAN & PEMUSNAHAN */}
      {(() => {
        const speciesData = speciesId ? SPECIES_DATABASE[speciesId] : null;
        const hasEconomicPathways = speciesData && Object.values(speciesData.jalurEkonomi).some(p => p?.available);
        const isDarurat = result.statusInvasif === 'DARURAT' || result.statusInvasif === 'KRITIS';

        if (hasEconomicPathways) {
          return (
            <div className="mb-10 border-l-4 border-emerald-600 p-6 bg-emerald-50">
              <div className="flex items-start gap-4">
                <TrendingUp className="w-6 h-6 text-emerald-700 shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="text-xs font-black text-emerald-900 uppercase tracking-widest mb-2">
                    {t('Tangkapan ini memiliki nilai ekonomi!', 'This catch has economic value!')}
                  </p>
                  <p className="text-sm text-emerald-800 mb-4 leading-relaxed">
                    {t(
                      'Jangan dibuang — ada jalur pemanfaatan yang bisa menghasilkan pendapatan. Lihat kalkulasi lengkapnya.',
                      "Don't discard — there are utilization pathways that can generate income. See the full calculation."
                    )}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {Object.entries(speciesData!.jalurEkonomi).filter(([, v]) => v?.available).map(([key]) => (
                      <span key={key} className="text-xs font-bold uppercase tracking-widest bg-emerald-700 text-white px-3 py-1.5">
                        {key === 'tepungIkan' ? '🌾 Tepung Ikan' :
                         key === 'pakanSegar' ? '🐔 Pakan Ternak' :
                         key === 'pupukOrganik' ? '🌱 Pupuk Organik' :
                         key === 'konsumsi' ? '🍽️ Konsumsi' :
                         key === 'ikanhias' ? '🐠 Ikan Hias' :
                         key === 'kerajinan' ? '👜 Kerajinan' : key}
                      </span>
                    ))}
                    {speciesId && (
                      <Link
                        href={`/economy?species=${speciesId}`}
                        className="text-xs font-black uppercase tracking-widest border-2 border-emerald-700 text-emerald-800 px-4 py-1.5 hover:bg-emerald-700 hover:text-white transition-colors ml-auto"
                      >
                        {t('Hitung Nilai →', 'Calculate Value →')}
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        }

        if (isDarurat) {
          return (
            <div className="mb-10 border-l-4 border-red-600 p-6 bg-red-50">
              <div className="flex items-start gap-4 mb-4">
                <Trash2 className="w-6 h-6 text-red-700 shrink-0 mt-0.5" />
                <p className="text-xs font-black text-red-900 uppercase tracking-widest">
                  {t('Cara Pemusnahan Layak — JANGAN Dilepas!', 'Proper Disposal — DO NOT Release!')}
                </p>
              </div>
              <ol className="space-y-3 pl-2">
                {[
                  t('🚫 Jangan lepas kembali ke perairan — melanggar Permen KP No. 19/2020.', '🚫 Do not release back — violates MKP Regulation No. 19/2020.'),
                  t('❄️ Masukkan ke wadah berisi es batu atau freezer untuk mematikan secara manusiawi.', '❄️ Place in ice or freezer to humanely euthanize.'),
                  t('📸 Dokumentasikan dengan foto dan catat lokasi tangkap sebagai bukti laporan.', '📸 Document with photo and record location as evidence.'),
                  t('📞 Hubungi KKP Hotline: 1500-415 atau Dinas Kelautan setempat dalam 1×24 jam.', '📞 Contact KKP Hotline: 1500-415 or local fisheries office within 24 hours.'),
                  t('🔬 Dapat diserahkan ke BRIN/KKP untuk koleksi penelitian ilmiah.', '🔬 May be submitted to BRIN/KKP for scientific research collection.'),
                ].map((step, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <span className="text-red-700 font-black text-sm mt-0.5 shrink-0">{i + 1}.</span>
                    <span className="text-sm text-red-900 leading-relaxed">{step}</span>
                  </li>
                ))}
              </ol>
              <div className="mt-6 flex flex-col sm:flex-row gap-4">
                <a
                  href={`https://wa.me/628111262220?text=${encodeURIComponent(`Halo KKP, saya menemukan ${result.namaLokal} (${result.namaIlmiah}) — status ${result.statusInvasif}. Mohon panduan pelaporan segera. #SiJagaSungai`)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 flex items-center justify-center gap-3 py-3 px-4 bg-[#25D366] hover:bg-[#1da851] text-white font-bold text-xs uppercase tracking-widest transition-colors"
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/><path d="M12 0C5.374 0 0 5.373 0 12c0 2.108.549 4.086 1.508 5.808L.057 23.999l6.337-1.44A11.947 11.947 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.946a9.93 9.93 0 01-5.031-1.356l-.361-.214-3.741.981.999-3.648-.237-.375A9.95 9.95 0 012.054 12C2.054 6.501 6.502 2.054 12 2.054S21.946 6.501 21.946 12 17.498 21.946 12 21.946z"/></svg>
                  {t('Lapor ke KKP via WhatsApp', 'Report to KKP via WhatsApp')}
                </a>
                <a
                  href="https://kkp.go.id/lapor"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 flex items-center justify-center gap-3 py-3 px-4 bg-white border border-red-200 text-red-700 font-bold text-xs uppercase tracking-widest hover:bg-red-50 transition-colors"
                >
                  🌐 {t('Portal Laporan KKP', 'KKP Report Portal')}
                </a>
              </div>
            </div>
          );
        }

        return null;
      })()}

      {/* TIGA DAMPAK BANNER */}
      {result.isInvasif && (
        <div className="border-t border-gray-200 pt-10">
          <p className="text-xs font-black text-gray-900 uppercase tracking-widest text-center mb-6">
            {t('Satu Foto. Tiga Dampak. — Lanjutkan Perjalananmu', 'One Photo. Three Impacts. — Continue Your Journey')}
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Impact 1 - Done */}
            <div className="flex flex-col items-center p-5 bg-gray-50 border border-gray-200">
              <div className="w-10 h-10 bg-gray-900 flex items-center justify-center mb-3">
                <span className="text-white text-sm font-black">✓</span>
              </div>
              <p className="text-xs font-black text-gray-900 uppercase tracking-widest text-center">{t('Identifikasi', 'Identify')}</p>
              <p className="text-xs text-gray-500 text-center mt-1 font-medium">{t('Selesai', 'Done')}</p>
            </div>

            {/* Impact 2 - Laporkan */}
            <Link
              href={`/map?report=${encodeURIComponent(result.namaLokal)}`}
              className="flex flex-col items-center p-5 bg-white border-2 border-gray-300 hover:border-gray-900 hover:bg-gray-50 transition-all group"
              onClick={() => {
                try {
                  sessionStorage.setItem('reportPrefill', JSON.stringify({
                    speciesName: result.namaLokal,
                    scientificName: result.namaIlmiah,
                    imageUrl: uploadedImage || null,
                  }));
                } catch {}
              }}
            >
              <div className="w-10 h-10 bg-gray-100 group-hover:bg-gray-200 flex items-center justify-center mb-3 transition-colors">
                <MapPin className="w-5 h-5 text-gray-900" />
              </div>
              <p className="text-xs font-black text-gray-900 uppercase tracking-widest group-hover:text-black text-center transition-colors">{t('Laporkan', 'Report')}</p>
              <p className="text-xs text-gray-500 text-center mt-1 font-medium">{t('ke Peta Nasional', 'to National Map')}</p>
            </Link>

            {/* Impact 3 - Nilai Ekonomi */}
            {speciesId ? (
              <Link
                href={`/economy?species=${speciesId}`}
                className="flex flex-col items-center p-5 bg-white border-2 border-gray-300 hover:border-gray-900 hover:bg-gray-50 transition-all group"
              >
                <div className="w-10 h-10 bg-gray-100 group-hover:bg-gray-200 flex items-center justify-center mb-3 transition-colors">
                  <DollarSign className="w-5 h-5 text-gray-900" />
                </div>
                <p className="text-xs font-black text-gray-900 uppercase tracking-widest group-hover:text-black text-center transition-colors">{t('Nilai Ekonomi', 'Economic Value')}</p>
                <p className="text-xs text-gray-500 text-center mt-1 font-medium">{t('Hitung potensi', 'Calculate potential')}</p>
              </Link>
            ) : (
              <div className="flex flex-col items-center p-5 bg-gray-50 border border-gray-200 opacity-50">
                <div className="w-10 h-10 bg-gray-200 flex items-center justify-center mb-3">
                  <DollarSign className="w-5 h-5 text-gray-400" />
                </div>
                <p className="text-xs font-black text-gray-400 uppercase tracking-widest text-center">{t('Nilai Ekonomi', 'Economic Value')}</p>
                <p className="text-xs text-gray-400 text-center mt-1 font-medium">{t('Cek di halaman ekonomi', 'Check economy page')}</p>
              </div>
            )}
          </div>

          {/* Share Button */}
          {!isCapturing && (
            <button
              onClick={handleShare}
              disabled={isCapturing}
              className={`mt-6 w-full flex items-center justify-center gap-3 py-4 border-2 transition-all text-xs font-black uppercase tracking-widest ${
                copied
                  ? 'bg-emerald-50 border-emerald-600 text-emerald-800'
                  : 'bg-white border-gray-900 text-gray-900 hover:bg-gray-900 hover:text-white'
              }`}
            >
              {isCapturing ? (
                <>{t('Memproses Gambar...', 'Processing Image...')}</>
              ) : copied ? (
                <><Check className="w-5 h-5" /> {t('Selesai! 🎉', 'Done! 🎉')}</>
              ) : (
                <><Share className="w-5 h-5" /> {t('Share Sosmed', 'Share to Social Media')}</>
              )}
            </button>
          )}

          {/* Watermark Khusus Hasil Capture */}
          {isCapturing && (
            <div className="mt-8 pt-4 border-t border-gray-100 flex items-center justify-center opacity-80">
              <div className="flex items-center space-x-2">
                <div className="w-6 h-6 rounded-full bg-primary-sunai/20 flex items-center justify-center text-primary-sunai font-bold text-xs">
                  💧
                </div>
                <span className="font-extrabold text-sm text-gray-900 tracking-tight">SiJaga Sungai</span>
                <span className="text-xs text-gray-400">— Bantu jaga perairan kita!</span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* HIDDEN SHARE CARD TEMPLATE */}
      <div className="absolute top-0 left-0 -z-50 opacity-0 pointer-events-none" aria-hidden="true">
        <div 
          ref={shareCardRef}
          style={{ 
            fontFamily: "'Inter', sans-serif",
            width: '1080px',
            height: '1350px',
            background: result.statusInvasif === 'DARURAT' || result.statusInvasif === 'KRITIS' ? 'linear-gradient(to bottom right, #dc2626, #4c0519)' : 
                       result.statusInvasif === 'TINGGI' ? 'linear-gradient(to bottom right, #f97316, #7c2d12)' :
                       result.statusInvasif === 'SEDANG' ? 'linear-gradient(to bottom right, #fbbf24, #92400e)' :
                       'linear-gradient(to bottom right, #34d399, #064e3b)',
            padding: '4rem',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            position: 'relative'
          }}
        >
          <div style={{ position: 'relative', zIndex: 10, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flexGrow: 1, color: '#ffffff', gap: '3rem' }}>
            <div style={{ backgroundColor: 'rgba(255,255,255,0.2)', padding: '0.75rem 2rem', borderRadius: '9999px', border: '1px solid rgba(255,255,255,0.3)', letterSpacing: '0.2em', fontWeight: 900, fontSize: '1.25rem', color: 'rgba(255,255,255,0.9)', textTransform: 'uppercase' }}>
              LAPORAN SIJAGA SUNGAI
            </div>
            
            {/* Foto yang diunggah pengguna atau fallback ke foto database */}
            <div style={{ width: '20rem', height: '20rem', backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: '3rem', border: '4px solid rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '180px', position: 'relative', overflow: 'hidden' }}>
              {uploadedImage ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={uploadedImage} alt="Foto Temuan" className="w-full h-full object-cover" />
              ) : speciesData?.imageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={speciesData.imageUrl} alt={result.namaLokal} className="w-full h-full object-cover" />
              ) : (
                <div className="drop-shadow-2xl">{speciesData?.badgeEmoji || '🐟'}</div>
              )}
            </div>

            <div style={{ textAlign: 'center', maxWidth: '48rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <h1 style={{ fontSize: '6rem', fontWeight: 900, letterSpacing: '-0.025em', color: '#ffffff', lineHeight: 1 }}>
                {result.namaLokal}
              </h1>
              <p style={{ fontSize: '2.25rem', fontStyle: 'italic', fontWeight: 300, color: 'rgba(255,255,255,0.8)' }}>
                {result.namaIlmiah}
              </p>
            </div>

            <div style={{ 
              marginTop: '1rem', 
              padding: '1.5rem 3rem', 
              borderRadius: '1.5rem', 
              border: '4px solid',
              display: 'flex', 
              alignItems: 'center', 
              gap: '1.5rem',
              ...(result.statusInvasif === 'DARURAT' || result.statusInvasif === 'KRITIS' ? { backgroundColor: 'rgba(127,29,29,0.6)', borderColor: 'rgba(248,113,113,0.5)', color: '#fef2f2' } : 
                 result.statusInvasif === 'TINGGI' ? { backgroundColor: 'rgba(124,45,18,0.6)', borderColor: 'rgba(251,146,60,0.5)', color: '#fff7ed' } :
                 result.statusInvasif === 'SEDANG' ? { backgroundColor: 'rgba(120,53,15,0.6)', borderColor: 'rgba(251,191,36,0.5)', color: '#fffbeb' } :
                 { backgroundColor: 'rgba(6,78,59,0.6)', borderColor: 'rgba(52,211,153,0.5)', color: '#ecfdf5' })
            }}>
              <AlertTriangle style={{ width: '4rem', height: '4rem' }} />
              <div>
                <p style={{ fontSize: '1.5rem', fontWeight: 700, opacity: 0.8, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '0.25rem' }}>Status Bahaya</p>
                <p style={{ fontSize: '3rem', fontWeight: 900, letterSpacing: '0.05em' }}>{result.statusInvasif}</p>
              </div>
            </div>
            
            {/* Teks Quotes Pelaporan */}
            <div style={{ backgroundColor: 'rgba(0,0,0,0.2)', padding: '2rem', borderRadius: '1.5rem', border: '1px solid rgba(255,255,255,0.1)', marginTop: '1.5rem', maxWidth: '48rem', textAlign: 'center' }}>
              <p style={{ fontSize: '1.875rem', color: '#ffffff', fontWeight: 900, fontStyle: 'italic', lineHeight: 1.625 }}>
                &quot;Saya telah mengidentifikasi spesies invasif ini menggunakan AI SiJaga Sungai!&quot;
              </p>
            </div>
          </div>

          <div style={{ position: 'relative', zIndex: 10, display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: '2.5rem', borderTop: '1px solid rgba(255,255,255,0.2)', marginTop: '3rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <div style={{ width: '4rem', height: '4rem', backgroundColor: '#ffffff', borderRadius: '9999px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <span style={{ color: '#2563eb', fontSize: '1.875rem', fontWeight: 900 }}>💧</span>
              </div>
              <div>
                <p style={{ fontSize: '1.875rem', fontWeight: 900, color: '#ffffff', letterSpacing: '-0.025em', margin: 0 }}>SiJaga Sungai</p>
                <p style={{ fontSize: '1.25rem', color: 'rgba(255,255,255,0.7)', fontWeight: 500, margin: 0 }}>Kenali. Laporkan. Manfaatkan.</p>
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <p style={{ fontSize: '1.25rem', fontWeight: 700, color: '#ffffff', letterSpacing: '0.1em', opacity: 0.8, marginBottom: '0.25rem', margin: 0 }}>AI CONFIDENCE</p>
              <p style={{ fontSize: '2.25rem', fontWeight: 900, color: '#ffffff', margin: 0 }}>{result.tingkatKeyakinan}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
