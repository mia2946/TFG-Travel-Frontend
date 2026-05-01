export type FlightSearchRequest = {
  origin: string;
  originLat?: string;
  originLon?: string;
  destination: string;
  destinationLat?: string;
  destinationLon?: string;
  departureDate: string;
  returnDate?: string;
  passengers: number;
  tripType?: "oneWay" | "roundTrip";
};

export type AccommodationSearchRequest = {
  destination: string;
  lat?: string;
  lon?: string;
  checkIn: string;
  checkOut: string;
  guests: number;
};

export type ActivitySearchRequest = {
  destination: string;
  lat?: string;
  lon?: string;
    radius?: number;
  activityType?: string;
};


export type TransportSearchRequest = {
  origin: string;
  originLat?: string;
  originLon?: string;
  destination: string;
  destinationLat?: string;
  destinationLon?: string;
  date?: string;
  transportType?: string;
};

export type PoiSearchRequest = {
  destination: string;
  lat?: string;
  lon?: string;
  poiType?: string;
  radius: number;
};

export type FlightResult = Record<string, unknown>;
export type AccommodationResult = Record<string, unknown>;
export type ActivityResult = Record<string, unknown>;
export type TransportResult = Record<string, unknown>;
export type PoiResult = Record<string, unknown>;