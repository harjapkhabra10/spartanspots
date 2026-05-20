import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import type { Spot } from "@/types/spot";

type SpotCardProps = {
  spot: Spot;
  tags?: string[];
  averageRating?: number | null;
};

export function SpotCard({
  spot,
  tags = [],
  averageRating = null,
}: SpotCardProps) {
  const amenities = [
    spot.has_outlets ? "Outlets" : null,
    spot.has_whiteboards ? "Whiteboards" : null,
    spot.has_food_nearby ? "Food Nearby" : null,
    spot.has_natural_light ? "Natural Light" : null,
  ].filter(Boolean) as string[];

  return (
    <Link href={`/spots/${spot.id}`} className="block h-full">
      <Card className="group flex h-full flex-col overflow-hidden rounded-3xl border-zinc-200 bg-white shadow-sm transition-all duration-200 hover:-translate-y-1 hover:shadow-md">
        <div className="relative">
          {spot.image_url ? (
            <img
              src={spot.image_url}
              alt={spot.name}
              className="h-44 w-full object-cover"
            />
          ) : (
            <div className="flex h-44 w-full items-center justify-center bg-zinc-100 text-sm text-zinc-500">
              No image available
            </div>
          )}

          <div className="absolute left-4 top-4">
            <Badge className="rounded-full bg-white/95 px-3 py-1 text-zinc-800 shadow-sm hover:bg-white">
              {averageRating ? `${averageRating.toFixed(1)} ★` : "No ratings yet"}
            </Badge>
          </div>
        </div>

        <CardContent className="flex flex-1 flex-col p-5">
          <div>
            <h3 className="line-clamp-2 text-xl font-semibold tracking-tight text-zinc-900">
              {spot.name}
            </h3>
            <p className="mt-1 text-sm text-zinc-500">{spot.location}</p>
          </div>

          <p className="mt-4 line-clamp-2 text-sm leading-6 text-zinc-600">
            {spot.description || "No description provided yet."}
          </p>

          {tags.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-2">
              {tags.slice(0, 3).map((tag) => (
                <span
                  key={tag}
                  className="rounded-full bg-zinc-100 px-3 py-1 text-xs font-medium text-zinc-700"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}

          {amenities.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-2">
              {amenities.slice(0, 2).map((amenity) => (
                <span
                  key={amenity}
                  className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700"
                >
                  {amenity}
                </span>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </Link>
  );
}