import type { Metadata } from 'next';
import MapPageClient from './map-client';

export const metadata: Metadata = {
  title: 'Peta Distribusi Spesies Invasif Real-time — SiJaga Sungai',
  description: 'Pantau titik penyebaran dan zona merah spesies ikan invasif di sungai dan perairan tawar seluruh Indonesia secara real-time.',
  openGraph: {
    title: 'Peta Distribusi Spesies Invasif Real-time — SiJaga Sungai',
    description: 'Peta interaktif pelaporan citizen science untuk melacak titik kerawanan invasi spesies asing di Indonesia.',
  }
};

export default function MapPage() {
  return <MapPageClient />;
}
