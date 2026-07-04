import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#08090f] px-4 text-center">
      <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-3xl border border-[rgba(255,255,255,0.08)] bg-[#0f1117]">
        <span className="text-4xl">🧠</span>
      </div>
      <h1 className="mb-2 text-6xl font-bold text-[#f1f5f9]">404</h1>
      <p className="mb-2 text-lg text-[#64748b]">Page not found</p>
      <p className="mb-8 text-sm text-[#334155]">The page you&apos;re looking for doesn&apos;t exist.</p>
      <Link
        href="/"
        className="rounded-xl bg-[#6366f1] px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-[#4f46e5]"
      >
        Back Home
      </Link>
    </div>
  );
}
