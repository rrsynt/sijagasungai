import type { Metadata } from 'next';
import HomePageClient from './home-client';

export const metadata: Metadata = {
  title: 'SiJaga Sungai — Pelaporan & Identifikasi Ikan Invasif Nusantara',
  description: 'Lindungi ekosistem perairan tawar Indonesia dari ancaman ikan invasif. Laporkan penemuan, identifikasi spesies menggunakan AI pintar, dan pelajari pengolahan bernilai ekonomi.',
  openGraph: {
    title: 'SiJaga Sungai — Pelaporan & Identifikasi Ikan Invasif Nusantara',
    description: 'Lindungi ekosistem perairan tawar Indonesia dari ancaman ikan invasif. Laporkan penemuan, identifikasi spesies menggunakan AI pintar, dan pelajari pengolahan bernilai ekonomi.',
  }
};

export default function HomePage() {
  const websiteJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'SiJaga Sungai',
    url: process.env.APP_URL || 'https://sijaga-sungai-701628588260.asia-southeast1.run.app',
    description: 'Platform citizen science berbasis AI untuk identifikasi, pelaporan, dan pemanfaatan spesies ikan invasif di Indonesia.',
    applicationCategory: 'Environment, Education',
    genre: 'Citizen Science',
    about: {
      '@type': 'Thing',
      name: 'Invasive Species Control in Indonesia',
      description: 'Identifying and mapping invasive alien fish species to protect local freshwater ecosystems.'
    }
  };

  const datasetJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Dataset',
    name: 'Peta Distribusi Spesies Ikan Invasif Indonesia',
    description: 'Data persebaran laporan citizen science spesies ikan asing invasif di perairan tawar Indonesia.',
    url: `${process.env.APP_URL || 'https://sijaga-sungai-701628588260.asia-southeast1.run.app'}/map`,
    creator: {
      '@type': 'Organization',
      name: 'SiJaga Sungai Community'
    },
    temporalCoverage: '2025/2026',
    spatialCoverage: {
      '@type': 'Place',
      name: 'Indonesia'
    }
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(datasetJsonLd) }}
      />
      <HomePageClient />
    </>
  );
}
