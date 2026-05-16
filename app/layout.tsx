import type {Metadata} from 'next';
import './globals.css';
import { LanguageProvider } from '@/components/LanguageContext';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { Chatbot } from '@/components/Chatbot';
import { QuickReportFAB } from '@/components/QuickReportFAB';
import { BottomNav } from '@/components/BottomNav';
import { OfflineBanner } from '@/components/OfflineBanner';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import Script from 'next/script';

export const metadata: Metadata = {
  metadataBase: new URL(process.env.APP_URL || 'http://localhost:3000'),
  title: 'SiJaga Sungai — Platform Citizen Science Spesies Invasif',
  description: 'Identifikasi ikan invasif dengan AI, laporkan ke Peta Nasional, dan temukan nilai ekonomi tangkapanmu. Satu Foto. Tiga Dampak.',
  manifest: '/manifest.json',
  openGraph: {
    title: 'SiJaga Sungai — Satu Foto. Tiga Dampak.',
    description: 'Platform citizen science berbasis AI untuk identifikasi dan pelaporan spesies ikan invasif di perairan Indonesia.',
    images: [{ url: '/images/og-image.png', width: 1200, height: 630, alt: 'SiJaga Sungai' }],
    type: 'website',
    locale: 'id_ID',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'SiJaga Sungai — Satu Foto. Tiga Dampak.',
    description: 'Platform citizen science berbasis AI untuk identifikasi dan pelaporan spesies ikan invasif di perairan Indonesia.',
    images: ['/images/og-image.png'],
  },
};

export default function RootLayout({children}: {children: React.ReactNode}) {
  return (
    <html lang="id" className="font-sans" suppressHydrationWarning>
      <head>
        <Script src="https://www.googletagmanager.com/gtag/js?id=G-04FYQ8KPWP" strategy="afterInteractive" />
        <Script id="ga4-init" strategy="afterInteractive">{`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', 'G-04FYQ8KPWP');
        `}</Script>
      </head>
      <body suppressHydrationWarning className="flex flex-col min-h-screen text-gray-900 bg-[#fafaf8]">
        <LanguageProvider>
          <Navbar />
          <OfflineBanner />
          <main className="flex-grow pb-16 md:pb-0">
            {children}
          </main>
          <QuickReportFAB />
          <BottomNav />
          <ErrorBoundary componentName="Chatbot">
            <Chatbot />
          </ErrorBoundary>
          <Footer />
        </LanguageProvider>
      </body>
    </html>
  );
}
