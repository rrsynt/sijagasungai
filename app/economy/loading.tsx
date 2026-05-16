import { LoadingSpinner } from '@/components/ui/LoadingSpinner';

export default function EconomyLoading() {
  return (
    <div className="min-h-[70vh] flex items-center justify-center">
      <LoadingSpinner text="Menyiapkan Kalkulator Ekonomi..." />
    </div>
  );
}
