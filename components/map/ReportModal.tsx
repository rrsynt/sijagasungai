'use client';

import { useState, useEffect, useRef } from 'react';
import { useLanguage } from '@/components/LanguageContext';
import { SPECIES_DATABASE } from '@/lib/species-database';
import { X, CheckCircle, AlertCircle, RefreshCw, MapPin, Copy, Check, LocateFixed, Share, Camera } from 'lucide-react';
import { useSearchParams } from 'next/navigation';
import html2canvas from 'html2canvas';
import confetti from 'canvas-confetti';
import { addGamificationReport } from '@/lib/gamification';
import { trackEvent } from '@/lib/analytics';
import { saveOfflineReport } from '@/lib/offline-sync';

// Compress image: returns { dataUrl, blob }
async function compressImage(file: File): Promise<{ dataUrl: string; blob: Blob }> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const MAX_W = 800;
        const scale = img.width > MAX_W ? MAX_W / img.width : 1;
        const canvas = document.createElement('canvas');
        canvas.width = img.width * scale;
        canvas.height = img.height * scale;
        canvas.getContext('2d')!.drawImage(img, 0, 0, canvas.width, canvas.height);
        canvas.toBlob((blob) => {
          if (!blob) { reject(new Error('Canvas toBlob failed')); return; }
          resolve({ dataUrl: canvas.toDataURL('image/jpeg', 0.75), blob });
        }, 'image/jpeg', 0.75);
      };
      img.onerror = reject;
      img.src = e.target?.result as string;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

// Call identify API with a Blob and return result
async function runIdentifyOnBlob(blob: Blob): Promise<{ namaLokal: string; isInvasif: boolean; fotoKurangJelas: boolean } | null> {
  try {
    const formData = new FormData();
    formData.append('image', new File([blob], 'upload.jpg', { type: 'image/jpeg' }));
    formData.append('lang', 'id');
    const res = await fetch('/api/identify', { method: 'POST', body: formData });
    if (!res.ok) return null;
    const json = await res.json();
    if (json.success && json.data) return json.data;
    return null;
  } catch {
    return null;
  }
}

// Geocode a text location via Nominatim (returns null if not found)
async function geocodeLocation(query: string): Promise<{ lat: number; lng: number } | null> {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=1&countrycodes=id`,
      { headers: { 'Accept-Language': 'id' } }
    );
    const data = await res.json();
    if (data && data.length > 0) {
      return { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) };
    }
    return null;
  } catch {
    return null;
  }
}

interface ReportModalProps {
  onClose: () => void;
  onSuccess: () => void;
  initialSpeciesName?: string;
}

export function ReportModal({ onClose, onSuccess, initialSpeciesName }: ReportModalProps) {
  const { t } = useLanguage();
  const searchParams = useSearchParams();

  const [speciesName, setSpeciesName] = useState(initialSpeciesName || searchParams.get('report') || '');
  const [locationName, setLocationName] = useState('');
  const [quantity, setQuantity] = useState<number | ''>('');
  const [waterCondition, setWaterCondition] = useState('Keruh');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [generatedReport, setGeneratedReport] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [newRankUnlocked, setNewRankUnlocked] = useState<{name: string, en: string, icon: string} | null>(null);
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [imageLoading, setImageLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [locationWarn, setLocationWarn] = useState<string | null>(null);
  const [identifyWarn, setIdentifyWarn] = useState<string | null>(null);
  const [photoIsNotFish, setPhotoIsNotFish] = useState(false);
  const [photoNotInvasive, setPhotoNotInvasive] = useState(false);

  const speciesList = Object.values(SPECIES_DATABASE);

  // Load pre-fill data from IdentifyResult if navigated from there
  useEffect(() => {
    try {
      const raw = sessionStorage.getItem('reportPrefill');
      if (raw) {
        const prefill = JSON.parse(raw);
        sessionStorage.removeItem('reportPrefill');
        if (prefill.speciesName) setSpeciesName(prefill.speciesName);
        if (prefill.imageUrl) {
          setUploadedImage(prefill.imageUrl);
          setIdentifyWarn(null);
          setPhotoIsNotFish(false);
          setPhotoNotInvasive(false);
        }
        // Auto-get GPS + reverse geocode for location
        if (typeof navigator !== 'undefined' && navigator.geolocation) {
          setGpsLoading(true);
          navigator.geolocation.getCurrentPosition(
            async (pos) => {
              const { latitude, longitude } = pos.coords;
              setCoords({ lat: latitude, lng: longitude });
              try {
                const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&addressdetails=1`);
                const data = await res.json();
                const town = data.address?.city || data.address?.town || data.address?.village || data.address?.county || '';
                const state = data.address?.state || '';
                const placeName = `${town ? town + ', ' : ''}${state}`.trim().replace(/,\s*$/, '');
                setLocationName(placeName || `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`);
              } catch {
                setLocationName(`${latitude.toFixed(4)}, ${longitude.toFixed(4)}`);
              }
              setGpsLoading(false);
            },
            () => setGpsLoading(false),
            { timeout: 8000 }
          );
        }
      }
    } catch {}
  }, []);

  // Escape key to close modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const copyText = (text: string, key: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopiedKey(key);
      setTimeout(() => setCopiedKey(null), 2000);
    });
  };

  const shareCardRef = useRef<HTMLDivElement>(null);
  const [isCapturing, setIsCapturing] = useState(false);
  const [shareCopied, setShareCopied] = useState(false);

  const handleShareMap = async () => {
    if (!shareCardRef.current) return;
    
    try {
      setIsCapturing(true);
      
      // Tunggu font load
      await new Promise(resolve => setTimeout(resolve, 800));
      
      const canvas = await html2canvas(shareCardRef.current, { 
        scale: 2,
        useCORS: true,
        backgroundColor: '#ffffff',
        logging: false,
      });

      const blob = await new Promise<Blob | null>(resolve => canvas.toBlob(resolve, 'image/png'));
      if (!blob) throw new Error('Canvas to Blob failed');

      const fileName = `SiJagaSungai-Laporan-${generatedReport?.laporanResmi?.idLaporan || 'Baru'}.png`;
      const file = new File([blob], fileName, { type: blob.type });

      const shareText = locationName 
        ? `Saya telah melaporkan penemuan spesies invasif ${speciesName} di ${locationName} ke Peta Nasional SiJaga Sungai!`
        : `Saya telah melaporkan penemuan spesies invasif ${speciesName} ke Peta Nasional SiJaga Sungai!`;

      // Instagram dan beberapa sosmed memblokir teks otomatis dari Web Share API.
      // Copy ke clipboard sebagai solusi hack.
      try {
        await navigator.clipboard.writeText(shareText);
      } catch (e) {
        // Abaikan
      }

      if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          title: 'Laporan Peta SiJaga Sungai',
          text: shareText,
          files: [file]
        });
      } else {
        const dataUrl = canvas.toDataURL('image/png');
        const link = document.createElement('a');
        link.download = fileName;
        link.href = dataUrl;
        link.click();
      }

      setShareCopied(true);
      setTimeout(() => setShareCopied(false), 2500);
    } catch (error) {
      console.error('Failed to generate image', error);
      navigator.clipboard.writeText(`🚨 Laporan SiJaga Sungai\nSpesies: ${speciesName}\nLokasi: ${locationName}`);
    } finally {
      setIsCapturing(false);
    }
  };

  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [gpsLoading, setGpsLoading] = useState(false);
  const [cooldown, setCooldown] = useState(0);

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setTimeout(() => setCooldown(c => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [cooldown]);

  const getGPS = () => {
    if (!navigator.geolocation) return;
    setGpsLoading(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        setCoords({ lat: latitude, lng: longitude });
        try {
          const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&addressdetails=1`);
          const data = await res.json();
          const town = data.address?.city || data.address?.town || data.address?.village || data.address?.county || '';
          const state = data.address?.state || '';
          const placeName = `${town ? town + ', ' : ''}${state}`.trim().replace(/,\s*$/, '');
          setLocationName(placeName || `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`);
        } catch {
          setLocationName(`${latitude.toFixed(4)}, ${longitude.toFixed(4)}`);
        }
        setGpsLoading(false);
      },
      () => setGpsLoading(false)
    );
  };

  useEffect(() => {
    if (initialSpeciesName) {
      setSpeciesName(initialSpeciesName);
    } else if (searchParams.get('report')) {
      setSpeciesName(searchParams.get('report')!);
    }
  }, [initialSpeciesName, searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Hard block — in case form was submitted via Enter key bypassing disabled button
    if (photoIsNotFish) {
      setError(t('Foto bukan ikan. Upload foto ikan invasif yang valid atau hapus foto.', 'Photo is not a fish. Upload a valid invasive fish photo or remove it.'));
      return;
    }
    if (photoNotInvasive) {
      setError(t('Foto menunjukkan ikan non-invasif. Hanya ikan invasif yang dapat dilaporkan ke peta ini.', 'Photo shows a non-invasive fish. Only invasive species can be reported here.'));
      return;
    }

    if (!speciesName || !locationName || quantity === '') {
      setError(t('Mohon isi semua field yang wajib.', 'Please fill all required fields.'));
      return;
    }

    setLoading(true);
    setError(null);

    // Temukan spesies untuk melengkapi data
    const normalizedSpecies = speciesName.toLowerCase();
    let invasiveStatus = 'UNKNOWN';
    let scientificName = '';
    let urgency = 'SEDANG';

    for (const sp of Object.values(SPECIES_DATABASE)) {
      if (sp.namaLokal.map(n => n.toLowerCase()).includes(normalizedSpecies) || sp.namaIlmiah.toLowerCase() === normalizedSpecies) {
        invasiveStatus = sp.statusInvasif;
        scientificName = sp.namaIlmiah;
        urgency = sp.urgensiLaporan;
        break;
      }
    }

    const reportData = {
      speciesName,
      scientificName,
      invasiveStatus,
      urgency,
      locationName,
      latitude: coords?.lat,
      longitude: coords?.lng,
      quantity: Number(quantity),
      waterCondition,
      reporterInitial: 'Anon',
      imageUrl: uploadedImage || undefined,
    };

    // If user typed location manually (no GPS), try geocoding
    if (!coords) {
      const geo = await geocodeLocation(locationName);
      if (geo) {
        reportData.latitude = geo.lat;
        reportData.longitude = geo.lng;
        setLocationWarn(null);
      } else {
        setLocationWarn(t(
          'Lokasi tidak ditemukan di peta. Coba perjelas nama lokasi (contoh: Sungai Ciliwung, Jakarta) atau gunakan tombol GPS.',
          'Location not found on map. Try a more specific name or use GPS.'
        ));
        setLoading(false);
        return;
      }
    }

    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      saveOfflineReport(reportData);
      setSuccess(true);
      setGeneratedReport({
        laporanResmi: { idLaporan: `OFFLINE-${Date.now().toString().slice(-6)}`, urgensi: urgency },
        dampakLokal: { prediksi1Tahun: t('Laporan tersimpan di memori HP. Akan otomatis dikirim saat ada sinyal internet.', 'Report saved in device memory. Will auto-sync when internet is back.') },
        kontenSosmed: { instagram: '', twitter: '', whatsapp: '' }
      });
      setLoading(false);
      
      const rankInfo = addGamificationReport();
      if (rankInfo.isNewRank) setNewRankUnlocked({ name: rankInfo.newRank, en: rankInfo.newRankEn, icon: rankInfo.newIcon });
      return;
    }

    try {
      const res = await fetch('/api/report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(reportData),
      });

      const data = await res.json();
      if (data.success) {
        setSuccess(true);
        setGeneratedReport(data.formattedReport);

        trackEvent('report_submitted', {
          species: speciesName,
          urgency: urgency,
          has_photo: !!uploadedImage,
          has_gps: !!coords,
        });
        
        // Gamification & Confetti
        const rankInfo = addGamificationReport();
        if (rankInfo.isNewRank) {
          setNewRankUnlocked({ name: rankInfo.newRank, en: rankInfo.newRankEn, icon: rankInfo.newIcon });
          if (typeof navigator !== 'undefined' && navigator.vibrate) navigator.vibrate([200, 100, 200]);
        } else {
          if (typeof navigator !== 'undefined' && navigator.vibrate) navigator.vibrate([100]);
        }
        
        const duration = rankInfo.isNewRank ? 3000 : 1500;
        const end = Date.now() + duration;
        const colors = ['#2563eb', '#10b981', '#f59e0b', '#ffffff'];
        
        (function frame() {
          confetti({
            particleCount: 5,
            angle: 60,
            spread: 55,
            origin: { x: 0 },
            colors: colors,
            zIndex: 9999
          });
          confetti({
            particleCount: 5,
            angle: 120,
            spread: 55,
            origin: { x: 1 },
            colors: colors,
            zIndex: 9999
          });

          if (Date.now() < end) {
            requestAnimationFrame(frame);
          }
        }());

        setCooldown(60); // Prevent spam: 60s cooldown before next report
        onSuccess(); // Refresh map behind the scene
      } else {
        setError(data.error || 'Failed to submit report');
      }
    } catch (err) {
      setError(t('Terjadi kesalahan jaringan.', 'Network error occurred.'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={loading ? undefined : onClose}></div>
      <div className="relative bg-white rounded-3xl p-6 md:p-8 shadow-2xl w-full max-w-lg animate-in zoom-in-95 duration-200">
        <button 
          onClick={onClose}
          disabled={loading}
          className="absolute top-4 right-4 p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600 rounded-xl transition-colors disabled:opacity-50"
        >
          <X className="w-6 h-6" />
        </button>

        <h2 className="text-2xl font-bold text-gray-900 mb-6">{t('Laporkan Temuan', 'Report Sighting')}</h2>

        {success && generatedReport ? (
          <div className="py-2">
             <CheckCircle className="w-12 h-12 text-emerald-500 mb-4" />
             <h3 className="text-xl font-bold text-gray-900 mb-2">{t('Laporan Berhasil!', 'Report Successful!')}</h3>
             
             {newRankUnlocked && (
               <div className="mb-4 bg-gradient-to-r from-amber-100 to-yellow-100 border border-amber-300 rounded-xl p-4 shadow-sm animate-in zoom-in slide-in-from-bottom-2">
                 <p className="text-xs font-bold text-amber-800 uppercase tracking-widest mb-1">{t('Pangkat Baru Terbuka!', 'New Rank Unlocked!')}</p>
                 <div className="flex items-center gap-3">
                   <span className="text-3xl drop-shadow-md">{newRankUnlocked.icon}</span>
                   <p className="text-lg font-extrabold text-amber-900">{t(newRankUnlocked.name, newRankUnlocked.en)}</p>
                 </div>
               </div>
             )}
             
             <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 mt-6 mb-4 text-left space-y-4 max-h-[50vh] overflow-y-auto">
               <div>
                  <p className="text-xs text-gray-500 uppercase font-bold tracking-widest mb-1">ID Laporan</p>
                  <p className="text-sm font-mono text-gray-900">{generatedReport.laporanResmi?.idLaporan}</p>
               </div>
               <div>
                  <p className="text-xs text-gray-500 uppercase font-bold tracking-widest mb-1">Urgensi</p>
                  <div className={`inline-block px-3 py-1 rounded-md text-xs font-bold ${generatedReport.laporanResmi?.urgensi === 'DARURAT' || generatedReport.laporanResmi?.urgensi === 'TINGGI' ? 'bg-red-100 text-red-800' : generatedReport.laporanResmi?.urgensi === 'SEDANG' ? 'bg-amber-100 text-amber-800' : 'bg-green-100 text-green-800'}`}>
                    {generatedReport.laporanResmi?.urgensi}
                  </div>
               </div>
               <div>
                  <p className="text-xs text-gray-500 uppercase font-bold tracking-widest mb-1">Prediksi 1 Tahun</p>
                  <p className="text-sm text-gray-700">{generatedReport.dampakLokal?.prediksi1Tahun}</p>
               </div>
               <div>
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-xs text-gray-500 uppercase font-bold tracking-widest">Draf Sosmed (Instagram)</p>
                    <button onClick={() => copyText(generatedReport.kontenSosmed?.instagram, 'ig')} className="flex items-center gap-1 text-xs text-primary-sunai hover:text-primary-sunai/80 font-semibold">
                      {copiedKey === 'ig' ? <><Check className="w-3 h-3" /> Disalin!</> : <><Copy className="w-3 h-3" /> Salin</>}
                    </button>
                  </div>
                  <div className="bg-white p-3 border border-gray-100 rounded-lg text-sm text-gray-600">
                    {generatedReport.kontenSosmed?.instagram}
                  </div>
               </div>
               <div>
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-xs text-gray-500 uppercase font-bold tracking-widest">Draf Sosmed (Twitter/X)</p>
                    <button onClick={() => copyText(generatedReport.kontenSosmed?.twitter, 'tw')} className="flex items-center gap-1 text-xs text-primary-sunai hover:text-primary-sunai/80 font-semibold">
                      {copiedKey === 'tw' ? <><Check className="w-3 h-3" /> Disalin!</> : <><Copy className="w-3 h-3" /> Salin</>}
                    </button>
                  </div>
                  <div className="bg-white p-3 border border-gray-100 rounded-lg text-sm text-gray-600">
                    {generatedReport.kontenSosmed?.twitter}
                  </div>
               </div>
               <div>
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-xs text-gray-500 uppercase font-bold tracking-widest">Draf Sosmed (WhatsApp)</p>
                    <button onClick={() => copyText(generatedReport.kontenSosmed?.whatsapp, 'wa')} className="flex items-center gap-1 text-xs text-primary-sunai hover:text-primary-sunai/80 font-semibold">
                      {copiedKey === 'wa' ? <><Check className="w-3 h-3" /> Disalin!</> : <><Copy className="w-3 h-3" /> Salin</>}
                    </button>
                  </div>
                  <div className="bg-white p-3 border border-gray-100 rounded-lg text-sm text-gray-600">
                    {generatedReport.kontenSosmed?.whatsapp}
                  </div>
               </div>
             </div>
             
             <div className="flex flex-col gap-3 mt-4">
               <button 
                 onClick={handleShareMap} 
                 disabled={isCapturing}
                 className="w-full flex items-center justify-center gap-2 py-3 bg-primary-sunai hover:bg-primary-sunai/90 text-white font-bold rounded-xl transition-all shadow-md hover:shadow-lg"
               >
                 {isCapturing ? (
                   <>{t('Memproses Gambar...', 'Processing Image...')}</>
                 ) : shareCopied ? (
                   <><Check className="w-5 h-5" /> {t('Selesai! 🎉', 'Done! 🎉')}</>
                 ) : (
                   <><Share className="w-5 h-5" /> {t('Share Poster Laporan', 'Share Report Poster')}</>
                 )}
               </button>
               <button onClick={onClose} className="w-full py-3 bg-gray-100 hover:bg-gray-200 text-gray-800 font-bold rounded-xl transition-colors">
                 {t('Tutup', 'Close')}
               </button>
             </div>

             {/* HIDDEN SHARE CARD TEMPLATE FOR MAP */}
             {(() => {
                const speciesData = Object.values(SPECIES_DATABASE).find(s => 
                  s.namaLokal.some(n => n.toLowerCase() === speciesName.toLowerCase()) || 
                  s.namaIlmiah.toLowerCase() === speciesName.toLowerCase()
                );
                return (
                  <div className="absolute top-0 left-0 -z-50 opacity-0 pointer-events-none" aria-hidden="true">
                    <div 
                      ref={shareCardRef}
                      style={{ 
                        fontFamily: "'Inter', sans-serif",
                        width: '1080px',
                        height: '1350px',
                        background: generatedReport?.laporanResmi?.urgensi === 'DARURAT' || generatedReport?.laporanResmi?.urgensi === 'KRITIS' ? 'linear-gradient(to bottom right, #dc2626, #4c0519)' : 
                                  generatedReport?.laporanResmi?.urgensi === 'TINGGI' ? 'linear-gradient(to bottom right, #f97316, #7c2d12)' :
                                  generatedReport?.laporanResmi?.urgensi === 'SEDANG' ? 'linear-gradient(to bottom right, #fbbf24, #92400e)' :
                                  'linear-gradient(to bottom right, #34d399, #064e3b)',
                        padding: '4rem',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'space-between',
                        position: 'relative'
                      }}
                    >
                      <div style={{ position: 'relative', zIndex: 10, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flexGrow: 1, color: '#ffffff', gap: '1.5rem' }}>
                        <div style={{ backgroundColor: 'rgba(255,255,255,0.2)', padding: '0.75rem 2rem', borderRadius: '9999px', border: '1px solid rgba(255,255,255,0.3)', letterSpacing: '0.2em', fontWeight: 900, fontSize: '1.25rem', color: 'rgba(255,255,255,0.9)', textTransform: 'uppercase', marginBottom: '1rem' }}>
                          {t('BUKTI LAPORAN SIJAGA SUNGAI', 'SIJAGA SUNGAI REPORT RECEIPT')}
                        </div>
                        
                        <div style={{ width: '16rem', height: '16rem', backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: '2.5rem', border: '4px solid rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '120px', position: 'relative', overflow: 'hidden' }}>
                          {uploadedImage ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={uploadedImage} alt={speciesName} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          ) : speciesData?.imageUrl ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={speciesData.imageUrl} alt={speciesName} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          ) : (
                            <div className="drop-shadow-2xl">{speciesData?.badgeEmoji || '🐟'}</div>
                          )}
                        </div>

                        <div style={{ textAlign: 'center', maxWidth: '48rem', display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '1rem' }}>
                          <h1 style={{ fontSize: '5rem', fontWeight: 900, letterSpacing: '-0.025em', color: '#ffffff', lineHeight: 1, margin: 0 }}>
                            {speciesName}
                          </h1>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.875rem', fontWeight: 500, color: 'rgba(255,255,255,0.8)', backgroundColor: 'rgba(0,0,0,0.2)', padding: '0.75rem 1.5rem', borderRadius: '1rem', marginTop: '0.5rem' }}>
                            <MapPin style={{ width: '2rem', height: '2rem', marginRight: '0.75rem', color: '#ffffff' }} />
                            {locationName || t('Lokasi Tersembunyi', 'Hidden Location')}
                          </div>
                        </div>

                        <div style={{ width: '100%', maxWidth: '56rem', display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: '2rem', marginTop: '1.5rem' }}>
                          <div style={{ backgroundColor: 'rgba(255,255,255,0.1)', border: '4px solid rgba(255,255,255,0.2)', padding: '1.5rem', borderRadius: '2rem' }}>
                            <p style={{ fontSize: '1.5rem', fontWeight: 700, opacity: 0.8, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '0.25rem', margin: 0 }}>{t('Tingkat Urgensi', 'Urgency Level')}</p>
                            <p style={{ fontSize: '3rem', fontWeight: 900, margin: 0 }}>
                              {generatedReport?.laporanResmi?.urgensi === 'DARURAT' ? t('DARURAT', 'EMERGENCY') :
                               generatedReport?.laporanResmi?.urgensi === 'KRITIS' ? t('KRITIS', 'CRITICAL') :
                               generatedReport?.laporanResmi?.urgensi === 'TINGGI' ? t('TINGGI', 'HIGH') :
                               generatedReport?.laporanResmi?.urgensi === 'SEDANG' ? t('SEDANG', 'MEDIUM') :
                               generatedReport?.laporanResmi?.urgensi === 'RENDAH' ? t('RENDAH', 'LOW') : generatedReport?.laporanResmi?.urgensi}
                            </p>
                          </div>
                          <div style={{ backgroundColor: 'rgba(255,255,255,0.1)', border: '4px solid rgba(255,255,255,0.2)', padding: '1.5rem', borderRadius: '2rem' }}>
                            <p style={{ fontSize: '1.5rem', fontWeight: 700, opacity: 0.8, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '0.25rem', margin: 0 }}>{t('Jumlah', 'Quantity')}</p>
                            <p style={{ fontSize: '3rem', fontWeight: 900, margin: 0 }}>{quantity} {t('Ekor', 'Specimens')}</p>
                          </div>
                        </div>
                        
                        <div style={{ backgroundColor: 'rgba(0,0,0,0.2)', padding: '1.5rem 2rem', borderRadius: '1.5rem', border: '1px solid rgba(255,255,255,0.1)', marginTop: '1rem', maxWidth: '56rem', textAlign: 'center' }}>
                          <p style={{ fontSize: '1.875rem', color: '#ffffff', fontWeight: 900, fontStyle: 'italic', lineHeight: 1.5, margin: 0 }}>
                            {locationName 
                              ? t(`"Saya melaporkan penemuan invasif ikan ${speciesName} di ${locationName}!"`, `"I reported an invasive sighting of ${speciesName} fish at ${locationName}!"`)
                              : t(`"Saya melaporkan penemuan invasif ikan ${speciesName} ke Peta Nasional SiJaga Sungai!"`, `"I reported an invasive sighting of ${speciesName} fish to the SiJaga Sungai National Map!"`)}
                          </p>
                        </div>
                      </div>

                      <div style={{ position: 'relative', zIndex: 10, display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: '2rem', borderTop: '1px solid rgba(255,255,255,0.2)', marginTop: '2rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                          <div style={{ width: '3.5rem', height: '3.5rem', backgroundColor: '#ffffff', borderRadius: '9999px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <span style={{ color: '#2563eb', fontSize: '1.5rem', fontWeight: 900 }}>💧</span>
                          </div>
                          <div>
                            <p style={{ fontSize: '1.5rem', fontWeight: 900, color: '#ffffff', letterSpacing: '-0.025em', margin: 0 }}>SiJaga Sungai</p>
                            <p style={{ fontSize: '1rem', color: 'rgba(255,255,255,0.7)', fontWeight: 500, margin: 0 }}>{t('Kenali. Laporkan. Manfaatkan.', 'Identify. Report. Utilize.')}</p>
                          </div>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <p style={{ fontSize: '1rem', fontWeight: 700, color: '#ffffff', letterSpacing: '0.1em', opacity: 0.8, marginBottom: '0.25rem', margin: 0 }}>{t('ID LAPORAN', 'REPORT ID')}</p>
                          <p style={{ fontSize: '1.5rem', fontFamily: 'monospace', fontWeight: 900, color: '#ffffff', margin: 0 }}>{generatedReport?.laporanResmi?.idLaporan}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                );
             })()}
          </div>
        ) : success ? (
          <div className="text-center py-10">
             <CheckCircle className="w-16 h-16 text-emerald-500 mx-auto mb-4" />
             <h3 className="text-xl font-bold text-gray-900 mb-2">{t('Laporan Berhasil!', 'Report Successful!')}</h3>
             <p className="text-gray-500">{t('Terima kasih atas partisipasi Anda.', 'Thank you for your participation.')}</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Foto Bukti — PERTAMA agar AI auto-isi nama spesies */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                📷 {t('Foto Ikan', 'Fish Photo')}
                <span className="text-xs font-normal text-emerald-600 ml-2">({t('AI otomatis kenali spesies', 'AI auto-identifies species')})</span>
              </label>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                className="hidden"
                disabled={loading}
                onChange={async (e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  setImageLoading(true);
                  setIdentifyWarn(null);
                  setPhotoIsNotFish(false);
                  setPhotoNotInvasive(false);
                  try {
                    const { dataUrl, blob } = await compressImage(file);
                    setUploadedImage(dataUrl);

                    // Auto-detect species via AI
                    const result = await runIdentifyOnBlob(blob);
                    if (!result) {
                      setPhotoIsNotFish(true);
                      setIdentifyWarn(t('AI tidak dapat menganalisis foto ini. Upload foto ikan invasif yang lebih jelas atau hapus foto.', 'AI could not analyze this photo. Upload a clearer invasive fish photo or remove it.'));
                    } else if (result.fotoKurangJelas || !result.isInvasif) {
                      if (result.fotoKurangJelas) {
                        setPhotoIsNotFish(true);
                        setIdentifyWarn(t('Foto kurang jelas atau bukan foto ikan invasif. Upload foto yang jernih atau hapus foto untuk laporan manual.', 'Photo is unclear or not an invasive fish. Upload a clear photo or remove it to report manually.'));
                      } else {
                        setPhotoNotInvasive(true);
                        if (result.namaLokal) setSpeciesName(result.namaLokal);
                        setIdentifyWarn(t(
                          `Terdeteksi: ${result.namaLokal}. Spesies ini bukan invasif dan tidak dapat dilaporkan ke peta invasif.`,
                          `Detected: ${result.namaLokal}. This species is not invasive and cannot be reported.`
                        ));
                      }
                    } else if (!result.namaLokal || result.namaLokal.toLowerCase().includes('bukan') || result.namaLokal.toLowerCase().includes('tidak dikenali') || result.namaLokal === '-') {
                      setPhotoIsNotFish(true);
                      setIdentifyWarn(t('Foto ini bukan ikan atau spesies tidak dikenali. Upload foto ikan invasif yang valid.', 'This photo is not a fish or species is unrecognized. Upload a valid invasive fish photo.'));
                    } else {
                      setSpeciesName(result.namaLokal);
                      setIdentifyWarn(null);
                    }
                  } catch {
                    setError(t('Gagal memproses foto. Coba foto lain.', 'Failed to process image. Try another.'));
                  } finally {
                    setImageLoading(false);
                  }
                }}
              />
              {uploadedImage ? (
                <div className="relative w-full h-36 rounded-xl overflow-hidden border border-gray-200">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={uploadedImage} alt="preview" className="w-full h-full object-cover" />
                  {imageLoading && (
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center gap-2">
                      <RefreshCw className="w-6 h-6 text-white animate-spin" />
                      <span className="text-white text-sm font-medium">{t('AI menganalisis...', 'AI analyzing...')}</span>
                    </div>
                  )}
                  <button
                    type="button"
                    onClick={() => { setUploadedImage(null); setIdentifyWarn(null); setPhotoIsNotFish(false); setPhotoNotInvasive(false); if (fileInputRef.current) fileInputRef.current.value = ''; }}
                    className="absolute top-2 right-2 p-2 bg-black/60 text-white rounded-full"
                    aria-label={t('Hapus foto', 'Remove photo')}
                  >
                    <X className="w-4 h-4" />
                  </button>
                  {!imageLoading && !photoIsNotFish && !photoNotInvasive && (
                    <span className="absolute bottom-2 left-2 text-xs text-white bg-emerald-600/80 px-2 py-0.5 rounded-full font-semibold">✓ {t('Spesies terdeteksi', 'Species detected')}</span>
                  )}
                  {!imageLoading && (photoIsNotFish || photoNotInvasive) && (
                    <span className="absolute bottom-2 left-2 text-xs text-white bg-red-600/80 px-2 py-0.5 rounded-full">⚠ {t('Tidak dapat dilaporkan', 'Cannot be reported')}</span>
                  )}
                </div>
              ) : (
                <button
                  type="button"
                  disabled={loading || imageLoading}
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full flex items-center justify-center gap-3 py-5 border-2 border-dashed border-emerald-300 rounded-xl text-sm bg-emerald-50 text-emerald-700 hover:bg-emerald-100 hover:border-emerald-400 transition-colors font-semibold"
                >
                  <Camera className="w-5 h-5" />
                  {t('Ambil / Pilih Foto Ikan', 'Take / Choose Fish Photo')}
                </button>
              )}
              {identifyWarn && (
                <p className={`mt-1.5 text-xs flex items-start gap-1 ${(photoIsNotFish || photoNotInvasive) ? 'text-red-600' : 'text-amber-700'}`}>
                  <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                  {identifyWarn}
                </p>
              )}
            </div>

            {/* Species — datalist autocomplete, auto-filled from photo */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                {t('Nama Spesies', 'Species Name')} <span className="text-red-500">*</span>
                {speciesName && !photoIsNotFish && !photoNotInvasive && (
                  <span className="ml-2 text-xs font-normal text-emerald-600">✓ {t('Terisi otomatis', 'Auto-filled')}</span>
                )}
              </label>
              <input
                list="species-datalist"
                type="text"
                value={speciesName}
                onChange={e => setSpeciesName(e.target.value)}
                placeholder={t('Foto ikan di atas → nama terisi otomatis', 'Photo fish above → name auto-fills')}
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-sunai focus:border-primary-sunai outline-none transition-all"
                disabled={loading}
              />
              <datalist id="species-datalist">
                {speciesList.map(s => (
                  <option key={s.id} value={s.namaLokal[0]}>{s.namaIlmiah}</option>
                ))}
              </datalist>
            </div>

            {/* Location with GPS */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-sm font-semibold text-gray-700">
                  {t('Lokasi', 'Location')} <span className="text-red-500">*</span>
                </label>
                {coords && <span className="text-xs text-emerald-600 font-semibold flex items-center gap-1">📍 {t('GPS aktif', 'GPS active')}</span>}
              </div>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    value={locationName}
                    onChange={e => { setLocationName(e.target.value); setLocationWarn(null); }}
                    placeholder={t('Contoh: Sungai Ciliwung, Jakarta', 'Example: Ciliwung River, Jakarta')}
                    className={`w-full pl-10 pr-4 py-3 bg-gray-50 border rounded-xl focus:ring-2 focus:ring-primary-sunai focus:border-primary-sunai outline-none transition-all ${locationWarn ? 'border-amber-400 bg-amber-50' : 'border-gray-200'}`}
                    disabled={loading}
                  />
                </div>
                <button
                  type="button"
                  onClick={getGPS}
                  disabled={loading || gpsLoading}
                  title={t('Gunakan lokasi GPS', 'Use GPS location')}
                  className={`shrink-0 px-3 py-3 rounded-xl border transition-colors ${
                    coords ? 'bg-emerald-50 border-emerald-300 text-emerald-600' : 'bg-gray-50 border-gray-200 text-gray-500 hover:bg-blue-50 hover:border-blue-300 hover:text-blue-600'
                  }`}
                >
                  {gpsLoading ? <RefreshCw className="w-5 h-5 animate-spin" /> : <LocateFixed className="w-5 h-5" />}
                </button>
              </div>
              {locationWarn && (
                <p className="mt-1.5 text-xs text-amber-700 flex items-start gap-1">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                  {locationWarn}
                </p>
              )}
              {!coords && !locationWarn && locationName.length > 0 && locationName.length < 8 && (
                <p className="mt-1.5 text-xs text-gray-400">{t('Tambahkan nama kota/provinsi agar titik peta akurat.', 'Add city/province name for accurate map pin.')}</p>
              )}
            </div>

            {/* Quantity & Water */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  {t('Jumlah (Ekor/Kg)', 'Quantity')} <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  min="1"
                  value={quantity}
                  onChange={e => setQuantity(Number(e.target.value))}
                  placeholder="0"
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-sunai focus:border-primary-sunai outline-none transition-all"
                  disabled={loading}
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">{t('Kondisi Air', 'Water Condition')}</label>
                <select
                  value={waterCondition}
                  onChange={e => setWaterCondition(e.target.value)}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-sunai focus:border-primary-sunai outline-none transition-all"
                  disabled={loading}
                >
                  <option value="Jernih">{t('Jernih', 'Clear')}</option>
                  <option value="Keruh">{t('Keruh', 'Murky')}</option>
                  <option value="Berbau">{t('Berbau', 'Smelly')}</option>
                  <option value="Berlumpur">{t('Berlumpur', 'Muddy')}</option>
                </select>
              </div>
            </div>

            {error && (
              <div className="p-3 bg-red-50 border border-red-100 rounded-xl flex items-start text-sm text-red-800">
                <AlertCircle className="w-5 h-5 mr-2 shrink-0" />
                <p>{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading || photoIsNotFish || photoNotInvasive || cooldown > 0}
              className="w-full py-4 bg-primary-sunai hover:bg-primary-sunai/90 text-white font-bold rounded-xl shadow-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center"
            >
              {loading ? (
                <><RefreshCw className="w-5 h-5 mr-2 animate-spin" /> {t('Mengirim & Geocoding...', 'Submitting…')}</>
              ) : cooldown > 0 ? (
                t(`Tunggu ${cooldown}s sebelum laporan berikutnya`, `Wait ${cooldown}s before next report`)
              ) : (
                t('Kirim Laporan', 'Submit Report')
              )}
            </button>
          </form>

        )}
      </div>
    </div>
  );
}
