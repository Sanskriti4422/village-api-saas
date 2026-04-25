import Link from "next/link";

export default function Home() {
  return (
    <main className="min-h-screen bg-slate-50 text-slate-950">
      <section className="mx-auto flex min-h-screen max-w-5xl flex-col justify-center px-6 py-16">
        <p className="text-sm font-semibold uppercase tracking-wide text-emerald-700">
          India Village API
        </p>
        <h1 className="mt-4 max-w-3xl text-4xl font-semibold tracking-tight md:text-6xl">
          Village-level address data for B2B forms and autocomplete.
        </h1>
        <p className="mt-5 max-w-2xl text-base leading-7 text-slate-600">
          Search and dropdown APIs backed by 610,000+ imported village records,
          API-key authentication, usage logging, and daily plan limits.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link
            href="/dashboard"
            className="inline-flex h-11 items-center justify-center rounded-md bg-emerald-700 px-5 text-sm font-medium text-white hover:bg-emerald-800"
          >
            Open Dashboard
          </Link>
          <Link
            href="/api/v1/autocomplete?q=ram&limit=5"
            className="inline-flex h-11 items-center justify-center rounded-md border border-slate-300 bg-white px-5 text-sm font-medium text-slate-800 hover:bg-slate-100"
          >
            Test Protected API
          </Link>
        </div>
      </section>
    </main>
  );
}
