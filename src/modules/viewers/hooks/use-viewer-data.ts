"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

interface ViewerApiResponse {
  success: boolean;
  data: {
    job: {
      id: number;
      name: string | null;
      pipeline: string | null;
      siteId: number;
    };
    product: Record<string, unknown>;
    productIndex: number;
    site: {
      id: number;
      name: string;
      coordinates: [number, number] | null;
      boundary: [number, number][] | null;
    } | null;
    deliverables: Record<string, string>;
  };
  error?: string;
}

interface TilesetApiResponse {
  success: boolean;
  data: {
    tileset: {
      id: number;
      name: string;
      path: string;
      attribution: Record<string, string> | null;
      preset: string | null;
      tilesetOptions: Record<string, unknown> | null;
    } | null;
  };
}

export function useViewerData(jobProductId: string) {
  return useQuery<ViewerApiResponse["data"]>({
    queryKey: ["viewer", jobProductId],
    queryFn: async () => {
      const res = await fetch(`/api/viewer/${jobProductId}`);
      const json: ViewerApiResponse = await res.json();
      if (!json.success) throw new Error(json.error || "Failed to load viewer data");
      return json.data;
    },
    enabled: !!jobProductId,
  });
}

export function useViewerTileset(jobProductId: string) {
  return useQuery<TilesetApiResponse["data"]["tileset"]>({
    queryKey: ["viewer", jobProductId, "tileset"],
    queryFn: async () => {
      const res = await fetch(`/api/viewer/${jobProductId}/tileset`);
      const json: TilesetApiResponse = await res.json();
      if (!json.success) throw new Error("Failed to load tileset");
      return json.data.tileset;
    },
    enabled: !!jobProductId,
  });
}

export function useUpdateDeliverable(jobProductId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ key, value }: { key: string; value: string }) => {
      const res = await fetch(`/api/viewer/${jobProductId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key, value }),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error || "Failed to save");
      return json.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["viewer", jobProductId] });
    },
  });
}
