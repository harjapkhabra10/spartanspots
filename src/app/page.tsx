"use client";

import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { useEffect, useMemo, useState } from "react";
import { SiteHeader } from "@/components/layout/site-header";
import { SpotCard } from "@/components/spots/spot-card";
import type { Spot } from "@/types/spot";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";


type SpotWithExtras = {
  spot: Spot;
  tags: string[];
  averageRating: number | null;
};

type SortOption = "newest" | "highest-rated" | "a-z";

export default function HomePage() {
  const [spots, setSpots] = useState<SpotWithExtras[]>([]);
  const [loading, setLoading] = useState(true);

  const [searchQuery, setSearchQuery] = useState("");
  const [availableTags, setAvailableTags] = useState<string[]>([]);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState<SortOption>("newest");

  const router = useRouter();
  
  useEffect(() => {
    async function fetchSpots() {
      const { data: tagRows, error: tagsError } = await supabase
        .from("tags")
        .select("name")
        .order("name", { ascending: true });

      if (tagsError) {
        console.error("Error fetching tags:", tagsError);
      } else {
        setAvailableTags(tagRows?.map((tag) => tag.name) || []);
      }

      const { data: spotRows, error: spotsError } = await supabase
        .from("spots")
        .select("*")
        .order("id", { ascending: false });

      if (spotsError) {
        console.error("Error fetching spots:", spotsError);
        setLoading(false);
        return;
      }

      const formattedSpots: SpotWithExtras[] = [];

      for (const spot of spotRows || []) {
        const { data: spotTagRows, error: tagError } = await supabase
          .from("spot_tags")
          .select("tag_id, tags(name)")
          .eq("spot_id", spot.id);

        if (tagError) {
          console.error("Error fetching spot tags:", tagError);
        }

        const { data: reviewRows, error: reviewError } = await supabase
          .from("reviews")
          .select("overall_rating")
          .eq("spot_id", spot.id);

        if (reviewError) {
          console.error("Error fetching reviews:", reviewError);
        }

        const tags =
          spotTagRows?.map((row) => {
            const tagData = row.tags as
              | { name: string }
              | { name: string }[]
              | null;

            if (Array.isArray(tagData)) {
              return tagData[0]?.name;
            }

            return tagData?.name;
          }).filter(Boolean) as string[] || [];

        const averageRating =
          reviewRows && reviewRows.length > 0
            ? reviewRows.reduce((sum, review) => sum + review.overall_rating, 0) /
              reviewRows.length
            : null;

        formattedSpots.push({
          spot,
          tags,
          averageRating,
        });
      }

      setSpots(formattedSpots);
      setLoading(false);
    }

    fetchSpots();
  }, []);

  function toggleTag(tag: string) {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  }

  const filteredSpots = useMemo(() => {
    const normalizedQuery = searchQuery.trim().toLowerCase();

    let results = spots.filter((item) => {
      const matchesSearch =
        normalizedQuery === "" ||
        item.spot.name.toLowerCase().includes(normalizedQuery) ||
        item.spot.location.toLowerCase().includes(normalizedQuery) ||
        (item.spot.description ?? "").toLowerCase().includes(normalizedQuery) ||
        item.tags.some((tag) => tag.toLowerCase().includes(normalizedQuery));

      const matchesTags =
        selectedTags.length === 0 ||
        selectedTags.every((tag) => item.tags.includes(tag));

      return matchesSearch && matchesTags;
    });

    results = [...results].sort((a, b) => {
      if (sortBy === "highest-rated") {
        const ratingA = a.averageRating ?? -1;
        const ratingB = b.averageRating ?? -1;
        return ratingB - ratingA;
      }

      if (sortBy === "a-z") {
        return a.spot.name.localeCompare(b.spot.name);
      }

      return b.spot.id - a.spot.id;
    });

    return results;
  }, [spots, searchQuery, selectedTags, sortBy]);

  function clearFilters() {
    setSearchQuery("");
    setSelectedTags([]);
    setSortBy("newest");
  }

  const hasActiveFilters =
    searchQuery.trim() !== "" || selectedTags.length > 0 || sortBy !== "newest";

  return (
    <main className="min-h-screen bg-stone-50">
      <SiteHeader />

      <section className="mx-auto w-full max-w-5xl px-6 py-8 sm:px-8 lg:max-w-6xl 2xl:max-w-7xl lg:px-10">
        <div className="space-y-6">
          <div className="space-y-3">
            <div className="inline-flex rounded-full bg-emerald-50 px-4 py-1 text-sm font-medium text-emerald-700">
              Discover study spaces at MSU
            </div>

            <div className="max-w-3xl space-y-3">
              <h1 className="text-4xl font-semibold tracking-tight text-zinc-900 sm:text-5xl">
                Find your next study spot
              </h1>
              <p className="text-base leading-7 text-zinc-600 sm:text-lg">
                Browse quiet corners, group-friendly spots, and student-recommended
                spaces across campus.
              </p>
            </div>

            
          </div>

          <div className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm">
            <div className="flex flex-col gap-3 md:flex-row">
              <input
                type="text"
                placeholder="Search by name, location, or keyword"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-11 w-full rounded-xl border border-zinc-200 bg-zinc-50 px-4 text-sm outline-none transition focus:border-emerald-600 md:flex-1"
              />

              <Popover>
                <PopoverTrigger asChild>
                  <button
                    className={`h-11 w-full rounded-xl border px-4 text-sm font-medium transition md:w-auto ${
                      selectedTags.length > 0
                        ? "border-emerald-700 bg-emerald-50 text-emerald-800"
                        : "border-zinc-200 bg-zinc-50 text-zinc-700 hover:border-zinc-300"
                    }`}
                  >
                    {selectedTags.length > 0
                      ? `Filters (${selectedTags.length})`
                      : "Filters"}
                  </button>
                </PopoverTrigger>

                <PopoverContent
                  align="end"
                  className="w-[calc(100vw-3rem)] rounded-2xl border-zinc-200 p-4 sm:w-[340px]"
                >
                  <div className="space-y-4">
                    <div>
                      <h3 className="text-sm font-semibold text-zinc-900">
                        Filter by tags
                      </h3>
                      <p className="mt-1 text-xs text-zinc-500">
                        Select one or more tags to narrow results.
                      </p>
                    </div>

                    <div className="max-h-64 space-y-2 overflow-y-auto pr-1">
                      {availableTags.map((tag) => {
                        const isSelected = selectedTags.includes(tag);

                        return (
                          <button
                            key={tag}
                            type="button"
                            onClick={() => toggleTag(tag)}
                            className={`flex w-full items-center justify-between rounded-xl border px-3 py-2 text-left text-sm transition ${
                              isSelected
                                ? "border-emerald-700 bg-emerald-50 text-emerald-800"
                                : "border-zinc-200 bg-white text-zinc-700 hover:border-zinc-300"
                            }`}
                          >
                            <span>{tag}</span>
                            {isSelected && <span className="text-xs font-semibold">✓</span>}
                          </button>
                        );
                      })}
                    </div>

                    <div className="flex items-center justify-between border-t border-zinc-200 pt-3">
                      <p className="text-xs text-zinc-500">
                        {selectedTags.length} selected
                      </p>

                      <button
                        type="button"
                        onClick={() => setSelectedTags([])}
                        className="text-sm font-medium text-emerald-700 transition hover:text-emerald-800"
                      >
                        Clear tags
                      </button>
                    </div>
                  </div>
                </PopoverContent>
              </Popover>

              <button
                onClick={clearFilters}
                disabled={!hasActiveFilters}
                className="h-11 w-full rounded-xl bg-emerald-700 px-5 text-sm font-medium text-white transition hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-50 md:w-auto"
              >
                Clear
              </button>
            </div>

            {selectedTags.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-2">
                {selectedTags.map((tag) => (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => toggleTag(tag)}
                    className="rounded-full bg-emerald-50 px-3 py-1.5 text-sm font-medium text-emerald-800 transition hover:bg-emerald-100"
                  >
                    {tag} ×
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-2xl font-semibold tracking-tight text-zinc-900">
              Study Spots
            </h2>
            <p className="mt-1 text-sm text-zinc-500">
              {loading
                ? "Loading spots..."
                : `${filteredSpots.length} result${
                    filteredSpots.length === 1 ? "" : "s"
                  }`}
            </p>
          </div>

          <div className="flex items-center gap-3">
            {/* <Link href="/add-spot">
              <button className="h-10 rounded-lg bg-emerald-700 px-4 text-sm font-medium text-white transition hover:bg-emerald-800">
                Add a Spot
              </button>
            </Link> */}

            <button
              type="button"
              onClick={async () => {
                const {
                  data: { user },
                } = await supabase.auth.getUser();
                
                if (user) {
                  router.push("/add-spot");
                } else {
                  router.push("/auth");
                }
              }}
              className="h-10 rounded-lg bg-emerald-700 px-4 text-sm font-medium text-white transition hover:bg-emerald-800"
            >
              Add a Spot 
              </button>

            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortOption)}
              className="h-10 rounded-lg border border-zinc-200 bg-white px-3 text-sm outline-none transition focus:border-emerald-600"
            >
              <option value="newest">Newest</option>
              <option value="highest-rated">Highest Rated</option>
              <option value="a-z">A–Z</option>
            </select>
          </div>
        </div>

        <div className="mt-6">
          {loading ? (
            <div className="rounded-3xl border border-zinc-200 bg-white p-8 text-sm text-zinc-500 shadow-sm">
              Loading study spots...
            </div>
          ) : filteredSpots.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-zinc-300 bg-white p-10 text-center shadow-sm">
              <h3 className="text-lg font-semibold text-zinc-900">
                No matching study spots
              </h3>
              <p className="mt-2 text-sm text-zinc-500">
                Try a different search or clear your filters.
              </p>
            </div>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
              {filteredSpots.map((item) => (
                <SpotCard
                  key={item.spot.id}
                  spot={item.spot}
                  tags={item.tags}
                  averageRating={item.averageRating}
                />
              ))}
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
