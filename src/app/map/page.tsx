"use client";

import { useCallback, useEffect, useState } from "react";
import { SiteHeader } from "@/components/layout/site-header";
import { MapSpotPreview, type MapSpot } from "@/components/map/map-spot-preview";
import { MapView } from "@/components/map/map-view";
import { supabase } from "@/lib/supabase";

export default function MapPage() {
  const [spots, setSpots] = useState<MapSpot[]>([]);
  const [selectedSpot, setSelectedSpot] = useState<MapSpot | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchSpots() {
      const { data: spotRows, error } = await supabase
        .from("spots")
        .select("*")
        .not("latitude", "is", null)
        .not("longitude", "is", null);

      if (error) {
        console.error("Error fetching map spots:", error);
        setLoading(false);
        return;
      }

      const formattedSpots: MapSpot[] = [];

      for (const spot of spotRows || []) {
        const { data: tagRows } = await supabase
          .from("spot_tags")
          .select("tags(name)")
          .eq("spot_id", spot.id);

        const tags =
          (tagRows
            ?.map((row) => {
              const tagData = row.tags as
                | { name: string }
                | { name: string }[]
                | null;

              if (Array.isArray(tagData)) {
                return tagData[0]?.name;
              }

              return tagData?.name;
            })
            .filter(Boolean) as string[]) || [];

        const { data: reviewRows } = await supabase
          .from("reviews")
          .select("overall_rating")
          .eq("spot_id", spot.id);

        const averageRating =
          reviewRows && reviewRows.length > 0
            ? reviewRows.reduce(
                (sum, review) => sum + review.overall_rating,
                0
              ) / reviewRows.length
            : null;

        formattedSpots.push({
          ...spot,
          tags,
          averageRating,
        });
      }

      setSpots(formattedSpots);
      setSelectedSpot(formattedSpots[0] || null);
      setLoading(false);
    }

    fetchSpots();
  }, []);

  const handleSelectSpot = useCallback((spot: MapSpot) => {
    setSelectedSpot(spot);
  }, []);

  return (
    <main className="min-h-screen bg-stone-50">
      <SiteHeader />

      <section className="mx-auto w-full max-w-7xl px-6 py-8 sm:px-8 lg:px-10 2xl:max-w-[1500px]">
        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight text-zinc-900">
              Campus Map
            </h1>
            <p className="mt-2 text-sm text-zinc-500">
              Explore study spots by location around campus.
            </p>
          </div>

          <div className="rounded-xl border border-zinc-200 bg-white px-4 py-2 text-sm text-zinc-600">
            {loading
              ? "Loading spots..."
              : `${spots.length} mapped spot${spots.length === 1 ? "" : "s"}`}
          </div>
        </div>

        <div className="grid items-start gap-5 lg:grid-cols-[1fr_360px]">
          <MapView
            spots={spots}
            loading={loading}
            onSelectSpot={handleSelectSpot}
          />

          <MapSpotPreview selectedSpot={selectedSpot} />
        </div>
      </section>
    </main>
  );
}
