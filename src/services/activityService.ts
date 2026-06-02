import { API_CONFIG } from "../config/api";
import { apiRequest } from "./apiClient";
import type { ActivityResult, ActivitySearchRequest } from "../types/search";

type GeoapifyFeatureCollection = {
  type: string;
  features?: ActivityResult[];
};

function inferPoiType(categories?: string[]): string | undefined {
  if (!categories?.length) return undefined;

  if (categories.includes("tourism.sights.square")) return "SQUARE";
  if (categories.includes("tourism.sights.memorial")) return "MEMORIAL";
  if (categories.includes("tourism.sights.building")) return "BUILDING";
  if (categories.includes("tourism.attraction.artwork.statue")) return "STATUE";
  if (categories.includes("tourism.attraction.artwork.mural")) return "MURAL";
  if (categories.includes("tourism.attraction.clock")) return "CLOCK";
  if (categories.includes("tourism.attraction.artwork")) return "ARTWORK";
  if (categories.includes("tourism.attraction")) return "ATTRACTION";
  if (categories.includes("tourism.sights")) return "SIGHT";
  if (categories.includes("tourism")) return "TOURISM";

  if (categories.includes("office.government")) return "GOVERNMENT_OFFICE";
  if (categories.includes("building.historic")) return "HISTORIC_BUILDING";
  if (categories.includes("highway.pedestrian")) return "PEDESTRIAN_AREA";

  return categories[0]?.toUpperCase().replaceAll(".", "_");
}

export async function searchActivities(
  request: ActivitySearchRequest
): Promise<ActivityResult[]> {
  const radiusMeters = request.radius ?? 3000;

  const params = new URLSearchParams({
    lat: String(request.lat),
    lon: String(request.lon),
    radiusMeters: String(radiusMeters),
  });

  const data = await apiRequest<GeoapifyFeatureCollection>(
    `${API_CONFIG.baseUrl}${API_CONFIG.activities.path}?${params.toString()}`,
    {
      method: API_CONFIG.activities.method,
    }
  );

  return (data.features ?? [])
    .filter((feature) => feature.properties?.name)
    .map((feature) => ({
      ...feature,
      properties: {
        ...feature.properties,
        inferredType: inferPoiType(feature.properties?.categories),
      },
    }));
}