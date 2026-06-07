import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mockFlightsApiResponse, mockUser } from '../mocks/mockData'
import type { FlightSearchRequest } from '../../types/search'

vi.mock('../../services/authService', () => ({
  getSession: vi.fn(),
  saveSession: vi.fn(),
  logout: vi.fn(),
}))

import { searchFlights, addFlightToTravel } from '../../services/flightService'

const BASE_URL = 'http://localhost:8080'

function mockFetch(data: unknown, ok = true) {
  return vi.spyOn(global, 'fetch').mockResolvedValue({
    ok,
    status: ok ? 200 : 400,
    json: async () => data,
    text: async () => (typeof data === 'string' ? data : JSON.stringify(data)),
  } as Response)
}

const baseRequest: FlightSearchRequest = {
  departureId: 'MAD',
  arrivalId: 'CDG',
  outboundDate: '2026-07-01',
  currency: 'EUR',
  hl: 'es',
  gl: 'es',
  type: 2,
  travelClass: 1,
  sortBy: 1,
  showHidden: false,
  deepSearch: false,
}

describe('flightService', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  describe('searchFlights', () => {
    it('calls POST /api/flights/search with correct query parameters', async () => {
      const fetchSpy = mockFetch(mockFlightsApiResponse)

      await searchFlights(baseRequest)

      expect(fetchSpy).toHaveBeenCalledTimes(1)
      const calledUrl = (fetchSpy.mock.calls[0][0] as string)
      expect(calledUrl).toContain('/api/flights/search')
      expect(calledUrl).toContain('departureId=MAD')
      expect(calledUrl).toContain('arrivalId=CDG')
      expect(calledUrl).toContain('outboundDate=2026-07-01')
    })

    it('appends currency param', async () => {
      const fetchSpy = mockFetch(mockFlightsApiResponse)

      await searchFlights(baseRequest)

      const calledUrl = fetchSpy.mock.calls[0][0] as string
      expect(calledUrl).toContain('currency=EUR')
    })

    it('appends travelClass param', async () => {
      const fetchSpy = mockFetch(mockFlightsApiResponse)

      await searchFlights(baseRequest)

      const calledUrl = fetchSpy.mock.calls[0][0] as string
      expect(calledUrl).toContain('travelClass=1')
    })

    it('appends sortBy param', async () => {
      const fetchSpy = mockFetch(mockFlightsApiResponse)

      await searchFlights(baseRequest)

      const calledUrl = fetchSpy.mock.calls[0][0] as string
      expect(calledUrl).toContain('sortBy=1')
    })

    it('appends showHidden param', async () => {
      const fetchSpy = mockFetch(mockFlightsApiResponse)

      await searchFlights({ ...baseRequest, showHidden: true })

      const calledUrl = fetchSpy.mock.calls[0][0] as string
      expect(calledUrl).toContain('showHidden=true')
    })

    it('appends deepSearch param', async () => {
      const fetchSpy = mockFetch(mockFlightsApiResponse)

      await searchFlights({ ...baseRequest, deepSearch: true })

      const calledUrl = fetchSpy.mock.calls[0][0] as string
      expect(calledUrl).toContain('deepSearch=true')
    })

    it('appends returnDate when provided', async () => {
      const fetchSpy = mockFetch(mockFlightsApiResponse)

      await searchFlights({ ...baseRequest, returnDate: '2026-07-15' })

      const calledUrl = fetchSpy.mock.calls[0][0] as string
      expect(calledUrl).toContain('returnDate=2026-07-15')
    })

    it('does not append returnDate when not provided', async () => {
      const fetchSpy = mockFetch(mockFlightsApiResponse)

      await searchFlights(baseRequest)

      const calledUrl = fetchSpy.mock.calls[0][0] as string
      expect(calledUrl).not.toContain('returnDate')
    })

    it('uses GET method', async () => {
      const fetchSpy = mockFetch(mockFlightsApiResponse)

      await searchFlights(baseRequest)

      const options = fetchSpy.mock.calls[0][1] as RequestInit
      expect(options.method).toBe('GET')
    })

    it('returns the parsed response', async () => {
      mockFetch(mockFlightsApiResponse)

      const result = await searchFlights(baseRequest)

      expect(result).toEqual(mockFlightsApiResponse)
      expect(result.best_flights).toHaveLength(1)
      expect(result.best_flights![0].price).toBe(150)
    })

    it('throws when response is not ok', async () => {
      mockFetch('Service unavailable', false)

      await expect(searchFlights(baseRequest)).rejects.toThrow('Service unavailable')
    })

    it('defaults hl to "es" when not provided', async () => {
      const fetchSpy = mockFetch(mockFlightsApiResponse)
      const { hl: _hl, ...requestWithoutHl } = baseRequest

      await searchFlights(requestWithoutHl as FlightSearchRequest)

      const calledUrl = fetchSpy.mock.calls[0][0] as string
      expect(calledUrl).toContain('hl=es')
    })

    it('defaults type to 2 (one-way) when not provided', async () => {
      const fetchSpy = mockFetch(mockFlightsApiResponse)
      const { type: _type, ...requestWithoutType } = baseRequest

      await searchFlights(requestWithoutType as FlightSearchRequest)

      const calledUrl = fetchSpy.mock.calls[0][0] as string
      expect(calledUrl).toContain('type=2')
    })
  })

  describe('addFlightToTravel', () => {
    const flightPayload = {
      transport: {
        transportType: 'FLIGHT',
        provider: 'Iberia',
        departureTime: '2026-07-01T10:00:00Z',
        arrivalTime: '2026-07-01T12:30:00Z',
        price: 150,
        currency: 'EUR',
        apiProvider: 'GOOGLE_FLIGHTS',
      },
      details: {
        flightCode: 'IB3540',
        airline: 'Iberia',
        originAirport: 'MAD',
        destinationAirport: 'CDG',
        cabinClass: 'ECONOMY',
        luggageIncluded: false,
      },
    }

    it('calls POST /flights/{userId}/{travelId} with the payload', async () => {
      const fetchSpy = mockFetch({ id: 1 })

      await addFlightToTravel(42, 1, flightPayload)

      expect(fetchSpy).toHaveBeenCalledWith(
        `${BASE_URL}/flights/42/1`,
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify(flightPayload),
        })
      )
    })

    it('includes Content-Type: application/json header', async () => {
      const fetchSpy = mockFetch({ id: 1 })

      await addFlightToTravel(42, 1, flightPayload)

      const options = fetchSpy.mock.calls[0][1] as RequestInit
      expect((options.headers as Record<string, string>)['Content-Type']).toBe('application/json')
    })

    it('throws when response is not ok', async () => {
      mockFetch('Forbidden', false)

      await expect(addFlightToTravel(42, 1, flightPayload)).rejects.toThrow()
    })

    it('returns the parsed response on success', async () => {
      const savedFlight = { id: 10, ...flightPayload }
      mockFetch(savedFlight)

      const result = await addFlightToTravel(42, 1, flightPayload)

      expect(result).toEqual(savedFlight)
    })
  })
})
