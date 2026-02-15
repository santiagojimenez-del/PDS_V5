"use client";

import { useEffect, useState, useCallback } from "react";
import { ViewerContainer } from "../shared/viewer-container";
import { MapDisplay } from "../shared/map-display";
import { Toolbar } from "../shared/toolbar";
import { ClassificationSidebar } from "../shared/classification-sidebar";
import { useMapInstance } from "../../hooks/use-map-instance";
import { useDrawingTools } from "../../hooks/use-drawing-tools";
import { useViewerData, useViewerTileset, useUpdateDeliverable } from "../../hooks/use-viewer-data";
import { parseDeliverableJSON, stringifyDeliverableJSON } from "../../services/deliverables-client";
import type { ClassificationItem, ViewerFeatureCollection } from "../../types";

interface ConstructViewerProps {
  jobProductId: string;
}

export function ConstructViewer({ jobProductId }: ConstructViewerProps) {
  const { data, isLoading, error } = useViewerData(jobProductId);
  const { data: tileset } = useViewerTileset(jobProductId);
  const updateDeliverable = useUpdateDeliverable(jobProductId);

  const center = data?.site?.coordinates ?? [27.0, -81.8] as [number, number];

  const { mapRef, mapInstance } = useMapInstance({
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

  // Load deliverables into state
  useEffect(() => {
    if (!data?.deliverables) return;
    const d = data.deliverables;

    const loadedFeatures = parseDeliverableJSON<ViewerFeatureCollection>(d.features);
    if (loadedFeatures) replaceFeatures(loadedFeatures);

    const loadedClassifications = parseDeliverableJSON<ClassificationItem[]>(d.classifications);
    if (loadedClassifications) setClassifications(loadedClassifications);
  }, [data?.deliverables, replaceFeatures]);

  // Center map on site
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
    ]);
  }, [features, classifications, updateDeliverable]);

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
        viewerType="construct"
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

      {/* Map container div for Leaflet */}
      <div ref={mapRef} className="absolute inset-0 z-0" />

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
        tileUrl={tileUrl}
      />

      <ClassificationSidebar
        classifications={classifications}
        selectedClassificationId={selectedClassificationId}
        onAdd={(item) => setClassifications((prev) => [...prev, item])}
        onRemove={(id) => setClassifications((prev) => prev.filter((c) => c.id !== id))}
        onSelect={setSelectedClassificationId}
        onColorChange={(id, color) =>
          setClassifications((prev) => prev.map((c) => (c.id === id ? { ...c, color } : c)))
        }
      />
    </ViewerContainer>
  );
}
