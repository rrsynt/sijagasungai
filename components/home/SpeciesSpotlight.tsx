'use client';

import { useState, useEffect } from 'react';
import { SPECIES_DATABASE, InvasiveSpecies } from '@/lib/species-database';
import { useLanguage } from '../LanguageContext';

import Image from 'next/image';

const speciesList = Object.values(SPECIES_DATABASE);

export function SpeciesSpotlight() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const { t } = useLanguage();

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % speciesList.length);
    }, 3000);
    return () => clearInterval(timer);
  }, []);

  const species = speciesList[currentIndex];

  if (!species) return null;

  return (
    <div className="bg-white rounded-3xl p-8 md:p-10 shadow-lg border border-gray-100 flex flex-col md:flex-row items-center gap-8 transform transition-all duration-500">
      <div className="flex-shrink-0 w-32 h-32 md:w-48 md:h-48 bg-primary-sunai/10 rounded-full flex items-center justify-center text-6xl md:text-8xl shadow-inner overflow-hidden relative">
        {species.imageUrl ? (
          <Image src={species.imageUrl} alt={species.namaLokal[0]} fill className="object-cover" sizes="(max-width: 768px) 8rem, 12rem" />
        ) : (
          species.badgeEmoji
        )}
      </div>
      
      <div className="flex-1 text-center md:text-left">
        <div className="inline-block px-3 py-1 bg-amber-100 text-amber-800 text-xs font-bold rounded-full tracking-wide mb-3 uppercase">
          {species.badgeName}
        </div>
        <h3 className="text-2xl md:text-3xl font-extrabold text-gray-900 mb-2">
          {species.namaLokal[0]} <span className="text-gray-400 font-normal italic text-xl">({species.namaIlmiah})</span>
        </h3>
        
        <p className="text-gray-600 mb-4 text-sm md:text-base font-medium">
          <span className="font-bold text-gray-800">{t('Asal:', 'Origin:')}</span> {species.asal}
        </p>

        <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100 text-sm md:text-base italic text-gray-700">
          &quot;{species.funFact}&quot;
        </div>
      </div>
    </div>
  );
}
