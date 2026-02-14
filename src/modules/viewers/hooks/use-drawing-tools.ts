"use client";

import { useState, useCallback } from "react";
import type { ViewerFeature, ViewerFeatureCollection } from "../types";

export function useDrawingTools(initialFeatures?: ViewerFeatureCollection) {
  const [features, setFeatures] = useState<ViewerFeatureCollection>(
    initialFeatures || { type: "FeatureCollection", features: [] }
  );
  const [isDrawing, setIsDrawing] = useState(false);
  const [selectedFeatureId, setSelectedFeatureId] = useState<string | null>(null);

  const addFeature = useCallback((feature: ViewerFeature) => {
    setFeatures((prev) => ({
      ...prev,
      features: [...prev.features, feature],
    }));
  }, []);

  const updateFeature = useCallback((id: string, updates: Partial<ViewerFeature>) => {
    setFeatures((prev) => ({
      ...prev,
      features: prev.features.map((f) =>
        f.id === id ? { ...f, ...updates } : f
      ),
    }));
  }, []);

  const deleteFeature = useCallback((id: string) => {
    setFeatures((prev) => ({
      ...prev,
      features: prev.features.filter((f) => f.id !== id),
    }));
    setSelectedFeatureId((current) => (current === id ? null : current));
  }, []);

  const clearFeatures = useCallback(() => {
    setFeatures({ type: "FeatureCollection", features: [] });
    setSelectedFeatureId(null);
  }, []);

  const replaceFeatures = useCallback((fc: ViewerFeatureCollection) => {
    setFeatures(fc);
    setSelectedFeatureId(null);
  }, []);

  return {
    features,
    isDrawing,
    setIsDrawing,
    selectedFeatureId,
    setSelectedFeatureId,
    addFeature,
    updateFeature,
    deleteFeature,
    clearFeatures,
    replaceFeatures,
  };
}
