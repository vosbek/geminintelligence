import LoadingSpinner from '@/components/ui/LoadingSpinner';

export default function Loading() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
      <LoadingSpinner size="lg" />
      <div className="text-gray-600">Loading AI tools data...</div>
    </div>
  );
}