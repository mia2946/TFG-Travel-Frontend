export type FlightSearchRequest = {
  departureId: string;
  arrivalId: string;

  outboundDate: string;
  returnDate?: string;

  passengers?: number;

  currency?: string;
  hl?: string;
  gl?: string;

  type?: 1 | 2 | 3;
  travelClass?: 1 | 2 | 3 | 4;
  sortBy?: 1 | 2 | 3 | 4 | 5;

  showHidden?: boolean;
  deepSearch?: boolean;
};

export type FlightAirportInfo = {
  id?: string;
  name?: string;
  time?: string;
};

export type FlightLeg = {
  airline?: string;
  airline_logo?: string;
  airplane?: string;
  flight_number?: string;
  travel_class?: string;
  duration?: number;
  legroom?: string;
  departure_airport?: FlightAirportInfo;
  arrival_airport?: FlightAirportInfo;
  extensions?: string[];
  often_delayed_by_over_30_min?: boolean | null;
  overnight?: boolean | null;
  ticket_also_sold_by?: string[] | null;
};

export type FlightLayover = {
  duration?: number;
  id?: string;
  name?: string;
  overnight?: boolean | null;
};

export type FlightCarbonEmissions = {
  this_flight?: number;
  typical_for_this_route?: number;
  difference_percent?: number;
};

export type FlightOption = {
  airline_logo?: string;
  carbon_emissions?: FlightCarbonEmissions;
  departure_token?: string | null;
  flights?: FlightLeg[];
  layovers?: FlightLayover[] | null;
  price?: number;
  total_duration?: number;
  type?: string;
};

export type FlightsApiResponse = {
  best_flights?: FlightOption[];
  other_flights?: FlightOption[];
  price_insights?: unknown | null;
  airports?: unknown[];
  search_metadata?: {
    status?: string;
    google_flights_url?: string;
    total_time_taken?: number;
  };
  search_parameters?: Record<string, unknown>;
};

export type AccommodationSearchRequest = {
  destination: string;
  lat?: string;
  lon?: string;
  checkIn: string;
  checkOut: string;
  guests: number;
  radius?: number;
  limit?: number;
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

export type AccommodationResult = {
  type?: string;
  geometry?: {
    type?: string;
    coordinates?: number[];
  };
  properties?: {
    name?: string;
    formatted?: string;
    address_line1?: string;
    address_line2?: string;
    city?: string;
    country?: string;
    categories?: string[];
    website?: string;
    phone?: string;
    opening_hours?: string;
    rating?: number;
    price_level?: number;
    datasource?: { sourcename?: string };
  };
  // flat-format fallback fields
  name?: string;
  formatted?: string;
  address?: string;
  categories?: string[];
  website?: string;
  phone?: string;
  rating?: number;
  lat?: number;
  lon?: number;
};
//export type ActivityResult = Record<string, unknown>;
export type ActivityResult = {
  type: string;
  geometry: {
    type: string;
    coordinates: number[];
  };
  properties: {
    name?: string | null;
    formatted?: string | null;
    city?: string | null;
    country?: string | null;
    categories?: string[];
    inferredType?: string;
    datasource?: {
      sourcename?: string;
      attribution?: string;
    };
  };
};
export type TransportResult = Record<string, unknown>;
export type PoiResult = Record<string, unknown>;