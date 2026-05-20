import Link from "next/link";
import type { User } from "@supabase/supabase-js";
import type { Spot } from "@/types/spot";
import type { Review } from "@/types/review";
import { RatingRow } from "@/components/spots/rating-row";
import { StarDisplay, StarRating } from "@/components/spots/star-rating";

type AverageRatings = {
  overall: number | null;
  quiet: number | null;
  crowd: number | null;
  comfort: number | null;
};

type SpotOverviewTabProps = {
  spot: Spot;
  reviews: Review[];
  averageRatings: AverageRatings;
  user: User | null;

  overallRating: number;
  quietLevel: number;
  crowdLevel: number;
  comfortRating: number;
  reviewText: string;
  submittingReview: boolean;

  setOverallRating: (value: number) => void;
  setQuietLevel: (value: number) => void;
  setCrowdLevel: (value: number) => void;
  setComfortRating: (value: number) => void;
  setReviewText: (value: string) => void;
  onSubmitReview: (e: React.FormEvent) => void;
};

export function SpotOverviewTab({
  spot,
  reviews,
  averageRatings,
  user,
  overallRating,
  quietLevel,
  crowdLevel,
  comfortRating,
  reviewText,
  submittingReview,
  setOverallRating,
  setQuietLevel,
  setCrowdLevel,
  setComfortRating,
  setReviewText,
  onSubmitReview,
}: SpotOverviewTabProps) {
  return (
    <div className="space-y-8 p-6">
      <section>
        <h2 className="text-xl font-semibold text-zinc-900">Description</h2>
        <p className="mt-3 text-sm leading-6 text-zinc-700">
          {spot.description || "No description provided yet."}
        </p>
      </section>

      <section>
        <h2 className="text-xl font-semibold text-zinc-900">
          Ratings Summary
        </h2>

        {reviews.length === 0 ? (
          <p className="mt-3 text-sm text-zinc-500">
            No reviews yet. Be the first to review this spot.
          </p>
        ) : (
          <div className="mt-4 space-y-3">
            <RatingRow label="Overall" value={averageRatings.overall} />
            <RatingRow label="Quiet Level" value={averageRatings.quiet} />
            <RatingRow label="Crowd Level" value={averageRatings.crowd} />
            <RatingRow label="Comfort" value={averageRatings.comfort} />
          </div>
        )}
      </section>

      <section>
        <h2 className="text-xl font-semibold text-zinc-900">Reviews</h2>

        {reviews.length === 0 ? (
          <p className="mt-3 text-sm text-zinc-500">
            No reviews have been added yet.
          </p>
        ) : (
          <div className="mt-4 space-y-3">
            {reviews.map((review) => (
              <div
                key={review.id}
                className="rounded-xl border border-zinc-200 bg-white p-4"
              >
                <div className="flex items-center gap-2">
                  <StarDisplay value={review.overall_rating} />
                  <span className="text-sm text-zinc-500">
                    {review.overall_rating}/5
                  </span>
                </div>

                <p className="mt-2 text-sm text-zinc-700">
                  {review.review_text || "No written comment."}
                </p>

                <div className="mt-3 flex flex-wrap gap-3 text-xs text-zinc-500">
                  <span>Quiet: {review.quiet_level}/5</span>
                  <span>Crowd: {review.crowd_level}/5</span>
                  <span>Comfort: {review.comfort_rating}/5</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="border-t border-zinc-200 pt-6">
        <h2 className="text-xl font-semibold text-zinc-900">
          Add Your Review
        </h2>

        {!user ? (
          <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 p-5">
            <p className="text-sm font-medium text-amber-900">
              Sign in to leave a review.
            </p>
            <p className="mt-1 text-sm leading-6 text-amber-800">
              Reviews are tied to your account so students can trust the
              feedback being shared.
            </p>

            <Link
              href="/auth"
              className="mt-4 inline-flex rounded-xl bg-emerald-700 px-4 py-2 text-sm font-medium text-white transition hover:bg-emerald-800"
            >
              Sign In
            </Link>
          </div>
        ) : (
          <>
            <p className="mt-2 text-sm text-zinc-500">
              Share how this spot feels for studying so other students know what
              to expect.
            </p>

            <form onSubmit={onSubmitReview} className="mt-5 space-y-5">
              <div>
                <label className="text-sm font-medium text-zinc-700">
                  Overall Rating
                </label>

                <div className="mt-2">
                  <StarRating
                    value={overallRating}
                    onChange={setOverallRating}
                  />

                  {overallRating === 0 && (
                    <p className="mt-2 text-xs text-zinc-500">
                      Select an overall rating to submit.
                    </p>
                  )}
                </div>
              </div>

              <RatingInput
                label="Quiet Level"
                value={quietLevel}
                onChange={setQuietLevel}
                helperText="1 = noisy, 5 = very quiet"
              />

              <RatingInput
                label="Crowd Level"
                value={crowdLevel}
                onChange={setCrowdLevel}
                helperText="1 = empty, 5 = very crowded"
              />

              <RatingInput
                label="Comfort"
                value={comfortRating}
                onChange={setComfortRating}
                helperText="1 = uncomfortable, 5 = very comfortable"
              />

              <div>
                <label className="text-sm font-medium text-zinc-700">
                  Written Review
                </label>
                <textarea
                  value={reviewText}
                  onChange={(e) => setReviewText(e.target.value)}
                  placeholder="What should other students know about this spot?"
                  className="mt-2 min-h-28 w-full rounded-xl border border-zinc-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-emerald-600"
                />
              </div>

              <button
                type="submit"
                disabled={submittingReview || overallRating === 0}
                className="rounded-xl bg-emerald-700 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {submittingReview ? "Adding Review..." : "Add Review"}
              </button>
            </form>
          </>
        )}
      </section>
    </div>
  );
}

function RatingInput({
  label,
  value,
  onChange,
  helperText,
}: {
  label: string;
  value: number;
  onChange: (value: number) => void;
  helperText?: string;
}) {
  return (
    <div>
      <div className="flex items-center justify-between gap-4">
        <div>
          <label className="text-sm font-medium text-zinc-700">{label}</label>
          {helperText && (
            <p className="mt-1 text-xs text-zinc-500">{helperText}</p>
          )}
        </div>

        <span className="text-sm font-semibold text-zinc-900">{value}/5</span>
      </div>

      <input
        type="range"
        min="1"
        max="5"
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="mt-3 w-full accent-emerald-700"
      />
    </div>
  );
}