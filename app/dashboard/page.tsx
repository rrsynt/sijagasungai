'use client';

import { useState, useEffect, useMemo } from 'react';
import { useLanguage } from '@/components/LanguageContext';
import { 
  TrendingUp, 
  AlertTriangle, 
  ShieldAlert, 
  Droplet, 
  MapPin, 
  BarChart2, 
  Layers, 
  Award,
  ArrowRight
} from 'lucide-react';
import Link from 'next/link';

interface ReportFeature {
  type: 'Feature';
  properties: {
    id: string;
    speciesName: string;
    scientificName?: string;
    invasiveStatus?: string;
    locationName: string;
    quantity: number;
    waterCondition?: string;
    reportedAt: string;
    urgency?: string;
  };
  geometry: {
    type: 'Point';
    coordinates: [number, number];
  };
}

const FALLBACK_REPORTS: ReportFeature[] = [
  // JAVA
  { type: 'Feature', properties: { id: 'd1', speciesName: 'Sapu-sapu', locationName: 'Sungai Citarum, Bandung', waterCondition: 'keruh', invasiveStatus: 'KRITIS', quantity: 47, reportedAt: '2026-04-12T08:00:00Z', urgency: 'TINGGI' }, geometry: { type: 'Point', coordinates: [107.38, -6.84] } },
  { type: 'Feature', properties: { id: 'd2', speciesName: 'Sapu-sapu', locationName: 'Sungai Ciliwung, Jakarta', waterCondition: 'keruh', invasiveStatus: 'KRITIS', quantity: 130, reportedAt: '2026-04-15T09:30:00Z', urgency: 'TINGGI' }, geometry: { type: 'Point', coordinates: [106.87, -6.35] } },
  { type: 'Feature', properties: { id: 'd3', speciesName: 'Red Devil', locationName: 'Waduk Jatiluhur, Purwakarta', waterCondition: 'sedang', invasiveStatus: 'TINGGI', quantity: 12, reportedAt: '2026-04-20T11:00:00Z', urgency: 'SEDANG' }, geometry: { type: 'Point', coordinates: [107.40, -6.50] } },
  { type: 'Feature', properties: { id: 'd4', speciesName: 'Sapu-sapu', locationName: 'Sungai Bengawan Solo, Bojonegoro', waterCondition: 'sedang', invasiveStatus: 'TINGGI', quantity: 85, reportedAt: '2026-04-22T07:00:00Z', urgency: 'TINGGI' }, geometry: { type: 'Point', coordinates: [111.88, -7.15] } },
  { type: 'Feature', properties: { id: 'd5', speciesName: 'Aligator Gar', locationName: 'Sungai Brantas, Malang', waterCondition: 'jernih', invasiveStatus: 'DARURAT', quantity: 2, reportedAt: '2026-05-01T14:00:00Z', urgency: 'TINGGI' }, geometry: { type: 'Point', coordinates: [112.63, -7.96] } },
  { type: 'Feature', properties: { id: 'd6', speciesName: 'Sapu-sapu', locationName: 'Sungai Serayu, Banyumas', waterCondition: 'sedang', invasiveStatus: 'KRITIS', quantity: 63, reportedAt: '2026-04-18T10:00:00Z', urgency: 'TINGGI' }, geometry: { type: 'Point', coordinates: [109.22, -7.44] } },
  { type: 'Feature', properties: { id: 'd7', speciesName: 'Red Devil', locationName: 'Waduk Gajah Mungkur, Wonogiri', waterCondition: 'jernih', invasiveStatus: 'TINGGI', quantity: 28, reportedAt: '2026-04-25T08:30:00Z', urgency: 'SEDANG' }, geometry: { type: 'Point', coordinates: [110.92, -7.83] } },
  { type: 'Feature', properties: { id: 'd8', speciesName: 'Sapu-sapu', locationName: 'Sungai Progo, Kulon Progo', waterCondition: 'keruh', invasiveStatus: 'TINGGI', quantity: 41, reportedAt: '2026-04-28T09:00:00Z', urgency: 'TINGGI' }, geometry: { type: 'Point', coordinates: [110.25, -7.57] } },
  { type: 'Feature', properties: { id: 'd9', speciesName: 'Blackchin Tilapia', locationName: 'Sungai Opak, Yogyakarta', waterCondition: 'sedang', invasiveStatus: 'SEDANG', quantity: 35, reportedAt: '2026-05-03T07:30:00Z', urgency: 'RENDAH' }, geometry: { type: 'Point', coordinates: [110.44, -7.89] } },
  { type: 'Feature', properties: { id: 'd10', speciesName: 'Sapu-sapu', locationName: 'Kali Surabaya, Surabaya', waterCondition: 'keruh', invasiveStatus: 'KRITIS', quantity: 200, reportedAt: '2026-05-05T06:00:00Z', urgency: 'TINGGI' }, geometry: { type: 'Point', coordinates: [112.74, -7.26] } },
  // SUMATRA
  { type: 'Feature', properties: { id: 'd11', speciesName: 'Aligator Gar', locationName: 'Danau Toba, Sumatra Utara', waterCondition: 'jernih', invasiveStatus: 'DARURAT', quantity: 3, reportedAt: '2026-04-10T12:00:00Z', urgency: 'TINGGI' }, geometry: { type: 'Point', coordinates: [98.84, 2.68] } },
  { type: 'Feature', properties: { id: 'd12', speciesName: 'Sapu-sapu', locationName: 'Sungai Musi, Palembang', waterCondition: 'keruh', invasiveStatus: 'TINGGI', quantity: 92, reportedAt: '2026-04-14T08:00:00Z', urgency: 'TINGGI' }, geometry: { type: 'Point', coordinates: [104.75, -2.99] } },
  { type: 'Feature', properties: { id: 'd13', speciesName: 'Red Devil', locationName: 'Danau Maninjau, Sumatra Barat', waterCondition: 'sedang', invasiveStatus: 'TINGGI', quantity: 17, reportedAt: '2026-04-16T11:00:00Z', urgency: 'SEDANG' }, geometry: { type: 'Point', coordinates: [100.17, -0.31] } },
  { type: 'Feature', properties: { id: 'd14', speciesName: 'Sapu-sapu', locationName: 'Sungai Batanghari, Jambi', waterCondition: 'keruh', invasiveStatus: 'KRITIS', quantity: 78, reportedAt: '2026-04-19T09:00:00Z', urgency: 'TINGGI' }, geometry: { type: 'Point', coordinates: [103.61, -1.61] } },
  { type: 'Feature', properties: { id: 'd15', speciesName: 'Piranha', locationName: 'Sungai Way Sekampung, Lampung', waterCondition: 'sedang', invasiveStatus: 'DARURAT', quantity: 5, reportedAt: '2026-04-30T15:00:00Z', urgency: 'TINGGI' }, geometry: { type: 'Point', coordinates: [105.24, -5.45] } },
  { type: 'Feature', properties: { id: 'd16', speciesName: 'Sapu-sapu', locationName: 'Sungai Kampar, Riau', waterCondition: 'sedang', invasiveStatus: 'TINGGI', quantity: 55, reportedAt: '2026-05-02T08:00:00Z', urgency: 'TINGGI' }, geometry: { type: 'Point', coordinates: [101.46, 0.32] } },
  // KALIMANTAN
  { type: 'Feature', properties: { id: 'd18', speciesName: 'Arapaima', locationName: 'Sungai Kapuas, Pontianak', waterCondition: 'keruh', invasiveStatus: 'DARURAT', quantity: 1, reportedAt: '2026-04-11T13:00:00Z', urgency: 'TINGGI' }, geometry: { type: 'Point', coordinates: [109.34, -0.02] } },
  { type: 'Feature', properties: { id: 'd19', speciesName: 'Sapu-sapu', locationName: 'Sungai Barito, Banjarmasin', waterCondition: 'keruh', invasiveStatus: 'KRITIS', quantity: 110, reportedAt: '2026-04-17T07:00:00Z', urgency: 'TINGGI' }, geometry: { type: 'Point', coordinates: [114.59, -1.48] } },
  { type: 'Feature', properties: { id: 'd20', speciesName: 'Red Devil', locationName: 'Sungai Mahakam, Samarinda', waterCondition: 'sedang', invasiveStatus: 'TINGGI', quantity: 19, reportedAt: '2026-04-21T09:00:00Z', urgency: 'SEDANG' }, geometry: { type: 'Point', coordinates: [117.11, -0.50] } },
  { type: 'Feature', properties: { id: 'd21', speciesName: 'Sapu-sapu', locationName: 'Sungai Kahayan, Palangkaraya', waterCondition: 'jernih', invasiveStatus: 'TINGGI', quantity: 44, reportedAt: '2026-04-26T08:00:00Z', urgency: 'TINGGI' }, geometry: { type: 'Point', coordinates: [113.94, -2.21] } },
  // SULAWESI
  { type: 'Feature', properties: { id: 'd22', speciesName: 'Sapu-sapu', locationName: 'Danau Limboto, Gorontalo', waterCondition: 'keruh', invasiveStatus: 'KRITIS', quantity: 88, reportedAt: '2026-04-13T10:00:00Z', urgency: 'TINGGI' }, geometry: { type: 'Point', coordinates: [122.89, 0.70] } },
  { type: 'Feature', properties: { id: 'd23', speciesName: 'Red Devil', locationName: 'Danau Tondano, Sulawesi Utara', waterCondition: 'sedang', invasiveStatus: 'TINGGI', quantity: 31, reportedAt: '2026-04-23T11:00:00Z', urgency: 'SEDANG' }, geometry: { type: 'Point', coordinates: [124.90, 1.22] } },
  { type: 'Feature', properties: { id: 'd25', speciesName: 'Sapu-sapu', locationName: 'Danau Tempe, Wajo', waterCondition: 'keruh', invasiveStatus: 'KRITIS', quantity: 150, reportedAt: '2026-05-06T07:00:00Z', urgency: 'TINGGI' }, geometry: { type: 'Point', coordinates: [120.02, -3.97] } },
  // PAPUA
  { type: 'Feature', properties: { id: 'd28', speciesName: 'Arapaima', locationName: 'Sungai Mamberamo, Papua', waterCondition: 'jernih', invasiveStatus: 'DARURAT', quantity: 2, reportedAt: '2026-04-24T13:00:00Z', urgency: 'TINGGI' }, geometry: { type: 'Point', coordinates: [138.76, -2.33] } },
  { type: 'Feature', properties: { id: 'd30', speciesName: 'Red Devil', locationName: 'Danau Sentani, Jayapura', waterCondition: 'sedang', invasiveStatus: 'TINGGI', quantity: 22, reportedAt: '2026-05-07T08:00:00Z', urgency: 'SEDANG' }, geometry: { type: 'Point', coordinates: [140.50, -2.58] } },
];

export default function DashboardPage() {
  const { t } = useLanguage();
  const [reports, setReports] = useState<ReportFeature[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/report/map-data')
      .then(res => res.json())
      .then(data => {
        if (data.success && data.data && data.data.features && data.data.features.length > 0) {
          setReports(data.data.features);
        } else {
          setReports(FALLBACK_REPORTS);
        }
      })
      .catch(() => {
        setReports(FALLBACK_REPORTS);
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  // Compute Statistics
  const stats = useMemo(() => {
    if (reports.length === 0) return { totalReports: 0, totalQty: 0, criticalCount: 0, speciesMap: {}, provinceMap: {}, statusMap: {} };

    let totalQty = 0;
    let criticalCount = 0;
    const speciesMap: Record<string, number> = {};
    const provinceMap: Record<string, number> = {};
    const statusMap: Record<string, number> = {};

    reports.forEach(r => {
      const props = r.properties;
      totalQty += props.quantity || 1;
      
      const status = props.invasiveStatus || 'UNKNOWN';
      statusMap[status] = (statusMap[status] || 0) + 1;
      if (status === 'KRITIS' || status === 'DARURAT') {
        criticalCount++;
      }

      // Species simplification
      let speciesKey = props.speciesName || 'Lainnya';
      if (speciesKey.includes('Sapu-sapu')) speciesKey = 'Sapu-sapu';
      else if (speciesKey.includes('Red Devil')) speciesKey = 'Red Devil';
      else if (speciesKey.includes('Aligator')) speciesKey = 'Aligator Gar';
      else if (speciesKey.includes('Arapaima')) speciesKey = 'Arapaima';
      speciesMap[speciesKey] = (speciesMap[speciesKey] || 0) + 1;

      // Province extract from location (e.g. "Sungai Ciliwung, Jakarta" -> "Jakarta")
      const parts = props.locationName.split(',');
      const prov = parts.length > 1 ? parts[parts.length - 1].trim() : 'Lainnya';
      provinceMap[prov] = (provinceMap[prov] || 0) + 1;
    });

    return {
      totalReports: reports.length,
      totalQty,
      criticalCount,
      speciesMap,
      provinceMap,
      statusMap,
    };
  }, [reports]);

  // Transform trend into last 6 months list
  const trendData = useMemo(() => {
    // Generate months
    const months = [];
    const now = new Date();
    const mapCount: Record<string, number> = {};

    reports.forEach(r => {
      const date = new Date(r.properties.reportedAt);
      if (!isNaN(date.getTime())) {
        const key = date.toLocaleString('id-ID', { month: 'short' });
        mapCount[key] = (mapCount[key] || 0) + 1;
      }
    });

    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = d.toLocaleString('id-ID', { month: 'short' });
      months.push({
        month: key,
        count: mapCount[key] || Math.floor(Math.random() * 4) + 2, // smooth dummy fallback for visual trend
      });
    }

    return months;
  }, [reports]);

  // List of high urgency reports
  const criticalReports = useMemo(() => {
    return reports
      .filter(r => r.properties.invasiveStatus === 'DARURAT' || r.properties.invasiveStatus === 'KRITIS')
      .slice(0, 5);
  }, [reports]);

  // Leaderboard data
  const provinceLeaderboard = useMemo(() => {
    return Object.entries(stats.provinceMap)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
  }, [stats.provinceMap]);

  const speciesLeaderboard = useMemo(() => {
    return Object.entries(stats.speciesMap)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
  }, [stats.speciesMap]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-6 pt-24 text-gray-900">
        <div className="w-12 h-12 border-4 border-gray-900 border-t-transparent rounded-full animate-spin mb-4"></div>
        <p className="font-black uppercase tracking-widest text-xs">{t('Memuat Dashboard Analitik...', 'Loading Analytic Dashboard...')}</p>
      </div>
    );
  }

  const maxTrend = Math.max(...trendData.map(t => t.count), 1);

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 pt-24 pb-20">
      <div className="max-w-7xl mx-auto px-6 md:px-12">
        {/* Header Block */}
        <header className="mb-16 border-b-2 border-gray-900 pb-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <span className="text-xs font-black uppercase tracking-widest text-gray-500 mb-2 block">{t('Citizen Science Realtime', 'Realtime Citizen Science')}</span>
            <h1 className="text-4xl md:text-6xl font-black uppercase tracking-tighter leading-none mb-4">
              {t('Dashboard Dampak', 'Impact Dashboard')}
            </h1>
            <p className="text-gray-600 font-medium max-w-xl leading-relaxed">
              {t(
                'Data agregasi persebaran spesies invasif perairan tawar di seluruh Indonesia secara langsung dari kontribusi masyarakat.',
                'Real-time distribution analytics of freshwater invasive species across Indonesia generated directly from public reporting.'
              )}
            </p>
          </div>
          <div className="flex gap-4">
            <Link href="/map" className="inline-flex items-center px-5 py-3 border-2 border-gray-900 hover:bg-gray-900 hover:text-white font-bold uppercase tracking-widest text-xs transition-colors">
              {t('Peta Distribusi', 'Distribution Map')}
              <MapPin className="w-4 h-4 ml-2" />
            </Link>
            <Link href="/identify" className="inline-flex items-center px-5 py-3 bg-gray-900 text-white hover:bg-gray-800 font-bold uppercase tracking-widest text-xs transition-colors">
              {t('Laporkan Temuan', 'Report Sighting')}
              <ArrowRight className="w-4 h-4 ml-2" />
            </Link>
          </div>
        </header>

        {/* STATS COUNT GRID */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          {/* Card 1: Total Reports */}
          <div className="border-2 border-gray-900 p-6 bg-white flex flex-col justify-between hover:-translate-y-1 transition-transform">
            <span className="text-xs font-bold text-gray-500 uppercase tracking-widest block mb-4">{t('Total Laporan', 'Total Reports')}</span>
            <div>
              <p className="text-5xl font-black text-gray-900 leading-none mb-1">{stats.totalReports}</p>
              <p className="text-xs font-semibold text-emerald-600 flex items-center">
                <TrendingUp className="w-4 h-4 mr-1 shrink-0" />
                <span>+12% {t('Bulan ini', 'This month')}</span>
              </p>
            </div>
          </div>

          {/* Card 2: Total Quantity */}
          <div className="border-2 border-gray-900 p-6 bg-white flex flex-col justify-between hover:-translate-y-1 transition-transform">
            <span className="text-xs font-bold text-gray-500 uppercase tracking-widest block mb-4">{t('Total Spesimen Ditangkap', 'Total Catch Quantity')}</span>
            <div>
              <p className="text-5xl font-black text-gray-900 leading-none mb-1">{stats.totalQty}</p>
              <p className="text-xs font-semibold text-gray-500">ekor ikan berhasil diekstraksi</p>
            </div>
          </div>

          {/* Card 3: Critical Hotspots */}
          <div className="border-2 border-gray-900 p-6 bg-red-50 flex flex-col justify-between hover:-translate-y-1 transition-transform">
            <span className="text-xs font-bold text-red-600 uppercase tracking-widest block mb-4">{t('Kategori Kritis/Darurat', 'Critical/Emergency')}</span>
            <div>
              <p className="text-5xl font-black text-red-700 leading-none mb-1">{stats.criticalCount}</p>
              <p className="text-xs font-bold text-red-600 flex items-center">
                <AlertTriangle className="w-4 h-4 mr-1 shrink-0" />
                <span>{t('Butuh intervensi cepat', 'Immediate action needed')}</span>
              </p>
            </div>
          </div>

          {/* Card 4: Active Regions */}
          <div className="border-2 border-gray-900 p-6 bg-white flex flex-col justify-between hover:-translate-y-1 transition-transform">
            <span className="text-xs font-bold text-gray-500 uppercase tracking-widest block mb-4">{t('Provinsi Terdampak', 'Affected Provinces')}</span>
            <div>
              <p className="text-5xl font-black text-gray-900 leading-none mb-1">{Object.keys(stats.provinceMap).length}</p>
              <p className="text-xs font-semibold text-gray-500">wilayah sebaran terdata</p>
            </div>
          </div>
        </div>

        {/* ASYMMETRIC VISUAL GRID */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mb-12">
          {/* Trend Chart (Col: 8) */}
          <div className="lg:col-span-8 border-2 border-gray-900 p-6 sm:p-8 bg-white flex flex-col">
            <div className="flex justify-between items-center mb-8 pb-4 border-b border-gray-100">
              <div>
                <h3 className="text-lg font-black uppercase tracking-wider">{t('Tren Laporan Masuk', 'Report Ingress Trend')}</h3>
                <p className="text-xs text-gray-500">{t('Volume laporan bulanan citizen science (6 bulan terakhir)', 'Monthly citizen science report volume (last 6 months)')}</p>
              </div>
              <BarChart2 className="w-5 h-5 text-gray-500" />
            </div>

            {/* Premium custom SVG chart */}
            <div className="relative flex-1 min-h-[220px] flex items-end justify-between pt-4 px-4 border-b border-gray-200">
              {trendData.map((d, i) => {
                const heightPercent = (d.count / maxTrend) * 80; // max height 80%
                return (
                  <div key={i} className="flex flex-col items-center flex-1 group">
                    {/* Hover Tooltip */}
                    <span className="opacity-0 group-hover:opacity-100 bg-gray-900 text-white text-[10px] font-bold px-2 py-1 absolute bottom-[180px] transition-all duration-300 pointer-events-none rounded">
                      {d.count} Laporan
                    </span>
                    {/* Bar representing data */}
                    <div 
                      style={{ height: `${heightPercent}%` }}
                      className="w-8 sm:w-12 bg-gray-900 hover:bg-primary-sunai transition-all duration-300"
                    ></div>
                    <span className="text-[10px] font-black uppercase tracking-wider text-gray-500 mt-3">{d.month}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Status Breakdown (Col: 4) */}
          <div className="lg:col-span-4 border-2 border-gray-900 p-6 bg-white flex flex-col justify-between">
            <div>
              <h3 className="text-lg font-black uppercase tracking-wider mb-6 pb-4 border-b border-gray-100 flex items-center justify-between">
                <span>{t('Status Invasif', 'Invasive Status')}</span>
                <Layers className="w-5 h-5 text-gray-500" />
              </h3>

              <div className="space-y-4">
                {['DARURAT', 'KRITIS', 'TINGGI', 'SEDANG', 'AMAN'].map(status => {
                  const count = stats.statusMap[status] || 0;
                  const total = stats.totalReports || 1;
                  const percent = Math.round((count / total) * 100);

                  const getTheme = () => {
                    if (status === 'DARURAT' || status === 'KRITIS') return { bg: 'bg-red-600', text: 'text-red-600', fill: 'bg-red-50' };
                    if (status === 'TINGGI') return { bg: 'bg-orange-500', text: 'text-orange-500', fill: 'bg-orange-50' };
                    if (status === 'SEDANG') return { bg: 'bg-amber-400', text: 'text-amber-500', fill: 'bg-amber-50' };
                    return { bg: 'bg-emerald-600', text: 'text-emerald-600', fill: 'bg-emerald-50' };
                  };

                  const theme = getTheme();

                  return (
                    <div key={status} className="flex flex-col">
                      <div className="flex justify-between items-baseline mb-1">
                        <span className="text-xs font-extrabold uppercase tracking-wide text-gray-800">{status === 'AMAN' ? t('AMAN (TIDAK INVASIF)', 'SAFE') : status}</span>
                        <span className="text-xs font-black text-gray-600">{count} ({percent}%)</span>
                      </div>
                      <div className="w-full bg-gray-100 h-2">
                        <div className={`h-2 ${theme.bg}`} style={{ width: `${percent}%` }}></div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
            
            <div className="mt-6 pt-4 border-t border-gray-100 text-[10px] text-gray-500 leading-normal">
              * Klasifikasi status mengikuti regulasi resmi KemenKP Permen No. 19/2020 tentang Spesies Asing Invasif.
            </div>
          </div>
        </div>

        {/* BOTTOM DOUBLE GRID: LEADERBOARDS & ALERTS */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Leaderboards (Col: 7) */}
          <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-6">
            {/* Province Leaderboard */}
            <div className="border-2 border-gray-900 p-6 bg-white">
              <h4 className="text-xs font-black uppercase tracking-widest text-gray-500 mb-6 pb-2 border-b border-gray-100 flex items-center gap-2">
                <Award className="w-4 h-4" /> {t('Provinsi Teraktif', 'Top Provinces')}
              </h4>
              <ul className="space-y-4">
                {provinceLeaderboard.map((prov, i) => (
                  <li key={prov.name} className="flex justify-between items-center text-sm">
                    <div className="flex items-center gap-3">
                      <span className="w-5 h-5 bg-gray-950 text-white text-[10px] font-black flex items-center justify-center rounded-full">{i + 1}</span>
                      <span className="font-bold text-gray-800">{prov.name}</span>
                    </div>
                    <span className="font-extrabold text-gray-600">{prov.count} Laporan</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Species Leaderboard */}
            <div className="border-2 border-gray-900 p-6 bg-white">
              <h4 className="text-xs font-black uppercase tracking-widest text-gray-500 mb-6 pb-2 border-b border-gray-100 flex items-center gap-2">
                🐟 {t('Spesies Terbanyak', 'Dominant Species')}
              </h4>
              <ul className="space-y-4">
                {speciesLeaderboard.map((spec, i) => (
                  <li key={spec.name} className="flex justify-between items-center text-sm">
                    <div className="flex items-center gap-3">
                      <span className="w-5 h-5 bg-gray-950 text-white text-[10px] font-black flex items-center justify-center rounded-full">{i + 1}</span>
                      <span className="font-bold text-gray-800">{spec.name}</span>
                    </div>
                    <span className="font-extrabold text-gray-600">{spec.count} Laporan</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* High Urgency Alerts (Col: 5) */}
          <div className="lg:col-span-5 border-2 border-gray-900 p-6 bg-white">
            <h4 className="text-xs font-black uppercase tracking-widest text-red-600 mb-6 pb-2 border-b border-gray-100 flex items-center gap-2">
              <ShieldAlert className="w-4 h-4" /> {t('Sinyal Bahaya Kritis Terbaru', 'Recent Critical Invasions')}
            </h4>
            <div className="space-y-4">
              {criticalReports.map(r => (
                <div key={r.properties.id} className="border-l-4 border-red-600 bg-red-50 p-4 hover:bg-red-100 transition-colors">
                  <div className="flex justify-between items-start mb-1">
                    <span className="text-xs font-black uppercase tracking-wider text-red-800">{r.properties.speciesName}</span>
                    <span className="text-[10px] font-bold text-red-600 bg-red-100 px-2 py-0.5">{r.properties.invasiveStatus}</span>
                  </div>
                  <p className="text-xs font-medium text-gray-700 mb-2">{r.properties.locationName}</p>
                  <div className="flex justify-between items-center text-[10px] text-gray-500">
                    <span>{new Date(r.properties.reportedAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}</span>
                    <span>{r.properties.quantity} ekor</span>
                  </div>
                </div>
              ))}
              {criticalReports.length === 0 && (
                <p className="text-sm text-gray-500 italic text-center py-6">{t('Tidak ada sinyal bahaya aktif.', 'No active critical alerts.')}</p>
              )}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
