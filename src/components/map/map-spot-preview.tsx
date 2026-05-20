import Link from "next/link";
import { ExternalLink, MapPinned } from "lucide-react";
import { StarDisplay } from "@/components/spots/star-rating";
import type { Spot } from "@/types/spot";

export type MapSpot = Spot & {
  latitude: number | null;
  longitude: number | null;
  tags: string[];
  averageRating: number | null;
};

type MapSpotPreviewProps = {
  selectedSpot: MapSpot | null;
};

export function MapSpotPreview({ selectedSpot }: MapSpotPreviewProps) {
  const directionsUrl =
    selectedSpot &&
    selectedSpot.latitude !== null &&
    selectedSpot.longitude !== null
      ? `https://www.google.com/maps/dir/?api=1&destination=${selectedSpot.latitude},${selectedSpot.longitude}`
      : null;

  const selectedAmenities = selectedSpot
    ? ([
        selectedSpot.has_outlets ? "Outlets" : null,
        selectedSpot.has_whiteboards ? "Whiteboards" : null,
        selectedSpot.has_food_nearby ? "Food Nearby" : null,
        selectedSpot.has_natural_light ? "Natural Light" : null,
      ].filter(Boolean) as string[])
    : [];
  const actionGridClass = directionsUrl
    ? "mt-5 grid grid-cols-2 gap-2"
    : "mt-5 grid gap-2";

  return (
    <aside className="rounded-2xl border border-zinc-200 bg-white p-4 lg:h-[650px]">
      {selectedSpot ? (
        <div className="flex h-full min-h-0 flex-col">
          {selectedSpot.image_url ? (
            <img
              src={selectedSpot.image_url}
              alt={selectedSpot.name}
              className="h-44 w-full rounded-xl object-cover"
            />
          ) : (
            <div className="flex h-44 w-full items-center justify-center rounded-xl bg-zinc-100 text-sm text-zinc-500">
              No image available
            </div>
          )}

          <div className="mt-4 flex-1 space-y-4 pr-1">
            <div>
              <h2 className="text-xl font-semibold text-zinc-900">
                {selectedSpot.name}
              </h2>
              <p className="mt-1 text-sm text-zinc-500">
                {selectedSpot.location}
              </p>
            </div>

            {selectedSpot.averageRating ? (
              <div className="flex items-center gap-2">
                <StarDisplay value={Math.round(selectedSpot.averageRating)} />
                <span className="text-sm font-medium text-zinc-900">
                  {selectedSpot.averageRating.toFixed(1)}
                </span>
              </div>
            ) : (
              <p className="text-sm text-zinc-500">No ratings yet</p>
            )}

            <p className="text-sm leading-6 text-zinc-700">
              {selectedSpot.description || "No description provided yet."}
            </p>

            {selectedSpot.tags.length > 0 && (
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">
                  Tags
                </p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {selectedSpot.tags.map((tag) => (
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

            {selectedAmenities.length > 0 && (
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">
                  Amenities
                </p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {selectedAmenities.map((amenity) => (
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

          <div className={actionGridClass}>
            {directionsUrl ? (
              <a
                href={directionsUrl}
                target="_blank"
                rel="noreferrer"
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-700 px-3 py-2.5 text-sm font-medium text-white transition hover:bg-emerald-800"
              >
                <MapPinned className="h-4 w-4" aria-hidden="true" />
                Get Directions
              </a>
            ) : null}

            <Link
              href={`/spots/${selectedSpot.id}`}
              className="flex w-full items-center justify-center gap-2 rounded-xl border border-zinc-200 px-3 py-2.5 text-sm font-medium text-zinc-800 transition hover:border-zinc-300 hover:bg-zinc-50"
            >
              Details
              <ExternalLink className="h-4 w-4" aria-hidden="true" />
            </Link>
          </div>
        </div>
      ) : (
        <div className="text-sm text-zinc-500">
          Select a map marker to preview a study spot.
        </div>
      )}
    </aside>
  );
}
