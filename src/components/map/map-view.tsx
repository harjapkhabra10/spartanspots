"use client";

import { useEffect, useRef, useState } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import type { MapSpot } from "@/components/map/map-spot-preview";

mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || "";

const MAP_STYLES = {
  light: "mapbox://styles/mapbox/light-v11",
  streets: "mapbox://styles/mapbox/streets-v12",
  outdoors: "mapbox://styles/mapbox/outdoors-v12",
  satellite: "mapbox://styles/mapbox/satellite-streets-v12",
};

type MapStyleKey = keyof typeof MAP_STYLES;

type MapViewProps = {
  spots: MapSpot[];
  loading: boolean;
  onSelectSpot: (spot: MapSpot) => void;
};

export function MapView({ spots, loading, onSelectSpot }: MapViewProps) {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const markersRef = useRef<mapboxgl.Marker[]>([]);

  const [mapStyle, setMapStyle] = useState<MapStyleKey>("light");

  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current || spots.length === 0) {
      return;
    }

    const validSpots = spots.filter(
      (spot) => spot.latitude !== null && spot.longitude !== null
    );

    if (validSpots.length === 0) {
      return;
    }

    const bounds = new mapboxgl.LngLatBounds();

    validSpots.forEach((spot) => {
      bounds.extend([spot.longitude!, spot.latitude!]);
    });

    const map = new mapboxgl.Map({
      container: mapContainerRef.current,
      style: MAP_STYLES[mapStyle],
    });

    mapRef.current = map;

    map.addControl(new mapboxgl.NavigationControl(), "top-right");

    function clearMarkers() {
      markersRef.current.forEach((marker) => marker.remove());
      markersRef.current = [];
    }

    function addMarkers() {
      if (!mapRef.current) return;

      clearMarkers();

      validSpots.forEach((spot) => {
        const markerElement = document.createElement("button");

        markerElement.className =
          "h-4 w-4 rounded-full border-2 border-white bg-emerald-700 shadow-md";
        markerElement.setAttribute("aria-label", spot.name);

        markerElement.addEventListener("click", () => {
          onSelectSpot(spot);
        });

        const marker = new mapboxgl.Marker(markerElement)
          .setLngLat([spot.longitude!, spot.latitude!])
          .addTo(mapRef.current!);

        markersRef.current.push(marker);
      });
    }

    map.on("load", () => {
      map.fitBounds(bounds, {
        padding: 80,
        maxZoom: 16,
        duration: 0,
      });

      addMarkers();
    });

    map.on("style.load", () => {
      addMarkers();
    });

    return () => {
      clearMarkers();
      map.remove();
      mapRef.current = null;
    };
  }, [spots, onSelectSpot]);

  useEffect(() => {
    if (mapRef.current) {
      mapRef.current.setStyle(MAP_STYLES[mapStyle]);
    }
  }, [mapStyle]);

  return (
    <div className="relative overflow-hidden rounded-2xl border border-zinc-200 bg-white">
      {spots.length === 0 && !loading ? (
        <div className="flex h-[650px] items-center justify-center text-sm text-zinc-500">
          No spots with map coordinates yet.
        </div>
      ) : (
        <>
          <div className="absolute left-4 top-4 z-10 flex items-center gap-3 rounded-lg border border-zinc-200 bg-white/95 px-4 py-2 shadow-sm">
            <span className="text-xs font-medium text-zinc-500">
              Style
            </span>

            <select
              value={mapStyle}
              onChange={(e) =>
                setMapStyle(e.target.value as MapStyleKey)
              }
              className="h-6 bg-transparent text-sm font-medium text-zinc-800 outline-none"
            >
              <option value="light">Light</option>
              <option value="streets">Streets</option>
              <option value="outdoors">Outdoors</option>
              <option value="satellite">Satellite</option>
            </select>
          </div>

          <div ref={mapContainerRef} className="h-[650px] w-full" />
        </>
      )}
    </div>
  );
}
