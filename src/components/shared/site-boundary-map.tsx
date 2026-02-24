"use client";

import { useEffect, useRef, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "leaflet-draw";
import "leaflet-draw/dist/leaflet.draw.css";
import { Button } from "@/components/ui/button";
import { IconPencil, IconTrash, IconCheck, IconX } from "@tabler/icons-react";

interface SiteBoundaryMapProps {
  coordinates: [number, number] | null; // [lat, lng]
  boundary: any; // GeoJSON Polygon or null
  onBoundaryChange?: (geojson: any | null) => void;
  height?: string;
  readOnly?: boolean;
}

const SITE_ICON = L.divIcon({
  className: "",
  html: `<div style="
    width:28px;height:28px;border-radius:50%;
    background:#ff6600;border:3px solid white;
    box-shadow:0 2px 6px rgba(0,0,0,0.3);
    display:flex;align-items:center;justify-content:center;
  "><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5">
    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
    <circle cx="12" cy="10" r="3"/>
  </svg></div>`,
  iconSize: [28, 28],
  iconAnchor: [14, 14],
});

export function SiteBoundaryMap({
  coordinates,
  boundary,
  onBoundaryChange,
  height = "400px",
  readOnly = false,
}: SiteBoundaryMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const drawnItemsRef = useRef<L.FeatureGroup | null>(null);
  const drawControlRef = useRef<any>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasBoundary, setHasBoundary] = useState(false);

  // Initialize map
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const center: L.LatLngExpression = coordinates ?? [27.0, -81.8];

    mapRef.current = L.map(containerRef.current, {
      center,
      zoom: coordinates ? 14 : 8,
    });

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: '&copy; OpenStreetMap contributors',
      maxZoom: 19,
    }).addTo(mapRef.current);

    drawnItemsRef.current = new L.FeatureGroup();
    mapRef.current.addLayer(drawnItemsRef.current);

    return () => {
      mapRef.current?.remove();
      mapRef.current = null;
    };
  }, []);

  // Render site marker whenever coordinates change
  useEffect(() => {
    if (!mapRef.current) return;
    // Remove old marker layer (not draw items)
    mapRef.current.eachLayer((layer) => {
      if ((layer as any)._isSiteMarker) mapRef.current!.removeLayer(layer);
    });
    if (coordinates) {
      const marker = L.marker(coordinates, { icon: SITE_ICON }) as any;
      marker._isSiteMarker = true;
      marker.addTo(mapRef.current);
    }
  }, [coordinates]);

  // Render existing boundary
  useEffect(() => {
    if (!mapRef.current || !drawnItemsRef.current) return;
    drawnItemsRef.current.clearLayers();
    setHasBoundary(false);

    if (!boundary) return;

    try {
      let latLngs: L.LatLngExpression[] = [];

      if (boundary.type === "Polygon" && Array.isArray(boundary.coordinates)) {
        // GeoJSON [lng, lat] → Leaflet [lat, lng]
        latLngs = (boundary.coordinates[0] as [number, number][]).map(
          ([lng, lat]) => [lat, lng] as L.LatLngExpression
        );
      } else if (Array.isArray(boundary) && boundary.length >= 3) {
        latLngs = boundary as L.LatLngExpression[];
      }

      if (latLngs.length >= 3) {
        const polygon = L.polygon(latLngs, {
          color: "#3b82f6",
          weight: 2,
          fillOpacity: 0.15,
        });
        drawnItemsRef.current.addLayer(polygon);
        setHasBoundary(true);

        // Fit map to boundary
        const bounds = polygon.getBounds();
        if (bounds.isValid()) mapRef.current.fitBounds(bounds, { padding: [40, 40] });
      }
    } catch {
      // Invalid boundary data - skip
    }
  }, [boundary]);

  function startDrawing() {
    if (!mapRef.current || !drawnItemsRef.current) return;
    setIsDrawing(true);

    // Clear existing drawn boundary
    drawnItemsRef.current.clearLayers();
    setHasBoundary(false);

    const options = {
      position: "topright" as L.ControlPosition,
      draw: {
        polygon: {
          allowIntersection: false,
          showArea: true,
          shapeOptions: { color: "#3b82f6", weight: 2, fillOpacity: 0.15 },
        },
        polyline: false,
        circle: false,
        rectangle: false,
        marker: false,
        circlemarker: false,
      },
      edit: { featureGroup: drawnItemsRef.current },
    };

    drawControlRef.current = new (L.Control as any).Draw(options);
    mapRef.current.addControl(drawControlRef.current);

    // Auto-activate polygon tool
    setTimeout(() => {
      const btn = containerRef.current?.querySelector(".leaflet-draw-draw-polygon") as HTMLElement;
      btn?.click();
    }, 100);

    mapRef.current.on((L as any).Draw.Event.CREATED, onDrawCreated);
  }

  function onDrawCreated(e: any) {
    if (!mapRef.current || !drawnItemsRef.current) return;

    const layer = e.layer as L.Polygon;
    drawnItemsRef.current.addLayer(layer);
    setHasBoundary(true);
    stopDrawMode();

    // Build GeoJSON Polygon (close ring)
    const latLngs = (layer.getLatLngs()[0] as L.LatLng[]);
    const coords = latLngs.map((ll) => [ll.lng, ll.lat] as [number, number]);
    coords.push(coords[0]); // close the ring

    const geojson = {
      type: "Polygon",
      coordinates: [coords],
    };

    onBoundaryChange?.(geojson);
  }

  function stopDrawMode() {
    if (!mapRef.current) return;
    mapRef.current.off((L as any).Draw.Event.CREATED, onDrawCreated);
    if (drawControlRef.current) {
      mapRef.current.removeControl(drawControlRef.current);
      drawControlRef.current = null;
    }
    setIsDrawing(false);
  }

  function clearBoundary() {
    drawnItemsRef.current?.clearLayers();
    setHasBoundary(false);
    onBoundaryChange?.(null);
    stopDrawMode();
  }

  return (
    <div className="space-y-2">
      <div ref={containerRef} style={{ height, width: "100%" }} className="rounded-lg border overflow-hidden" />

      {!readOnly && (
        <div className="flex items-center gap-2">
          {!isDrawing ? (
            <>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={startDrawing}
              >
                <IconPencil className="mr-1.5 h-4 w-4" />
                {hasBoundary ? "Redraw Boundary" : "Draw Boundary"}
              </Button>
              {hasBoundary && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="text-destructive hover:text-destructive"
                  onClick={clearBoundary}
                >
                  <IconTrash className="mr-1.5 h-4 w-4" />
                  Clear Boundary
                </Button>
              )}
            </>
          ) : (
            <>
              <p className="text-sm text-muted-foreground">
                Click on the map to draw the site boundary polygon. Click the first point to close.
              </p>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={stopDrawMode}
              >
                <IconX className="mr-1.5 h-4 w-4" />
                Cancel
              </Button>
            </>
          )}
        </div>
      )}
    </div>
  );
}
