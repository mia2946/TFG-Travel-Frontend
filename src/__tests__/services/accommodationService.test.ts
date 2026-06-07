import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('../../services/apiClient', () => ({
  apiRequest: vi.fn(),
}))

import { searchAccommodations } from '../../services/accommodationService'
import { apiRequest } from '../../services/apiClient'

const BASE = 'http://localhost:8080'
const PATH = '/api/accommodations/search'

const mockResults = [
  {
    name: 'Hotel Paris',
    lat: 48.8566,
    lon: 2.3522,
    price: 150,
    rating: 4.5,
  },
  {
    name: 'Budget Inn',
    lat: 48.86,
    lon: 2.35,
    price: 80,
    rating: 3.0,
  },
]

describe('accommodationService – searchAccommodations', () => {
  beforeEach(() => {
    vi.mocked(apiRequest).mockResolvedValue(mockResults)
  })

  it('calls apiRequest with the correct base URL and path', async () => {
    await searchAccommodations({ lat: 48.8566, lon: 2.3522 })
    const url: string = vi.mocked(apiRequest).mock.calls[0][0]
    expect(url).toContain(BASE)
    expect(url).toContain(PATH)
  })

  it('uses GET method', async () => {
    await searchAccommodations({ lat: 48.8566, lon: 2.3522 })
    const opts = vi.mocked(apiRequest).mock.calls[0][1]
    expect(opts.method).toBe('GET')
  })

  it('encodes lat query parameter', async () => {
    await searchAccommodations({ lat: 48.8566, lon: 2.3522 })
    const url: string = vi.mocked(apiRequest).mock.calls[0][0]
    expect(url).toContain('lat=48.8566')
  })

  it('encodes lon query parameter', async () => {
    await searchAccommodations({ lat: 48.8566, lon: 2.3522 })
    const url: string = vi.mocked(apiRequest).mock.calls[0][0]
    expect(url).toContain('lon=2.3522')
  })

  it('uses default radius of 5000 when not provided', async () => {
    await searchAccommodations({ lat: 48.8566, lon: 2.3522 })
    const url: string = vi.mocked(apiRequest).mock.calls[0][0]
    expect(url).toContain('radius=5000')
  })

  it('uses default limit of 20 when not provided', async () => {
    await searchAccommodations({ lat: 48.8566, lon: 2.3522 })
    const url: string = vi.mocked(apiRequest).mock.calls[0][0]
    expect(url).toContain('limit=20')
  })

  it('respects a custom radius', async () => {
    await searchAccommodations({ lat: 48.8566, lon: 2.3522, radius: 10000 })
    const url: string = vi.mocked(apiRequest).mock.calls[0][0]
    expect(url).toContain('radius=10000')
  })

  it('respects a custom limit', async () => {
    await searchAccommodations({ lat: 48.8566, lon: 2.3522, limit: 5 })
    const url: string = vi.mocked(apiRequest).mock.calls[0][0]
    expect(url).toContain('limit=5')
  })

  it('returns the array from the API response', async () => {
    const result = await searchAccommodations({ lat: 48.8566, lon: 2.3522 })
    expect(result).toEqual(mockResults)
  })

  it('returns an empty array when API responds with empty list', async () => {
    vi.mocked(apiRequest).mockResolvedValue([])
    const result = await searchAccommodations({ lat: 0, lon: 0 })
    expect(result).toEqual([])
  })
})
