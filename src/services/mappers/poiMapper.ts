// Types (adapt to your existing ones if needed)
export type GeoJSONFeature = {
  geometry?: {
    coordinates?: [number, number];
    type?: string;
  };
  properties?: {
    name?: string | null;
    formatted?: string | null;
    categories?: string[];
    city?: string | null;
    country?: string | null;
  };
};

export type PointOfInterest = {
  id?: string;
  name: string;
  description?: string;
  type?: string;
  category?: string;
  source?: string;
  latitude?: number;
  longitude?: number;
  address?: string;
};

// -----------------------------
// TYPE INFERENCE
// -----------------------------
export function inferPoiType(categories?: string[]): string | undefined {
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

// -----------------------------
// CATEGORY NORMALIZATION
// -----------------------------
export function getPoiCategory(categories?: string[]): string | undefined {
  if (!categories?.length) return undefined;

  // Prefer tourism-related category
  const tourism = categories.find(c => c.startsWith("tourism."));
  if (tourism) return tourism;

  // fallback to first
  return categories[0];
}

// -----------------------------
// SAFE FIELD EXTRACTORS
// -----------------------------
export function getPoiName(feature: GeoJSONFeature): string {
  return (
    feature.properties?.name ??
    feature.properties?.formatted ??
    "Unnamed place"
  );
}

export function getPoiAddress(feature: GeoJSONFeature): string | undefined {
  return feature.properties?.formatted ?? undefined;
}

export function getPoiCoordinates(feature: GeoJSONFeature): {
  latitude?: number;
  longitude?: number;
} {
  const coords = feature.geometry?.coordinates;
  if (!coords || coords.length < 2) return {};

  return {
    longitude: coords[0],
    latitude: coords[1],
  };
}

// -----------------------------
// MAIN MAPPER
// -----------------------------
export function mapFeatureToPoi(feature: GeoJSONFeature): PointOfInterest {
  const categories = feature.properties?.categories;

  const { latitude, longitude } = getPoiCoordinates(feature);

  return {
    id: `${getPoiName(feature)}-${latitude}-${longitude}`,

    name: getPoiName(feature),

    description: categories?.join(", "), // useful fallback

    type: inferPoiType(categories),

    category: getPoiCategory(categories),

    source: "OSM",

    latitude,
    longitude,

    address: getPoiAddress(feature),
  };
}

// -----------------------------
// BULK MAPPER
// -----------------------------
export function mapFeaturesToPois(
  features: GeoJSONFeature[]
): PointOfInterest[] {
  return features
    .map(mapFeatureToPoi)
    .filter(poi => poi.name && poi.latitude && poi.longitude);
}