"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import type { Tag } from "@/types/tag";

export function AddSpotForm() {
  const router = useRouter();

  const [name, setName] = useState("");
  const [location, setLocation] = useState("");
  const [address, setAddress] = useState("");
  const [description, setDescription] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);

  const [hasOutlets, setHasOutlets] = useState(false);
  const [hasWhiteboards, setHasWhiteboards] = useState(false);
  const [hasFoodNearby, setHasFoodNearby] = useState(false);
  const [hasNaturalLight, setHasNaturalLight] = useState(false);

  const [tags, setTags] = useState<Tag[]>([]);
  const [selectedTagIds, setSelectedTagIds] = useState<number[]>([]);
  const [loadingTags, setLoadingTags] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [addressError, setAddressError] = useState("");
  const [imageError, setImageError] = useState("");

  useEffect(() => {
    async function fetchTags() {
      const { data, error } = await supabase
        .from("tags")
        .select("*")
        .order("name", { ascending: true });

      if (error) {
        console.error("Error fetching tags:", error);
        setLoadingTags(false);
        return;
      }

      setTags(data || []);
      setLoadingTags(false);
    }

    fetchTags();
  }, []);

  function toggleTag(tagId: number) {
    setSelectedTagIds((prev) =>
      prev.includes(tagId)
        ? prev.filter((id) => id !== tagId)
        : [...prev, tagId]
    );
  }

  async function geocodeAddress(address: string) {
    const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;

    if (!token || !address.trim()) {
      return { latitude: null, longitude: null };
    }

    const params = new URLSearchParams({
      q: address,
      limit: "1",
      country: "us",
      proximity: "-84.482,42.729",
      access_token: token,
    });

    const response = await fetch(
      `https://api.mapbox.com/search/geocode/v6/forward?${params.toString()}`
    );

    const data = await response.json();

    if (!response.ok) {
      console.error("Geocoding request failed:", data);
      return { latitude: null, longitude: null };
    }

    const coordinates = data.features?.[0]?.geometry?.coordinates;

    if (!coordinates) {
      console.error("No geocoding result found:", data);
      return { latitude: null, longitude: null };
    }

    const [longitude, latitude] = coordinates;

    return { latitude, longitude };
  }

  async function uploadSpotImage() {
    if (!imageFile) return null;

    setImageError("");

    if (!imageFile.type.startsWith("image/")) {
      setImageError("Please upload an image file.");
      return null;
    }

    const maxSize = 5 * 1024 * 1024;

    if (imageFile.size > maxSize) {
      setImageError("Image must be smaller than 5MB.");
      return null;
    }

    const fileExtension = imageFile.name.split(".").pop();
    const fileName = `${Date.now()}-${crypto.randomUUID()}.${fileExtension}`;

    const { error: uploadError } = await supabase.storage
      .from("spot-images")
      .upload(fileName, imageFile);

    if (uploadError) {
      console.error("Error uploading image:", uploadError);
      setImageError("Image upload failed. Try again or use an image URL.");
      return null;
    }

    const { data } = supabase.storage
      .from("spot-images")
      .getPublicUrl(fileName);

    return data.publicUrl;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    const cleanedAddress = address.trim();
    setAddressError("");
    setImageError("");

    if (cleanedAddress.length < 8) {
      setAddressError("Please enter a more specific address.");
      return;
    }

    if (!/\d/.test(cleanedAddress)) {
      setAddressError("Include a street number, like 366 W Circle Dr.");
      return;
    }

    if (!imageFile) {
      setImageError("Please upload an image.");
      return;
    }

    setSubmitting(true);

    const {
      data: {user},
    } = await supabase.auth.getUser();

    const { latitude, longitude } = await geocodeAddress(cleanedAddress);

    if (latitude === null || longitude === null) {
      setAddressError("We could not find this address. Try a clearer one.");
      setSubmitting(false);
      return;
    }

    const isNearMSU =
      latitude >= 42.68 &&
      latitude <= 42.78 &&
      longitude >= -84.56 &&
      longitude <= -84.40;

    if (!isNearMSU) {
      setAddressError("Please enter an address near MSU campus.");
      setSubmitting(false);
      return;
    }

    const finalImageUrl = await uploadSpotImage();

    if (imageFile && !finalImageUrl) {
      setSubmitting(false);
      return;
    }

    const { data: insertedSpot, error: spotError } = await supabase
      .from("spots")
      .insert([
        {
          name,
          location,
          address: cleanedAddress,
          description,
          image_url: finalImageUrl,
          has_outlets: hasOutlets,
          has_whiteboards: hasWhiteboards,
          has_food_nearby: hasFoodNearby,
          has_natural_light: hasNaturalLight,
          latitude,
          longitude,
          user_id: user?.id ?? null,
        },
      ])
      .select()
      .single();

    if (spotError) {
      console.error("Error inserting spot:", spotError);
      setSubmitting(false);
      return;
    }

    if (selectedTagIds.length > 0) {
      const spotTagRows = selectedTagIds.map((tagId) => ({
        spot_id: insertedSpot.id,
        tag_id: tagId,
      }));

      const { error: spotTagsError } = await supabase
        .from("spot_tags")
        .insert(spotTagRows);

      if (spotTagsError) {
        console.error("Error inserting spot tags:", spotTagsError);
        setSubmitting(false);
        return;
      }
    }

    setName("");
    setLocation("");
    setAddress("");
    setDescription("");
    setImageFile(null);
    setHasOutlets(false);
    setHasWhiteboards(false);
    setHasFoodNearby(false);
    setHasNaturalLight(false);
    setSelectedTagIds([]);
    setAddressError("");
    setImageError("");
    setSubmitting(false);

    router.push("/");
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      <div className="space-y-4">
        <div>
          <label className="mb-2 block text-sm font-medium text-zinc-800">
            Study Spot Name
          </label>
          <Input
            placeholder="e.g. Main Library East Wing"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            className="h-11 rounded-xl border-zinc-300 bg-white"
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-zinc-800">
            Display Location
          </label>
          <Input
            placeholder="e.g. Main Library, 4th floor"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            required
            className="h-11 rounded-xl border-zinc-300 bg-white"
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-zinc-800">
            Address
          </label>
          <Input
            placeholder="e.g. 366 W Circle Dr, East Lansing, MI 48824"
            value={address}
            onChange={(e) => {
              setAddress(e.target.value);
              if (addressError) setAddressError("");
            }}
            required
            className={`h-11 rounded-xl bg-white ${
              addressError
                ? "border-red-500 focus-visible:ring-red-500"
                : "border-zinc-300"
            }`}
          />
          {addressError && (
            <p className="mt-1 text-xs text-red-500">{addressError}</p>
          )}
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-zinc-800">
            Upload Image
          </label>
          <input
            type="file"
            accept="image/*"
            onChange={(e) => {
              setImageFile(e.target.files?.[0] || null);
              if (imageError) setImageError("");
            }}
            className="block w-full cursor-pointer rounded-xl border border-zinc-300 bg-white text-sm text-zinc-700 file:mr-4 file:border-0 file:bg-zinc-100 file:px-4 file:py-3 file:text-sm file:font-medium file:text-zinc-700 hover:file:bg-zinc-200"
          />
          {imageFile && (
            <p className="mt-1 text-xs text-zinc-500">
              Selected: {imageFile.name}
            </p>
          )}
          {imageError && (
            <p className="mt-1 text-xs text-red-500">{imageError}</p>
          )}
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-zinc-800">
            Description
          </label>
          <Textarea
            placeholder="Describe the atmosphere, seating, or what makes this a good study spot."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="min-h-28 rounded-xl border-zinc-300 bg-white"
          />
        </div>
      </div>

      <div className="rounded-2xl border border-zinc-200 bg-zinc-50/70 p-5">
        <h2 className="text-lg font-semibold text-zinc-900">Amenities</h2>
        <p className="mt-1 text-sm text-zinc-500">
          Select the features this study spot offers.
        </p>

        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <label className="flex items-center gap-3 rounded-xl border border-zinc-200 bg-white px-4 py-3 text-sm text-zinc-700">
            <input
              type="checkbox"
              checked={hasOutlets}
              onChange={(e) => setHasOutlets(e.target.checked)}
            />
            Has outlets
          </label>

          <label className="flex items-center gap-3 rounded-xl border border-zinc-200 bg-white px-4 py-3 text-sm text-zinc-700">
            <input
              type="checkbox"
              checked={hasWhiteboards}
              onChange={(e) => setHasWhiteboards(e.target.checked)}
            />
            Has whiteboards
          </label>

          <label className="flex items-center gap-3 rounded-xl border border-zinc-200 bg-white px-4 py-3 text-sm text-zinc-700">
            <input
              type="checkbox"
              checked={hasFoodNearby}
              onChange={(e) => setHasFoodNearby(e.target.checked)}
            />
            Food nearby
          </label>

          <label className="flex items-center gap-3 rounded-xl border border-zinc-200 bg-white px-4 py-3 text-sm text-zinc-700">
            <input
              type="checkbox"
              checked={hasNaturalLight}
              onChange={(e) => setHasNaturalLight(e.target.checked)}
            />
            Natural light
          </label>
        </div>
      </div>

      <div className="rounded-2xl border border-zinc-200 bg-zinc-50/70 p-5">
        <h2 className="text-lg font-semibold text-zinc-900">Tags</h2>
        <p className="mt-1 text-sm text-zinc-500">
          Choose tags that best describe this study spot.
        </p>

        {loadingTags ? (
          <p className="mt-4 text-sm text-zinc-500">Loading tags...</p>
        ) : (
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {tags.map((tag) => {
              const isSelected = selectedTagIds.includes(tag.id);

              return (
                <button
                  key={tag.id}
                  type="button"
                  onClick={() => toggleTag(tag.id)}
                  className={`rounded-xl border px-4 py-3 text-left text-sm font-medium transition ${
                    isSelected
                      ? "border-emerald-700 bg-emerald-50 text-emerald-800"
                      : "border-zinc-200 bg-white text-zinc-700 hover:border-zinc-300"
                  }`}
                >
                  {tag.name}
                </button>
              );
            })}
          </div>
        )}
      </div>

      <div className="flex justify-end">
        <Button
          type="submit"
          disabled={submitting}
          className="rounded-full bg-emerald-700 px-6 hover:bg-emerald-800"
        >
          {submitting ? "Adding Spot..." : "Add Study Spot"}
        </Button>
      </div>
    </form>
  );
}