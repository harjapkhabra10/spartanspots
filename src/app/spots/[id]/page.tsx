"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import type { User } from "@supabase/supabase-js";
import { SiteHeader } from "@/components/layout/site-header";
import { SpotDetailHeader } from "@/components/spots/spot-detail-header";
import { SpotOverviewTab } from "@/components/spots/spot-overview-tab";
import { ActiveSessionsTab } from "@/components/spots/active-sessions-tab";
import { supabase } from "@/lib/supabase";
import type { Spot } from "@/types/spot";
import type { Review } from "@/types/review";

type Tab = "overview" | "active";

export default function SpotDetailPage() {
  const params = useParams();
  const id = params.id as string;

  const [spot, setSpot] = useState<Spot | null>(null);
  const [tags, setTags] = useState<string[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [activeTab, setActiveTab] = useState<Tab>("overview");
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<User | null>(null);

  const [overallRating, setOverallRating] = useState(0);
  const [quietLevel, setQuietLevel] = useState(3);
  const [crowdLevel, setCrowdLevel] = useState(3);
  const [comfortRating, setComfortRating] = useState(3);
  const [reviewText, setReviewText] = useState("");
  const [submittingReview, setSubmittingReview] = useState(false);

  useEffect(() => {
    async function fetchUser() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      setUser(user);
    }

    fetchUser();
  }, []);

  useEffect(() => {
    async function fetchSpotDetails() {
      const { data: spotData, error: spotError } = await supabase
        .from("spots")
        .select("*")
        .eq("id", id)
        .single();

      if (spotError || !spotData) {
        console.error("Error fetching spot:", spotError);
        setLoading(false);
        return;
      }

      const { data: tagRows, error: tagError } = await supabase
        .from("spot_tags")
        .select("tags(name)")
        .eq("spot_id", id);

      if (tagError) {
        console.error("Error fetching tags:", tagError);
      }

      const formattedTags =
        tagRows
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
          .filter(Boolean) as string[] || [];

      const { data: reviewRows, error: reviewError } = await supabase
        .from("reviews")
        .select("*")
        .eq("spot_id", id)
        .order("id", { ascending: false });

      if (reviewError) {
        console.error("Error fetching reviews:", reviewError);
      }

      setSpot(spotData);
      setTags(formattedTags);
      setReviews(reviewRows || []);
      setLoading(false);
    }

    if (id) {
      fetchSpotDetails();
    }
  }, [id]);

  const averageRatings = useMemo(() => {
    if (reviews.length === 0) {
      return {
        overall: null,
        quiet: null,
        crowd: null,
        comfort: null,
      };
    }

    const total = reviews.reduce(
      (sum, review) => ({
        overall: sum.overall + review.overall_rating,
        quiet: sum.quiet + review.quiet_level,
        crowd: sum.crowd + review.crowd_level,
        comfort: sum.comfort + review.comfort_rating,
      }),
      { overall: 0, quiet: 0, crowd: 0, comfort: 0 }
    );

    return {
      overall: total.overall / reviews.length,
      quiet: total.quiet / reviews.length,
      crowd: total.crowd / reviews.length,
      comfort: total.comfort / reviews.length,
    };
  }, [reviews]);

  async function handleReviewSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!spot || !user) return;

    setSubmittingReview(true);

    const { data, error } = await supabase
      .from("reviews")
      .insert([
        {
          spot_id: spot.id,
          overall_rating: overallRating,
          quiet_level: quietLevel,
          crowd_level: crowdLevel,
          comfort_rating: comfortRating,
          review_text: reviewText || null,
          user_id: user.id,
        },
      ])
      .select()
      .single();

    if (error) {
      console.error("Error adding review:", error);
      setSubmittingReview(false);
      return;
    }

    setReviews((prev) => [data, ...prev]);

    setOverallRating(5);
    setQuietLevel(5);
    setCrowdLevel(3);
    setComfortRating(5);
    setReviewText("");
    setSubmittingReview(false);
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-stone-50">
        <SiteHeader />
        <section className="mx-auto max-w-5xl px-6 py-8">
          <p className="text-sm text-zinc-500">Loading spot...</p>
        </section>
      </main>
    );
  }

  if (!spot) {
    return (
      <main className="min-h-screen bg-stone-50">
        <SiteHeader />
        <section className="mx-auto max-w-5xl px-6 py-8">
          <Link href="/" className="text-sm font-medium text-emerald-700">
            ← Back to spots
          </Link>
          <h1 className="mt-6 text-2xl font-semibold">Spot not found</h1>
        </section>
      </main>
    );
  }

  const amenities = [
    spot.has_outlets ? "Outlets" : null,
    spot.has_whiteboards ? "Whiteboards" : null,
    spot.has_food_nearby ? "Food Nearby" : null,
    spot.has_natural_light ? "Natural Light" : null,
  ].filter(Boolean) as string[];

  return (
    <main className="min-h-screen bg-stone-50">
      <SiteHeader />

      <section className="mx-auto w-full max-w-5xl px-6 py-8 sm:px-8 lg:max-w-6xl lg:px-10">
        <Link href="/" className="text-sm font-medium text-emerald-700">
          ← Back to spots
        </Link>

        <SpotDetailHeader
          spot={spot}
          tags={tags}
          amenities={amenities}
          averageOverall={averageRatings.overall}
          reviewCount={reviews.length}
        />

        <div className="mt-6 overflow-hidden rounded-2xl border border-zinc-200 bg-white">
          <div className="flex border-b border-zinc-200">
            <button
              onClick={() => setActiveTab("overview")}
              className={`px-5 py-3 text-sm font-medium ${
                activeTab === "overview"
                  ? "border-b-2 border-emerald-700 text-emerald-700"
                  : "text-zinc-500"
              }`}
            >
              Overview
            </button>

            <button
              onClick={() => setActiveTab("active")}
              className={`px-5 py-3 text-sm font-medium ${
                activeTab === "active"
                  ? "border-b-2 border-emerald-700 text-emerald-700"
                  : "text-zinc-500"
              }`}
            >
              Active Sessions
            </button>
          </div>

          {activeTab === "overview" ? (
            <SpotOverviewTab
              spot={spot}
              reviews={reviews}
              averageRatings={averageRatings}
              user={user}
              overallRating={overallRating}
              quietLevel={quietLevel}
              crowdLevel={crowdLevel}
              comfortRating={comfortRating}
              reviewText={reviewText}
              submittingReview={submittingReview}
              setOverallRating={setOverallRating}
              setQuietLevel={setQuietLevel}
              setCrowdLevel={setCrowdLevel}
              setComfortRating={setComfortRating}
              setReviewText={setReviewText}
              onSubmitReview={handleReviewSubmit}
            />
          ) : (
            <ActiveSessionsTab spotId={spot.id} />
          )}
        </div>
      </section>
    </main>
  );
}