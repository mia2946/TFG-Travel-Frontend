export type FlightSearchRequest = {
  origin: string;
  destination: string;
  departureDate: string;
  returnDate?: string;
  passengers: number;
};

export type AccommodationSearchRequest = {
  destination: string;
  checkIn: string;
  checkOut: string;
  guests: number;
};

export type ActivitySearchRequest = {
  destination: string;
  date?: string;
  category?: string;
};

export type TransportSearchRequest = {
  origin: string;
  destination: string;
  date?: string;
  transportType?: string;
};

export type PoiSearchRequest = {
  destination: string;
  poiType?: string;
  radius: number;
};

export type FlightResult = Record<string, unknown>;
export type AccommodationResult = Record<string, unknown>;
export type ActivityResult = Record<string, unknown>;
export type TransportResult = Record<string, unknown>;
export type PoiResult = Record<string, unknown>;