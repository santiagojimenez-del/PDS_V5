import { useState, useEffect, useCallback } from "react";

export interface RecentItem {
  id: string;
  type: "job" | "site" | "organization" | "user";
  title: string;
  url: string;
  timestamp: number;
}

const STORAGE_KEY = "prodrones_recent_items";
const MAX_ITEMS = 10;

/**
 * Hook to track and retrieve recently viewed items
 */
export function useRecentItems() {
  const [recentItems, setRecentItems] = useState<RecentItem[]>([]);

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const items = JSON.parse(stored) as RecentItem[];
        setRecentItems(items);
      }
    } catch (error) {
      console.error("Failed to load recent items:", error);
    }
  }, []);

  // Add a new recent item
  const addRecentItem = useCallback((item: Omit<RecentItem, "timestamp">) => {
    setRecentItems((prev) => {
      // Remove duplicates (same id and type)
      const filtered = prev.filter(
        (i) => !(i.id === item.id && i.type === item.type)
      );

      // Add new item at the beginning
      const updated = [
        { ...item, timestamp: Date.now() },
        ...filtered,
      ].slice(0, MAX_ITEMS);

      // Save to localStorage
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      } catch (error) {
        console.error("Failed to save recent items:", error);
      }

      return updated;
    });
  }, []);

  // Clear all recent items
  const clearRecentItems = useCallback(() => {
    setRecentItems([]);
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (error) {
      console.error("Failed to clear recent items:", error);
    }
  }, []);

  // Remove a specific item
  const removeRecentItem = useCallback((id: string, type: string) => {
    setRecentItems((prev) => {
      const updated = prev.filter((i) => !(i.id === id && i.type === type));
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      } catch (error) {
        console.error("Failed to update recent items:", error);
      }
      return updated;
    });
  }, []);

  return {
    recentItems,
    addRecentItem,
    clearRecentItems,
    removeRecentItem,
  };
}
