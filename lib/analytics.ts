/** GA4 event tracking utility — wraps gtag calls safely */
export function trackEvent(eventName: string, params?: Record<string, string | number | boolean>) {
  if (typeof window === 'undefined') return;
  const w = window as any;
  if (typeof w.gtag !== 'function') return;
  w.gtag('event', eventName, params);
}
