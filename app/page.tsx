import Link from "next/link";

export default function Home() {
  return (
    <main className="min-h-screen bg-white px-6 py-16 text-[17px] text-slate-900">
      <div className="mx-auto max-w-3xl">
        <h1 className="text-5xl font-black tracking-tight">Gatekeeper</h1>
        <p className="mt-4 text-xl text-slate-700">
          Community application vetting with AI scoring and a shared hashed
          blocklist.
        </p>
        <div className="mt-10 flex flex-wrap gap-3">
          <Link
            href="/apply"
            className="rounded-xl bg-slate-900 px-5 py-3 font-bold text-white"
          >
            Apply
          </Link>
          <Link
            href="/dashboard"
            className="rounded-xl border-2 border-slate-300 px-5 py-3 font-bold"
          >
            Dashboard
          </Link>
          <Link
            href="/queue"
            className="rounded-xl border-2 border-slate-300 px-5 py-3 font-bold"
          >
            Review queue
          </Link>
          <Link
            href="/eval"
            className="rounded-xl border-2 border-slate-300 px-5 py-3 font-bold"
          >
            Eval
          </Link>
        </div>
      </div>
    </main>
  );
}
