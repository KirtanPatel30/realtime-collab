"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../lib/supabaseClient";

export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) router.replace("/app");
    });
  }, [router]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null);
    setLoading(true);

    try {
      if (mode === "signin") {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        router.replace("/app");
      } else {
        const { error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;

        setMsg("Account created ✅ If email confirmation is enabled, check your inbox.");
        const { data } = await supabase.auth.getSession();
        if (data.session) router.replace("/app");
      }
    } catch (err: any) {
      setMsg(err?.message ?? "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center p-6">
      <div className="w-full max-w-md rounded-2xl border bg-white p-6 shadow-sm">
        <h1 className="text-2xl font-semibold">Realtime Collaboration App</h1>
        <p className="mt-1 text-sm text-gray-600">
          {mode === "signin" ? "Sign in to continue." : "Create an account to continue."}
        </p>

        <form onSubmit={handleSubmit} className="mt-6 space-y-3">
          <div className="space-y-1">
            <label className="text-sm font-medium">Email</label>
            <input
              className="w-full rounded-xl border px-3 py-2 outline-none focus:ring"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="kirtan@email.com"
              required
            />
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium">Password</label>
            <input
              className="w-full rounded-xl border px-3 py-2 outline-none focus:ring"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              minLength={6}
            />
          </div>

          {msg ? (
            <div className="rounded-xl border px-3 py-2 text-sm text-gray-700 bg-gray-50">
              {msg}
            </div>
          ) : null}

          <button
            disabled={loading}
            className="w-full rounded-xl bg-black py-2 text-white disabled:opacity-60"
            type="submit"
          >
            {loading ? "Loading..." : mode === "signin" ? "Sign In" : "Sign Up"}
          </button>
        </form>

        <div className="mt-4 text-sm text-gray-700">
          {mode === "signin" ? (
            <button className="underline" onClick={() => setMode("signup")}>
              Need an account? Sign up
            </button>
          ) : (
            <button className="underline" onClick={() => setMode("signin")}>
              Already have an account? Sign in
            </button>
          )}
        </div>
      </div>
    </main>
  );
}
