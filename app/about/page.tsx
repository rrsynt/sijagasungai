'use client';

import { useLanguage } from '@/components/LanguageContext';
import { Droplets, Target, Cpu, Globe, Users, Award, ExternalLink, ArrowRight } from 'lucide-react';
import Link from 'next/link';

export default function AboutPage() {
  const { t } = useLanguage();

  const techStack = [
    { name: 'Next.js 15', desc: 'App Router + Server Components' },
    { name: 'Gemini 2.0 Flash', desc: 'AI Vision & Text Generation' },
    { name: 'Google Maps Platform', desc: 'Peta distribusi interaktif' },
    { name: 'Firebase Firestore', desc: 'Database laporan citizen science' },
    { name: 'Google Cloud Run', desc: 'Serverless deployment (Jakarta)' },
    { name: 'TypeScript + TailwindCSS', desc: 'Type-safe UI development' },
  ];

  const impacts = [
    {
      title: t('Nelayan & Pemancing', 'Fishermen & Anglers'),
      desc: t('Mengidentifikasi tangkapan, menghitung nilai ekonomi, dan menghindari denda pelanggaran.', 'Identify catches, calculate economic value, and avoid violation penalties.'),
    },
    {
      title: t('Peneliti & BRIN/KKP', 'Researchers & BRIN/KKP'),
      desc: t('Data distribusi real-time dari ribuan titik laporan citizen scientist untuk mendukung kebijakan nasional.', 'Real-time distribution data from thousands of citizen science reports to support national policy.'),
    },
    {
      title: t('Komunitas & Pelajar', 'Community & Students'),
      desc: t('Belajar ekologi perairan melalui ensiklopedia interaktif dan kuis gamifikasi.', 'Learn aquatic ecology through interactive encyclopedia and gamified quizzes.'),
    },
  ];

  const team = [
    { role: t('Developer', 'Developer'), name: 'Ratri Risyanto' },
    { role: t('AI Engine', 'AI Engine'), name: 'Gemini 2.0 Flash' },
    { role: t('AI Assistant', 'AI Assistant'), name: 'AntiGravity' },
    { role: t('Infrastructure', 'Infrastructure'), name: 'Google Cloud' },
  ];

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 pt-24 pb-20">
      <div className="max-w-7xl mx-auto px-6 md:px-12">
        {/* Header Section */}
        <header className="mb-24 md:flex md:items-end md:justify-between border-b-2 border-gray-900 pb-12">
          <div className="max-w-3xl">
            <h1 className="text-5xl md:text-7xl font-black uppercase tracking-tighter leading-none mb-6">
              {t('Misi Kami', 'Our Mission')}
            </h1>
            <p className="text-xl md:text-3xl font-medium text-gray-600 leading-tight">
              {t(
                'Platform citizen science berbasis AI untuk identifikasi, pelaporan, dan pemanfaatan ekonomi spesies ikan invasif di perairan Indonesia.',
                'AI-powered citizen science platform for identifying, reporting, and economically utilizing invasive fish species in Indonesian waters.'
              )}
            </p>
          </div>
          <div className="mt-8 md:mt-0 md:text-right shrink-0">
            <p className="text-sm font-bold uppercase tracking-widest text-gray-500 mb-2">
              {t('Pilar Utama', 'Core Pillars')}
            </p>
            <p className="text-lg font-black uppercase tracking-widest">
              {t('Kenali. Laporkan. Manfaatkan.', 'Identify. Report. Utilize.')}
            </p>
          </div>
        </header>

        {/* Content Section - Asymmetric Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-24 mb-24">
          
          {/* Left Column (Wider) */}
          <div className="lg:col-span-7 space-y-24">
            
            {/* The Problem */}
            <section>
              <div className="flex items-center gap-4 mb-8 border-b-2 border-gray-900 pb-4">
                <span className="text-sm font-black text-gray-400">01</span>
                <h2 className="text-2xl font-black uppercase tracking-widest">{t('Masalah', 'The Problem')}</h2>
              </div>
              
              <div className="space-y-6 text-lg text-gray-700 leading-relaxed font-medium">
                <p>
                  {t(
                    'Indonesia memiliki lebih dari 150 sungai yang terdampak spesies ikan invasif seperti Sapu-sapu (Pterygoplichthys), Aligator Gar, dan Peacock Bass.',
                    'Indonesia has over 150 rivers affected by invasive fish species such as Suckermouth Catfish, Alligator Gar, and Peacock Bass.'
                  )}
                </p>
                <p>
                  {t(
                    'Menurut data KKP, kerugian ekologi akibat spesies invasif di perairan tawar Indonesia diperkirakan mencapai miliaran rupiah per tahun. Spesies asli terdesak, rantai makanan rusak, dan keseimbangan ekosistem hancur.',
                    'According to KKP data, ecological damage from invasive species in Indonesian freshwater is estimated at billions of rupiah annually. Native species are displaced, food chains are broken, and ecosystem balance is destroyed.'
                  )}
                </p>
                <div className="bg-gray-900 text-white p-8 my-8 border-l-8 border-red-600">
                  <p className="text-xl font-bold">
                    {t(
                      'Mayoritas masyarakat — khususnya nelayan kecil — tidak tahu cara mengidentifikasi, ke mana melaporkan, atau bagaimana memanfaatkan tangkapan invasif secara ekonomi.',
                      'The majority of the public — especially small-scale fishermen — don\'t know how to identify these species, where to report them, or how to economically utilize invasive catches.'
                    )}
                  </p>
                </div>
                <p>
                  {t(
                    'SiJaga Sungai hadir untuk mengisi celah ini dengan mengawinkan kecerdasan buatan (AI) dan konsep citizen science.',
                    'SiJaga Sungai is here to bridge this gap by marrying Artificial Intelligence (AI) with the concept of citizen science.'
                  )}
                </p>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-0 border-y-2 border-gray-900 mt-12">
                {[
                  { num: '150+', label: t('Sungai Terdampak', 'Affected Rivers') },
                  { num: '10+', label: t('Spesies Invasif', 'Invasive Species') },
                  { num: 'Triliun', label: t('Kerugian Ekologi', 'Ecological Losses') },
                ].map((stat, idx) => (
                  <div key={idx} className={`py-6 px-4 ${idx !== 0 ? 'sm:border-l-2 sm:border-gray-900' : ''} border-b-2 sm:border-b-0 border-gray-900 last:border-b-0`}>
                    <p className="text-4xl font-black text-gray-900 mb-1">{stat.num}</p>
                    <p className="text-xs font-bold text-gray-500 uppercase tracking-widest">{stat.label}</p>
                  </div>
                ))}
              </div>
            </section>

            {/* Tech Stack */}
            <section>
              <div className="flex items-center gap-4 mb-8 border-b-2 border-gray-900 pb-4">
                <span className="text-sm font-black text-gray-400">02</span>
                <h2 className="text-2xl font-black uppercase tracking-widest">{t('Teknologi', 'Technology')}</h2>
              </div>
              
              <ul className="space-y-0">
                {techStack.map((tech, idx) => (
                  <li key={idx} className="group py-6 border-b border-gray-300 flex flex-col sm:flex-row sm:items-baseline sm:justify-between hover:bg-gray-100 transition-colors px-4 -mx-4">
                    <span className="text-lg font-black text-gray-900 uppercase tracking-wide group-hover:text-primary-sunai transition-colors">{tech.name}</span>
                    <span className="text-sm font-medium text-gray-500 mt-1 sm:mt-0">{tech.desc}</span>
                  </li>
                ))}
              </ul>
            </section>

          </div>

          {/* Right Column (Narrower) */}
          <div className="lg:col-span-5 space-y-24">
            
            {/* Target User */}
            <section>
              <div className="flex items-center gap-4 mb-8 border-b-2 border-gray-900 pb-4">
                <span className="text-sm font-black text-gray-400">03</span>
                <h2 className="text-2xl font-black uppercase tracking-widest">{t('Dampak', 'Impact')}</h2>
              </div>
              
              <div className="space-y-8">
                {impacts.map((item, idx) => (
                  <div key={idx} className="border-l-4 border-gray-900 pl-6">
                    <h3 className="text-lg font-black text-gray-900 uppercase tracking-widest mb-3">{item.title}</h3>
                    <p className="text-gray-600 font-medium leading-relaxed">{item.desc}</p>
                  </div>
                ))}
              </div>
            </section>

            {/* Team */}
            <section>
              <div className="flex items-center gap-4 mb-8 border-b-2 border-gray-900 pb-4">
                <span className="text-sm font-black text-gray-400">04</span>
                <h2 className="text-2xl font-black uppercase tracking-widest">{t('Tim', 'Team')}</h2>
              </div>
              
              <div className="grid grid-cols-1 gap-6">
                {team.map((member, idx) => (
                  <div key={idx} className="bg-white border-2 border-gray-900 p-6 flex flex-col justify-between hover:bg-gray-900 hover:text-white transition-colors group">
                    <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-4 group-hover:text-gray-400 transition-colors">{member.role}</p>
                    <p className="text-xl font-black uppercase tracking-widest">{member.name}</p>
                  </div>
                ))}
              </div>
            </section>

          </div>
        </div>

        {/* JuaraVibeCoding Banner */}
        <section className="border-y-4 border-gray-900 py-16 text-center bg-gray-100">
          <div className="max-w-3xl mx-auto px-6">
            <p className="text-sm font-bold uppercase tracking-widest text-gray-500 mb-4">{t('Dibuat untuk', 'Built for')}</p>
            <h2 className="text-4xl md:text-6xl font-black uppercase tracking-tighter mb-8">
              #JuaraVibeCoding
            </h2>
            <p className="text-lg text-gray-700 font-medium leading-relaxed mb-10 max-w-2xl mx-auto">
              {t(
                'Google Vibe Coding Event 2026 — Platform ini dibuat sepenuhnya dengan AI-assisted coding sebagai bukti bahwa teknologi dapat mempercepat solusi atas masalah lingkungan nyata.',
                'Google Vibe Coding Event 2026 — This platform was built entirely with AI-assisted coding as proof that technology can accelerate solutions to real environmental problems.'
              )}
            </p>
            <Link
              href="/identify"
              className="inline-flex items-center px-8 py-4 bg-gray-900 text-white font-bold uppercase tracking-widest hover:bg-gray-800 transition-colors"
            >
              {t('Mulai Identifikasi', 'Start Identification')}
              <ArrowRight className="w-5 h-5 ml-3" />
            </Link>
          </div>
        </section>

      </div>
    </div>
  );
}
