"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { User } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";

export function SiteHeader() {
  const [user, setUser] = useState<User | null>(null);
  const [loadingUser, setLoadingUser] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  async function refreshUser() {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    setUser(user);
    setLoadingUser(false);
  }

  useEffect(() => {
    void supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user);
      setLoadingUser(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(() => {
      refreshUser();
    });

    return () => subscription.unsubscribe();
  }, []);

  async function handleSignOut() {
    setLoadingUser(true);
    setMobileMenuOpen(false);
    await supabase.auth.signOut();
    await refreshUser();
  }

  return (
    <header className="border-b border-zinc-200 bg-white/90 backdrop-blur">
      <div className="mx-auto flex w-full max-w-5xl items-center justify-between px-6 py-4 sm:px-8 lg:max-w-6xl lg:px-10 2xl:max-w-7xl">
        <div className="flex items-center gap-8">
          <Link
            href="/"
            className="text-xl font-semibold tracking-tight text-zinc-900"
          >
            SpartanSpots
          </Link>

          <nav className="hidden items-center gap-6 md:flex">
            <Link
              href="/"
              className="text-sm font-medium text-zinc-600 transition hover:text-zinc-900"
            >
              Explore
            </Link>

            <Link
              href="/map"
              className="text-sm font-medium text-zinc-600 transition hover:text-zinc-900"
            >
              Map
            </Link>
          </nav>
        </div>

        <div className="flex items-center gap-3">
          {loadingUser ? (
            // <div className="hidden h-5 w-16 rounded-md bg-zinc-100 sm:block" />
            <div className="h10 w=10" />
          ) : user ? (
            <button
              type="button"
              onClick={handleSignOut}
              className="text-sm font-medium text-zinc-600 transition hover:text-zinc-900"
            >
              Sign Out
            </button>
          ) : (
            <Link
              href="/auth"
              className="text-sm font-medium text-zinc-600 transition hover:text-zinc-900"
            >
              Sign In
            </Link>
          )}

          {!loadingUser && user ? (
            <div className="hidden h-10 w-10 items-center justify-center rounded-full border border-zinc-200 bg-zinc-100 text-sm font-semibold text-zinc-700 sm:flex">
              {user.email?.slice(0, 2).toUpperCase()}
            </div>
          ) : null}

          <button
            type="button"
            onClick={() => setMobileMenuOpen((open) => !open)}
            className="flex h-10 w-10 items-center justify-center rounded-lg border border-zinc-200 text-zinc-700 transition hover:border-zinc-300 hover:bg-zinc-50 md:hidden"
            aria-label={mobileMenuOpen ? "Close navigation" : "Open navigation"}
            aria-expanded={mobileMenuOpen}
          >
            {mobileMenuOpen ? (
              <span
                className="relative block h-5 w-5"
                aria-hidden="true"
              >
                <span className="absolute left-1/2 top-1/2 block h-0.5 w-5 -translate-x-1/2 -translate-y-1/2 rotate-45 rounded-full bg-current" />
                <span className="absolute left-1/2 top-1/2 block h-0.5 w-5 -translate-x-1/2 -translate-y-1/2 -rotate-45 rounded-full bg-current" />
              </span>
            ) : (
              <span className="space-y-1.5" aria-hidden="true">
                <span className="block h-0.5 w-5 rounded-full bg-current" />
                <span className="block h-0.5 w-5 rounded-full bg-current" />
                <span className="block h-0.5 w-5 rounded-full bg-current" />
              </span>
            )}
          </button>
        </div>
      </div>

      {mobileMenuOpen && (
        <nav className="border-t border-zinc-100 bg-white md:hidden">
          <div className="mx-auto flex w-full max-w-5xl flex-col px-6 py-2 sm:px-8">
            <Link
              href="/"
              onClick={() => setMobileMenuOpen(false)}
              className="border-b border-zinc-100 px-1 py-3 text-sm font-medium text-zinc-700 transition hover:text-emerald-700"
            >
              Explore
            </Link>

            <Link
              href="/map"
              onClick={() => setMobileMenuOpen(false)}
              className="border-b border-zinc-100 px-1 py-3 text-sm font-medium text-zinc-700 transition hover:text-emerald-700"
            >
              Map
            </Link>

          </div>
        </nav>
      )}
    </header>
  );
}
