'use client';

import { useLanguage } from '@/components/LanguageContext';
import { InvasiveSpecies } from '@/lib/species-database';
import { Badge } from '../ui/Badge';
import Image from 'next/image';

interface SpeciesCardProps {
  species: InvasiveSpecies;
  onClick: (id: string) => void;
}

export function SpeciesCard({ species, onClick }: SpeciesCardProps) {
  const { t } = useLanguage();

  return (
    <div 
      onClick={() => onClick(species.id)}
      className="flex flex-col sm:flex-row items-start sm:items-center justify-between py-6 border-b border-gray-200 cursor-pointer group hover:bg-gray-50 transition-colors px-4 -mx-4"
    >
      <div className="flex items-center gap-6">
        <div className="w-20 h-20 bg-gray-100 shrink-0 relative overflow-hidden group-hover:grayscale-0 transition-all duration-300">
          {species.imageUrl ? (
            <Image src={species.imageUrl} alt={species.namaLokal[0]} fill className="object-cover" sizes="5rem" />
          ) : (
            <span className="flex items-center justify-center w-full h-full text-3xl">{species.badgeEmoji}</span>
          )}
        </div>
        <div>
          <h3 className="text-xl font-bold text-gray-900 group-hover:text-primary-sunai transition-colors">{species.namaLokal[0]}</h3>
          <p className="text-sm text-gray-500 italic mb-2">{species.namaIlmiah}</p>
          <div className="sm:hidden mb-2">
             <Badge status={species.statusInvasif} />
          </div>
        </div>
      </div>
      
      <div className="hidden sm:flex flex-col items-end">
        <Badge status={species.statusInvasif} />
        <span className="text-xs font-bold text-gray-400 uppercase tracking-widest mt-2 group-hover:text-gray-900 transition-colors">
          {t('Lihat Profil →', 'View Profile →')}
        </span>
      </div>
    </div>
  );
}
