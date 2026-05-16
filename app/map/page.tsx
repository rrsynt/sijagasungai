'use client';

import { Suspense, useState, useEffect } from 'react';
import { useLanguage } from '@/components/LanguageContext';
import dynamic from 'next/dynamic';
import { ReportModal } from '@/components/map/ReportModal';
import { Map, Plus, TrendingUp, Maximize2, Minimize2 } from 'lucide-react';
import { useSearchParams } from 'next/navigation';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import Link from 'next/link';

const ReportMap = dynamic(() => import('@/components/map/ReportMap').then(mod => mod.ReportMap), {
  ssr: false,
  loading: () => <LoadingSpinner text="Memuat Peta..." />
});

function MapContent() {
  const { t } = useLanguage();
  const searchParams = useSearchParams();
  const [showModal, setShowModal] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [trend, setTrend] = useState<Array<{month: string; count: number}>>([]);
  const [presentationMode, setPresentationMode] = useState(false);

  // Must run in useEffect — not lazy initializer — to avoid SSR/client hydration mismatch
  useEffect(() => {
    if (searchParams.get('report') || searchParams.get('open') === 'report') {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setShowModal(true);
    }
  }, [searchParams]);

  useEffect(() => {
    fetch('/api/reports/trend')
      .then(r => r.json())
      .then(d => { if (d.trend) setTrend(d.trend); })
      .catch(() => {});
  }, []);

  return (
    <div
      className="flex flex-col bg-gray-50 relative"
      style={{ height: presentationMode ? '100vh' : 'calc(100vh - 64px)' }}
    >
      {!presentationMode && (
        <div className="bg-white border-b border-gray-200 px-4 sm:px-6 lg:px-8 py-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 shrink-0 shadow-sm z-10">
          <div>
            <h1 className="text-2xl font-extrabold text-gray-900 flex items-center">
              <Map className="w-6 h-6 mr-3 text-secondary-air" />
              {t('Peta Persebaran Invasif', 'Invasive Distribution Map')}
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              {t('Data laporan citizen science di seluruh Indonesia.', 'Citizen science report data across Indonesia.')}
            </p>
          </div>
          
          <div className="flex items-center gap-3 w-full sm:w-auto">
            {trend.length > 0 && (
              <div className="hidden md:flex items-end gap-1 h-8 bg-gray-50 border border-gray-100 rounded-xl px-3 py-1.5" title={t('Tren laporan 6 bulan terakhir', 'Reports trend last 6 months')}>
                <TrendingUp className="w-3.5 h-3.5 text-gray-400 mr-1 self-center" />
                {trend.map((d, i) => {
                  const max = Math.max(...trend.map(x => x.count), 1);
                  const h = Math.max((d.count / max) * 20, 2);
                  return (
                    <div key={i} title={`${d.month}: ${d.count}`} className="flex flex-col items-center gap-0.5">
                      <div className="w-3 bg-primary-sunai rounded-sm transition-all" style={{ height: `${h}px` }} />
                      {i === trend.length - 1 && <span className="text-[9px] text-gray-400">{d.month}</span>}
                    </div>
                  );
                })}
              </div>
            )}
            <Link href="/prevention" className="hidden sm:flex items-center gap-1.5 px-3 py-2 text-sm font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-xl hover:bg-emerald-100 transition-colors">
              🛡️ {t('Pencegahan', 'Prevention')}
            </Link>
            <button
              onClick={() => setPresentationMode(true)}
              className="flex items-center gap-2 px-3 py-2 text-sm font-semibold text-gray-600 bg-gray-50 border border-gray-200 rounded-xl hover:bg-gray-100 transition-colors"
              title="Mode Presentasi — sembunyikan semua UI, tampilkan peta fullscreen"
            >
              <Maximize2 className="w-4 h-4" />
              <span className="hidden sm:inline">Presentasi</span>
            </button>
            <button
              onClick={() => setShowModal(true)}
              className="flex-1 sm:flex-none justify-center items-center px-4 py-2 border border-transparent rounded-xl shadow-sm text-sm font-bold text-white bg-primary-sunai hover:bg-primary-sunai/90 transition-colors flex h-10"
            >
               <Plus className="w-4 h-4 mr-2 shrink-0" />
               {t('Tambah Laporan', 'Add Report')}
            </button>
          </div>
        </div>
      )}

      {/* Presentation mode: floating exit button */}
      {presentationMode && (
        <button
          onClick={() => setPresentationMode(false)}
          className="absolute top-4 right-4 z-50 flex items-center gap-2 px-3 py-2 text-sm font-semibold text-white bg-gray-900/70 backdrop-blur-sm border border-white/20 rounded-xl hover:bg-gray-900/90 transition-colors"
        >
          <Minimize2 className="w-4 h-4" /> Keluar Presentasi
        </button>
      )}

      <div className="flex-1 relative p-4 sm:p-6 lg:p-8">
        <ReportMap key={refreshKey} />
      </div>

      {showModal && (
        <ReportModal 
          onClose={() => setShowModal(false)} 
          onSuccess={() => setRefreshKey(k => k + 1)} 
        />
      )}
    </div>
  );
}

export default function MapPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <MapContent />
    </Suspense>
  );
}
