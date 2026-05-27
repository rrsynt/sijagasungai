'use client';

import { useState, useEffect, useRef } from 'react';
import { SPECIES_DATABASE, InvasiveSpecies } from '@/lib/species-database';
import { useLanguage } from '../LanguageContext';
import Image from 'next/image';

const speciesList = Object.values(SPECIES_DATABASE);

export function SpeciesSpotlight() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFading, setIsFading] = useState(false);
  const { t } = useLanguage();
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const startTimer = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      triggerFade((prev) => (prev + 1) % speciesList.length);
    }, 4500);
  };

  const triggerFade = (nextIndexVal: number | ((prev: number) => number)) => {
    setIsFading(true);
    setTimeout(() => {
      setCurrentIndex(nextIndexVal);
      setIsFading(false);
    }, 300);
  };

  useEffect(() => {
    startTimer();
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const species = speciesList[currentIndex];

  if (!species) return null;

  return (
    <div 
      className="flex flex-col items-center gap-6"
      onMouseEnter={() => { if (timerRef.current) clearInterval(timerRef.current); }}
      onMouseLeave={() => startTimer()}
    >
      <div 
        className={`w-full bg-white rounded-none p-8 md:p-10 border-2 border-gray-900 flex flex-col md:flex-row items-center gap-8 md:gap-12 transition-all duration-300 transform ${
          isFading ? 'opacity-0 translate-y-2' : 'opacity-100 translate-y-0'
        }`}
      >
        <div className="flex-shrink-0 w-32 h-32 md:w-44 md:h-44 bg-gray-50 border-2 border-gray-900 rounded-none flex items-center justify-center text-6xl md:text-7xl shadow-sm overflow-hidden relative group">
          {species.imageUrl ? (
            <Image 
              src={species.imageUrl} 
              alt={species.namaLokal[0]} 
              fill 
              className="object-cover group-hover:scale-105 transition-transform duration-500" 
              sizes="(max-width: 768px) 8rem, 11rem" 
            />
          ) : (
            species.badgeEmoji
          )}
        </div>
        
        <div className="flex-1 text-center md:text-left">
          <div className="inline-block px-3 py-1 bg-red-50 text-red-700 border border-red-200 text-xs font-bold tracking-widest mb-4 uppercase">
            {t(species.statusInvasif, species.statusInvasif)}
          </div>
          <h3 className="text-3xl font-extrabold text-gray-900 mb-2 leading-none">
            {species.namaLokal[0]}{' '}
            <span className="text-gray-400 font-normal italic text-lg block sm:inline sm:ml-2">({species.namaIlmiah})</span>
          </h3>
          
          <p className="text-gray-600 mb-6 text-sm">
            <span className="font-bold text-gray-900 uppercase tracking-widest text-xs mr-2">{t('Asal Wilayah:', 'Origin Region:')}</span> {species.asal}
          </p>

          <div className="bg-gray-50 border-l-4 border-gray-900 p-4 text-sm italic text-gray-700 leading-relaxed">
            &quot;{species.funFact}&quot;
          </div>
        </div>
      </div>

      {/* Manual selection dots */}
      <div className="flex gap-2">
        {speciesList.map((_, idx) => (
          <button
            key={idx}
            onClick={() => triggerFade(idx)}
            className={`w-3.5 h-3.5 rounded-full border transition-all ${
              idx === currentIndex
                ? 'bg-gray-900 border-gray-900 scale-110'
                : 'bg-gray-200 border-gray-300 hover:bg-gray-300'
            }`}
            title={`Slide ${idx + 1}`}
            aria-label={`Lihat spesies ${idx + 1}`}
          />
        ))}
      </div>
    </div>
  );
}
