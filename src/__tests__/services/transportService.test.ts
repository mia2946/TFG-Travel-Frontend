import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
  searchPublicTransportRoute,
  searchTransportPois,
} from '../../services/transportService'

const BASE = 'http://localhost:8080'
const TRANSPORT_PATH = '/transport/routes/public'
const TRANSPORT_POIS_PATH = '/pois/v2/transport-pois'

const mockRouteResponse = {
  type: 'FeatureCollection',
  features: [
    {
      type: 'Feature',
      geometry: { type: 'LineString', coordinates: [[0, 0], [1, 1]] },
      properties: { mode: 'bus', duration: 1200 },
    },
  ],
}

function mockFetch(data: unknown, ok = true, status = 200) {
  return vi.spyOn(global, 'fetch').mockResolvedValue({
    ok,
    status,
    statusText: ok ? 'OK' : 'Error',
    json: async () => data,
    text: async () => (typeof data === 'string' ? data : JSON.stringify(data)),
  } as Response)
}

describe('transportService', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  describe('searchPublicTransportRoute', () => {
    const request = {
      startLatitude: 40.4168,
      startLongitude: -3.7038,
      endLatitude: 41.3851,
      endLongitude: 2.1734,
    }

    it('calls fetch with the correct transport route URL', async () => {
      const fetchSpy = mockFetch(mockRouteResponse)
      await searchPublicTransportRoute(request)
      const calledUrl: string = fetchSpy.mock.calls[0][0] as string
      expect(calledUrl).toBe(`${BASE}${TRANSPORT_PATH}`)
    })

    it('uses POST method', async () => {
      const fetchSpy = mockFetch(mockRouteResponse)
      await searchPublicTransportRoute(request)
      const opts = fetchSpy.mock.calls[0][1] as RequestInit
      expect(opts.method).toBe('POST')
    })

    it('sends JSON body with the route request payload', async () => {
      const fetchSpy = mockFetch(mockRouteResponse)
      await searchPublicTransportRoute(request)
      const opts = fetchSpy.mock.calls[0][1] as RequestInit
      const body = JSON.parse(opts.body as string)
      expect(body.startLatitude).toBe(40.4168)
      expect(body.startLongitude).toBe(-3.7038)
      expect(body.endLatitude).toBe(41.3851)
      expect(body.endLongitude).toBe(2.1734)
    })

    it('sends Content-Type: application/json header', async () => {
      const fetchSpy = mockFetch(mockRouteResponse)
      await searchPublicTransportRoute(request)
      const opts = fetchSpy.mock.calls[0][1] as RequestInit
      const headers = opts.headers as Record<string, string>
      expect(headers['Content-Type']).toBe('application/json')
    })

    it('returns the GeoJSON feature collection on success', async () => {
      mockFetch(mockRouteResponse)
      const result = await searchPublicTransportRoute(request)
      expect(result.type).toBe('FeatureCollection')
      expect(result.features).toHaveLength(1)
    })

    it('throws when the response is not ok', async () => {
      mockFetch('Route not found', false, 404)
      await expect(searchPublicTransportRoute(request)).rejects.toThrow()
    })

    it('throws when features array is empty', async () => {
      mockFetch({ type: 'FeatureCollection', features: [] })
      await expect(searchPublicTransportRoute(request)).rejects.toThrow(
        'No public transport route found.'
      )
    })
  })

  describe('searchTransportPois', () => {
    it('fetches the correct transport POIs URL', async () => {
      const fetchSpy = mockFetch([{ id: 1, type: 'bus_stop' }])
      await searchTransportPois(48.8566, 2.3522, 500)
      const calledUrl: string = fetchSpy.mock.calls[0][0] as string
      expect(calledUrl).toContain(`${BASE}${TRANSPORT_POIS_PATH}`)
    })

    it('includes lat query parameter', async () => {
      const fetchSpy = mockFetch([])
      await searchTransportPois(48.8566, 2.3522, 500)
      const calledUrl: string = fetchSpy.mock.calls[0][0] as string
      expect(calledUrl).toContain('lat=48.8566')
    })

    it('includes lon query parameter', async () => {
      const fetchSpy = mockFetch([])
      await searchTransportPois(48.8566, 2.3522, 500)
      const calledUrl: string = fetchSpy.mock.calls[0][0] as string
      expect(calledUrl).toContain('lon=2.3522')
    })

    it('includes radiusMeters query parameter', async () => {
      const fetchSpy = mockFetch([])
      await searchTransportPois(48.8566, 2.3522, 750)
      const calledUrl: string = fetchSpy.mock.calls[0][0] as string
      expect(calledUrl).toContain('radiusMeters=750')
    })

    it('uses GET method', async () => {
      const fetchSpy = mockFetch([])
      await searchTransportPois(48.8566, 2.3522, 500)
      const opts = fetchSpy.mock.calls[0][1] as RequestInit
      expect(opts.method).toBe('GET')
    })

    it('returns a plain array response directly', async () => {
      const pois = [{ id: 1, type: 'bus_stop' }, { id: 2, type: 'metro_station' }]
      mockFetch(pois)
      const result = await searchTransportPois(48.8566, 2.3522, 500)
      expect(result).toEqual(pois)
    })

    it('returns elements from data.elements when response wraps the array', async () => {
      const elements = [{ id: 10 }]
      mockFetch({ elements })
      const result = await searchTransportPois(48.8566, 2.3522, 500)
      expect(result).toEqual(elements)
    })

    it('returns features from data.features when response uses GeoJSON wrapper', async () => {
      const features = [{ type: 'Feature', properties: {} }]
      mockFetch({ features })
      const result = await searchTransportPois(48.8566, 2.3522, 500)
      expect(result).toEqual(features)
    })

    it('returns empty array for unrecognised response shape', async () => {
      mockFetch({ unknown: true })
      const result = await searchTransportPois(48.8566, 2.3522, 500)
      expect(result).toEqual([])
    })

    it('throws when the response is not ok', async () => {
      mockFetch('Server error', false, 500)
      await expect(searchTransportPois(48.8566, 2.3522, 500)).rejects.toThrow()
    })

    it('accepts string lat/lon values', async () => {
      const fetchSpy = mockFetch([])
      await searchTransportPois('48.8566', '2.3522', 500)
      const calledUrl: string = fetchSpy.mock.calls[0][0] as string
      expect(calledUrl).toContain('lat=48.8566')
      expect(calledUrl).toContain('lon=2.3522')
    })
  })
})
