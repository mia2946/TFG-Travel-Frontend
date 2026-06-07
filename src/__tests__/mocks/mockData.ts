import type { TravelPlan } from '../../types/travel'
import type {
  FlightsApiResponse,
  AccommodationResult,
  ActivityResult,
} from '../../types/search'
import type { RouteSearchResponse } from '../../types/route'

export const mockUser = {
  id: 42,
  username: 'testuser',
  firstName: 'Test',
  lastName: 'User',
  email: 'test@example.com',
  phone: '+34 600 000 000',
  country: 'Spain',
  language: 'es',
  rol: 'USER' as const,
  password: 'hashed_password',
  fecha: '2026-01-01',
  active: true,
}

export const mockAdminUser = {
  ...mockUser,
  id: 1,
  username: 'adminuser',
  rol: 'ADMIN' as const,
}

export const mockCityParis = {
  name: 'Paris',
  country: 'France',
  countryCode: 'FR',
  lat: '48.8566',
  lon: '2.3522',
}

export const mockCityMadrid = {
  name: 'Madrid',
  country: 'Spain',
  countryCode: 'ES',
  lat: '40.4168',
  lon: '-3.7038',
}

export const mockSavedFlight = {
  id: 10,
  airline: 'Iberia',
  apiProvider: 'GOOGLE_FLIGHTS',
  arrivalTime: '2026-07-01T14:00:00Z',
  cabinClass: 'ECONOMY',
  currency: 'EUR',
  departureTime: '2026-07-01T10:00:00Z',
  destinationAirport: 'CDG',
  flightCode: 'IB3540',
  luggageIncluded: false,
  originAirport: 'MAD',
  price: 150,
  provider: 'Iberia',
}

export const mockSavedAccommodation = {
  id: 20,
  name: 'Hotel Paris',
  latitude: 48.8566,
  longitude: 2.3522,
  address: '1 Rue de Paris, 75001 Paris',
}

export const mockSavedActivity = {
  id: 30,
  name: 'Eiffel Tower Tour',
  latitude: 48.8584,
  longitude: 2.2945,
  location: 'Champ de Mars, Paris',
}

export const mockSavedPoi = {
  id: 40,
  name: 'Le Café de Flore',
  latitude: 48.854,
  longitude: 2.3325,
  address: '172 Boulevard Saint-Germain, Paris',
}

export const mockTravelPlan: TravelPlan = {
  id: 1,
  userId: 42,
  name: 'Summer Trip',
  description: 'A summer vacation in Paris',
  startDate: '2026-07-01',
  endDate: '2026-07-15',
  createdAt: '2026-01-01T00:00:00Z',
  savedFlights: [mockSavedFlight],
  savedAccommodations: [mockSavedAccommodation],
  savedActivities: [mockSavedActivity],
  savedPois: [mockSavedPoi],
  savedRoutes: [],
}

export const mockEmptyTravelPlan: TravelPlan = {
  id: 2,
  userId: 42,
  name: 'Empty Trip',
  startDate: '2026-08-01',
  endDate: '2026-08-15',
  createdAt: '2026-01-01T00:00:00Z',
  savedFlights: [],
  savedAccommodations: [],
  savedActivities: [],
  savedPois: [],
  savedRoutes: [],
}

export const mockFlightsApiResponse: FlightsApiResponse = {
  best_flights: [
    {
      airline_logo: 'https://example.com/iberia-logo.png',
      flights: [
        {
          airline: 'Iberia',
          flight_number: 'IB3540',
          travel_class: 'ECONOMY',
          departure_airport: {
            id: 'MAD',
            name: 'Madrid Barajas',
            time: '2026-07-01 10:00',
          },
          arrival_airport: {
            id: 'CDG',
            name: 'Charles de Gaulle',
            time: '2026-07-01 12:30',
          },
        },
      ],
      price: 150,
      total_duration: 150,
      layovers: [],
    },
  ],
  other_flights: [
    {
      flights: [
        {
          airline: 'Air France',
          flight_number: 'AF1234',
          travel_class: 'ECONOMY',
          departure_airport: {
            id: 'MAD',
            name: 'Madrid Barajas',
            time: '2026-07-01 15:00',
          },
          arrival_airport: {
            id: 'CDG',
            name: 'Charles de Gaulle',
            time: '2026-07-01 17:15',
          },
        },
      ],
      price: 120,
      total_duration: 135,
      layovers: [],
    },
  ],
}

export const mockAccommodationResult: AccommodationResult = {
  type: 'Feature',
  geometry: { type: 'Point', coordinates: [2.3522, 48.8566] },
  properties: {
    name: 'Hotel du Louvre',
    formatted: '1 Place André Malraux, 75001 Paris, France',
    categories: ['accommodation.hotel'],
    website: 'https://hoteldulouvre.com',
    phone: '+33 1 44 58 38 38',
    rating: 4.5,
    datasource: { sourcename: 'geoapify' },
  },
}

export const mockActivityResult: ActivityResult = {
  type: 'Feature',
  geometry: { type: 'Point', coordinates: [2.2945, 48.8584] },
  properties: {
    name: 'Eiffel Tower',
    formatted: 'Champ de Mars, 5 Avenue Anatole France, 75007 Paris, France',
    categories: ['tourism.attraction'],
    inferredType: 'ATTRACTION',
    datasource: { sourcename: 'geoapify' },
  },
}

export const mockRestaurantPoi = {
  id: 'node/123456',
  type: 'node',
  tags: {
    name: 'Le Jules Verne',
    amenity: 'restaurant',
    cuisine: 'french',
    phone: '+33 1 45 55 61 44',
    website: 'https://lejulesverne-paris.com',
    opening_hours: 'Mo-Su 12:00-22:00',
  },
  lat: 48.8583,
  lon: 2.2944,
}

export const mockHospitalPoi = {
  id: 'node/789012',
  type: 'node',
  tags: {
    name: 'Hôpital de la Pitié-Salpêtrière',
    amenity: 'hospital',
    phone: '+33 1 42 16 00 00',
  },
  lat: 48.8435,
  lon: 2.3592,
}

export const mockAirportMAD = {
  iata: 'MAD',
  name: 'Adolfo Suárez Madrid-Barajas Airport',
  city: 'Madrid',
  latitude: 40.4936,
  longitude: -3.5668,
}

export const mockAirportCDG = {
  iata: 'CDG',
  name: 'Charles de Gaulle Airport',
  city: 'Paris',
  latitude: 49.0097,
  longitude: 2.5479,
}

export const mockRouteSearchResponse: RouteSearchResponse = {
  distanceMeters: 5200,
  durationSeconds: 1800,
  geometry: {
    type: 'LineString',
    coordinates: [
      [2.3522, 48.8566],
      [2.2945, 48.8584],
    ] as [number, number][],
  },
  steps: [
    {
      instruction: 'Head north on Rue de Rivoli',
      distanceMeters: 500,
      durationSeconds: 360,
    },
    {
      instruction: 'Turn left on Avenue des Champs-Élysées',
      distanceMeters: 4700,
      durationSeconds: 1440,
    },
  ],
}

export const mockStoredRoute = {
  id: 100,
  apiProvider: 'geoapify',
  totalDistanceMeters: 5200,
  totalTimeSeconds: 1800,
  startLat: 48.8566,
  startLon: 2.3522,
  endLat: 48.8584,
  endLon: 2.2945,
  geometryCoordinates: [[[2.3522, 48.8566], [2.2945, 48.8584]]] as [number, number][][],
  steps: [
    { instructionText: 'Head north', distanceMeters: 500, timeSeconds: 360 },
  ],
  originName: 'Hotel Paris',
  destinationName: 'Eiffel Tower Tour',
  originType: 'ACCOMMODATION',
  destinationType: 'ACTIVITY',
}
