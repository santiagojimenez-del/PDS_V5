"use client";

import { useQuery } from "@tanstack/react-query";
import type { AuthUser } from "@/modules/auth/types";

export function useHasPermission(user: AuthUser | null, permission: string): boolean {
  if (!user) return false;
  if (user.roles.includes(0)) return true; // Admin has all permissions
  return user.permissions.includes(permission);
}

export function useHasRole(user: AuthUser | null, roles: number[]): boolean {
  if (!user) return false;
  return user.roles.some((r) => roles.includes(r));
}

export function useCurrentUser() {
  return useQuery({
    queryKey: ["currentUser"],
    queryFn: async () => {
      const res = await fetch("/api/auth/metadata");
      if (!res.ok) return null;
      return res.json();
    },
    staleTime: 5 * 60 * 1000,
    retry: false,
  });
}
