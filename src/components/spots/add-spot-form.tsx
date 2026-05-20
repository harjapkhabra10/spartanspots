"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import { supabase } from "@/lib/supabase";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import type { Tag } from "@/types/tag";
import "./add-spot-form.css";

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || "";
const MSU_CENTER = { lng: -84.482, lat: 42.729 };
const MSU_BBOX: [number, number, number, number] = [
  -84.56, 42.68, -84.4, 42.78,
];

const SearchBox = dynamic(
  () => import("@mapbox/search-js-react").then((mod) => mod.SearchBox),
  { ssr: false }
);

type SelectedAddress = {
  address: string;
  latitude: number;
  longitude: number;
};

export function AddSpotForm() {
  const router = useRouter();

  const [name, setName] = useState("");
  const [location, setLocation] = useState("");
  const [address, setAddress] = useState("");
  const [selectedAddress, setSelectedAddress] =
    useState<SelectedAddress | null>(null);
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

  function handleAddressChange(value: string) {
    setAddress(value);
    if (addressError) setAddressError("");

    if (selectedAddress && value !== selectedAddress.address) {
      setSelectedAddress(null);
    }
  }

  function handleAddressRetrieve(result: any) {
    const feature = result.features[0];

    if (!feature) return;

    const { properties } = feature;
    const coordinates = properties.coordinates;
    const addressLabel =
      properties.full_address ||
      [properties.name, properties.place_formatted].filter(Boolean).join(", ");

    setAddress(addressLabel);
    setSelectedAddress({
      address: addressLabel,
      latitude: coordinates.latitude,
      longitude: coordinates.longitude,
    });
    setAddressError("");

    if (!location.trim()) {
      setLocation(properties.name);
    }
  }

  async function geocodeAddress(address: string) {
    const token = MAPBOX_TOKEN;

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

    if (cleanedAddress.length < 8 && !selectedAddress) {
      setAddressError("Please enter a more specific address.");
      return;
    }

    if (!/\d/.test(cleanedAddress) && !selectedAddress) {
      setAddressError("Include a street number, like 366 W Circle Dr.");
      return;
    }

    if (!imageFile) {
      setImageError("Please upload an image.");
      return;
    }

    setSubmitting(true);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    const coordinates =
      selectedAddress && selectedAddress.address === cleanedAddress
        ? {
            latitude: selectedAddress.latitude,
            longitude: selectedAddress.longitude,
          }
        : await geocodeAddress(cleanedAddress);
    const { latitude, longitude } = coordinates;

    if (latitude === null || longitude === null) {
      setAddressError("We could not find this address. Try a clearer one.");
      setSubmitting(false);
      return;
    }

    const isNearMSU =
      latitude >= 42.65 &&
      latitude <= 42.80 &&
      longitude >= -84.58 &&
      longitude <= -84.35;

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
    setSelectedAddress(null);
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
          {MAPBOX_TOKEN ? (
            <div className="mapbox-searchbox">
              <SearchBox
                accessToken={MAPBOX_TOKEN}
                value={address}
                onChange={handleAddressChange}
                onRetrieve={handleAddressRetrieve}
                options={{
                  language: "en",
                  country: "US",
                  proximity: MSU_CENTER,
                  bbox: MSU_BBOX,
                }}
                placeholder="Search MSU buildings or addresses"
                theme={{
                  variables: {
                    border:
                      addressError ? "1px solid #ef4444" : "1px solid #d4d4d8",
                    borderRadius: "0.75rem",
                    boxShadow: "none",
                    colorPrimary: "#047857",
                    fontFamily: "inherit",
                  },
                }}
              />
            </div>
          ) : (
            <Input
              placeholder="e.g. 366 W Circle Dr, East Lansing, MI 48824"
              value={address}
              onChange={(e) => handleAddressChange(e.target.value)}
              required
              className={`h-11 rounded-xl bg-white ${
                addressError
                  ? "border-red-500 focus-visible:ring-red-500"
                  : "border-zinc-300"
              }`}
            />
          )}
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
