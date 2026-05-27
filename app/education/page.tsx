import type { Metadata } from 'next';
import { SPECIES_DATABASE } from '@/lib/species-database';
import EducationPageClient from './education-client';

export const metadata: Metadata = {
  title: 'Ensiklopedia Ikan Invasif & Kuis Gamifikasi — SiJaga Sungai',
  description: 'Pelajari spesies ikan asing invasif di Indonesia melalui kartu fakta interaktif dan uji pengetahuanmu lewat kuis mini untuk mengumpulkan lencana kehormatan.',
  openGraph: {
    title: 'Ensiklopedia Ikan Invasif & Kuis Gamifikasi — SiJaga Sungai',
    description: 'Bahan edukasi interaktif citizen science dan kuis berhadiah lencana bagi penjaga sungai.',
  }
};

export default function EducationPage() {
  const itemListJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: 'Daftar Spesies Ikan Invasif di Indonesia',
    description: 'Katalog spesies ikan asing invasif yang mengancam ekosistem perairan tawar di Indonesia.',
    numberOfItems: Object.keys(SPECIES_DATABASE).length,
    itemListElement: Object.values(SPECIES_DATABASE).map((species, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      item: {
        '@type': 'Thing',
        name: species.namaLokal[0],
        alternateName: [species.namaIlmiah, species.namaEn, ...species.namaLokal.slice(1)],
        description: species.funFact,
        image: species.imageUrl ? `https://sijaga-sungai-701628588260.asia-southeast1.run.app${species.imageUrl}` : undefined,
        sameAs: species.referensi
      }
    }))
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListJsonLd) }}
      />
      <EducationPageClient />
    </>
  );
}
