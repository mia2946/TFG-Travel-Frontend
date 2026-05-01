import { API_CONFIG } from "../config/api";
import { apiRequest } from "./apiClient";
import type { PoiResult, PoiSearchRequest } from "../types/search";

function toArray(data: any): PoiResult[] {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.elements)) return data.elements;
  if (Array.isArray(data?.features)) return data.features;
  if (Array.isArray(data?.data)) return data.data;
  return [];
}

function resolveEndpoint(poiType: string) {
  if (
    ["restaurant", "cafe", "bar", "pub", "fast_food", "food_court", "bakery"].includes(poiType)
  ) {
    return "food_drink";
  }

  if (
    ["hospital", "pharmacy", "police", "atm", "toilets", "luggage"].includes(poiType)
  ) {
    return "amenities";
  }

  if (poiType === "embassy") {
    return "embassies";
  }

  return "food_drink";
}

export async function searchPois(
  request: PoiSearchRequest
): Promise<any> {
  const radiusMeters = request.radius ?? 3000;

  const params = new URLSearchParams({
    lat: String(request.lat),
    lon: String(request.lon),
    radius: String(radiusMeters),
  });

  const body = {
    lat: Number(request.lat),
    lon: Number(request.lon),
    radius: radiusMeters,
  };

  if (!request.poiType) {
    const [foodDrink, amenities, embassies] = await Promise.all([
      apiRequest<PoiResult[]>(
        `${API_CONFIG.baseUrl}/pois/v2/food-drink/details?${params.toString()}`,
        { method: "GET" }
      ),
      apiRequest<PoiResult[]>(
        `${API_CONFIG.baseUrl}/pois/v2/amenities`,
        { method: "POST", body }
      ),
      apiRequest<PoiResult[]>(
        `${API_CONFIG.baseUrl}/pois/v2/embassies`,
        { method: "POST", body }
      ),
    ]);

    return [
    ...toArray(foodDrink),
    ...toArray(amenities),
    ...toArray(embassies),
    ];
  }

  const group = resolveEndpoint(request.poiType);

  switch (group) {
    case "food_drink":
      return apiRequest<PoiResult[]>(
        `${API_CONFIG.baseUrl}/pois/v2/food-drink/details?${params.toString()}`,
        { method: "GET" }
      );

    case "amenities":
      return apiRequest<PoiResult[]>(
        `${API_CONFIG.baseUrl}/pois/v2/amenities`,
        { method: "POST", body }
      );

    case "embassies":
      return apiRequest<PoiResult[]>(
        `${API_CONFIG.baseUrl}/pois/v2/embassies`,
        { method: "POST", body }
      );

    default:
      throw new Error("Invalid POI type");
  }
}

export type PoiLike = PoiResult & {
  id?: string | number;
  name?: string;
  description?: string;
  type?: string;
  subtype?: string;
  lat?: number;
  lon?: number;
  image?: string;
  imageUrl?: string;
  photo?: string;
  picture?: string;
  address?: string;
  website?: string;
  phone?: string;
  openingHours?: string;
  opening_hours?: string;
  price?: string;
  tags?: Record<string, any>;
  properties?: Record<string, any>;
  geometry?: {
    coordinates?: [number, number];
  };
};

export function getPoiArray(data: any): PoiLike[] {
  return toArray(data) as PoiLike[];
}

export function getPoiName(poi: PoiLike) {
  const tags = poi.tags || {};
  const properties = poi.properties || {};

  return (
    poi.name ||
    properties.name ||
    tags.name ||
    tags.operator ||
    tags.amenity ||
    tags.shop ||
    tags.diplomatic ||
    tags.office ||
    "Unnamed place"
  );
}

export function getPoiCategory(poi: PoiLike) {
  const tags = poi.tags || {};
  const properties = poi.properties || {};
  const raw = properties.datasource?.raw || {};

  return (
    poi.subtype ||
    properties.subtype ||
    properties.category ||
    tags.cuisine ||
    tags.amenity ||
    tags.shop ||
    tags.tourism ||
    tags.diplomatic ||
    tags.embassy ||
    tags.office ||
    raw.amenity ||
    raw.shop ||
    raw.tourism ||
    raw.diplomatic ||
    raw.embassy ||
    raw.office ||
    ""
  );
}

export function getPoiAddress(poi: PoiLike) {
  const tags = poi.tags || {};
  const properties = poi.properties || {};

  return (
    poi.address ||
    properties.formatted ||
    [
      tags["addr:street"],
      tags["addr:housenumber"],
      tags["addr:postcode"],
      tags["addr:city"],
    ]
      .filter(Boolean)
      .join(", ")
  );
}

export function getPoiWebsite(poi: PoiLike) {
  const tags = poi.tags || {};
  const properties = poi.properties || {};
  const raw = properties.datasource?.raw || {};

  return (
    poi.website ||
    tags.website ||
    tags["contact:website"] ||
    properties.website ||
    raw.website ||
    raw["contact:website"]
  );
}

export function getPoiPhone(poi: PoiLike) {
  const tags = poi.tags || {};
  const properties = poi.properties || {};
  const raw = properties.datasource?.raw || {};

  return (
    poi.phone ||
    tags.phone ||
    tags["contact:phone"] ||
    properties.phone ||
    raw.phone ||
    raw["contact:phone"]
  );
}

export function getPoiOpeningHours(poi: PoiLike) {
  const tags = poi.tags || {};
  const raw = poi.properties?.datasource?.raw || {};

  return (
    poi.openingHours ||
    poi.opening_hours ||
    tags.opening_hours ||
    raw.opening_hours
  );
}

export function getPoiPrice(poi: PoiLike) {
  const tags = poi.tags || {};
  const properties = poi.properties || {};
  const raw = properties.datasource?.raw || {};

  return poi.price || tags.charge || properties.price || raw.charge || "";
}

export function getPoiLatitude(poi: PoiLike) {
  return poi.lat ?? poi.properties?.lat ?? poi.geometry?.coordinates?.[1] ?? null;
}

export function getPoiLongitude(poi: PoiLike) {
  return poi.lon ?? poi.properties?.lon ?? poi.geometry?.coordinates?.[0] ?? null;
}

export function getPoiId(poi: PoiLike, index: number) {
  return poi.id || poi.properties?.place_id || `${getPoiName(poi)}-${index}`;
}

export function extractImageUrl(url?: unknown) {
  if (typeof url !== "string") return undefined;

  const cleanUrl = url.trim();
  if (!cleanUrl) return undefined;

  try {
    const decoded = decodeURIComponent(cleanUrl);

    const match = decoded.match(
      /(https:\/\/lh[0-9]\.googleusercontent\.com\/p\/[^!"'<>\s]+)/i
    );

    if (match?.[1]) {
      let baseUrl = match[1];

      // Remove existing parameters (=w240-h160...)
      baseUrl = baseUrl.split("=")[0];

      // Image size
      return `${baseUrl}=s800`;
    }
  } catch {
    // ignore malformed urls
  }

  // fallback: use URL if valid
  if (cleanUrl.startsWith("http://") || cleanUrl.startsWith("https://")) {
    return cleanUrl;
  }

  return undefined;
}

export function getPoiImageUrl(poi: PoiLike) {
  const tags = poi.tags || {};
  const properties = poi.properties || {};
  const raw = properties.datasource?.raw || {};

  const candidates = [
    poi.image,
    poi.imageUrl,
    poi.photo,
    poi.picture,
    tags.image,
    tags["image:0"],
    tags.photo,
    tags.picture,
    tags["contact:photo"],
    properties.image,
    properties.imageUrl,
    properties.photo,
    properties.picture,
    properties.preview?.source,
    properties.preview?.url,
    raw.image,
    raw["image:0"],
    raw.photo,
    raw.picture,
  ];

  for (const candidate of candidates) {
    const image = extractImageUrl(candidate);
    if (image) return image;
  }

  return undefined;
}

function normalizePoiText(value: unknown) {
  return String(value || "").toLowerCase();
}

function getPoiValuesToCheck(poi: PoiLike) {
  const tags = poi.tags || {};
  const properties = poi.properties || {};
  const raw = properties.datasource?.raw || {};

  return [
    poi.type,
    poi.subtype,
    properties.type,
    properties.subtype,
    properties.category,
    tags.amenity,
    tags.shop,
    tags.tourism,
    tags.cuisine,
    tags.diplomatic,
    tags.embassy,
    tags.office,
    raw.amenity,
    raw.shop,
    raw.tourism,
    raw.diplomatic,
    raw.embassy,
    raw.office,
  ].map(normalizePoiText);
}

export function isPlannablePoi(poi: PoiLike) {
  const values = getPoiValuesToCheck(poi);

  return values.some((value) =>
    [
      "restaurant",
      "cafe",
      "bar",
      "pub",
      "fast_food",
      "food_court",
      "bakery",
      "luggage_locker",
      "left_luggage",
    ].some((type) => value === type || value.includes(type))
  );
}

export function filterPoiResults(data: any, poiType?: string) {
  const results = getPoiArray(data);

  if (!poiType) return results;

  const selectedType = poiType.toLowerCase();

  return results.filter((poi) => {
    const values = getPoiValuesToCheck(poi);

    if (selectedType === "luggage") {
      return values.some(
        (value) => value === "luggage_locker" || value === "left_luggage"
      );
    }

    return values.some(
      (value) => value === selectedType || value.includes(selectedType)
    );
  });
}

export function getPoiDescription(poi: PoiLike) {
  const tags = poi.tags || {};
  const properties = poi.properties || {};
  const raw = properties.datasource?.raw || {};

  return (
    poi.description ||
    properties.description ||
    properties.shortDescription ||
    tags.description ||
    tags.note ||
    raw.description ||
    raw.note ||
    ""
  );
}