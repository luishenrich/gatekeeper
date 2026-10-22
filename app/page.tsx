import Link from "next/link";

export default function Home() {
  return (
    <main className="min-h-screen p-8">
      <h1 className="text-4xl font-bold mb-4">Gatekeeper</h1>
      <p className="text-lg mb-6">
        Community application vetting with AI scoring and shared blocklist
      </p>
      <div className="space-x-4">
        <Link href="/queue" className="text-blue-600 hover:underline">
          Review Queue
        </Link>
        <Link href="/eval" className="text-blue-600 hover:underline">
          Eval Dashboard
        </Link>
      </div>
    </main>
  );
}
