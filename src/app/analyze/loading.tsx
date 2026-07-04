export default function AnalyzeLoading() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#08090f] px-4">
      <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-[#6366f1]/10">
        <div
          className="h-6 w-6 animate-spin rounded-full border-2 border-current border-r-transparent text-[#6366f1]"
        />
      </div>
      <p className="text-sm text-[#64748b]">Loading analyzer...</p>
    </div>
  );
}
