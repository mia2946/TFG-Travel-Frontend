import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
  getAirportCoordinates,
  getRouteableAirportCoordinates,
  getAirportsByCoordinates,
} from '../../services/airportService'

const BASE = 'http://localhost:8080'

function mockFetch(data: unknown, ok = true, status = 200) {
  return vi.spyOn(global, 'fetch').mockResolvedValue({
    ok,
    status,
    statusText: ok ? 'OK' : 'Error',
    json: async () => data,
    text: async () => JSON.stringify(data),
  } as Response)
}

describe('airportService', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  describe('getAirportCoordinates', () => {
    it('fetches the correct URL with iata code', async () => {
      const fetchSpy = mockFetch({ iata: 'MAD', latitude: 40.4719, longitude: -3.5626 })
      await getAirportCoordinates('MAD')
      expect(fetchSpy).toHaveBeenCalledWith(
        `${BASE}/api/airports/coordinates?iata=MAD`,
        expect.objectContaining({ method: 'GET' })
      )
    })

    it('returns the airport data on success', async () => {
      const airportData = { iata: 'CDG', latitude: 49.0097, longitude: 2.5479, name: 'Charles de Gaulle' }
      mockFetch(airportData)
      const result = await getAirportCoordinates('CDG')
      expect(result).toEqual(airportData)
    })

    it('returns null when the response is not ok', async () => {
      mockFetch({}, false, 404)
      const result = await getAirportCoordinates('XYZ')
      expect(result).toBeNull()
    })

    it('returns null when fetch throws', async () => {
      vi.spyOn(global, 'fetch').mockRejectedValue(new Error('Network error'))
      const result = await getAirportCoordinates('MAD')
      expect(result).toBeNull()
    })

    it('encodes special characters in the iata code', async () => {
      const fetchSpy = mockFetch({})
      await getAirportCoordinates('M A D')
      const calledUrl: string = fetchSpy.mock.calls[0][0] as string
      expect(calledUrl).toContain('iata=M%20A%20D')
    })
  })

  describe('getRouteableAirportCoordinates', () => {
    it('fetches the correct routeable-coordinates URL', async () => {
      const fetchSpy = mockFetch({ iata: 'MAD', latitude: 40.4719, longitude: -3.5626 })
      await getRouteableAirportCoordinates('MAD')
      expect(fetchSpy).toHaveBeenCalledWith(
        `${BASE}/api/airports/routeable-coordinates?iata=MAD`,
        expect.objectContaining({ method: 'GET' })
      )
    })

    it('returns the routeable response on success', async () => {
      const data = {
        iata: 'LHR',
        latitude: 51.477,
        longitude: -0.461,
        routePointName: 'Heathrow Terminal 1',
      }
      mockFetch(data)
      const result = await getRouteableAirportCoordinates('LHR')
      expect(result).toEqual(data)
    })

    it('returns null when the response is not ok', async () => {
      mockFetch({}, false, 500)
      const result = await getRouteableAirportCoordinates('XYZ')
      expect(result).toBeNull()
    })

    it('returns null when fetch throws', async () => {
      vi.spyOn(global, 'fetch').mockRejectedValue(new Error('Network error'))
      const result = await getRouteableAirportCoordinates('MAD')
      expect(result).toBeNull()
    })
  })

  describe('getAirportsByCoordinates', () => {
    it('fetches the correct airports search URL with lat and lon params', async () => {
      const fetchSpy = mockFetch([{ iata: 'MAD', name: 'Barajas' }])
      await getAirportsByCoordinates(40.4719, -3.5626)
      const calledUrl: string = fetchSpy.mock.calls[0][0] as string
      expect(calledUrl).toContain(`${BASE}/api/airports/search`)
      expect(calledUrl).toContain('lat=40.4719')
      expect(calledUrl).toContain('lon=-3.5626')
    })

    it('uses GET method', async () => {
      const fetchSpy = mockFetch([{ iata: 'MAD' }])
      await getAirportsByCoordinates(40.47, -3.56)
      const opts = fetchSpy.mock.calls[0][1] as RequestInit
      expect(opts.method).toBe('GET')
    })

    it('returns array of airports when response is a plain array', async () => {
      const airports = [{ iata: 'MAD', name: 'Barajas' }, { iata: 'AGP', name: 'Malaga' }]
      mockFetch(airports)
      const result = await getAirportsByCoordinates(40.47, -3.56)
      expect(result).toEqual(airports)
    })

    it('returns airports from data.airports when response wraps the array', async () => {
      const airports = [{ iata: 'CDG', name: 'Charles de Gaulle' }]
      mockFetch({ airports })
      const result = await getAirportsByCoordinates(49.0097, 2.5479)
      expect(result).toEqual(airports)
    })

    it('returns single airport wrapped in array when response is a single object', async () => {
      mockFetch({ iata: 'LHR', name: 'Heathrow' })
      const result = await getAirportsByCoordinates(51.477, -0.461)
      expect(result).toHaveLength(1)
      expect(result[0].iata).toBe('LHR')
    })

    it('filters out airports without an iata code from plain-array response', async () => {
      mockFetch([{ iata: 'MAD' }, { name: 'No IATA' }, { iata: 'CDG' }])
      const result = await getAirportsByCoordinates(40, 2)
      expect(result).toHaveLength(2)
      expect(result.every((a) => a.iata)).toBe(true)
    })

    it('returns empty array when response shape is unrecognised', async () => {
      mockFetch({ unknown: 'format' })
      const result = await getAirportsByCoordinates(0, 0)
      expect(result).toEqual([])
    })

    it('throws when the response is not ok', async () => {
      mockFetch('Not found', false, 404)
      await expect(getAirportsByCoordinates(0, 0)).rejects.toThrow()
    })
  })
})
