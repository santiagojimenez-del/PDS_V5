"use client";

import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

interface SiteMarker {
  id: number;
  name: string;
  address: string | null;
  coordinates: [number, number] | null;
  boundary: [number, number][] | null;
  jobCount: number;
}

interface SitesMapProps {
  sites: SiteMarker[];
  selectedSiteId?: number | null;
  onSiteClick?: (siteId: number) => void;
  className?: string;
}

export function SitesMap({ sites, selectedSiteId, onSiteClick, className }: SitesMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<L.Map | null>(null);
  const markersRef = useRef<L.LayerGroup | null>(null);
  const polygonsRef = useRef<L.LayerGroup | null>(null);

  useEffect(() => {
    if (!mapRef.current || mapInstance.current) return;

    mapInstance.current = L.map(mapRef.current, {
      center: [27.0, -81.8],
      zoom: 8,
      zoomControl: true,
    });

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      maxZoom: 19,
    }).addTo(mapInstance.current);

    markersRef.current = L.layerGroup().addTo(mapInstance.current);
    polygonsRef.current = L.layerGroup().addTo(mapInstance.current);

    return () => {
      mapInstance.current?.remove();
      mapInstance.current = null;
    };
  }, []);

  useEffect(() => {
    if (!mapInstance.current || !markersRef.current || !polygonsRef.current) return;

    markersRef.current.clearLayers();
    polygonsRef.current.clearLayers();

    const bounds: L.LatLngExpression[] = [];

    const orangeIcon = L.divIcon({
      className: "custom-marker",
      html: `<div style="
        width: 28px; height: 28px; border-radius: 50%;
        background: #ff6600; border: 3px solid white;
        box-shadow: 0 2px 6px rgba(0,0,0,0.3);
        display: flex; align-items: center; justify-content: center;
      "><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg></div>`,
      iconSize: [28, 28],
      iconAnchor: [14, 14],
    });

    const selectedIcon = L.divIcon({
      className: "custom-marker",
      html: `<div style="
        width: 36px; height: 36px; border-radius: 50%;
        background: #ff6600; border: 3px solid #2c2c2c;
        box-shadow: 0 2px 10px rgba(255,102,0,0.5);
        display: flex; align-items: center; justify-content: center;
      "><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg></div>`,
      iconSize: [36, 36],
      iconAnchor: [18, 18],
    });

    for (const site of sites) {
      if (!site.coordinates || !Array.isArray(site.coordinates) || site.coordinates.length < 2) continue;

      const [lat, lng] = site.coordinates;
      if (typeof lat !== "number" || typeof lng !== "number") continue;

      const isSelected = site.id === selectedSiteId;
      const marker = L.marker([lat, lng], {
        icon: isSelected ? selectedIcon : orangeIcon,
        zIndexOffset: isSelected ? 1000 : 0,
      });

      marker.bindPopup(`
        <div style="min-width: 160px;">
          <strong style="font-size: 13px;">${site.name}</strong>
          ${site.address ? `<br><span style="font-size: 11px; color: #666;">${site.address}</span>` : ""}
          <br><span style="font-size: 11px; color: #ff6600; font-weight: 600;">${site.jobCount} job${site.jobCount !== 1 ? "s" : ""}</span>
        </div>
      `);

      if (onSiteClick) {
        marker.on("click", () => onSiteClick(site.id));
      }

      marker.addTo(markersRef.current!);
      bounds.push([lat, lng]);

      // Draw boundary polygon
      if (site.boundary && Array.isArray(site.boundary) && site.boundary.length > 2) {
        const polygon = L.polygon(
          site.boundary.map(([pLat, pLng]) => [pLat, pLng] as L.LatLngExpression),
          {
            color: isSelected ? "#ff6600" : "#ff6600",
            weight: isSelected ? 3 : 2,
            opacity: isSelected ? 0.9 : 0.5,
            fillColor: "#ff6600",
            fillOpacity: isSelected ? 0.15 : 0.05,
          }
        );
        polygon.addTo(polygonsRef.current!);
      }
    }

    if (bounds.length > 0) {
      mapInstance.current.fitBounds(L.latLngBounds(bounds), { padding: [40, 40], maxZoom: 14 });
    }
  }, [sites, selectedSiteId, onSiteClick]);

  return (
    <div
      ref={mapRef}
      className={className || "h-[400px] w-full rounded-lg border"}
      style={{ zIndex: 0 }}
    />
  );
}
