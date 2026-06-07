export type AppDestination = {
  id?: number;
  cityName: string;
  country: string;
  countryCode: string;
  latitude: number;
  longitude: number;
  description?: string;
};

export type SavedFlight = {
  id: number;
  airline: string;
  apiProvider: string;
  arrivalTime: string;
  cabinClass: string;
  currency: string;
  departureTime: string;
  destinationAirport: string;
  flightCode: string;
  luggageIncluded: boolean;
  originAirport: string;
  price: number;
  provider: string;
};

export type TravelPlan = {
  id: number;
  userId: number;

  name: string;
  description?: string;

  startDate: string;
  endDate: string;
  createdAt: string;

  savedAccommodations?: any[];
  savedActivities?: any[];
  savedPois?: any[];
  savedTransports?: any[];
  savedFlights?: SavedFlight[];
  savedRoutes?: any[];
};
