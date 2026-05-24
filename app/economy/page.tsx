import type { Metadata } from 'next';
import EconomyPageClient from './economy-client';

export const metadata: Metadata = {
  title: 'Kalkulator Potensi Ekonomi Spesies Invasif — SiJaga Sungai',
  description: 'Hitung potensi penghasilan dari pemanfaatan non-pangan spesies invasif seperti tepung ikan, pakan segar ternak, dan pupuk cair organik.',
  openGraph: {
    title: 'Kalkulator Potensi Ekonomi Spesies Invasif — SiJaga Sungai',
    description: 'Ubah tangkapan berbahaya menjadi peluang sirkular ekonomi non-pangan bernilai jual tinggi.',
  }
};

export default function EconomyPage() {
  return <EconomyPageClient />;
}
