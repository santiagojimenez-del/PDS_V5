import type { BaseDeliverableData } from "./index";

export interface LandscapeDeliverableData extends BaseDeliverableData {
  layers?: {
    tileset: boolean;
    parcels: boolean;
    roads: boolean;
    areas: boolean;
  };
}
