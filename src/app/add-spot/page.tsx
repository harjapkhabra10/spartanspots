"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { SiteHeader } from "@/components/layout/site-header";
import { AddSpotForm } from "@/components/spots/add-spot-form";
import { supabase } from "@/lib/supabase";

export default function AddSpotPage() {
  const router = useRouter();
  const [loadingUser, setLoadingUser] = useState(true);

  useEffect(() => {
    async function checkUser() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.replace("/auth");
        return;
      }

      setLoadingUser(false);
    }

    checkUser();
  }, [router]);

  if (loadingUser) {
    return (
      <main className="min-h-screen bg-stone-50">
        <SiteHeader />
        <section className="mx-auto w-full max-w-4xl px-6 py-8 sm:px-8 lg:max-w-5xl lg:px-10 2xl:max-w-6xl">
          <div className="rounded-2xl border border-zinc-200 bg-white p-6 text-sm text-zinc-500 shadow-sm">
            Loading...
          </div>
        </section>
      </main>
    );
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

        <div className="overflow-hidden rounded-[2rem] border border-zinc-200 bg-white shadow-sm">
          <div className="border-b border-zinc-200 px-6 py-6 sm:px-8">
            <h1 className="text-3xl font-semibold tracking-tight text-zinc-900">
              Add a New Study Spot
            </h1>

            <p className="mt-2 max-w-2xl text-sm leading-6 text-zinc-600">
              Share a place that helps students get work done. Add a
              description, helpful tags, and key amenities so others know what
              to expect.
            </p>
          </div>

          <div className="px-6 py-6 sm:px-8">
            <AddSpotForm />
          </div>
        </div>
      </section>
    </main>
  );
}