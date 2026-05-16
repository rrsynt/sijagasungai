'use client';

import { useEffect, useState } from 'react';
import { MapPin, Clock } from 'lucide-react';
import { useLanguage } from '../LanguageContext';

interface ReportFeature {
  properties: {
    id: string;
    speciesName: string;
    locationName: string;
    reportedAt: string;
    urgency: string;
  }
}

export function RecentReports() {
  const [reports, setReports] = useState<ReportFeature[]>([]);
  const [loading, setLoading] = useState(true);
  const { t, language } = useLanguage();

  useEffect(() => {
    async function fetchReports() {
      try {
        const response = await fetch('/api/report/map-data?days=7');
        const json = await response.json();
        if (json.success && json.data?.features) {
          // Take top 3 recent reports
          setReports(json.data.features.slice(0, 3));
        }
      } catch (err) {
        console.error('Failed to fetch recent reports', err);
      } finally {
        setLoading(false);
      }
    }
    fetchReports();
  }, []);

  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {[1, 2, 3].map((i) => (
          <div key={i} className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 animate-pulse">
            <div className="h-6 bg-gray-200 rounded w-1/2 mb-4"></div>
            <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          </div>
        ))}
      </div>
    );
  }

  if (reports.length === 0) {
    return (
      <div className="text-center py-10 bg-white rounded-2xl border border-gray-100 shadow-sm">
        <p className="text-gray-500">{t('Belum ada laporan terbaru minggu ini.', 'No recent reports this week.')}</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {reports.map((report) => (
        <div key={report.properties.id} className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
          <div className="flex justify-between items-start mb-4">
            <h3 className="font-bold text-gray-900 text-lg truncate pr-2">{report.properties.speciesName}</h3>
            <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
              report.properties.urgency === 'DARURAT' ? 'bg-red-100 text-red-800' :
              report.properties.urgency === 'TINGGI' ? 'bg-amber-100 text-amber-800' :
              'bg-blue-100 text-blue-800'
            }`}>
              {t(report.properties.urgency, report.properties.urgency === 'DARURAT' ? 'EMERGENCY' : report.properties.urgency === 'TINGGI' ? 'HIGH' : report.properties.urgency === 'SEDANG' ? 'MEDIUM' : 'LOW')}
            </span>
          </div>
          <div className="space-y-2 text-sm text-gray-600">
            <div className="flex items-center">
              <MapPin className="h-4 w-4 mr-2 text-gray-400" />
              <span className="truncate">{report.properties.locationName}</span>
            </div>
            <div className="flex items-center">
              <Clock className="h-4 w-4 mr-2 text-gray-400" />
              <span>{new Date(report.properties.reportedAt).toLocaleDateString(language === 'id' ? 'id-ID' : 'en-US', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
