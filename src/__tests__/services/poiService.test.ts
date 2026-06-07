import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('../../services/apiClient', () => ({
  apiRequest: vi.fn(),
}))

import {
  searchPois,
  getPoiName,
  getPoiCategory,
  getPoiAddress,
  getPoiWebsite,
  getPoiPhone,
  getPoiOpeningHours,
  getPoiPrice,
  getPoiLatitude,
  getPoiLongitude,
  getPoiId,
  getPoiImageUrl,
  extractImageUrl,
  isPlannablePoi,
  filterPoiResults,
  getPoiDescription,
} from '../../services/poiService'
import { apiRequest } from '../../services/apiClient'

const BASE = 'http://localhost:8080'

const osmRestaurant = {
  id: 'osm-1',
  tags: {
    name: 'Café de Flore',
    amenity: 'cafe',
    'addr:street': 'Boulevard Saint-Germain',
    'addr:housenumber': '172',
    website: 'https://cafedeflore.fr',
    phone: '+33 1 45 48 55 26',
    opening_hours: 'Mo-Su 07:30-01:30',
    charge: '5 EUR',
  },
  lat: 48.8543,
  lon: 2.3333,
}

const geoapifyRestaurant = {
  type: 'Feature',
  name: 'Eiffel Tower Bistro',
  subtype: 'restaurant',
  lat: 48.8584,
  lon: 2.2945,
  address: '5 Avenue Anatole France',
  properties: {
    name: 'Eiffel Tower Bistro',
    formatted: '5 Avenue Anatole France, Paris',
    place_id: 'geoapify-abc123',
  },
  geometry: { coordinates: [2.2945, 48.8584] },
}

describe('poiService – searchPois', () => {
  beforeEach(() => {
    vi.mocked(apiRequest).mockReset()
    vi.mocked(apiRequest).mockResolvedValue([])
  })

  it('calls all three endpoints in parallel when poiType is absent', async () => {
    await searchPois({ lat: '48.8566', lon: '2.3522' })
    expect(apiRequest).toHaveBeenCalledTimes(3)
  })

  it('uses GET for food_drink endpoint when no poiType given', async () => {
    await searchPois({ lat: '48.8566', lon: '2.3522' })
    const foodDrinkCall = vi.mocked(apiRequest).mock.calls.find(
      ([url]) => (url as string).includes('food-drink')
    )
    expect(foodDrinkCall![1].method).toBe('GET')
  })

  it('uses POST for amenities endpoint when no poiType given', async () => {
    await searchPois({ lat: '48.8566', lon: '2.3522' })
    const amenitiesCall = vi.mocked(apiRequest).mock.calls.find(
      ([url]) => (url as string).includes('amenities')
    )
    expect(amenitiesCall![1].method).toBe('POST')
  })

  it('uses POST for embassies endpoint when no poiType given', async () => {
    await searchPois({ lat: '48.8566', lon: '2.3522' })
    const embassiesCall = vi.mocked(apiRequest).mock.calls.find(
      ([url]) => (url as string).includes('embassies')
    )
    expect(embassiesCall![1].method).toBe('POST')
  })

  it('combines results from all three endpoints', async () => {
    vi.mocked(apiRequest)
      .mockResolvedValueOnce([{ id: 'food-1' }])
      .mockResolvedValueOnce([{ id: 'amenity-1' }])
      .mockResolvedValueOnce([{ id: 'embassy-1' }])
    const result = await searchPois({ lat: '48.8566', lon: '2.3522' })
    expect(result).toHaveLength(3)
  })

  it('calls only food_drink endpoint for restaurant poiType', async () => {
    await searchPois({ lat: '48.8566', lon: '2.3522', poiType: 'restaurant' })
    expect(apiRequest).toHaveBeenCalledTimes(1)
    const [url] = vi.mocked(apiRequest).mock.calls[0]
    expect((url as string)).toContain('food-drink')
  })

  it('calls only food_drink endpoint for cafe poiType', async () => {
    await searchPois({ lat: '48.8566', lon: '2.3522', poiType: 'cafe' })
    expect(apiRequest).toHaveBeenCalledTimes(1)
  })

  it('calls only amenities endpoint for hospital poiType', async () => {
    await searchPois({ lat: '48.8566', lon: '2.3522', poiType: 'hospital' })
    expect(apiRequest).toHaveBeenCalledTimes(1)
    const [url] = vi.mocked(apiRequest).mock.calls[0]
    expect((url as string)).toContain('amenities')
  })

  it('calls only amenities endpoint for pharmacy poiType', async () => {
    await searchPois({ lat: '48.8566', lon: '2.3522', poiType: 'pharmacy' })
    expect(apiRequest).toHaveBeenCalledTimes(1)
    const [url] = vi.mocked(apiRequest).mock.calls[0]
    expect((url as string)).toContain('amenities')
  })

  it('calls only embassies endpoint for embassy poiType', async () => {
    await searchPois({ lat: '48.8566', lon: '2.3522', poiType: 'embassy' })
    expect(apiRequest).toHaveBeenCalledTimes(1)
    const [url] = vi.mocked(apiRequest).mock.calls[0]
    expect((url as string)).toContain('embassies')
  })

  it('food_drink GET call includes lat, lon, radius query params', async () => {
    await searchPois({ lat: '48.8566', lon: '2.3522', radius: 1500 })
    const foodDrinkCall = vi.mocked(apiRequest).mock.calls.find(
      ([url]) => (url as string).includes('food-drink')
    )
    const url = foodDrinkCall![0] as string
    expect(url).toContain('lat=48.8566')
    expect(url).toContain('lon=2.3522')
    expect(url).toContain('radius=1500')
  })

  it('amenities POST call includes lat, lon, radius in body', async () => {
    await searchPois({ lat: '48.8566', lon: '2.3522', radius: 2000 })
    const amenitiesCall = vi.mocked(apiRequest).mock.calls.find(
      ([url]) => (url as string).includes('amenities')
    )
    expect(amenitiesCall![1].body).toMatchObject({
      lat: 48.8566,
      lon: 2.3522,
      radius: 2000,
    })
  })

  it('uses default radius of 3000 when not specified', async () => {
    await searchPois({ lat: '48.8566', lon: '2.3522' })
    const foodDrinkCall = vi.mocked(apiRequest).mock.calls.find(
      ([url]) => (url as string).includes('food-drink')
    )
    const url = foodDrinkCall![0] as string
    expect(url).toContain('radius=3000')
  })
})

describe('poiService – utility functions', () => {
  describe('getPoiName', () => {
    it('returns poi.name when set directly', () => {
      expect(getPoiName({ name: 'Direct Name' })).toBe('Direct Name')
    })

    it('falls back to properties.name', () => {
      expect(getPoiName({ properties: { name: 'Props Name' } })).toBe('Props Name')
    })

    it('falls back to tags.name', () => {
      expect(getPoiName({ tags: { name: 'Tag Name' } })).toBe('Tag Name')
    })

    it('falls back to tags.amenity', () => {
      expect(getPoiName({ tags: { amenity: 'restaurant' } })).toBe('restaurant')
    })

    it('returns "Unnamed place" when nothing is set', () => {
      expect(getPoiName({})).toBe('Unnamed place')
    })
  })

  describe('getPoiCategory', () => {
    it('returns poi.subtype when set', () => {
      expect(getPoiCategory({ subtype: 'bistro' })).toBe('bistro')
    })

    it('falls back to tags.cuisine', () => {
      expect(getPoiCategory({ tags: { cuisine: 'french' } })).toBe('french')
    })

    it('falls back to tags.amenity', () => {
      expect(getPoiCategory({ tags: { amenity: 'hospital' } })).toBe('hospital')
    })

    it('returns empty string when nothing is set', () => {
      expect(getPoiCategory({})).toBe('')
    })
  })

  describe('getPoiAddress', () => {
    it('returns poi.address when set', () => {
      expect(getPoiAddress({ address: '123 Main St' })).toBe('123 Main St')
    })

    it('falls back to properties.formatted', () => {
      expect(getPoiAddress({ properties: { formatted: '5 Rue de Rivoli' } })).toBe('5 Rue de Rivoli')
    })

    it('builds address from tags addr: fields', () => {
      const poi = {
        tags: {
          'addr:street': 'Rue de Rivoli',
          'addr:housenumber': '10',
          'addr:postcode': '75001',
          'addr:city': 'Paris',
        },
      }
      const result = getPoiAddress(poi)
      expect(result).toContain('Rue de Rivoli')
      expect(result).toContain('10')
    })
  })

  describe('getPoiWebsite', () => {
    it('returns poi.website when set', () => {
      expect(getPoiWebsite({ website: 'https://example.com' })).toBe('https://example.com')
    })

    it('falls back to tags.website', () => {
      expect(getPoiWebsite({ tags: { website: 'https://tag.com' } })).toBe('https://tag.com')
    })
  })

  describe('getPoiPhone', () => {
    it('returns poi.phone when set', () => {
      expect(getPoiPhone({ phone: '+33123456789' })).toBe('+33123456789')
    })

    it('falls back to tags.phone', () => {
      expect(getPoiPhone({ tags: { phone: '+34600111222' } })).toBe('+34600111222')
    })
  })

  describe('getPoiOpeningHours', () => {
    it('returns poi.openingHours when set', () => {
      expect(getPoiOpeningHours({ openingHours: 'Mo-Su 09:00-21:00' })).toBe('Mo-Su 09:00-21:00')
    })

    it('falls back to poi.opening_hours', () => {
      expect(getPoiOpeningHours({ opening_hours: 'Mo-Fr 08:00-18:00' })).toBe('Mo-Fr 08:00-18:00')
    })

    it('falls back to tags.opening_hours', () => {
      expect(getPoiOpeningHours({ tags: { opening_hours: '24/7' } })).toBe('24/7')
    })
  })

  describe('getPoiPrice', () => {
    it('returns poi.price when set', () => {
      expect(getPoiPrice({ price: '10 EUR' })).toBe('10 EUR')
    })

    it('falls back to tags.charge', () => {
      expect(getPoiPrice({ tags: { charge: '5 EUR' } })).toBe('5 EUR')
    })

    it('returns empty string when nothing is set', () => {
      expect(getPoiPrice({})).toBe('')
    })
  })

  describe('getPoiLatitude', () => {
    it('returns poi.lat when set', () => {
      expect(getPoiLatitude({ lat: 48.8566 })).toBe(48.8566)
    })

    it('falls back to geometry coordinates[1] (GeoJSON convention)', () => {
      expect(getPoiLatitude({ geometry: { coordinates: [2.3522, 48.8566] } })).toBe(48.8566)
    })

    it('returns null when no location data', () => {
      expect(getPoiLatitude({})).toBeNull()
    })
  })

  describe('getPoiLongitude', () => {
    it('returns poi.lon when set', () => {
      expect(getPoiLongitude({ lon: 2.3522 })).toBe(2.3522)
    })

    it('falls back to geometry coordinates[0]', () => {
      expect(getPoiLongitude({ geometry: { coordinates: [2.3522, 48.8566] } })).toBe(2.3522)
    })

    it('returns null when no location data', () => {
      expect(getPoiLongitude({})).toBeNull()
    })
  })

  describe('getPoiId', () => {
    it('returns poi.id when set', () => {
      expect(getPoiId({ id: 'osm-999' }, 0)).toBe('osm-999')
    })

    it('falls back to properties.place_id', () => {
      expect(getPoiId({ properties: { place_id: 'geoapify-abc' } }, 0)).toBe('geoapify-abc')
    })

    it('generates id from name and index as last resort', () => {
      const result = getPoiId({ tags: { name: 'Café' } }, 3)
      expect(result).toContain('Café')
      expect(result).toContain('3')
    })
  })

  describe('extractImageUrl', () => {
    it('returns undefined for non-string input', () => {
      expect(extractImageUrl(null)).toBeUndefined()
      expect(extractImageUrl(42)).toBeUndefined()
    })

    it('returns undefined for empty string', () => {
      expect(extractImageUrl('')).toBeUndefined()
    })

    it('returns plain https URL as-is', () => {
      expect(extractImageUrl('https://example.com/photo.jpg')).toBe('https://example.com/photo.jpg')
    })

    it('returns undefined for non-http string', () => {
      expect(extractImageUrl('not-a-url')).toBeUndefined()
    })

    it('extracts and resizes Google user content URL', () => {
      const raw = 'https://lh3.googleusercontent.com/p/AF1QipNfoo=w240-h160'
      const result = extractImageUrl(raw)
      expect(result).toContain('lh3.googleusercontent.com')
      expect(result).toContain('=s800')
    })
  })

  describe('isPlannablePoi', () => {
    it('returns true for restaurant', () => {
      expect(isPlannablePoi({ tags: { amenity: 'restaurant' } })).toBe(true)
    })

    it('returns true for cafe', () => {
      expect(isPlannablePoi({ tags: { amenity: 'cafe' } })).toBe(true)
    })

    it('returns true for bar', () => {
      expect(isPlannablePoi({ tags: { amenity: 'bar' } })).toBe(true)
    })

    it('returns true for luggage_locker', () => {
      expect(isPlannablePoi({ tags: { amenity: 'luggage_locker' } })).toBe(true)
    })

    it('returns false for hospital', () => {
      expect(isPlannablePoi({ tags: { amenity: 'hospital' } })).toBe(false)
    })

    it('returns false for embassy', () => {
      expect(isPlannablePoi({ tags: { diplomatic: 'embassy' } })).toBe(false)
    })

    it('returns false for unknown type', () => {
      expect(isPlannablePoi({ tags: { amenity: 'bench' } })).toBe(false)
    })
  })

  describe('filterPoiResults', () => {
    const pois = [
      { tags: { amenity: 'restaurant' } },
      { tags: { amenity: 'hospital' } },
      { tags: { amenity: 'cafe' } },
      { tags: { diplomatic: 'embassy' } },
    ]

    it('returns all results when no poiType is given', () => {
      expect(filterPoiResults(pois)).toHaveLength(4)
    })

    it('filters to only restaurants when poiType is "restaurant"', () => {
      const result = filterPoiResults(pois, 'restaurant')
      expect(result).toHaveLength(1)
      expect(result[0].tags!['amenity']).toBe('restaurant')
    })

    it('filters to only hospitals when poiType is "hospital"', () => {
      const result = filterPoiResults(pois, 'hospital')
      expect(result).toHaveLength(1)
    })

    it('handles POI arrays wrapped in an elements key', () => {
      const result = filterPoiResults({ elements: pois })
      expect(result).toHaveLength(4)
    })

    it('filters luggage_locker when poiType is "luggage"', () => {
      const data = [{ tags: { amenity: 'luggage_locker' } }, { tags: { amenity: 'restaurant' } }]
      const result = filterPoiResults(data, 'luggage')
      expect(result).toHaveLength(1)
      expect(result[0].tags!['amenity']).toBe('luggage_locker')
    })
  })

  describe('getPoiDescription', () => {
    it('returns poi.description when set', () => {
      expect(getPoiDescription({ description: 'A lovely cafe' })).toBe('A lovely cafe')
    })

    it('falls back to properties.description', () => {
      expect(getPoiDescription({ properties: { description: 'From props' } })).toBe('From props')
    })

    it('falls back to tags.note', () => {
      expect(getPoiDescription({ tags: { note: 'Closed Sundays' } })).toBe('Closed Sundays')
    })

    it('returns empty string when nothing is set', () => {
      expect(getPoiDescription({})).toBe('')
    })
  })
})
