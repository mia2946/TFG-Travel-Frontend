import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('../../services/apiClient', () => ({
  apiRequest: vi.fn(),
}))

import { searchActivities } from '../../services/activityService'
import { apiRequest } from '../../services/apiClient'

const BASE = 'http://localhost:8080'
const PATH = '/pois/v2/activities/geoapify'

const featureWithName = (
  name: string,
  categories: string[] = ['tourism.attraction']
) => ({
  type: 'Feature',
  properties: { name, categories },
  geometry: { type: 'Point', coordinates: [2.3522, 48.8566] },
})

const featureWithoutName = {
  type: 'Feature',
  properties: { categories: ['tourism.sights'] },
  geometry: { type: 'Point', coordinates: [2.35, 48.86] },
}

describe('activityService – searchActivities', () => {
  beforeEach(() => {
    vi.mocked(apiRequest).mockResolvedValue({
      type: 'FeatureCollection',
      features: [featureWithName('Eiffel Tower'), featureWithName('Louvre Museum')],
    })
  })

  it('calls apiRequest with the correct base URL and path', async () => {
    await searchActivities({ lat: '48.8566', lon: '2.3522' })
    const url: string = vi.mocked(apiRequest).mock.calls[0][0]
    expect(url).toContain(BASE)
    expect(url).toContain(PATH)
  })

  it('uses GET method', async () => {
    await searchActivities({ lat: '48.8566', lon: '2.3522' })
    const opts = vi.mocked(apiRequest).mock.calls[0][1]
    expect(opts.method).toBe('GET')
  })

  it('includes lat query parameter', async () => {
    await searchActivities({ lat: '48.8566', lon: '2.3522' })
    const url: string = vi.mocked(apiRequest).mock.calls[0][0]
    expect(url).toContain('lat=48.8566')
  })

  it('includes lon query parameter', async () => {
    await searchActivities({ lat: '48.8566', lon: '2.3522' })
    const url: string = vi.mocked(apiRequest).mock.calls[0][0]
    expect(url).toContain('lon=2.3522')
  })

  it('uses default radius of 3000 metres when not specified', async () => {
    await searchActivities({ lat: '48.8566', lon: '2.3522' })
    const url: string = vi.mocked(apiRequest).mock.calls[0][0]
    expect(url).toContain('radiusMeters=3000')
  })

  it('respects a custom radius', async () => {
    await searchActivities({ lat: '48.8566', lon: '2.3522', radius: 5000 })
    const url: string = vi.mocked(apiRequest).mock.calls[0][0]
    expect(url).toContain('radiusMeters=5000')
  })

  it('returns one result per named feature', async () => {
    const result = await searchActivities({ lat: '48.8566', lon: '2.3522' })
    expect(result).toHaveLength(2)
  })

  it('filters out features that have no name', async () => {
    vi.mocked(apiRequest).mockResolvedValue({
      type: 'FeatureCollection',
      features: [featureWithName('Eiffel Tower'), featureWithoutName],
    })
    const result = await searchActivities({ lat: '48.8566', lon: '2.3522' })
    expect(result).toHaveLength(1)
    expect(result[0].properties?.name).toBe('Eiffel Tower')
  })

  it('adds inferredType to each feature from categories', async () => {
    vi.mocked(apiRequest).mockResolvedValue({
      type: 'FeatureCollection',
      features: [featureWithName('Eiffel Tower', ['tourism.attraction'])],
    })
    const result = await searchActivities({ lat: '48.8566', lon: '2.3522' })
    expect(result[0].properties?.inferredType).toBe('ATTRACTION')
  })

  it('infers SQUARE type from tourism.sights.square category', async () => {
    vi.mocked(apiRequest).mockResolvedValue({
      type: 'FeatureCollection',
      features: [featureWithName('Trafalgar Square', ['tourism.sights.square'])],
    })
    const result = await searchActivities({ lat: '51.5', lon: '-0.12' })
    expect(result[0].properties?.inferredType).toBe('SQUARE')
  })

  it('infers MEMORIAL type from tourism.sights.memorial category', async () => {
    vi.mocked(apiRequest).mockResolvedValue({
      type: 'FeatureCollection',
      features: [featureWithName('War Memorial', ['tourism.sights.memorial'])],
    })
    const result = await searchActivities({ lat: '51.5', lon: '-0.12' })
    expect(result[0].properties?.inferredType).toBe('MEMORIAL')
  })

  it('infers STATUE type from tourism.attraction.artwork.statue category', async () => {
    vi.mocked(apiRequest).mockResolvedValue({
      type: 'FeatureCollection',
      features: [featureWithName('David Statue', ['tourism.attraction.artwork.statue'])],
    })
    const result = await searchActivities({ lat: '43.7', lon: '11.2' })
    expect(result[0].properties?.inferredType).toBe('STATUE')
  })

  it('returns an empty array when features list is empty', async () => {
    vi.mocked(apiRequest).mockResolvedValue({ type: 'FeatureCollection', features: [] })
    const result = await searchActivities({ lat: '0', lon: '0' })
    expect(result).toEqual([])
  })

  it('returns an empty array when features field is absent', async () => {
    vi.mocked(apiRequest).mockResolvedValue({ type: 'FeatureCollection' })
    const result = await searchActivities({ lat: '0', lon: '0' })
    expect(result).toEqual([])
  })

  it('preserves original feature properties alongside inferredType', async () => {
    vi.mocked(apiRequest).mockResolvedValue({
      type: 'FeatureCollection',
      features: [featureWithName('Louvre', ['tourism.attraction'])],
    })
    const result = await searchActivities({ lat: '48.8566', lon: '2.3522' })
    expect(result[0].properties?.name).toBe('Louvre')
    expect(result[0].properties?.categories).toEqual(['tourism.attraction'])
  })
})
