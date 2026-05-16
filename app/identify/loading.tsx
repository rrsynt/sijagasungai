import { LoadingSpinner } from '@/components/ui/LoadingSpinner';

export default function IdentifyLoading() {
  return (
    <div className="min-h-[70vh] flex items-center justify-center">
      <LoadingSpinner text="Menyiapkan Kamera AI..." />
    </div>
  );
}
