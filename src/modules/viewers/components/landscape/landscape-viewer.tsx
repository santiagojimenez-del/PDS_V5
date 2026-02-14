"use client";

import { useEffect, useState, useCallback } from "react";
import { ViewerContainer } from "../shared/viewer-container";
import { MapDisplay } from "../shared/map-display";
import { Toolbar } from "../shared/toolbar";
import { ClassificationSidebar } from "../shared/classification-sidebar";
import { ViewsPanel } from "./views-panel";
import { LayerToggle } from "./layer-toggle";
import { useMapInstance } from "../../hooks/use-map-instance";
import { useDrawingTools } from "../../hooks/use-drawing-tools";
import { useViewerData, useViewerTileset, useUpdateDeliverable } from "../../hooks/use-viewer-data";
import { parseDeliverableJSON, stringifyDeliverableJSON } from "../../services/deliverables-client";
import type { ClassificationItem, SavedView, ViewerFeatureCollection } from "../../types";

interface LandscapeViewerProps {
  jobProductId: string;
}

export function LandscapeViewer({ jobProductId }: LandscapeViewerProps) {
  const { data, isLoading, error } = useViewerData(jobProductId);
  const { data: tileset } = useViewerTileset(jobProductId);
  const updateDeliverable = useUpdateDeliverable(jobProductId);

  const center = data?.site?.coordinates ?? [27.0, -81.8] as [number, number];

  const { mapRef, mapInstance, flyTo } = useMapInstance({
    center: center as [number, number],
    zoom: 16,
  });

  const {
    features,
    isDrawing,
    setIsDrawing,
    selectedFeatureId,
    setSelectedFeatureId,
    addFeature,
    deleteFeature,
    replaceFeatures,
  } = useDrawingTools();

  const [classifications, setClassifications] = useState<ClassificationItem[]>([]);
  const [selectedClassificationId, setSelectedClassificationId] = useState<string | null>(null);
  const [savedViews, setSavedViews] = useState<SavedView[]>([]);
  const [layers, setLayers] = useState({
    tileset: true,
    parcels: false,
    roads: false,
    areas: true,
  });

  // Load deliverables into state
  useEffect(() => {
    if (!data?.deliverables) return;
    const d = data.deliverables;

    const loadedFeatures = parseDeliverableJSON<ViewerFeatureCollection>(d.features);
    if (loadedFeatures) replaceFeatures(loadedFeatures);

    const loadedClassifications = parseDeliverableJSON<ClassificationItem[]>(d.classifications);
    if (loadedClassifications) setClassifications(loadedClassifications);

    const loadedViews = parseDeliverableJSON<SavedView[]>(d.saved_views);
    if (loadedViews) setSavedViews(loadedViews);

    const loadedLayers = parseDeliverableJSON<typeof layers>(d.layers);
    if (loadedLayers) setLayers(loadedLayers);
  }, [data?.deliverables, replaceFeatures]);

  // Center map on site when data loads
  useEffect(() => {
    if (data?.site?.coordinates && mapInstance) {
      const [lat, lng] = data.site.coordinates;
      mapInstance.setView([lat, lng], 16);
    }
  }, [data?.site?.coordinates, mapInstance]);

  const tileUrl = tileset
    ? `/api/tiles/${tileset.path}/{z}/{x}/{y}.png`
    : undefined;

  const handleSave = useCallback(async () => {
    await Promise.all([
      updateDeliverable.mutateAsync({
        key: "features",
        value: stringifyDeliverableJSON(features),
      }),
      updateDeliverable.mutateAsync({
        key: "classifications",
        value: stringifyDeliverableJSON(classifications),
      }),
      updateDeliverable.mutateAsync({
        key: "saved_views",
        value: stringifyDeliverableJSON(savedViews),
      }),
      updateDeliverable.mutateAsync({
        key: "layers",
        value: stringifyDeliverableJSON(layers),
      }),
    ]);
  }, [features, classifications, savedViews, layers, updateDeliverable]);

  const handleAddClassification = (item: ClassificationItem) => {
    setClassifications((prev) => [...prev, item]);
  };

  const handleRemoveClassification = (id: string) => {
    setClassifications((prev) => prev.filter((c) => c.id !== id));
  };

  const handleColorChange = (id: string, color: string) => {
    setClassifications((prev) =>
      prev.map((c) => (c.id === id ? { ...c, color } : c))
    );
  };

  const handleSaveView = (view: SavedView) => {
    setSavedViews((prev) => [...prev, view]);
  };

  const handleDeleteView = (id: string) => {
    setSavedViews((prev) => prev.filter((v) => v.id !== id));
  };

  const handleGoToView = (view: SavedView) => {
    flyTo(view.center[0], view.center[1], view.zoom);
  };

  const getCurrentView = (): { center: [number, number]; zoom: number } | null => {
    const map = mapInstance;
    if (!map) return null;
    const c = map.getCenter();
    return { center: [c.lat, c.lng], zoom: map.getZoom() };
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-muted-foreground text-sm">Loading viewer...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-destructive text-sm">
          Error: {error instanceof Error ? error.message : "Failed to load"}
        </div>
      </div>
    );
  }



  return (
    <ViewerContainer>
      <Toolbar
        viewerType="landscape"
        jobName={data?.job.name}
        isDrawing={isDrawing}
        hasSelection={!!selectedFeatureId}
        isSaving={updateDeliverable.isPending}
        onDraw={() => setIsDrawing(true)}
        onSelect={() => setIsDrawing(false)}
        onSave={handleSave}
        onDelete={() => {
          if (selectedFeatureId) deleteFeature(selectedFeatureId);
        }}
        backUrl={data?.job.id ? `/client/job/${data.job.id}` : undefined}
      />

      {/* Only render MapDisplay if we are on client to avoid Leaflet SSR issues */}
      <div
        ref={mapRef}
        className="absolute inset-0 z-0"
        style={{ height: "100%", width: "100%" }}
      />

      <MapDisplay
        mapInstance={mapInstance}
        features={features}
        classifications={classifications}
        isDrawing={isDrawing}
        selectedFeatureId={selectedFeatureId}
        onFeatureCreated={(f) => {
          if (selectedClassificationId) {
            f.properties.classificationId = selectedClassificationId;
          }
          addFeature(f);
        }}
        onFeatureSelected={setSelectedFeatureId}
        onDrawingStop={() => setIsDrawing(false)}
        tileUrl={layers.tileset ? tileUrl : undefined}
      />

      <ClassificationSidebar
        classifications={classifications}
        selectedClassificationId={selectedClassificationId}
        onAdd={handleAddClassification}
        onRemove={handleRemoveClassification}
        onSelect={setSelectedClassificationId}
        onColorChange={handleColorChange}
      />

      <ViewsPanel
        views={savedViews}
        onSaveView={handleSaveView}
        onDeleteView={handleDeleteView}
        onGoToView={handleGoToView}
        getCurrentView={getCurrentView}
      />

      <LayerToggle
        layers={layers}
        onToggle={(key) => setLayers((prev) => ({ ...prev, [key]: !prev[key] }))}
      />
    </ViewerContainer>
  );
}
