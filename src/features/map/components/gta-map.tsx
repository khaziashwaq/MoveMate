"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

type MapListing = {
  id: string;
  title: string;
  price: string;
  location: string;
  category: string;
  lat: number;
  lng: number;
  image: string;
};

type Props = {
  center: [number, number];
  zoom: number;
  listings: MapListing[];
  onBoundsChange: (bounds: {
    north: number;
    south: number;
    east: number;
    west: number;
  }) => void;
  onListingClick: (id: string) => void;
  onMapClick?: (lat: number, lng: number) => void;
  pinLocation?: { lat: number; lng: number } | null;
};

export function GTAMap({
  center,
  zoom,
  listings,
  onBoundsChange,
  onListingClick,
  onMapClick,
  pinLocation,
}: Props) {
  const mapRef = useRef<L.Map | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const markersRef = useRef<L.LayerGroup | null>(null);
  const pinRef = useRef<L.Marker | null>(null);
  const [mapReady, setMapReady] = useState(false);

  // Initialize map
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = L.map(containerRef.current, {
      center,
      zoom,
      zoomControl: false,
      attributionControl: false,
      minZoom: 11,
      maxBoundsViscosity: 1.0,
    });

    // Restrict panning to the city area (set from center ± ~0.15 degrees)
    const cityBounds = L.latLngBounds(
      [center[0] - 0.15, center[1] - 0.25],
      [center[0] + 0.15, center[1] + 0.25]
    );
    map.setMaxBounds(cityBounds);

    // Dark/stylized tiles for GTA feel
    const cartoKey = process.env.NEXT_PUBLIC_CARTO_API_KEY;
    L.tileLayer(
      `https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png${
        cartoKey ? `?api_key=${cartoKey}` : ""
      }`,
      {
        maxZoom: 19,
      }
    ).addTo(map);

    // Zoom control bottom-right
    L.control.zoom({ position: "bottomright" }).addTo(map);

    // Layer group for markers
    markersRef.current = L.layerGroup().addTo(map);

    // Emit bounds on move
    const emitBounds = () => {
      const b = map.getBounds();
      onBoundsChange({
        north: b.getNorth(),
        south: b.getSouth(),
        east: b.getEast(),
        west: b.getWest(),
      });
    };

    map.on("moveend", emitBounds);
    map.on("zoomend", emitBounds);

    mapRef.current = map;
    setMapReady(true);

    // Initial bounds emit after map is fully ready
    map.whenReady(() => {
      emitBounds();
    });

    return () => {
      map.remove();
      mapRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Update center when city changes
  const centerLat = center[0];
  const centerLng = center[1];
  useEffect(() => {
    if (mapRef.current) {
      mapRef.current.setView([centerLat, centerLng], zoom);
    }
  }, [centerLat, centerLng, zoom]);

  // Handle map click for pinning location
  useEffect(() => {
    if (!mapRef.current) return;
    if (!onMapClick) return;

    const handler = (e: L.LeafletMouseEvent) => {
      onMapClick(e.latlng.lat, e.latlng.lng);
    };
    mapRef.current.on("click", handler);
    return () => {
      mapRef.current?.off("click", handler);
    };
  }, [onMapClick]);

  // Show/update pin marker
  useEffect(() => {
    if (!mapRef.current) return;

    if (pinRef.current) {
      mapRef.current.removeLayer(pinRef.current);
      pinRef.current = null;
    }

    if (pinLocation) {
      const icon = L.divIcon({
        className: "gta-marker gta-pin-pulse",
        html: `<div class="gta-marker-inner" style="border-color:#f59e0b;box-shadow:0 0 18px rgba(245,158,11,0.6),0 0 40px rgba(245,158,11,0.2)"><span class="gta-marker-price" style="color:#f59e0b"><svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 256 256" fill="#f59e0b" style="display:inline;vertical-align:middle;margin-right:3px"><path d="M128,16a88.1,88.1,0,0,0-88,88c0,75.3,80,132.17,83.41,134.55a8,8,0,0,0,9.18,0C136,236.17,216,179.3,216,104A88.1,88.1,0,0,0,128,16Zm0,56a32,32,0,1,1-32,32A32,32,0,0,1,128,72Z"/></svg>Your Pin</span></div>`,
        iconSize: [100, 36],
        iconAnchor: [50, 36],
      });
      pinRef.current = L.marker([pinLocation.lat, pinLocation.lng], { icon }).addTo(mapRef.current);
    }
  }, [pinLocation]);

  // Update markers when listings change
  useEffect(() => {
    if (!markersRef.current || !mapReady) return;

    markersRef.current.clearLayers();

    listings.forEach((listing) => {
      const icon = L.divIcon({
        className: "gta-marker",
        html: `
          <div class="gta-marker-inner">
            <span class="gta-marker-price">${listing.price}</span>
            <span class="gta-marker-nav" title="View Details">⮞</span>
          </div>
        `,
        iconSize: [100, 36],
        iconAnchor: [50, 36],
      });

      const marker = L.marker([listing.lat, listing.lng], { icon });

      marker.on("click", () => {
        onListingClick(listing.id);
      });

      markersRef.current!.addLayer(marker);
    });
  }, [listings, mapReady, onListingClick]);

  return (
    <div ref={containerRef} className="h-full w-full gta-map-container" />
  );
}

export type { MapListing };
