import { LoadingSpinner } from '@/components/ui/LoadingSpinner';

export default function MapLoading() {
  return (
    <div className="h-[calc(100vh-64px)] flex items-center justify-center bg-gray-50">
      <LoadingSpinner text="Memuat Peta SiJaga..." />
    </div>
  );
}
