"use client";

import { useEffect, useState, useCallback } from "react";
import { ViewerContainer } from "../shared/viewer-container";
import { MapDisplay } from "../shared/map-display";
import { Toolbar } from "../shared/toolbar";
import { ClassificationSidebar } from "../shared/classification-sidebar";
import { ControlPanel } from "../shared/control-panel";
import { CompliancePanel } from "./compliance-panel";
import { PropertyOverlay } from "./property-overlay";
import { useMapInstance } from "../../hooks/use-map-instance";
import { useDrawingTools } from "../../hooks/use-drawing-tools";
import { useViewerData, useViewerTileset, useUpdateDeliverable } from "../../hooks/use-viewer-data";
import { parseDeliverableJSON, stringifyDeliverableJSON } from "../../services/deliverables-client";
import type { ClassificationItem, SavedView, ViewerFeatureCollection } from "../../types";
import type { ComplianceEntry } from "../../types/community";

interface CommunityViewerProps {
  jobProductId: string;
}

export function CommunityViewer({ jobProductId }: CommunityViewerProps) {
  const { data, isLoading, error } = useViewerData(jobProductId);
  const { data: tileset } = useViewerTileset(jobProductId);
  const updateDeliverable = useUpdateDeliverable(jobProductId);

  // Helper to normalize coordinates (handle both array and object formats)
  const normalizeCoordinates = (coords: any): [number, number] => {
    if (!coords) return [27.0, -81.8];
    if (Array.isArray(coords) && coords.length >= 2) {
      return [coords[0], coords[1]];
    }
    if (typeof coords === 'object' && 'lat' in coords && 'lng' in coords) {
      return [coords.lat, coords.lng];
    }
    return [27.0, -81.8];
  };

  const center = normalizeCoordinates(data?.site?.coordinates);

  const { mapRef, mapInstance, flyTo } = useMapInstance({
    center,
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
  const [complianceReports, setComplianceReports] = useState<ComplianceEntry[]>([]);
  const [propertyOverlayEnabled, setPropertyOverlayEnabled] = useState(false);
  const [savedViews, setSavedViews] = useState<SavedView[]>([]);
  const [showTileset, setShowTileset] = useState(true);

  // Load deliverables into state
  useEffect(() => {
    if (!data?.deliverables) return;
    const d = data.deliverables;

    const loadedFeatures = parseDeliverableJSON<ViewerFeatureCollection>(d.features);
    if (loadedFeatures) replaceFeatures(loadedFeatures);

    const loadedClassifications = parseDeliverableJSON<ClassificationItem[]>(d.classifications);
    if (loadedClassifications) setClassifications(loadedClassifications);

    const loadedReports = parseDeliverableJSON<ComplianceEntry[]>(d.compliance_reports);
    if (loadedReports) setComplianceReports(loadedReports);

    const loadedViews = parseDeliverableJSON<SavedView[]>(d.saved_views);
    if (loadedViews) setSavedViews(loadedViews);

    const loadedTilesetState = parseDeliverableJSON<boolean>(d.show_tileset);
    if (loadedTilesetState !== null && loadedTilesetState !== undefined) {
      setShowTileset(loadedTilesetState);
    }
  }, [data?.deliverables, replaceFeatures]);

  // Center map on site
  useEffect(() => {
    if (data?.site?.coordinates && mapInstance) {
      const [lat, lng] = normalizeCoordinates(data.site.coordinates);
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
        key: "compliance_reports",
        value: stringifyDeliverableJSON(complianceReports),
      }),
      updateDeliverable.mutateAsync({
        key: "saved_views",
        value: stringifyDeliverableJSON(savedViews),
      }),
      updateDeliverable.mutateAsync({
        key: "show_tileset",
        value: stringifyDeliverableJSON(showTileset),
      }),
    ]);
  }, [features, classifications, complianceReports, savedViews, showTileset, updateDeliverable]);

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
        viewerType="community"
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
        tileUrl={showTileset ? tileUrl : undefined}
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

      <ControlPanel
        views={savedViews}
        onSaveView={handleSaveView}
        onDeleteView={handleDeleteView}
        onGoToView={handleGoToView}
        getCurrentView={getCurrentView}
        showTileset={showTileset}
        onToggleTileset={() => setShowTileset(!showTileset)}
      />

      <CompliancePanel reports={complianceReports} />

      <PropertyOverlay
        enabled={propertyOverlayEnabled}
        onToggle={setPropertyOverlayEnabled}
      />
    </ViewerContainer>
  );
}
