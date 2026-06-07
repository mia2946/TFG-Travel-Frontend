import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mockUser, mockRouteSearchResponse, mockStoredRoute } from '../mocks/mockData'

vi.mock('../../services/authService', () => ({
  getSession: vi.fn(),
  saveSession: vi.fn(),
  logout: vi.fn(),
}))

vi.mock('../../services/apiClient', () => ({
  apiRequest: vi.fn(),
}))

import { getSession } from '../../services/authService'
import { apiRequest } from '../../services/apiClient'
import {
  searchRoute,
  saveRoute,
  deleteRoute,
  getRoute,
} from '../../services/routeService'

const BASE_URL = 'http://localhost:8080'

function mockFetch(data: unknown, ok = true, status = 200) {
  return vi.spyOn(global, 'fetch').mockResolvedValue({
    ok,
    status,
    json: async () => data,
    text: async () => JSON.stringify(data),
  } as Response)
}

const routeRequest = {
  startLatitude: 48.8566,
  startLongitude: 2.3522,
  endLatitude: 48.8584,
  endLongitude: 2.2945,
}

describe('routeService', () => {
  beforeEach(() => {
    vi.mocked(getSession).mockReturnValue(mockUser as any)
    vi.mocked(apiRequest).mockReset()
    vi.restoreAllMocks()
    vi.mocked(getSession).mockReturnValue(mockUser as any)
  })

  describe('searchRoute', () => {
    it('calls POST /transport/routes/public with route request body', async () => {
      const geoapifyResponse = {
        features: [
          {
            geometry: {
              type: 'LineString',
              coordinates: [[2.3522, 48.8566], [2.2945, 48.8584]],
            },
            properties: {
              distance: 5200,
              time: 1800,
              legs: [
                {
                  steps: [
                    {
                      instruction: { text: 'Head north' },
                      distance: 500,
                      time: 360,
                    },
                  ],
                },
              ],
            },
          },
        ],
      }
      const fetchSpy = mockFetch(geoapifyResponse)

      await searchRoute(routeRequest)

      expect(fetchSpy).toHaveBeenCalledWith(
        `${BASE_URL}/transport/routes/public`,
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify(routeRequest),
        })
      )
    })

    it('includes Content-Type: application/json header', async () => {
      const geoapifyResponse = {
        features: [
          {
            geometry: { type: 'LineString', coordinates: [[2.3522, 48.8566]] },
            properties: { distance: 100, time: 60, legs: [] },
          },
        ],
      }
      const fetchSpy = mockFetch(geoapifyResponse)

      await searchRoute(routeRequest)

      const options = fetchSpy.mock.calls[0][1] as RequestInit
      expect((options.headers as Record<string, string>)['Content-Type']).toBe('application/json')
    })

    it('maps Geoapify GeoJSON LineString format correctly', async () => {
      const geoapifyResponse = {
        features: [
          {
            geometry: {
              type: 'LineString',
              coordinates: [
                [2.3522, 48.8566],
                [2.2945, 48.8584],
              ],
            },
            properties: {
              distance: 5200,
              time: 1800,
              legs: [
                {
                  steps: [
                    {
                      instruction: { text: 'Head north on Rue de Rivoli' },
                      distance: 500,
                      time: 360,
                    },
                  ],
                },
              ],
            },
          },
        ],
      }
      mockFetch(geoapifyResponse)

      const { route } = await searchRoute(routeRequest)

      expect(route.distanceMeters).toBe(5200)
      expect(route.durationSeconds).toBe(1800)
      expect(route.geometry.type).toBe('LineString')
      expect(route.steps[0].instruction).toBe('Head north on Rue de Rivoli')
      expect(route.steps[0].distanceMeters).toBe(500)
      expect(route.steps[0].durationSeconds).toBe(360)
    })

    it('maps Geoapify GeoJSON MultiLineString format correctly', async () => {
      const geoapifyResponse = {
        features: [
          {
            geometry: {
              type: 'MultiLineString',
              coordinates: [
                [[2.3522, 48.8566], [2.3000, 48.8570]],
                [[2.3000, 48.8570], [2.2945, 48.8584]],
              ],
            },
            properties: {
              distance: 5200,
              time: 1800,
              legs: [],
            },
          },
        ],
      }
      mockFetch(geoapifyResponse)

      const { route } = await searchRoute(routeRequest)

      expect(route.distanceMeters).toBe(5200)
      // MultiLineString coordinates should be flattened
      expect(route.geometry.coordinates).toHaveLength(4)
    })

    it('maps backend format (totalDistanceMeters, totalTimeSeconds, geometryCoordinates) correctly', async () => {
      const backendResponse = {
        totalDistanceMeters: 3500,
        totalTimeSeconds: 1200,
        geometryCoordinates: [
          [[2.3522, 48.8566], [2.2945, 48.8584]],
        ],
        steps: [
          {
            instructionText: 'Walk along Rue de Rivoli',
            distanceMeters: 3500,
            timeSeconds: 1200,
          },
        ],
      }
      mockFetch(backendResponse)

      const { route } = await searchRoute(routeRequest)

      expect(route.distanceMeters).toBe(3500)
      expect(route.durationSeconds).toBe(1200)
      expect(route.steps[0].instruction).toBe('Walk along Rue de Rivoli')
      expect(route.steps[0].distanceMeters).toBe(3500)
      expect(route.steps[0].durationSeconds).toBe(1200)
    })

    it('returns rawData alongside mapped route', async () => {
      const geoapifyResponse = {
        features: [
          {
            geometry: { type: 'LineString', coordinates: [[2.3522, 48.8566]] },
            properties: { distance: 100, time: 60, legs: [] },
          },
        ],
      }
      mockFetch(geoapifyResponse)

      const { rawData } = await searchRoute(routeRequest)

      expect(rawData).toEqual(geoapifyResponse)
    })

    it('throws when no feature is found in response', async () => {
      mockFetch({ features: [] })

      await expect(searchRoute(routeRequest)).rejects.toThrow()
    })

    it('throws when response is not ok', async () => {
      mockFetch({}, false, 500)

      await expect(searchRoute(routeRequest)).rejects.toThrow('Error searching route: 500')
    })
  })

  describe('saveRoute', () => {
    const savePayload = {
      apiProvider: 'geoapify',
      totalDistanceMeters: 5200,
      totalTimeSeconds: 1800,
      rawData: {},
      originName: 'Hotel Paris',
      destinationName: 'Eiffel Tower Tour',
      originType: 'ACCOMMODATION' as const,
      destinationType: 'ACTIVITY' as const,
      originEntityId: 20,
      destinationEntityId: 30,
    }

    it('calls apiRequest with POST /routes/{userId}/{travelId}', async () => {
      vi.mocked(apiRequest).mockResolvedValue(mockStoredRoute)

      await saveRoute(1, savePayload)

      expect(apiRequest).toHaveBeenCalledWith(
        `${BASE_URL}/routes/${mockUser.id}/1`,
        expect.objectContaining({
          method: 'POST',
          body: savePayload,
        })
      )
    })

    it('throws when user is not logged in', async () => {
      vi.mocked(getSession).mockReturnValue(null)

      await expect(saveRoute(1, savePayload)).rejects.toThrow('User not logged')
    })

    it('returns the saved route on success', async () => {
      vi.mocked(apiRequest).mockResolvedValue(mockStoredRoute)

      const result = await saveRoute(1, savePayload)

      expect(result).toEqual(mockStoredRoute)
    })
  })

  describe('deleteRoute', () => {
    it('calls DELETE /routes/{userId}/{travelId}/{routeId}', async () => {
      const fetchSpy = vi.spyOn(global, 'fetch').mockResolvedValue({
        ok: true,
        status: 204,
        json: async () => ({}),
        text: async () => '',
      } as Response)

      await deleteRoute(1, 100)

      expect(fetchSpy).toHaveBeenCalledWith(
        `${BASE_URL}/routes/${mockUser.id}/1/100`,
        expect.objectContaining({ method: 'DELETE' })
      )
    })

    it('throws when user is not logged in', async () => {
      vi.mocked(getSession).mockReturnValue(null)

      await expect(deleteRoute(1, 100)).rejects.toThrow('User not logged')
    })

    it('throws when response is not ok', async () => {
      vi.spyOn(global, 'fetch').mockResolvedValue({
        ok: false,
        status: 404,
        json: async () => ({}),
        text: async () => 'Not found',
      } as Response)

      await expect(deleteRoute(1, 999)).rejects.toThrow('Error deleting route: 404')
    })
  })

  describe('getRoute', () => {
    it('calls GET /routes/{userId}/{travelId}/{routeId}', async () => {
      const fetchSpy = mockFetch(mockStoredRoute)

      await getRoute(1, 100)

      expect(fetchSpy).toHaveBeenCalledWith(
        `${BASE_URL}/routes/${mockUser.id}/1/100`,
        expect.objectContaining({
          method: 'GET',
          headers: expect.objectContaining({ Accept: 'application/json' }),
        })
      )
    })

    it('throws when user is not logged in', async () => {
      vi.mocked(getSession).mockReturnValue(null)

      await expect(getRoute(1, 100)).rejects.toThrow('User not logged')
    })

    it('throws when response is not ok', async () => {
      mockFetch({}, false, 404)

      await expect(getRoute(1, 999)).rejects.toThrow('Error fetching route: 404')
    })

    it('returns parsed route on success', async () => {
      mockFetch(mockStoredRoute)

      const result = await getRoute(1, 100)

      expect(result).toEqual(mockStoredRoute)
      expect(result.totalDistanceMeters).toBe(5200)
      expect(result.originName).toBe('Hotel Paris')
    })
  })
})
