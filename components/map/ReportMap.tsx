'use client';

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { GoogleMap, useJsApiLoader, MarkerClusterer, Marker, InfoWindow } from '@react-google-maps/api';
import { LoadingSpinner } from '../ui/LoadingSpinner';
import { Badge } from '../ui/Badge';
import { useLanguage } from '../LanguageContext';
import { SPECIES_DATABASE } from '@/lib/species-database';

const containerStyle = {
  width: '100%',
  height: '100%'
};

const center = {
  lat: -2.5489,
  lng: 118.0149
};

// Fish SVG marker icon generator — color-coded by invasive status
function createFishMarkerIcon(status: string): google.maps.Icon {
  const configs: Record<string, { fill: string; stroke: string; size: number }> = {
    DARURAT: { fill: '#7F1D1D', stroke: '#FCA5A5', size: 44 },
    KRITIS:  { fill: '#DC2626', stroke: '#FECACA', size: 38 },
    TINGGI:  { fill: '#EA580C', stroke: '#FED7AA', size: 34 },
    SEDANG:  { fill: '#D97706', stroke: '#FDE68A', size: 30 },
    RENDAH:  { fill: '#16A34A', stroke: '#BBF7D0', size: 28 },
  };
  const cfg = configs[status] ?? { fill: '#0D9488', stroke: '#99F6E4', size: 28 };
  const s = cfg.size;
  // Proportional fish SVG viewBox 0 0 48 32
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 32" width="${s}" height="${Math.round(s * 0.67)}">
    <!-- Tail -->
    <polygon points="38,16 48,6 48,26" fill="${cfg.fill}" opacity="0.85"/>
    <!-- Body -->
    <ellipse cx="20" cy="16" rx="18" ry="11" fill="${cfg.fill}" stroke="${cfg.stroke}" stroke-width="2"/>
    <!-- Fin top -->
    <path d="M14,5 Q20,0 26,7" fill="none" stroke="${cfg.stroke}" stroke-width="1.5" stroke-linecap="round"/>
    <!-- Eye -->
    <circle cx="7" cy="13" r="3.5" fill="white"/>
    <circle cx="7" cy="13" r="1.8" fill="#1e293b"/>
    <!-- Status dot (pulse for DARURAT) -->
    <circle cx="20" cy="16" r="4" fill="white" opacity="0.25"/>
  </svg>`;
  return {
    url: `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`,
    scaledSize: new google.maps.Size(s, Math.round(s * 0.67)),
    anchor: new google.maps.Point(s / 2, Math.round(s * 0.67) / 2),
  };
}

interface ReportFeature {
  type: 'Feature';
  properties: {
    id: string;
    speciesName: string;
    locationName: string;
    waterCondition: string;
    invasiveStatus: string;
    quantity: number;
    reportedAt: string;
    imageUrl?: string | null;
  };
  geometry: {
    type: 'Point';
    coordinates: [number, number]; // [lng, lat]
  };
}


const DEMO_REPORTS: ReportFeature[] = [
  // JAVA
  { type: 'Feature', properties: { id: 'd1', speciesName: 'Sapu-sapu (Pterygoplichthys)', locationName: 'Sungai Citarum, Bandung', waterCondition: 'keruh', invasiveStatus: 'KRITIS', quantity: 47, reportedAt: '2025-04-12T08:00:00Z' }, geometry: { type: 'Point', coordinates: [107.38, -6.84] } },
  { type: 'Feature', properties: { id: 'd2', speciesName: 'Sapu-sapu (Pterygoplichthys)', locationName: 'Sungai Ciliwung, Jakarta', waterCondition: 'keruh', invasiveStatus: 'KRITIS', quantity: 130, reportedAt: '2025-04-15T09:30:00Z' }, geometry: { type: 'Point', coordinates: [106.87, -6.35] } },
  { type: 'Feature', properties: { id: 'd3', speciesName: 'Red Devil (Amphilophus labiatus)', locationName: 'Waduk Jatiluhur, Purwakarta', waterCondition: 'sedang', invasiveStatus: 'TINGGI', quantity: 12, reportedAt: '2025-04-20T11:00:00Z' }, geometry: { type: 'Point', coordinates: [107.40, -6.50] } },
  { type: 'Feature', properties: { id: 'd4', speciesName: 'Sapu-sapu (Pterygoplichthys)', locationName: 'Sungai Bengawan Solo, Bojonegoro', waterCondition: 'sedang', invasiveStatus: 'TINGGI', quantity: 85, reportedAt: '2025-04-22T07:00:00Z' }, geometry: { type: 'Point', coordinates: [111.88, -7.15] } },
  { type: 'Feature', properties: { id: 'd5', speciesName: 'Aligator Gar (Atractosteus spatula)', locationName: 'Sungai Brantas, Malang', waterCondition: 'jernih', invasiveStatus: 'DARURAT', quantity: 2, reportedAt: '2025-05-01T14:00:00Z' }, geometry: { type: 'Point', coordinates: [112.63, -7.96] } },
  { type: 'Feature', properties: { id: 'd6', speciesName: 'Sapu-sapu (Pterygoplichthys)', locationName: 'Sungai Serayu, Banyumas', waterCondition: 'sedang', invasiveStatus: 'KRITIS', quantity: 63, reportedAt: '2025-04-18T10:00:00Z' }, geometry: { type: 'Point', coordinates: [109.22, -7.44] } },
  { type: 'Feature', properties: { id: 'd7', speciesName: 'Red Devil (Amphilophus labiatus)', locationName: 'Waduk Gajah Mungkur, Wonogiri', waterCondition: 'jernih', invasiveStatus: 'TINGGI', quantity: 28, reportedAt: '2025-04-25T08:30:00Z' }, geometry: { type: 'Point', coordinates: [110.92, -7.83] } },
  { type: 'Feature', properties: { id: 'd8', speciesName: 'Sapu-sapu (Pterygoplichthys)', locationName: 'Sungai Progo, Kulon Progo', waterCondition: 'keruh', invasiveStatus: 'TINGGI', quantity: 41, reportedAt: '2025-04-28T09:00:00Z' }, geometry: { type: 'Point', coordinates: [110.25, -7.57] } },
  { type: 'Feature', properties: { id: 'd9', speciesName: 'Blackchin Tilapia (Sarotherodon melanotheron)', locationName: 'Sungai Opak, Yogyakarta', waterCondition: 'sedang', invasiveStatus: 'SEDANG', quantity: 35, reportedAt: '2025-05-03T07:30:00Z' }, geometry: { type: 'Point', coordinates: [110.44, -7.89] } },
  { type: 'Feature', properties: { id: 'd10', speciesName: 'Sapu-sapu (Pterygoplichthys)', locationName: 'Kali Surabaya, Surabaya', waterCondition: 'keruh', invasiveStatus: 'KRITIS', quantity: 200, reportedAt: '2025-05-05T06:00:00Z' }, geometry: { type: 'Point', coordinates: [112.74, -7.26] } },
  // SUMATRA
  { type: 'Feature', properties: { id: 'd11', speciesName: 'Aligator Gar (Atractosteus spatula)', locationName: 'Danau Toba, Sumatra Utara', waterCondition: 'jernih', invasiveStatus: 'DARURAT', quantity: 3, reportedAt: '2025-04-10T12:00:00Z' }, geometry: { type: 'Point', coordinates: [98.84, 2.68] } },
  { type: 'Feature', properties: { id: 'd12', speciesName: 'Sapu-sapu (Pterygoplichthys)', locationName: 'Sungai Musi, Palembang', waterCondition: 'keruh', invasiveStatus: 'TINGGI', quantity: 92, reportedAt: '2025-04-14T08:00:00Z' }, geometry: { type: 'Point', coordinates: [104.75, -2.99] } },
  { type: 'Feature', properties: { id: 'd13', speciesName: 'Red Devil (Amphilophus labiatus)', locationName: 'Danau Maninjau, Sumatra Barat', waterCondition: 'sedang', invasiveStatus: 'TINGGI', quantity: 17, reportedAt: '2025-04-16T11:00:00Z' }, geometry: { type: 'Point', coordinates: [100.17, -0.31] } },
  { type: 'Feature', properties: { id: 'd14', speciesName: 'Sapu-sapu (Pterygoplichthys)', locationName: 'Sungai Batanghari, Jambi', waterCondition: 'keruh', invasiveStatus: 'KRITIS', quantity: 78, reportedAt: '2025-04-19T09:00:00Z' }, geometry: { type: 'Point', coordinates: [103.61, -1.61] } },
  { type: 'Feature', properties: { id: 'd15', speciesName: 'Piranha (Pygocentrus nattereri)', locationName: 'Sungai Way Sekampung, Lampung', waterCondition: 'sedang', invasiveStatus: 'DARURAT', quantity: 5, reportedAt: '2025-04-30T15:00:00Z' }, geometry: { type: 'Point', coordinates: [105.24, -5.45] } },
  { type: 'Feature', properties: { id: 'd16', speciesName: 'Sapu-sapu (Pterygoplichthys)', locationName: 'Sungai Kampar, Riau', waterCondition: 'sedang', invasiveStatus: 'TINGGI', quantity: 55, reportedAt: '2025-05-02T08:00:00Z' }, geometry: { type: 'Point', coordinates: [101.46, 0.32] } },
  { type: 'Feature', properties: { id: 'd17', speciesName: 'Blackchin Tilapia (Sarotherodon melanotheron)', locationName: 'Danau Singkarak, Sumatra Barat', waterCondition: 'jernih', invasiveStatus: 'SEDANG', quantity: 23, reportedAt: '2025-05-04T10:00:00Z' }, geometry: { type: 'Point', coordinates: [100.55, -0.66] } },
  // KALIMANTAN
  { type: 'Feature', properties: { id: 'd18', speciesName: 'Arapaima (Arapaima gigas)', locationName: 'Sungai Kapuas, Pontianak', waterCondition: 'keruh', invasiveStatus: 'DARURAT', quantity: 1, reportedAt: '2025-04-11T13:00:00Z' }, geometry: { type: 'Point', coordinates: [109.34, -0.02] } },
  { type: 'Feature', properties: { id: 'd19', speciesName: 'Sapu-sapu (Pterygoplichthys)', locationName: 'Sungai Barito, Banjarmasin', waterCondition: 'keruh', invasiveStatus: 'KRITIS', quantity: 110, reportedAt: '2025-04-17T07:00:00Z' }, geometry: { type: 'Point', coordinates: [114.59, -1.48] } },
  { type: 'Feature', properties: { id: 'd20', speciesName: 'Red Devil (Amphilophus labiatus)', locationName: 'Sungai Mahakam, Samarinda', waterCondition: 'sedang', invasiveStatus: 'TINGGI', quantity: 19, reportedAt: '2025-04-21T09:00:00Z' }, geometry: { type: 'Point', coordinates: [117.11, -0.50] } },
  { type: 'Feature', properties: { id: 'd21', speciesName: 'Sapu-sapu (Pterygoplichthys)', locationName: 'Sungai Kahayan, Palangkaraya', waterCondition: 'jernih', invasiveStatus: 'TINGGI', quantity: 44, reportedAt: '2025-04-26T08:00:00Z' }, geometry: { type: 'Point', coordinates: [113.94, -2.21] } },
  // SULAWESI
  { type: 'Feature', properties: { id: 'd22', speciesName: 'Sapu-sapu (Pterygoplichthys)', locationName: 'Danau Limboto, Gorontalo', waterCondition: 'keruh', invasiveStatus: 'KRITIS', quantity: 88, reportedAt: '2025-04-13T10:00:00Z' }, geometry: { type: 'Point', coordinates: [122.89, 0.70] } },
  { type: 'Feature', properties: { id: 'd23', speciesName: 'Red Devil (Amphilophus labiatus)', locationName: 'Danau Tondano, Sulawesi Utara', waterCondition: 'sedang', invasiveStatus: 'TINGGI', quantity: 31, reportedAt: '2025-04-23T11:00:00Z' }, geometry: { type: 'Point', coordinates: [124.90, 1.22] } },
  { type: 'Feature', properties: { id: 'd24', speciesName: 'Flowerhorn (Cichlasoma hybrid)', locationName: 'Sungai Jeneberang, Makassar', waterCondition: 'sedang', invasiveStatus: 'SEDANG', quantity: 8, reportedAt: '2025-04-27T09:30:00Z' }, geometry: { type: 'Point', coordinates: [119.48, -5.18] } },
  { type: 'Feature', properties: { id: 'd25', speciesName: 'Sapu-sapu (Pterygoplichthys)', locationName: 'Danau Tempe, Wajo', waterCondition: 'keruh', invasiveStatus: 'KRITIS', quantity: 150, reportedAt: '2025-05-06T07:00:00Z' }, geometry: { type: 'Point', coordinates: [120.02, -3.97] } },
  // BALI & NTB
  { type: 'Feature', properties: { id: 'd26', speciesName: 'Sapu-sapu (Pterygoplichthys)', locationName: 'Sungai Ayung, Bali', waterCondition: 'sedang', invasiveStatus: 'TINGGI', quantity: 38, reportedAt: '2025-04-29T08:00:00Z' }, geometry: { type: 'Point', coordinates: [115.17, -8.45] } },
  { type: 'Feature', properties: { id: 'd27', speciesName: 'Blackchin Tilapia (Sarotherodon melanotheron)', locationName: 'Danau Rinjani, Lombok', waterCondition: 'jernih', invasiveStatus: 'SEDANG', quantity: 14, reportedAt: '2025-05-03T10:00:00Z' }, geometry: { type: 'Point', coordinates: [116.46, -8.41] } },
  // PAPUA
  { type: 'Feature', properties: { id: 'd28', speciesName: 'Arapaima (Arapaima gigas)', locationName: 'Sungai Mamberamo, Papua', waterCondition: 'jernih', invasiveStatus: 'DARURAT', quantity: 2, reportedAt: '2025-04-24T13:00:00Z' }, geometry: { type: 'Point', coordinates: [138.76, -2.33] } },
  { type: 'Feature', properties: { id: 'd29', speciesName: 'Sapu-sapu (Pterygoplichthys)', locationName: 'Sungai Digul, Papua Selatan', waterCondition: 'keruh', invasiveStatus: 'TINGGI', quantity: 67, reportedAt: '2025-05-01T09:00:00Z' }, geometry: { type: 'Point', coordinates: [140.38, -6.85] } },
  { type: 'Feature', properties: { id: 'd30', speciesName: 'Red Devil (Amphilophus labiatus)', locationName: 'Danau Sentani, Jayapura', waterCondition: 'sedang', invasiveStatus: 'TINGGI', quantity: 22, reportedAt: '2025-05-07T08:00:00Z' }, geometry: { type: 'Point', coordinates: [140.50, -2.58] } },
];

// Wrapper: fetches Maps key from server at runtime (works with Cloud Run runtime env vars)
export function ReportMap() {
  const [mapsKey, setMapsKey] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/config')
      .then(r => r.json())
      .then(d => setMapsKey(d.mapsKey || ''));
  }, []);

  if (mapsKey === null) return <div className="w-full h-full flex items-center justify-center bg-gray-50"><LoadingSpinner text="Memuat Peta..." /></div>;
  if (!mapsKey) return (
    <div className="w-full h-full flex flex-col items-center justify-center bg-gray-100 rounded-3xl border-2 border-dashed border-gray-300 p-6 text-center">
      <p className="text-gray-500 font-medium mb-2">Google Maps API Key tidak ditemukan.</p>
      <p className="text-sm text-gray-400">Pastikan NEXT_PUBLIC_GOOGLE_MAPS_API_KEY telah diset di environment variables.</p>
    </div>
  );
  return <ReportMapInner apiKey={mapsKey} />;
}

function ReportMapInner({ apiKey }: { apiKey: string }) {
  const { t } = useLanguage();
  const { isLoaded } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: apiKey,
    libraries: ['visualization']
  });

  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [reports, setReports] = useState<ReportFeature[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedReport, setSelectedReport] = useState<ReportFeature | null>(null);
  const [showHeatmap, setShowHeatmap] = useState(true);
  const [showDemo, setShowDemo] = useState(false);

  const displayedReports = useMemo(() => {
    return showDemo ? [...reports, ...DEMO_REPORTS] : reports;
  }, [showDemo, reports]);

  useEffect(() => {
    async function fetchMapData() {
      try {
        const res = await fetch('/api/report/map-data');
        const data = await res.json();
        if (data.success && data.data?.features) {
          setReports(data.data.features);
        }
      } catch (e) {
        console.error('Failed to load map data', e);
      } finally {
        setLoading(false);
      }
    }
    fetchMapData();
  }, []);

  const onLoad = useCallback(function callback(map: google.maps.Map) {
    setMap(map);
  }, []);

  const onUnmount = useCallback(function callback() {
    setMap(null);
    if (heatmapLayerRef.current) {
      heatmapLayerRef.current.setMap(null);
      heatmapLayerRef.current = null;
    }
  }, []);

  // Use a ref to always hold the latest layer — avoids stale closure in cleanup
  const heatmapLayerRef = useRef<google.maps.visualization.HeatmapLayer | null>(null);

  useEffect(() => {
    if (!map || !isLoaded || typeof google === 'undefined' || !google.maps.visualization) return;

    // Always destroy the old layer first
    if (heatmapLayerRef.current) {
      heatmapLayerRef.current.setMap(null);
      // eslint-disable-next-line react-hooks/immutability
      heatmapLayerRef.current = null;
    }

    if (showHeatmap && displayedReports.length > 0) {
      const heatMapData = displayedReports.map(
        r => new google.maps.LatLng(r.geometry.coordinates[1], r.geometry.coordinates[0])
      );
      heatmapLayerRef.current = new google.maps.visualization.HeatmapLayer({
        data: heatMapData,
        map: map,
        radius: 40,
        opacity: 0.9,
        gradient: [
          'rgba(0, 0, 0, 0)',
          'rgba(255, 204, 0, 1)',
          'rgba(255, 102, 0, 1)',
          'rgba(204, 0, 0, 1)',
          'rgba(153, 0, 0, 1)'
        ]
      });
    }

    return () => {
      if (heatmapLayerRef.current) {
        heatmapLayerRef.current.setMap(null);
        heatmapLayerRef.current = null;
      }
    };
  }, [showHeatmap, map, isLoaded, displayedReports]);

  const exportToCSV = () => {
    if (displayedReports.length === 0) return;
    
    const headers = ['ID', 'Nama Spesies', 'Lokasi', 'Kondisi Air', 'Status Invasif', 'Jumlah (Ekor)', 'Waktu Laporan', 'Latitude', 'Longitude'];
    const rows = displayedReports.map(r => {
      const p = r.properties;
      const c = r.geometry.coordinates;
      return [
        p.id,
        `"${p.speciesName}"`,
        `"${p.locationName}"`,
        p.waterCondition,
        p.invasiveStatus,
        p.quantity,
        p.reportedAt,
        c[1],
        c[0]
      ].join(',');
    });
    
    const csvContent = [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `SiJagaSungai_Data_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const mapOptions = useMemo(() => ({
    // No mapId — styles option only works without mapId
    disableDefaultUI: false,
    zoomControl: true,
    streetViewControl: false,
    mapTypeControl: false,
    // Hide all default Google Maps POI icons so fish markers stand out clearly
    styles: [
      { featureType: 'poi',             stylers: [{ visibility: 'off' }] },
      { featureType: 'poi.park',        stylers: [{ visibility: 'simplified' }] },
      { featureType: 'transit',         stylers: [{ visibility: 'off' }] },
      { featureType: 'transit.station', stylers: [{ visibility: 'off' }] },
      { featureType: 'road', elementType: 'labels.icon', stylers: [{ visibility: 'off' }] },
    ],
  }), []);

  if (!isLoaded || loading) {
    return <div className="w-full h-full flex items-center justify-center bg-gray-50"><LoadingSpinner text={t('Memuat Peta Nasional...', 'Loading National Map...')} /></div>;
  }

  return (
    <div className="relative w-full h-full rounded-3xl overflow-hidden shadow-sm border border-gray-200">
      <div className="absolute top-4 left-4 z-10 bg-white p-2 rounded-xl shadow-lg border border-gray-100 flex items-center space-x-2">
        <button 
          onClick={() => setShowHeatmap(false)}
          className={`px-4 py-2 text-sm font-bold rounded-lg transition-colors ${!showHeatmap ? 'bg-primary-sunai text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
        >
          📍 {t('Titik Laporan', 'Report Points')}
        </button>
        <button 
          onClick={() => setShowHeatmap(true)}
          className={`px-4 py-2 text-sm font-bold rounded-lg transition-colors ${showHeatmap ? 'bg-red-600 text-white shadow-md' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
        >
          🔥 {t('Zona Merah', 'Red Zone')}
        </button>
        <div className="w-px h-6 bg-gray-200" />
        <button
          onClick={() => setShowDemo(d => !d)}
          className={`px-4 py-2 text-sm font-bold rounded-lg transition-all border ${
            showDemo
              ? 'bg-violet-600 text-white border-violet-600 shadow-md shadow-violet-200'
              : 'bg-white text-violet-600 border-violet-300 hover:bg-violet-50'
          }`}
          title={t('Tampilkan 30 laporan demo untuk presentasi', 'Show 30 demo reports for presentation')}
        >
          {showDemo ? `✓ Demo ON (${DEMO_REPORTS.length})` : '🧪 Demo Data'}
        </button>
        <div className="w-px h-6 bg-gray-200" />
        <button
          onClick={exportToCSV}
          className="px-4 py-2 text-sm font-bold rounded-lg transition-colors bg-white text-emerald-700 border border-emerald-300 hover:bg-emerald-50 hover:border-emerald-400 flex items-center"
          title={t('Unduh data CSV untuk penelitian', 'Download CSV data for research')}
        >
          ⬇️ {t('Unduh CSV', 'Export CSV')}
        </button>
      </div>
      {showDemo && (
        <div className="absolute bottom-4 left-4 z-10 bg-violet-600/90 backdrop-blur-sm text-white text-xs px-3 py-1.5 rounded-lg shadow-lg">
          🧪 {t('Menampilkan data demo — bukan laporan nyata', 'Showing demo data — not real reports')}
        </div>
      )}

      <GoogleMap
        mapContainerStyle={containerStyle}
        center={center}
        zoom={5}
        onLoad={onLoad}
        onUnmount={onUnmount}
        options={mapOptions}
      >
        {!showHeatmap && (
          <MarkerClusterer options={{ imagePath: 'https://unpkg.com/@googlemaps/markerclustererplus@1.0.3/images/m' }}>
            {(clusterer) => (
              <>
                {displayedReports.map((report) => (
                  <Marker
                    key={report.properties.id}
                    position={{ lat: report.geometry.coordinates[1], lng: report.geometry.coordinates[0] }}
                    clusterer={clusterer}
                    onClick={() => setSelectedReport(report)}
                    icon={createFishMarkerIcon(report.properties.invasiveStatus)}
                  />
                ))}
              </>
            )}
          </MarkerClusterer>
        )}

        {selectedReport && !showHeatmap && (
          <InfoWindow
            position={{ lat: selectedReport.geometry.coordinates[1], lng: selectedReport.geometry.coordinates[0] }}
            onCloseClick={() => setSelectedReport(null)}
          >
            <div className="p-2" style={{ maxWidth: '260px' }}>
              {/* Fish image: uploaded photo > species database > emoji */}
              {(() => {
                const userImageUrl = selectedReport.properties.imageUrl;
                if (userImageUrl) {
                  return (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={userImageUrl}
                      alt="Foto laporan"
                      style={{ width: '100%', height: '110px', objectFit: 'cover', borderRadius: '8px', marginBottom: '8px' }}
                    />
                  );
                }
                const species = Object.values(SPECIES_DATABASE).find(s =>
                  s.namaLokal.some(n => selectedReport.properties.speciesName.toLowerCase().includes(n.toLowerCase())) ||
                  selectedReport.properties.speciesName.toLowerCase().includes(s.namaIlmiah.split(' ')[0].toLowerCase())
                );
                return species?.imageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={species.imageUrl}
                    alt={species.namaLokal[0]}
                    style={{ width: '100%', height: '110px', objectFit: 'cover', borderRadius: '8px', marginBottom: '8px' }}
                  />
                ) : (
                  <div style={{ width: '100%', height: '60px', background: '#f3f4f6', borderRadius: '8px', marginBottom: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '28px' }}>
                    {species?.badgeEmoji ?? '🐟'}
                  </div>
                );
              })()}
              <h3 className="font-bold text-gray-900 text-base mb-1">{selectedReport.properties.speciesName}</h3>
              <Badge status={selectedReport.properties.invasiveStatus} className="mb-3" />
              
              <div className="space-y-1 text-sm text-gray-700 mt-2">
                <p><strong>{t('Lokasi:', 'Location:')}</strong> {selectedReport.properties.locationName}</p>
                <p><strong>{t('Jumlah:', 'Quantity:')}</strong> {selectedReport.properties.quantity} ekor/kg</p>
                <p><strong>{t('Kondisi Air:', 'Water Condition:')}</strong> <span className="capitalize">{selectedReport.properties.waterCondition}</span></p>
                <p className="text-gray-500 text-xs mt-2">
                  Dilaporkan: {new Date(selectedReport.properties.reportedAt).toLocaleDateString()}
                </p>
              </div>
            </div>
          </InfoWindow>
        )}
      </GoogleMap>
    </div>
  );
}
