"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { User } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";

export function SiteHeader() {
  const [user, setUser] = useState<User | null>(null);
  const [loadingUser, setLoadingUser] = useState(true);

  async function refreshUser() {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    setUser(user);
    setLoadingUser(false);
  }

  useEffect(() => {
    refreshUser();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(() => {
      refreshUser();
    });

    return () => subscription.unsubscribe();
  }, []);

  async function handleSignOut() {
    setLoadingUser(true);
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

            <Link
              href="/focus"
              className="text-sm font-medium text-zinc-600 transition hover:text-zinc-900"
            >
              Focus
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
              className="hidden text-sm font-medium text-zinc-600 transition hover:text-zinc-900 sm:block"
            >
              Sign Out
            </button>
          ) : (
            <Link
              href="/auth"
              className="hidden text-sm font-medium text-zinc-600 transition hover:text-zinc-900 sm:block"
            >
              Sign In
            </Link>
          )}

          {loadingUser ? (
            <div className="h-10 w-10 rounded-full border border-zinc-200 bg-zinc-100" />
          ) : user ? (
            <div className="flex h-10 w-10 items-center justify-center rounded-full border border-zinc-200 bg-zinc-100 text-sm font-semibold text-zinc-700">
              {user.email?.slice(0, 2).toUpperCase()}
            </div>
          ) : (
            <Link
              href="/auth"
              className="flex h-10 w-10 items-center justify-center rounded-full border border-zinc-200 bg-zinc-100 text-sm font-semibold text-zinc-500 transition hover:bg-zinc-200"
              aria-label="Sign in"
            >
              ?
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}