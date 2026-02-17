"use client";

import { useEffect, useRef, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

interface UseMapInstanceOptions {
  center?: [number, number];
  zoom?: number;
  tileUrl?: string;
  attribution?: string;
  maxZoom?: number;
  minZoom?: number;
}

export function useMapInstance(options: UseMapInstanceOptions = {}) {
  const {
    center = [27.0, -81.8],
    zoom = 12,
    tileUrl = "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
    attribution = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    maxZoom = 22,
    minZoom = 2,
  } = options;

  // Use state for the container ref so we can react when it's attached
  const [mapContainer, setMapContainer] = useState<HTMLDivElement | null>(null);
  const [mapInstance, setMapInstance] = useState<L.Map | null>(null);
  const baseTileLayer = useRef<L.TileLayer | null>(null);

  useEffect(() => {
    // Wait until the container is available and we don't have a map yet
    if (!mapContainer || mapInstance) return;

    const map = L.map(mapContainer, {
      center,
      zoom,
      zoomControl: true,
      attributionControl: true,
      maxZoom,
      minZoom,
    });

    baseTileLayer.current = L.tileLayer(tileUrl, {
      attribution,
      maxZoom,
    }).addTo(map);

    setMapInstance(map);

    // Force resize after render to avoid grey tiles
    // Add safety check to ensure map is still attached to DOM
    setTimeout(() => {
      try {
        if (map && map.getContainer()) {
          map.invalidateSize();
        }
      } catch (error) {
        console.warn('Failed to invalidate map size:', error);
      }
    }, 100);

    return () => {
      map.remove();
      setMapInstance(null);
      baseTileLayer.current = null;
    };
    // Re-run if mapContainer changes (i.e. mounted)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mapContainer]);

  const setTileUrl = (url: string, attr?: string) => {
    if (!mapInstance) return;
    if (baseTileLayer.current) {
      baseTileLayer.current.setUrl(url);
      if (attr) {
        baseTileLayer.current.options.attribution = attr;
        // Accessing private/internal properties in Leaflet can be tricky, 
        // safer to just update the layer options if needed or re-add
      }
    }
  };

  const addOverlayTileLayer = (url: string, opts?: L.TileLayerOptions): L.TileLayer | null => {
    if (!mapInstance) return null;
    const layer = L.tileLayer(url, { maxZoom: 22, ...opts }).addTo(mapInstance);
    return layer;
  };

  const flyTo = (lat: number, lng: number, z?: number) => {
    mapInstance?.flyTo([lat, lng], z ?? mapInstance.getZoom());
  };

  const fitBounds = (bounds: L.LatLngBoundsExpression, padding?: number) => {
    mapInstance?.fitBounds(bounds, { padding: [padding ?? 40, padding ?? 40] });
  };

  return {
    mapRef: setMapContainer, // expose setter as the ref callback
    mapInstance, // now a state variable
    setTileUrl,
    addOverlayTileLayer,
    flyTo,
    fitBounds,
  };
}
