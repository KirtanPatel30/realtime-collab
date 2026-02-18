import Link from "next/link";

export default function Home() {
  return (
    <main className="min-h-screen flex items-center justify-center p-6">
      <div className="w-full max-w-xl rounded-2xl border bg-white p-6 shadow-sm text-center">
        <h1 className="text-4xl font-semibold">Realtime Collaboration App</h1>
        <p className="mt-2 text-gray-600"></p>

        <div className="mt-6 flex justify-center gap-3">
          <Link href="/login" className="rounded-xl bg-black px-4 py-2 text-white">
            Go to Login
          </Link>
          <Link href="/app" className="rounded-xl border px-4 py-2">
            Go to Dashboard
          </Link>
        </div>
      </div>
    </main>
  );
}
