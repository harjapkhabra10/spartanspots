"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { SiteHeader } from "@/components/layout/site-header";
import { supabase } from "@/lib/supabase";

export default function AuthPage() {
  const router = useRouter();

  const [mode, setMode] = useState<"sign-in" | "sign-up">("sign-in");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [authError, setAuthError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    setSubmitting(true);
    setAuthError("");

    const { error } =
      mode === "sign-in"
        ? await supabase.auth.signInWithPassword({ email, password })
        : await supabase.auth.signUp({ email, password });

    if (error) {
      setAuthError(error.message);
      setSubmitting(false);
      return;
    }

    setSubmitting(false);
    router.push("/");
  }

  return (
    <main className="min-h-screen bg-stone-50">
      <SiteHeader />

      <section className="mx-auto w-full max-w-4xl px-6 py-8 sm:px-8 lg:max-w-5xl lg:px-10 2xl:max-w-6xl">
        <div className="mb-6">
          <Link
            href="/"
            className="text-sm font-medium text-emerald-700 transition hover:text-emerald-800"
          >
            ← Back to study spots
          </Link>
        </div>

        <div className="mx-auto max-w-md rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
          <h1 className="text-2xl font-semibold tracking-tight text-zinc-900">
            {mode === "sign-in" ? "Sign in" : "Create account"}
          </h1>

          <p className="mt-2 text-sm leading-6 text-zinc-500">
            Use an account to manage your spots, reviews, and study sessions.
          </p>

          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <div>
              <label className="mb-2 block text-sm font-medium text-zinc-700">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="h-11 w-full rounded-xl border border-zinc-200 bg-zinc-50 px-3 text-sm outline-none transition focus:border-emerald-600"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-zinc-700">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="h-11 w-full rounded-xl border border-zinc-200 bg-zinc-50 px-3 text-sm outline-none transition focus:border-emerald-600"
              />
            </div>

            {authError && <p className="text-sm text-red-500">{authError}</p>}

            <button
              type="submit"
              disabled={submitting}
              className="w-full rounded-xl bg-emerald-700 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {submitting
                ? "Submitting..."
                : mode === "sign-in"
                  ? "Sign In"
                  : "Create Account"}
            </button>
          </form>

          <button
            type="button"
            onClick={() =>
              setMode((prev) => (prev === "sign-in" ? "sign-up" : "sign-in"))
            }
            className="mt-4 text-sm font-medium text-emerald-700 transition hover:text-emerald-800"
          >
            {mode === "sign-in"
              ? "Need an account? Sign up"
              : "Already have an account? Sign in"}
          </button>
        </div>
      </section>
    </main>
  );
}