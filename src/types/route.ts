export type RouteMode = "walk" | "drive" | "transit";

export type RoutePointType = "AIRPORT" | "ACCOMMODATION" | "POI" | "ACTIVITY";

export type RoutePoint = {
  id: string;
  label: string;
  type: RoutePointType;
  latitude: number;
  longitude: number;
  address?: string;
  iata?: string;
  entityId?: number | null;
};

export type RouteSearchRequest = {
  startLatitude: number;
  startLongitude: number;
  endLatitude: number;
  endLongitude: number;
};

export type RouteStep = {
  instruction: string;
  distanceMeters: number;
  durationSeconds: number;
};

export type RouteSearchResponse = {
  distanceMeters: number;
  durationSeconds: number;
  geometry: {
    type: "LineString";
    coordinates: [number, number][];
  };
  steps: RouteStep[];
};

export type RouteSearchResult = {
  route: RouteSearchResponse;
  rawData: unknown;
};

// Shape returned by GET /routes/{userId}/{travelId}/{transportId}
export type StoredRouteStep = {
  stepOrder: number;
  distanceMeters: number;
  timeSeconds: number;
  instructionText: string;
};

export type StoredRoute = {
  id: number;
  apiProvider: string;
  totalDistanceMeters: number;
  totalTimeSeconds: number;
  startLat: number;
  startLon: number;
  endLat: number;
  endLon: number;
  geometryCoordinates: [number, number][][]; // MultiLineString
  steps: StoredRouteStep[];
  originName?: string | null;
  destinationName?: string | null;
  originType?: string | null;
  destinationType?: string | null;
  originEntityId?: number | null;
  destinationEntityId?: number | null;
};

// Generic shape returned by POST /routes (save)
export type SavedRoute = {
  id?: number;
};

export type SaveRouteRequest = {
  apiProvider: string;
  totalDistanceMeters?: number;
  totalTimeSeconds?: number;
  rawData: unknown;
  originName?: string | null;
  destinationName?: string | null;
  originType?: string | null;
  destinationType?: string | null;
  originEntityId?: number | null;
  destinationEntityId?: number | null;
};
