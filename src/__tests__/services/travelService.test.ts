import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mockUser, mockTravelPlan } from '../mocks/mockData'

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
  getTravelPlans,
  createTravelPlan,
  addAccommodationToTravel,
  addActivityToTravel,
  addPoiToTravel,
  deleteAccommodationFromTravel,
  deleteActivityFromTravel,
  deletePoiFromTravel,
  deleteFlightFromTravel,
  deleteTravelPlan,
} from '../../services/travelService'

const BASE_URL = 'http://localhost:8080'

function mockFetch(data: unknown, ok = true, status = 200) {
  return vi.spyOn(global, 'fetch').mockResolvedValue({
    ok,
    status,
    json: async () => data,
    text: async () => JSON.stringify(data),
  } as Response)
}

describe('travelService', () => {
  beforeEach(() => {
    vi.mocked(getSession).mockReturnValue(mockUser as any)
    vi.mocked(apiRequest).mockReset()
  })

  describe('getTravelPlans', () => {
    it('calls GET /travels/{userId} and returns the plan list', async () => {
      const fetchSpy = mockFetch([mockTravelPlan])

      const result = await getTravelPlans()

      expect(fetchSpy).toHaveBeenCalledWith(
        `${BASE_URL}/travels/${mockUser.id}`,
        expect.objectContaining({ method: 'GET' })
      )
      expect(result).toEqual([mockTravelPlan])
    })

    it('throws when user is not logged in', async () => {
      vi.mocked(getSession).mockReturnValue(null)

      await expect(getTravelPlans()).rejects.toThrow('User not logged')
    })

    it('throws when the response is not ok', async () => {
      mockFetch({}, false, 500)

      await expect(getTravelPlans()).rejects.toThrow('Error fetching travels: 500')
    })
  })

  describe('deleteTravelPlan', () => {
    it('calls DELETE /travels/{userId}/{travelId}', async () => {
      const fetchSpy = vi.spyOn(global, 'fetch').mockResolvedValue({
        ok: true,
        status: 204,
        json: async () => ({}),
        text: async () => '',
      } as Response)

      await deleteTravelPlan(1)

      expect(fetchSpy).toHaveBeenCalledWith(
        `${BASE_URL}/travels/${mockUser.id}/1`,
        expect.objectContaining({ method: 'DELETE' })
      )
    })

    it('throws when user is not logged in', async () => {
      vi.mocked(getSession).mockReturnValue(null)

      await expect(deleteTravelPlan(1)).rejects.toThrow('User not logged')
    })
  })

  describe('createTravelPlan', () => {
    it('calls apiRequest with POST /travels/{userId} and correct body', async () => {
      vi.mocked(apiRequest).mockResolvedValue(mockTravelPlan)

      const result = await createTravelPlan('Summer Trip')

      expect(apiRequest).toHaveBeenCalledWith(
        `${BASE_URL}/travels/${mockUser.id}`,
        expect.objectContaining({
          method: 'POST',
          body: expect.objectContaining({
            userId: mockUser.id,
            name: 'Summer Trip',
          }),
        })
      )
      expect(result).toEqual(mockTravelPlan)
    })

    it('throws when user is not logged in', async () => {
      vi.mocked(getSession).mockReturnValue(null)

      await expect(createTravelPlan('My Trip')).rejects.toThrow('User not logged')
    })
  })

  describe('addAccommodationToTravel', () => {
    it('calls POST /accommodations/{userId}/{travelId} with accommodation payload', async () => {
      const accommodation = { name: 'Hotel Test', latitude: 1, longitude: 2 }
      const fetchSpy = mockFetch({ id: 1, ...accommodation })

      await addAccommodationToTravel(1, accommodation)

      expect(fetchSpy).toHaveBeenCalledWith(
        `${BASE_URL}/accommodations/${mockUser.id}/1`,
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify(accommodation),
        })
      )
    })

    it('throws when user is not logged in', async () => {
      vi.mocked(getSession).mockReturnValue(null)

      await expect(addAccommodationToTravel(1, {})).rejects.toThrow('User not logged')
    })

    it('throws when the response is not ok', async () => {
      mockFetch('Bad Request', false, 400)

      await expect(addAccommodationToTravel(1, {})).rejects.toThrow('Error saving accommodation')
    })
  })

  describe('addActivityToTravel', () => {
    it('calls POST /activities/{userId}/{travelId} with activity payload', async () => {
      const activity = { name: 'Eiffel Tower Tour' }
      const fetchSpy = mockFetch({ id: 1 })

      await addActivityToTravel(1, activity)

      expect(fetchSpy).toHaveBeenCalledWith(
        `${BASE_URL}/activities/${mockUser.id}/1`,
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify(activity),
        })
      )
    })

    it('throws when user is not logged in', async () => {
      vi.mocked(getSession).mockReturnValue(null)

      await expect(addActivityToTravel(1, {})).rejects.toThrow('User not logged')
    })
  })

  describe('addPoiToTravel', () => {
    it('calls POST /pois/{userId}/{travelId} with POI payload', async () => {
      const poi = { name: 'Le Jules Verne', source: 'OSM' }
      const fetchSpy = mockFetch({ id: 1 })

      await addPoiToTravel(1, poi)

      expect(fetchSpy).toHaveBeenCalledWith(
        `${BASE_URL}/pois/${mockUser.id}/1`,
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify(poi),
        })
      )
    })

    it('throws when user is not logged in', async () => {
      vi.mocked(getSession).mockReturnValue(null)

      await expect(addPoiToTravel(1, {})).rejects.toThrow('User not logged')
    })
  })

  describe('deleteAccommodationFromTravel', () => {
    it('calls DELETE /accommodations/{userId}/{travelId}/{accommodationId}', async () => {
      const fetchSpy = vi.spyOn(global, 'fetch').mockResolvedValue({
        ok: true,
        status: 204,
        json: async () => ({}),
        text: async () => '',
      } as Response)

      await deleteAccommodationFromTravel(1, 20)

      expect(fetchSpy).toHaveBeenCalledWith(
        `${BASE_URL}/accommodations/${mockUser.id}/1/20`,
        expect.objectContaining({ method: 'DELETE' })
      )
    })
  })

  describe('deleteActivityFromTravel', () => {
    it('calls DELETE /activities/{userId}/{travelId}/{activityId}', async () => {
      const fetchSpy = vi.spyOn(global, 'fetch').mockResolvedValue({
        ok: true,
        status: 204,
        json: async () => ({}),
        text: async () => '',
      } as Response)

      await deleteActivityFromTravel(1, 30)

      expect(fetchSpy).toHaveBeenCalledWith(
        `${BASE_URL}/activities/${mockUser.id}/1/30`,
        expect.objectContaining({ method: 'DELETE' })
      )
    })
  })

  describe('deletePoiFromTravel', () => {
    it('calls DELETE /pois/{userId}/{travelId}/{poiId}', async () => {
      const fetchSpy = vi.spyOn(global, 'fetch').mockResolvedValue({
        ok: true,
        status: 204,
        json: async () => ({}),
        text: async () => '',
      } as Response)

      await deletePoiFromTravel(1, 40)

      expect(fetchSpy).toHaveBeenCalledWith(
        `${BASE_URL}/pois/${mockUser.id}/1/40`,
        expect.objectContaining({ method: 'DELETE' })
      )
    })
  })

  describe('deleteFlightFromTravel', () => {
    it('calls DELETE /flights/{userId}/{travelId}/{flightId}', async () => {
      const fetchSpy = vi.spyOn(global, 'fetch').mockResolvedValue({
        ok: true,
        status: 204,
        json: async () => ({}),
        text: async () => '',
      } as Response)

      await deleteFlightFromTravel(1, 10)

      expect(fetchSpy).toHaveBeenCalledWith(
        `${BASE_URL}/flights/${mockUser.id}/1/10`,
        expect.objectContaining({ method: 'DELETE' })
      )
    })
  })
})
