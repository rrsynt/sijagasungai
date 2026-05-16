import { LoadingSpinner } from '@/components/ui/LoadingSpinner';

export default function EducationLoading() {
  return (
    <div className="min-h-[70vh] flex items-center justify-center">
      <LoadingSpinner text="Membuka Ensiklopedia Spesies..." />
    </div>
  );
}
