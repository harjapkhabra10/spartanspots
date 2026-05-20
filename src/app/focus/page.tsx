"use client";

import { useEffect, useState } from "react";
import { SiteHeader } from "@/components/layout/site-header";
import { FocusPanel } from "@/components/focus/focus-panel";
import { supabase } from "@/lib/supabase";
import type { Spot } from "@/types/spot";

export default function FocusPage() {
  const [spots, setSpots] = useState<Spot[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchSpots() {
      const { data, error } = await supabase
        .from("spots")
        .select("*")
        .order("name", { ascending: true });

      if (error) {
        console.error("Error fetching spots:", error);
        setLoading(false);
        return;
      }

      setSpots(data || []);
      setLoading(false);
    }

    fetchSpots();
  }, []);

  return (
    <main className="min-h-screen bg-stone-50">
      <SiteHeader />

      <section className="mx-auto w-full max-w-5xl px-6 py-8 sm:px-8 lg:max-w-6xl lg:px-10 2xl:max-w-7xl">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-zinc-900">
            Focus Mode
          </h1>
          <p className="mt-2 text-sm text-zinc-500">
            Choose where you are studying, then use simple tools to stay on
            track.
          </p>
        </div>

        <div className="mt-6">
          {loading ? (
            <div className="rounded-2xl border border-zinc-200 bg-white p-6 text-sm text-zinc-500">
              Loading focus tools...
            </div>
          ) : (
            <FocusPanel spots={spots} />
          )}
        </div>
      </section>
    </main>
  );
}