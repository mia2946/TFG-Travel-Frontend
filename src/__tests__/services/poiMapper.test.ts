import { describe, it, expect } from 'vitest'
import {
  inferPoiType,
  getPoiCategory,
  getPoiName,
  getPoiAddress,
  getPoiCoordinates,
  mapFeatureToPoi,
  mapFeaturesToPois,
} from '../../services/mappers/poiMapper'
import type { GeoJSONFeature } from '../../services/mappers/poiMapper'

const makeFeature = (overrides: Partial<GeoJSONFeature> = {}): GeoJSONFeature => ({
  geometry: { type: 'Point', coordinates: [2.3522, 48.8566] },
  properties: {
    name: 'Test Place',
    formatted: '10 Rue Test, Paris',
    categories: ['tourism.attraction'],
    city: 'Paris',
    country: 'France',
  },
  ...overrides,
})

describe('poiMapper – inferPoiType', () => {
  it('returns undefined for empty categories', () => {
    expect(inferPoiType([])).toBeUndefined()
    expect(inferPoiType(undefined)).toBeUndefined()
  })

  it('returns SQUARE for tourism.sights.square', () => {
    expect(inferPoiType(['tourism.sights.square'])).toBe('SQUARE')
  })

  it('returns MEMORIAL for tourism.sights.memorial', () => {
    expect(inferPoiType(['tourism.sights.memorial'])).toBe('MEMORIAL')
  })

  it('returns BUILDING for tourism.sights.building', () => {
    expect(inferPoiType(['tourism.sights.building'])).toBe('BUILDING')
  })

  it('returns STATUE for tourism.attraction.artwork.statue', () => {
    expect(inferPoiType(['tourism.attraction.artwork.statue'])).toBe('STATUE')
  })

  it('returns MURAL for tourism.attraction.artwork.mural', () => {
    expect(inferPoiType(['tourism.attraction.artwork.mural'])).toBe('MURAL')
  })

  it('returns CLOCK for tourism.attraction.clock', () => {
    expect(inferPoiType(['tourism.attraction.clock'])).toBe('CLOCK')
  })

  it('returns ARTWORK for tourism.attraction.artwork', () => {
    expect(inferPoiType(['tourism.attraction.artwork'])).toBe('ARTWORK')
  })

  it('returns ATTRACTION for tourism.attraction', () => {
    expect(inferPoiType(['tourism.attraction'])).toBe('ATTRACTION')
  })

  it('returns SIGHT for tourism.sights', () => {
    expect(inferPoiType(['tourism.sights'])).toBe('SIGHT')
  })

  it('returns TOURISM for generic tourism category', () => {
    expect(inferPoiType(['tourism'])).toBe('TOURISM')
  })

  it('returns GOVERNMENT_OFFICE for office.government', () => {
    expect(inferPoiType(['office.government'])).toBe('GOVERNMENT_OFFICE')
  })

  it('returns HISTORIC_BUILDING for building.historic', () => {
    expect(inferPoiType(['building.historic'])).toBe('HISTORIC_BUILDING')
  })

  it('returns PEDESTRIAN_AREA for highway.pedestrian', () => {
    expect(inferPoiType(['highway.pedestrian'])).toBe('PEDESTRIAN_AREA')
  })

  it('converts unknown category to upper-snake-case using first element', () => {
    expect(inferPoiType(['catering.restaurant'])).toBe('CATERING_RESTAURANT')
  })

  it('prioritises more specific category when multiple present (first match wins)', () => {
    expect(inferPoiType(['tourism.sights.square', 'tourism.attraction'])).toBe('SQUARE')
  })
})

describe('poiMapper – getPoiCategory', () => {
  it('returns undefined for empty categories', () => {
    expect(getPoiCategory([])).toBeUndefined()
    expect(getPoiCategory(undefined)).toBeUndefined()
  })

  it('prefers tourism.* categories', () => {
    expect(getPoiCategory(['catering.restaurant', 'tourism.attraction'])).toBe('tourism.attraction')
  })

  it('returns the first category as fallback when no tourism.* present', () => {
    expect(getPoiCategory(['catering.restaurant', 'amenity.pharmacy'])).toBe('catering.restaurant')
  })

  it('returns a tourism category directly when it is the only one', () => {
    expect(getPoiCategory(['tourism.sights'])).toBe('tourism.sights')
  })
})

describe('poiMapper – getPoiName', () => {
  it('returns properties.name when available', () => {
    expect(getPoiName(makeFeature({ properties: { name: 'Eiffel Tower' } }))).toBe('Eiffel Tower')
  })

  it('falls back to properties.formatted when name is null', () => {
    const feature = makeFeature({ properties: { name: null, formatted: 'Formatted Address' } })
    expect(getPoiName(feature)).toBe('Formatted Address')
  })

  it('returns "Unnamed place" when both name and formatted are null', () => {
    const feature = makeFeature({ properties: { name: null, formatted: null } })
    expect(getPoiName(feature)).toBe('Unnamed place')
  })

  it('returns "Unnamed place" when properties are absent', () => {
    expect(getPoiName({})).toBe('Unnamed place')
  })
})

describe('poiMapper – getPoiAddress', () => {
  it('returns properties.formatted when available', () => {
    const feature = makeFeature({ properties: { formatted: '10 Rue Test' } })
    expect(getPoiAddress(feature)).toBe('10 Rue Test')
  })

  it('returns undefined when formatted is null', () => {
    const feature = makeFeature({ properties: { formatted: null } })
    expect(getPoiAddress(feature)).toBeUndefined()
  })

  it('returns undefined when properties are absent', () => {
    expect(getPoiAddress({})).toBeUndefined()
  })
})

describe('poiMapper – getPoiCoordinates', () => {
  it('returns longitude as first coordinate and latitude as second', () => {
    const feature = makeFeature({ geometry: { type: 'Point', coordinates: [2.3522, 48.8566] } })
    const { latitude, longitude } = getPoiCoordinates(feature)
    expect(longitude).toBe(2.3522)
    expect(latitude).toBe(48.8566)
  })

  it('returns empty object when geometry is absent', () => {
    expect(getPoiCoordinates({})).toEqual({})
  })

  it('returns empty object when coordinates array is empty', () => {
    expect(getPoiCoordinates({ geometry: { coordinates: [] as any } })).toEqual({})
  })
})

describe('poiMapper – mapFeatureToPoi', () => {
  it('maps name from properties.name', () => {
    const poi = mapFeatureToPoi(makeFeature())
    expect(poi.name).toBe('Test Place')
  })

  it('maps latitude and longitude from GeoJSON coordinates', () => {
    const poi = mapFeatureToPoi(makeFeature())
    expect(poi.latitude).toBe(48.8566)
    expect(poi.longitude).toBe(2.3522)
  })

  it('sets source to OSM', () => {
    expect(mapFeatureToPoi(makeFeature()).source).toBe('OSM')
  })

  it('infers type from categories', () => {
    const feature = makeFeature({ properties: { name: 'Square', categories: ['tourism.sights.square'] } })
    expect(mapFeatureToPoi(feature).type).toBe('SQUARE')
  })

  it('generates an id containing name and coordinates', () => {
    const poi = mapFeatureToPoi(makeFeature())
    expect(poi.id).toContain('Test Place')
    expect(poi.id).toContain('48.8566')
    expect(poi.id).toContain('2.3522')
  })

  it('maps address from properties.formatted', () => {
    const poi = mapFeatureToPoi(makeFeature())
    expect(poi.address).toBe('10 Rue Test, Paris')
  })
})

describe('poiMapper – mapFeaturesToPois', () => {
  it('maps an array of features to POIs', () => {
    const features = [makeFeature(), makeFeature({ properties: { name: 'Louvre', formatted: '1 Rue de Rivoli' } })]
    const pois = mapFeaturesToPois(features)
    expect(pois).toHaveLength(2)
  })

  it('includes features whose name falls back to "Unnamed place" when they have coordinates', () => {
    const features = [
      makeFeature(),
      makeFeature({ properties: { name: null, formatted: null } }),
    ]
    const pois = mapFeaturesToPois(features)
    // getPoiName returns "Unnamed place" — still truthy, so both pass the name filter
    expect(pois).toHaveLength(2)
  })

  it('filters out features without coordinates', () => {
    const features = [
      makeFeature(),
      { properties: { name: 'No coords' } },
    ]
    const pois = mapFeaturesToPois(features)
    expect(pois).toHaveLength(1)
  })

  it('returns empty array for empty input', () => {
    expect(mapFeaturesToPois([])).toEqual([])
  })
})
