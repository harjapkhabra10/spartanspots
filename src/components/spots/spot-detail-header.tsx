import type { Spot } from "@/types/spot";
import { StarDisplay } from "@/components/spots/star-rating";
import { MapPin } from "lucide-react";

type SpotDetailHeaderProps = {
  spot: Spot;
  tags: string[];
  amenities: string[];
  averageOverall: number | null;
  reviewCount: number;
};

export function SpotDetailHeader({
  spot,
  tags,
  amenities,
  averageOverall,
  reviewCount,
}: SpotDetailHeaderProps) {
  return (
    <div className="mt-6 overflow-hidden rounded-2xl border border-zinc-200 bg-white">
      {spot.image_url ? (
        <img
          src={spot.image_url}
          alt={spot.name}
          className="h-72 w-full object-cover"
        />
      ) : (
        <div className="flex h-72 w-full items-center justify-center bg-zinc-100 text-sm text-zinc-500">
          No image available
        </div>
      )}

      <div className="space-y-5 p-6">
        {/* TITLE + RATING */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight text-zinc-900">
              {spot.name}
            </h1>
            <p className="mt-1 text-sm text-zinc-500">{spot.location}</p>
            {spot.address && (
              <p className="mt-2 flex items-start gap-1.5 text-sm text-zinc-600">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-emerald-700" />
                <span>{spot.address}</span>
              </p>
            )}
          </div>

          <div className="rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm">
            {averageOverall ? (
              <div className="flex items-center gap-2">
                <StarDisplay value={Math.round(averageOverall)} />
                <span className="text-sm font-medium text-zinc-900">
                  {averageOverall.toFixed(1)}
                </span>
              </div>
            ) : (
              <p className="font-semibold text-zinc-900">No ratings yet</p>
            )}

            <p className="mt-1 text-xs text-zinc-500">
              {reviewCount} review{reviewCount === 1 ? "" : "s"}
            </p>
          </div>
        </div>

        {/* TAGS + AMENITIES */}
        <div className="space-y-4">
          {/* TAGS */}
          {tags.length > 0 && (
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">
                Tags
              </p>
              <div className="mt-2 flex flex-wrap gap-2">
                {tags.map((tag) => (
                  <span
                    key={tag}
                    className="rounded-full bg-zinc-100 px-3 py-1 text-xs font-medium text-zinc-700"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* AMENITIES */}
          {amenities.length > 0 && (
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">
                Amenities
              </p>
              <div className="mt-2 flex flex-wrap gap-2">
                {amenities.map((amenity) => (
                  <span
                    key={amenity}
                    className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700"
                  >
                    {amenity}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
