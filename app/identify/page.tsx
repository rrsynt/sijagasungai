import type { Metadata } from 'next';
import IdentifyPageClient from './identify-client';

export const metadata: Metadata = {
  title: 'Identifikasi Spesies Ikan Invasif dengan AI — SiJaga Sungai',
  description: 'Upload foto ikan atau masukkan deskripsi fisik. AI pintar kami akan mengidentifikasi spesies, asal-usul, dampak ekologi, serta tindakan penanganan secara instan.',
  openGraph: {
    title: 'Identifikasi Spesies Ikan Invasif dengan AI — SiJaga Sungai',
    description: 'Analisis foto instan berbasis AI untuk mendeteksi ikan invasif dan aman secara akurat.',
  }
};

export default function IdentifyPage() {
  return <IdentifyPageClient />;
}
