"use client";

import { useQuery } from "@tanstack/react-query";
import type { AppConfig, MaintenanceConfig, PipeConfig, RoleConfig } from "../types";

async function fetchConfig(app: string): Promise<AppConfig> {
  const res = await fetch(`/api/config?app=${app}`);
  if (!res.ok) throw new Error("Failed to fetch config");
  return res.json();
}

export function useConfig(app: string) {
  return useQuery({
    queryKey: ["config", app],
    queryFn: () => fetchConfig(app),
    staleTime: 6 * 60 * 60 * 1000, // 6 hours
  });
}

export function useMaintenanceConfig(config: AppConfig | undefined) {
  if (!config?.maintenance) return null;
  return config.maintenance as MaintenanceConfig;
}

export function usePipesConfig(config: AppConfig | undefined) {
  if (!config?.pipes) return [];
  return config.pipes as PipeConfig[];
}

export function useRolesConfig(config: AppConfig | undefined) {
  if (!config?.roles) return [];
  return config.roles as RoleConfig[];
}
