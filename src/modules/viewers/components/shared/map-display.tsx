"use client";

import { useEffect, useRef, useCallback } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "leaflet-draw";
import "leaflet-draw/dist/leaflet.draw.css";
import type { ViewerFeature, ViewerFeatureCollection, ClassificationItem } from "../../types";

interface MapDisplayProps {
  mapInstance: L.Map | null;
  features: ViewerFeatureCollection;
  classifications: ClassificationItem[];
  isDrawing: boolean;
  selectedFeatureId: string | null;
  onFeatureCreated?: (feature: ViewerFeature) => void;
  onFeatureSelected?: (id: string | null) => void;
  onDrawingStop?: () => void;
  tileUrl?: string;
}

export function MapDisplay({
  mapInstance,
  features,
  classifications,
  isDrawing,
  selectedFeatureId,
  onFeatureCreated,
  onFeatureSelected,
  onDrawingStop,
  tileUrl,
}: MapDisplayProps) {
  const featuresLayerRef = useRef<L.LayerGroup | null>(null);
  const drawControlRef = useRef<L.Control.Draw | null>(null);
  const drawnItemsRef = useRef<L.FeatureGroup | null>(null);
  const overlayTileRef = useRef<L.TileLayer | null>(null);

  // Initialize features layer group
  useEffect(() => {
    const map = mapInstance;
    if (!map) return;

    if (!featuresLayerRef.current) {
      featuresLayerRef.current = L.layerGroup().addTo(map);
    }
    if (!drawnItemsRef.current) {
      drawnItemsRef.current = L.featureGroup().addTo(map);
    }

    return () => {
      featuresLayerRef.current?.remove();
      featuresLayerRef.current = null;
      drawnItemsRef.current?.remove();
      drawnItemsRef.current = null;
    };
  }, [mapInstance]);

  // Add tileset overlay
  useEffect(() => {
    const map = mapInstance;
    if (!map || !tileUrl) return;

    if (overlayTileRef.current) {
      overlayTileRef.current.remove();
    }

    overlayTileRef.current = L.tileLayer(tileUrl, {
      maxZoom: 22,
      opacity: 1,
    }).addTo(map);

    return () => {
      overlayTileRef.current?.remove();
      overlayTileRef.current = null;
    };
  }, [mapInstance, tileUrl]);

  // Render features as polygons
  useEffect(() => {
    const layer = featuresLayerRef.current;
    if (!layer) return;

    layer.clearLayers();

    for (const feature of features.features) {
      const classification = classifications.find(
        (c) => c.id === feature.properties.classificationId
      );
      const color = classification?.color || "#3388ff";
      const isSelected = feature.id === selectedFeatureId;

      if (feature.geometry.type === "Polygon") {
        const coords = (feature.geometry.coordinates[0] as number[][]).map(
          ([lng, lat]) => [lat, lng] as L.LatLngExpression
        );
        const polygon = L.polygon(coords, {
          color: isSelected ? "#ffffff" : color,
          weight: isSelected ? 3 : 2,
          fillColor: color,
          fillOpacity: isSelected ? 0.5 : 0.3,
          dashArray: isSelected ? "5, 5" : undefined,
        });

        polygon.on("click", () => {
          onFeatureSelected?.(feature.id);
        });

        if (feature.properties.name) {
          polygon.bindTooltip(feature.properties.name, { sticky: true });
        }

        polygon.addTo(layer);
      }
    }
  }, [features, classifications, selectedFeatureId, onFeatureSelected, mapInstance]); // Added mapInstance dependency to ensure layer exists

  // Handle drawing mode
  useEffect(() => {
    const map = mapInstance;
    const drawnItems = drawnItemsRef.current;
    if (!map || !drawnItems) return;

    if (isDrawing) {
      if (drawControlRef.current) {
        map.removeControl(drawControlRef.current);
      }

      drawControlRef.current = new L.Control.Draw({
        position: "topleft",
        draw: {
          polygon: {
            allowIntersection: false,
            showArea: true,
            shapeOptions: { color: "#3388ff", weight: 2 },
          },
          polyline: false,
          circle: false,
          rectangle: {
            shapeOptions: { color: "#3388ff", weight: 2 },
          },
          marker: false,
          circlemarker: false,
        },
        edit: {
          featureGroup: drawnItems,
        },
      });
      map.addControl(drawControlRef.current);

      const onCreated = (e: any) => {
        const layer = e.layer as L.Polygon;
        const latLngs = layer.getLatLngs()[0] as L.LatLng[];
        const coordinates = latLngs.map((ll) => [ll.lng, ll.lat]);
        coordinates.push(coordinates[0]); // close ring

        const feature: ViewerFeature = {
          id: `f-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
          type: "Feature",
          geometry: {
            type: "Polygon",
            coordinates: [coordinates],
          },
          properties: {},
        };

        onFeatureCreated?.(feature);
        onDrawingStop?.();

        // Remove the drawn layer (we render from state)
        map.removeLayer(layer);
      };

      map.on(L.Draw.Event.CREATED, onCreated);

      return () => {
        map.off(L.Draw.Event.CREATED, onCreated);
      };
    } else {
      if (drawControlRef.current) {
        map.removeControl(drawControlRef.current);
        drawControlRef.current = null;
      }
    }
  }, [isDrawing, mapInstance, onFeatureCreated, onDrawingStop]);

  return null;
}
