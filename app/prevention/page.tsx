import type { Metadata } from 'next';
import PreventionPageClient from './prevention-client';

export const metadata: Metadata = {
  title: 'Panduan Pencegahan Spesies Invasif — SiJaga Sungai',
  description: 'Lebih baik mencegah daripada memberantas. Pelajari alur aksi dan prosedur resmi KKP untuk menghentikan penyebaran spesies ikan invasif di sungai Indonesia.',
  openGraph: {
    title: 'Panduan Pencegahan Spesies Invasif — SiJaga Sungai',
    description: 'Pelajari alur aksi dan prosedur resmi KKP untuk menghentikan penyebaran spesies ikan invasif di perairan kita.',
  }
};

export default function PreventionPage() {
  return <PreventionPageClient />;
}
