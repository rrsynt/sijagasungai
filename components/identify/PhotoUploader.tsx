'use client';

import { useState, useRef, ChangeEvent, DragEvent, useEffect } from 'react';
import { Camera, Image as ImageIcon, MapPin, Search, UploadCloud, X, RefreshCw, AlertCircle } from 'lucide-react';
import { IdentificationResult } from '@/lib/types';
import { useLanguage } from '../LanguageContext';
import { IdentifyResult } from './IdentifyResult';
import { findSpeciesByName } from '@/lib/species-database';
import { trackEvent } from '@/lib/analytics';

const LOADING_MESSAGES_ID = [
  "Sedang menganalisis foto...",
  "Mencocokkan bentuk dan warna...",
  "Mengecek database spesies invasif...",
  "Menyiapkan hasil terbaik..."
];

const LOADING_MESSAGES_EN = [
  "Analyzing photo...",
  "Matching shape and colors...",
  "Checking invasive species database...",
  "Preparing the best results..."
];

export function PhotoUploader() {
  const { t, language } = useLanguage();
  
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [location, setLocation] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [loadingMsgIdx, setLoadingMsgIdx] = useState(0);
  const [result, setResult] = useState<{ data: IdentificationResult, speciesId: string | null } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [warning, setWarning] = useState<string | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  // Rotate loading messages
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isLoading) {
      interval = setInterval(() => {
        setLoadingMsgIdx((prev) => (prev + 1) % LOADING_MESSAGES_ID.length);
      }, 2000);
    }
    return () => clearInterval(interval);
  }, [isLoading]);

  const handleFile = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      setError(t('Tolong unggah file gambar yang valid.', 'Please upload a valid image file.'));
      return;
    }
    if (file.size > 15 * 1024 * 1024) {
      setError(t('Ukuran file terlalu besar. Maksimal 15MB.', 'File size too large. Max 15MB.'));
      return;
    }
    setError(null);
    setResult(null);

    // Client-side image compression & base64 conversion
    try {
      const compressedFile = await compressImage(file);
      setSelectedFile(compressedFile);
      
      // Convert to Base64 for html-to-image compatibility
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result as string);
      };
      reader.readAsDataURL(compressedFile);
    } catch (e) {
      console.error("Compression failed, using original file.", e);
      setWarning(t('Kompresi gambar gagal, menggunakan file asli. Pastikan foto jelas dan tidak rusak.', 'Image compression failed, using original file. Ensure the photo is clear and not corrupted.'));
      setSelectedFile(file);

      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const compressImage = (file: File): Promise<File> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.src = URL.createObjectURL(file);
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 1024;
        const MAX_HEIGHT = 1024;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_WIDTH) {
            height *= MAX_WIDTH / width;
            width = MAX_WIDTH;
          }
        } else {
          if (height > MAX_HEIGHT) {
            width *= MAX_HEIGHT / height;
            height = MAX_HEIGHT;
          }
        }
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) return reject('No canvas context');
        ctx.drawImage(img, 0, 0, width, height);
        
        canvas.toBlob((blob) => {
          if (!blob) return reject('No blob created');
          resolve(new File([blob], file.name, { type: 'image/jpeg', lastModified: Date.now() }));
        }, 'image/jpeg', 0.8);
      };
      img.onerror = () => reject('Image load error');
    });
  };

  const handleDragOver = (e: DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e: DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const loadSampleImage = async (imagePath: string, fileName: string) => {
    setIsLoading(true);
    try {
      const response = await fetch(imagePath);
      const blob = await response.blob();
      const file = new File([blob], fileName, { type: blob.type });
      handleFile(file);
      setIsLoading(false);
    } catch (e) {
      setError('Gagal memuat gambar sampel.');
      setIsLoading(false);
    }
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  const getLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          try {
            // Simple reverse geocoding via OpenStreetMap Nominatim for demo
            const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${position.coords.latitude}&lon=${position.coords.longitude}&addressdetails=1`);
            const data = await res.json();
            const town = data.address.city || data.address.town || data.address.village || data.address.county || '';
            const state = data.address.state || '';
            setLocation(`${town ? town + ', ' : ''}${state}`);
          } catch (e) {
             setLocation(`${position.coords.latitude.toFixed(4)}, ${position.coords.longitude.toFixed(4)}`);
          }
        },
        () => {
          setError(t('Gagal mendapatkan lokasi. Silakan ketik manual.', 'Failed to get location. Please type manually.'));
        }
      );
    } else {
      setError(t('Geolokasi tidak didukung di browser ini.', 'Geolocation is not supported in this browser.'));
    }
  };

  const handleIdentify = async () => {
    if (!selectedFile) return;
    
    setIsLoading(true);
    setError(null);
    setResult(null);
    setLoadingMsgIdx(0);

    const formData = new FormData();
    formData.append('image', selectedFile);
    formData.append('location', location);
    formData.append('lang', language);

    try {
      const res = await fetch('/api/identify', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        if (res.status === 422) {
           setError(data.error + (data.data?.panduanFotoUlang ? `\nPanduan: ${data.data.panduanFotoUlang}` : ''));
           // Still show the degraded result if exists
           if (data.data) {
             // In real app we might handle blurry results differently
           }
        } else if (res.status === 429) {
           setError(t('Koneksi sibuk, Anda terlalu cepat mencoba. Tunggu sebentar.', 'Too many requests. Please wait a moment.'));
        } else {
           setError(data.error || t('Terjadi kesalahan jaringan.', 'Network error occurred.'));
        }
        setIsLoading(false);
        return;
      }

      const speciesMatch = findSpeciesByName(data.data.namaIlmiah) || findSpeciesByName(data.data.namaLokal);
      setResult({ data: data.data, speciesId: speciesMatch?.id || null });
      if (data.warning) setWarning(data.warning);

      trackEvent('identify_success', {
        species: data.data.namaLokal,
        status: data.data.statusInvasif,
        method: 'photo',
      });

    } catch (e) {
      setError(t('Koneksi terputus. Silakan periksa internet Anda dan coba lagi.', 'Connection lost. Please check your internet and try again.'));
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setSelectedFile(null);
    setPreview(null);
    setResult(null);
    setError(null);
    setWarning(null);
  };

  return (
    <div className="w-full max-w-4xl">
      {!preview && (
        <div 
          className={`relative border-2 border-dashed p-10 sm:p-16 text-center transition-all ${
            isDragOver ? 'border-primary-sunai bg-primary-sunai/5' : 'border-gray-300 bg-white'
          }`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          <UploadCloud className={`mx-auto h-16 w-16 mb-6 ${isDragOver ? 'text-primary-sunai' : 'text-gray-400'}`} />
          <h3 className="text-2xl font-extrabold text-gray-900 mb-2 uppercase tracking-wide">
            {t('Unggah Foto Ikan', 'Upload Fish Photo')}
          </h3>
          <p className="text-gray-600 mb-10 max-w-sm mx-auto">
            {t('Tarik dan lepas gambar ke sini, atau gunakan tombol di bawah.', 'Drag and drop an image here, or use the buttons below.')}
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <input 
              type="file" 
              accept="image/*" 
              capture="environment" 
              ref={cameraInputRef} 
              className="hidden" 
              onChange={handleFileChange}
            />
            <button 
              onClick={() => cameraInputRef.current?.click()}
              className="flex justify-center items-center px-8 py-4 font-bold text-white bg-gray-900 hover:bg-gray-800 transition-colors uppercase tracking-widest text-sm w-full sm:w-auto"
            >
              <Camera className="w-5 h-5 mr-3" />
              {t('Ambil Foto', 'Take Photo')}
            </button>

            <input 
              type="file" 
              accept="image/*" 
              ref={fileInputRef} 
              className="hidden" 
              onChange={handleFileChange}
            />
            <button 
              onClick={() => fileInputRef.current?.click()}
              className="flex justify-center items-center px-8 py-4 font-bold text-gray-900 bg-gray-100 hover:bg-gray-200 transition-colors uppercase tracking-widest text-sm w-full sm:w-auto border border-gray-200"
            >
              <ImageIcon className="h-5 w-5 mr-3" />
              {t('Dari Galeri', 'From Gallery')}
            </button>
          </div>
          <p className="text-xs text-gray-400 mt-6 font-medium tracking-widest uppercase">JPG, PNG, WEBP (Max 15MB)</p>

          <div className="mt-12 pt-8 border-t border-gray-200">
            <p className="text-xs text-gray-500 font-bold uppercase tracking-widest mb-4">{t('Atau gunakan foto sampel untuk demo:', 'Or use sample photo for demo:')}</p>
            <div className="flex flex-wrap justify-center gap-3">
              <button onClick={() => loadSampleImage('/images/species/red_devil.png', 'red_devil.png')} className="px-4 py-2 bg-gray-100 text-gray-900 text-xs font-bold uppercase tracking-widest hover:bg-gray-200 transition-colors border border-gray-300">
                🐟 Red Devil
              </button>
              <button onClick={() => loadSampleImage('/images/species/sapu_sapu.png', 'sapu_sapu.png')} className="px-4 py-2 bg-gray-100 text-gray-900 text-xs font-bold uppercase tracking-widest hover:bg-gray-200 transition-colors border border-gray-300">
                🐟 Sapu-Sapu
              </button>
              <button onClick={() => loadSampleImage('/images/species/alligator_gar.png', 'alligator_gar.png')} className="px-4 py-2 bg-gray-100 text-gray-900 text-xs font-bold uppercase tracking-widest hover:bg-gray-200 transition-colors border border-gray-300">
                🐟 Aligator Gar
              </button>
            </div>
          </div>
        </div>
      )}

      {error && (
        <div className="mt-6 p-5 bg-red-50 border-l-4 border-red-600 flex items-start">
          <AlertCircle className="h-5 w-5 text-red-600 mr-3 shrink-0 mt-0.5" />
          <div className="text-red-900 text-sm font-medium whitespace-pre-line leading-relaxed">{error}</div>
        </div>
      )}

      {preview && !result && (
        <div className="bg-white border border-gray-200 p-8">
          <div className="relative bg-gray-100 aspect-[4/3] sm:aspect-video mb-8 overflow-hidden border border-gray-200">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={preview} alt="Preview" className="w-full h-full object-contain" />
            <button 
              onClick={resetForm}
              className="absolute top-4 right-4 bg-white text-gray-900 p-2 shadow-sm border border-gray-200 hover:bg-gray-100 transition-colors"
              disabled={isLoading}
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="space-y-6">
            <div>
              <label htmlFor="location" className="block text-xs font-bold text-gray-900 uppercase tracking-widest mb-3">
                {t('Lokasi Penemuan (Opsional)', 'Location Found (Optional)')}
              </label>
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="relative flex-1">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <MapPin className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="text"
                    id="location"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    disabled={isLoading}
                    className="block w-full pl-10 pr-3 py-4 border-b-2 border-gray-900 bg-gray-50 focus:outline-none focus:border-primary-sunai transition-colors"
                    placeholder={t('Contoh: Waduk Cirata, Jawa Barat', 'e.g. Ciliwung River, Jakarta')}
                  />
                </div>
                <button
                  type="button"
                  onClick={getLocation}
                  disabled={isLoading}
                  className="px-6 py-4 bg-gray-200 hover:bg-gray-300 text-gray-900 font-bold text-sm uppercase tracking-widest transition-colors w-full sm:w-auto"
                >
                  {t('Gunakan GPS', 'Use GPS')}
                </button>
              </div>
            </div>

            <button
              onClick={handleIdentify}
              disabled={isLoading}
              className="w-full flex items-center justify-center py-5 px-4 bg-primary-sunai text-white text-sm font-bold uppercase tracking-widest hover:bg-primary-sunai/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isLoading ? (
                <>
                  <RefreshCw className="animate-spin h-5 w-5 mr-3" />
                  {language === 'id' ? LOADING_MESSAGES_ID[loadingMsgIdx] : LOADING_MESSAGES_EN[loadingMsgIdx]}
                </>
              ) : (
                <>
                  <Search className="h-5 w-5 mr-3" />
                  {t('Identifikasi Sekarang!', 'Identify Now!')}
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {result && (
        <div className="space-y-6 mt-6">
          <div className="flex justify-between items-center border-b border-gray-200 pb-4">
             <button 
                onClick={resetForm}
                className="text-gray-500 font-bold text-sm uppercase tracking-widest hover:text-gray-900 flex items-center transition-colors"
              >
                ← {t('Foto Ikan Lainnya', 'Identify Another Fish')}
             </button>
          </div>
          {warning && (
            <div className="bg-amber-50 border-l-4 border-amber-500 px-5 py-4 text-sm text-amber-900 flex items-start gap-3">
              <span className="shrink-0 mt-0.5">⚠️</span>
              <span className="font-medium leading-relaxed">{warning}</span>
            </div>
          )}
          <IdentifyResult result={result.data} speciesId={result.speciesId} uploadedImage={preview} />
        </div>
      )}
    </div>
  );
}
