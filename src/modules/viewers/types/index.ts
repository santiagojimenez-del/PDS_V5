// ── GeoJSON Types ────────────────────────────────────────────────────────────

export interface ViewerFeature {
  id: string;
  type: "Feature";
  geometry: {
    type: "Polygon" | "MultiPolygon";
    coordinates: number[][][] | number[][][][];
  };
  properties: {
    classificationId?: string;
    name?: string;
    notes?: string;
    [key: string]: unknown;
  };
}

export interface ViewerFeatureCollection {
  type: "FeatureCollection";
  features: ViewerFeature[];
}

// ── Classification ───────────────────────────────────────────────────────────

export interface ClassificationItem {
  id: string;
  name: string;
  color: string;
}

// ── Saved Views ──────────────────────────────────────────────────────────────

export interface SavedView {
  id: string;
  name: string;
  center: [number, number];
  zoom: number;
}

// ── Tileset ──────────────────────────────────────────────────────────────────

export interface TilesetInfo {
  id: number;
  name: string;
  path: string;
  attribution: Record<string, string> | null;
  preset: string | null;
  tilesetOptions: Record<string, unknown> | null;
}

// ── Viewer Job ───────────────────────────────────────────────────────────────

export interface ViewerJob {
  id: number;
  name: string | null;
  pipeline: string | null;
  siteId: number;
  siteName?: string;
  products: Array<{
    id: number;
    name: string;
    [key: string]: unknown;
  }>;
}

// ── Deliverable Data ─────────────────────────────────────────────────────────

export interface BaseDeliverableData {
  jobProductId: string;
  tilesetId?: number;
  features?: ViewerFeatureCollection;
  classifications?: ClassificationItem[];
  savedViews?: SavedView[];
  center?: [number, number];
  zoom?: number;
}

// ── Viewer Types ─────────────────────────────────────────────────────────────

export type ViewerType = "landscape" | "community" | "construct";

export interface ViewerPageProps {
  params: Promise<{ jobProductId: string }>;
}
