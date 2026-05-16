'use client';

import { Suspense, useState, useEffect } from 'react';
import { SPECIES_DATABASE } from '@/lib/species-database';
import { SpeciesCard } from '@/components/education/SpeciesCard';
import { QuizPanel } from '@/components/education/QuizPanel';
import { useLanguage } from '@/components/LanguageContext';
import { BookOpen, X, ImageIcon, Lightbulb, Activity, Globe } from 'lucide-react';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { useSearchParams } from 'next/navigation';

function EducationContent() {
  const { t, language } = useLanguage();
  const searchParams = useSearchParams();
  const [selectedSpeciesId, setSelectedSpeciesId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'info' | 'quiz'>('info');
  const [cardData, setCardData] = useState<any>(null);
  const [loadingCard, setLoadingCard] = useState(false);

  const speciesList = Object.values(SPECIES_DATABASE);

  const handleCardClick = async (id: string) => {
    setSelectedSpeciesId(id);
    setActiveTab('info');
    setCardData(null);
    setLoadingCard(true);

    try {
      const res = await fetch(`/api/education/species-card/${id}?lang=${language}`);
      const data = await res.json();
      if (data.success) {
        setCardData(data.data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingCard(false);
    }
  };

  useEffect(() => {
    const prefilledSpecies = searchParams.get('species');
    if (prefilledSpecies && SPECIES_DATABASE[prefilledSpecies]) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      handleCardClick(prefilledSpecies);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  const closeModal = () => {
    setSelectedSpeciesId(null);
    setCardData(null);
  };

  return (
    <div className="min-h-screen bg-[#fafaf8] py-16 sm:py-24 relative">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <div className="mb-16 border-b border-gray-200 pb-10">
          <p className="text-sm font-bold text-gray-500 uppercase tracking-widest mb-2">{t('Katalog', 'Catalog')}</p>
          <h1 className="text-4xl sm:text-5xl font-extrabold text-gray-900 leading-tight mb-4">
             {t('Ensiklopedia Invasif', 'Invasive Encyclopedia')}
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl leading-relaxed">
             {t('Pelajari spesies yang mengancam perairan kita dan dapatkan badge pengetahuan.', 'Learn about species threatening our waters and earn knowledge badges.')}
          </p>
        </div>

        <div className="flex flex-col gap-0 border-t border-gray-200">
          {speciesList.map(species => (
            <SpeciesCard key={species.id} species={species} onClick={handleCardClick} />
          ))}
        </div>
      </div>

      {/* Modal */}
      {selectedSpeciesId && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-0 sm:p-6 bg-black/80 backdrop-blur-sm">
          {/* Backdrop */}
          <div className="absolute inset-0" onClick={closeModal}></div>
          
          {/* Modal Content */}
          <div className="relative bg-[#fafaf8] sm:rounded-none w-full h-full sm:h-auto max-w-4xl max-h-screen sm:max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in duration-200 border sm:border-gray-300">
            {/* Header */}
            <div className="flex bg-white border-b border-gray-200 px-4 py-3 items-center justify-between">
              <div className="flex gap-4">
                <button 
                  onClick={() => setActiveTab('info')}
                  className={`py-2 px-4 text-sm font-bold transition-colors ${activeTab === 'info' ? 'text-gray-900 border-b-2 border-gray-900' : 'text-gray-500 hover:text-gray-700'}`}
                >
                  {t('Info Spesies', 'Species Info')}
                </button>
                <button 
                  onClick={() => setActiveTab('quiz')}
                  className={`py-2 px-4 text-sm font-bold transition-colors ${activeTab === 'quiz' ? 'text-gray-900 border-b-2 border-gray-900' : 'text-gray-500 hover:text-gray-700'}`}
                >
                  {t('Kuis Mini', 'Mini Quiz')}
                </button>
              </div>
              <button onClick={closeModal} className="p-2 text-gray-400 hover:text-gray-900 transition-colors">
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Body */}
            <div className="overflow-y-auto p-6 sm:p-10 flex-grow bg-white">
              {activeTab === 'info' && (
                loadingCard ? (
                  <div className="py-20"><LoadingSpinner text={t('Memuat ensiklopedia...', 'Loading encyclopedia...')} /></div>
                ) : cardData ? (
                  <div className="space-y-12 animate-in fade-in">
                    
                    {/* Hero Image Section */}
                    {selectedSpeciesId && SPECIES_DATABASE[selectedSpeciesId]?.imageUrl && (
                      <div className="w-full h-64 sm:h-96 overflow-hidden relative mb-8">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img 
                          src={SPECIES_DATABASE[selectedSpeciesId].imageUrl} 
                          alt={cardData.namaDisplay} 
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute top-4 left-4 px-4 py-2 text-sm font-bold uppercase tracking-widest bg-red-600/90 backdrop-blur-sm text-white">
                          {cardData.statusBadge}
                        </div>
                      </div>
                    )}

                    <div className="border-b border-gray-200 pb-8">
                      <h2 className="text-4xl sm:text-5xl font-extrabold text-gray-900 mb-2 tracking-tight">{cardData.namaDisplay}</h2>
                      <p className="text-xl text-gray-500 italic font-medium">{SPECIES_DATABASE[selectedSpeciesId!].namaIlmiah}</p>
                      
                      {(!selectedSpeciesId || !SPECIES_DATABASE[selectedSpeciesId]?.imageUrl) && (
                        <div className="mt-4 inline-block px-4 py-1.5 text-xs font-bold uppercase tracking-widest border border-red-200 text-red-600 bg-red-50">
                          {cardData.statusBadge}
                        </div>
                      )}
                    </div>

                    <div className="prose max-w-none">
                      <p className="text-xl text-gray-800 leading-relaxed font-medium">
                        {cardData.asalUsul}
                      </p>
                    </div>

                    {cardData.predatorAlami && (
                      <div className="border-l-4 border-gray-900 pl-6 py-2">
                        <h3 className="font-bold text-gray-900 text-sm uppercase tracking-widest mb-2">{t('Predator Alami', 'Natural Predator')}</h3>
                        <p className="text-gray-700 text-base leading-relaxed">{cardData.predatorAlami}</p>
                      </div>
                    )}

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 pt-8 border-t border-gray-200">
                      <div>
                        <h3 className="text-sm font-bold text-gray-900 uppercase tracking-widest mb-6">
                          {t('Kekuatan Super (Ancaman)', 'Superpower (Threat)')}
                        </h3>
                        <ul className="space-y-6">
                          {cardData.kekuatanSuper?.map((f: any, i: number) => (
                            <li key={i} className="flex flex-col">
                              <span className="font-bold text-gray-900 text-lg mb-1">{f.nama}</span>
                              <span className="text-gray-600 leading-relaxed">{f.penjelasan}</span>
                            </li>
                          ))}
                        </ul>
                      </div>

                      <div>
                        <h3 className="text-sm font-bold text-gray-900 uppercase tracking-widest mb-6">
                          {t('Rantai Dampak', 'Impact Chain')}
                        </h3>
                        <div className="space-y-4">
                          {cardData.rantaiDampak?.map((f: string, i: number) => (
                            <div key={i} className="flex items-start">
                              <span className="text-gray-400 font-bold mr-4 mt-1">{i + 1}.</span>
                              <span className="text-gray-700 leading-relaxed">{f}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="bg-gray-50 p-8 border-l-4 border-primary-sunai">
                      <h4 className="font-bold text-gray-900 uppercase tracking-widest mb-3">
                        {t('Fakta Mengejutkan', 'Surprising Fact')}
                      </h4>
                      <p className="text-gray-700 leading-relaxed">{cardData.faktaMengejutkan}</p>
                    </div>
                  </div>
                ) : (
                   <p className="text-gray-500 py-10">{t('Gagal memuat data.', 'Failed to load data.')}</p>
                )
              )}

              {activeTab === 'quiz' && (
                <QuizPanel speciesId={selectedSpeciesId} />
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function EducationPage() {
  return (
    <Suspense fallback={<LoadingSpinner text="Memuat Ensiklopedia..." />}>
      <EducationContent />
    </Suspense>
  );
}
