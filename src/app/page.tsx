import Link from "next/link";

export default function Home() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-8 px-4 py-12">
      <div className="flex max-w-md flex-col items-center gap-3 text-center">
        <h1 className="font-display text-[32px] leading-[38px] font-bold tracking-[-0.02em] text-action">
          KemanaKita
        </h1>
        <p className="text-[15px] leading-[22px] text-fg-muted">
          Rencana bareng, jalan bareng.
        </p>
      </div>

      <div className="flex w-full max-w-sm flex-col gap-3">
        <Link
          href="/login"
          className="flex h-12 w-full items-center justify-center rounded-md bg-action px-4 text-[15px] font-semibold text-white transition-colors hover:bg-action-hover"
        >
          Mulai
        </Link>
        <p className="text-center text-[12px] leading-4 text-slate-500">
          Susun itinerary dan bagi biaya trip bareng teman.
        </p>
      </div>
    </main>
  );
}
