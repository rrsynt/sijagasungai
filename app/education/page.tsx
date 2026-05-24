import type { Metadata } from 'next';
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
  return <EducationPageClient />;
}
