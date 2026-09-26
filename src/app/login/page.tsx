import Link from "next/link";

export const metadata = {
  title: "Masuk — KemanaKita",
};

export default function LoginPage() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-4 px-4 py-12">
      <h1 className="font-display text-[26px] leading-8 font-bold text-fg">
        Masuk
      </h1>
      <p className="max-w-sm text-center text-[15px] leading-[22px] text-fg-muted">
        Login dengan email akan tersedia di tahap berikutnya.
      </p>
      <Link
        href="/"
        className="text-[15px] font-semibold text-action underline underline-offset-4"
      >
        Kembali
      </Link>
    </main>
  );
}
