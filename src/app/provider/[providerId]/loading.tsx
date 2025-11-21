export default function ProviderLoading() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-8">
      <div className="space-y-4 text-center">
        <div className="animate-pulse h-10 w-52 bg-gray-200 rounded-xl mx-auto" />
        <div className="animate-pulse h-24 w-[320px] bg-gray-200 rounded-2xl mx-auto" />
        <div className="animate-pulse h-32 w-[520px] bg-gray-200 rounded-2xl mx-auto" />
        <p className="text-sm text-gray-500">Memuat detail mitra...</p>
      </div>
    </div>
  );
}