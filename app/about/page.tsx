import type { Metadata } from 'next';
import AboutPageClient from './about-client';

export const metadata: Metadata = {
  title: 'Tentang Kami & Misi SiJaga Sungai',
  description: 'SiJaga Sungai adalah platform citizen science berbasis AI untuk identifikasi, pemetaan, dan pemanfaatan ekonomi spesies ikan invasif di Indonesia.',
  openGraph: {
    title: 'Tentang Kami & Misi SiJaga Sungai',
    description: 'Platform citizen science berbasis AI untuk menjaga kelestarian perairan tawar Indonesia.',
  }
};

export default function AboutPage() {
  return <AboutPageClient />;
}
