const MAX_OFFLINE_REPORTS = 20;

export function saveOfflineReport(reportData: any) {
  if (typeof window === 'undefined') return;
  const existing = localStorage.getItem('sijaga_offline_reports');
  const reports = existing ? JSON.parse(existing) : [];
  reports.push({ ...reportData, _offlineId: Date.now() });
  // Drop oldest if over the cap
  if (reports.length > MAX_OFFLINE_REPORTS) reports.splice(0, reports.length - MAX_OFFLINE_REPORTS);
  localStorage.setItem('sijaga_offline_reports', JSON.stringify(reports));
  window.dispatchEvent(new Event('offline_sync_update'));
}

export function getOfflineCount(): number {
  if (typeof window === 'undefined') return 0;
  const existing = localStorage.getItem('sijaga_offline_reports');
  return existing ? JSON.parse(existing).length : 0;
}

export async function syncOfflineReports() {
  if (typeof window === 'undefined') return;
  if (!navigator.onLine) return;
  
  const existing = localStorage.getItem('sijaga_offline_reports');
  if (!existing) return;
  
  const reports = JSON.parse(existing);
  if (reports.length === 0) return;
  
  const failedReports = [];
  
  for (const report of reports) {
    try {
      const res = await fetch('/api/report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(report),
      });
      if (!res.ok) throw new Error('Sync failed');
    } catch (e) {
      failedReports.push(report);
    }
  }
  
  if (failedReports.length === 0) {
    localStorage.removeItem('sijaga_offline_reports');
  } else {
    localStorage.setItem('sijaga_offline_reports', JSON.stringify(failedReports));
  }
  
  window.dispatchEvent(new Event('offline_sync_update'));
}
