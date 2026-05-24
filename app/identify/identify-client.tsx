'use client';

import { useState } from 'react';
import { PhotoUploader } from '@/components/identify/PhotoUploader';
import { TextIdentifier } from '@/components/identify/TextIdentifier';
import { useLanguage } from '@/components/LanguageContext';
import { Lightbulb, Camera, FileText } from 'lucide-react';

export default function IdentifyPageClient() {
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState<'photo' | 'text'>('photo');

  return (
    <div className="min-h-screen bg-[#fafaf8] py-16 sm:py-24">
      {/* Hero */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 mb-16 border-b border-gray-200 pb-10">
        <p className="text-sm font-bold text-gray-500 uppercase tracking-widest mb-2">{t('Kecerdasan Buatan', 'Artificial Intelligence')}</p>
        <h1 className="text-4xl sm:text-6xl font-extrabold text-gray-900 leading-tight mb-6">
          {t('Identifikasi Spesies', 'Species Identification')}
        </h1>
        <p className="text-xl text-gray-600 max-w-3xl leading-relaxed">
          {t('Kenali ikan invasif dengan akurasi tinggi menggunakan analisis foto atau pencocokan deskripsi teks.', 'Identify invasive fish with high accuracy using photo analysis or text description matching.')}
        </p>
      </section>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 lg:grid-cols-12 gap-16">
        
        {/* Left Column - Tools */}
        <div className="lg:col-span-8">
          {/* Tab Switcher */}
          <div className="flex border-b border-gray-300 mb-10">
            <button
              onClick={() => setActiveTab('photo')}
              className={`flex-1 flex items-center justify-center gap-3 py-4 text-sm font-bold uppercase tracking-widest transition-colors ${
                activeTab === 'photo' ? 'border-b-4 border-gray-900 text-gray-900' : 'text-gray-400 hover:text-gray-700'
              }`}
            >
              <Camera className="w-4 h-4" />
              {t('Analisis Foto', 'Photo Analysis')}
            </button>
            <button
              onClick={() => setActiveTab('text')}
              className={`flex-1 flex items-center justify-center gap-3 py-4 text-sm font-bold uppercase tracking-widest transition-colors ${
                activeTab === 'text' ? 'border-b-4 border-gray-900 text-gray-900' : 'text-gray-400 hover:text-gray-700'
              }`}
            >
              <FileText className="w-4 h-4" />
              {t('Pencocokan Teks', 'Text Matching')}
            </button>
          </div>

          {activeTab === 'photo' && (
            <div className="animate-in fade-in duration-500">
              <PhotoUploader />
            </div>
          )}

          {activeTab === 'text' && (
            <div className="animate-in fade-in duration-500">
              <TextIdentifier />
            </div>
          )}
        </div>

        {/* Right Column - Tips */}
        <div className="lg:col-span-4">
          <div className="bg-white border-l-4 border-primary-sunai p-6 shadow-sm">
            <div className="flex items-center gap-3 mb-4">
              <Lightbulb className="w-6 h-6 text-primary-sunai" />
              <h3 className="text-lg font-bold text-gray-900">{t('Panduan Akurasi', 'Accuracy Guide')}</h3>
            </div>
            
            {activeTab === 'photo' ? (
              <ul className="space-y-4 text-sm text-gray-600">
                <li className="flex gap-2">
                  <span className="font-bold text-gray-900">01.</span>
                  {t('Posisikan ikan secara horizontal dan foto dari sisi samping (profil).', 'Position the fish horizontally and photograph from the side (profile view).')}
                </li>
                <li className="flex gap-2">
                  <span className="font-bold text-gray-900">02.</span>
                  {t('Pastikan sirip punggung (dorsal) terlihat jelas.', 'Ensure the dorsal fin is clearly visible.')}
                </li>
                <li className="flex gap-2">
                  <span className="font-bold text-gray-900">03.</span>
                  {t('Cahaya terang natural lebih baik (hindari pantulan cahaya pada sisik).', 'Natural bright light is best — avoid glare on the scales.')}
                </li>
                <li className="flex gap-2">
                  <span className="font-bold text-gray-900">04.</span>
                  {t('Foto ikan yang masih segar atau hidup jika memungkinkan.', 'Photograph fresh or live fish if possible.')}
                </li>
              </ul>
            ) : (
              <ul className="space-y-4 text-sm text-gray-600">
                <li className="flex gap-2">
                  <span className="font-bold text-gray-900">01.</span>
                  {t('Sebutkan warna dominan dan pola (bintik, garis, dll).', 'Mention dominant colors and patterns (spots, stripes, etc).')}
                </li>
                <li className="flex gap-2">
                  <span className="font-bold text-gray-900">02.</span>
                  {t('Jelaskan bentuk tubuh dan siripnya.', 'Describe the body and fin shapes.')}
                </li>
                <li className="flex gap-2">
                  <span className="font-bold text-gray-900">03.</span>
                  {t('Sebutkan lokasi penemuan (sungai, danau, rawa).', 'Mention the discovery location (river, lake, swamp).')}
                </li>
              </ul>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
