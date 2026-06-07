import { describe, it, expect, vi, beforeEach } from 'vitest'

const CSV_CONTENT = `city,country,iso2,lat,lng
Paris,France,FR,48.8566,2.3522
Madrid,Spain,ES,40.4168,-3.7038
Barcelona,Spain,ES,41.3851,2.1734
London,United Kingdom,GB,51.5074,-0.1278
Berlin,Germany,DE,52.5200,13.4050
`

function mockFetchCsv(content = CSV_CONTENT, ok = true) {
  return vi.spyOn(global, 'fetch').mockResolvedValue({
    ok,
    status: ok ? 200 : 500,
    text: async () => content,
    json: async () => ({}),
  } as Response)
}

// Import after mock setup so module-level cache is always empty
// (vi.resetModules is not called here — each test shares module instance)

describe('locationService', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  describe('loadCities', () => {
    it('fetches /data/worldcities.csv', async () => {
      const fetchSpy = mockFetchCsv()
      const { loadCities } = await import('../../services/locationService')
      await loadCities()
      expect(fetchSpy).toHaveBeenCalledWith('/data/worldcities.csv')
    })

    it('parses CSV and returns CitySuggestion objects', async () => {
      mockFetchCsv()
      const { loadCities } = await import('../../services/locationService')
      const cities = await loadCities()
      const paris = cities.find((c) => c.name === 'Paris')
      expect(paris).toBeDefined()
      expect(paris!.country).toBe('France')
      expect(paris!.countryCode).toBe('FR')
      expect(paris!.lat).toBe('48.8566')
      expect(paris!.lon).toBe('2.3522')
    })

    it('returns an empty array when the fetch fails', async () => {
      vi.spyOn(global, 'fetch').mockResolvedValue({
        ok: false,
        status: 500,
        text: async () => '',
        json: async () => ({}),
      } as Response)
      vi.resetModules()
      const { loadCities } = await import('../../services/locationService')
      const result = await loadCities()
      expect(result).toEqual([])
    })

    it('returns cache on second call without additional fetch', async () => {
      vi.resetModules()
      const fetchSpy = mockFetchCsv()
      const { loadCities } = await import('../../services/locationService')
      await loadCities()
      await loadCities()
      expect(fetchSpy).toHaveBeenCalledTimes(1)
    })
  })

  describe('searchCities', () => {
    it('returns cities whose names start with the query (case-insensitive)', async () => {
      vi.resetModules()
      mockFetchCsv()
      const { searchCities } = await import('../../services/locationService')
      const results = await searchCities('par')
      expect(results.some((c) => c.name === 'Paris')).toBe(true)
    })

    it('returns an empty array for queries shorter than 2 characters', async () => {
      vi.resetModules()
      mockFetchCsv()
      const { searchCities } = await import('../../services/locationService')
      const results = await searchCities('p')
      expect(results).toEqual([])
    })

    it('returns no more than 10 results', async () => {
      const massiveCSV =
        'city,country,iso2,lat,lng\n' +
        Array.from({ length: 20 }, (_, i) => `City${i},Country,CC,${i},${i}`).join('\n')
      vi.resetModules()
      mockFetchCsv(massiveCSV)
      const { searchCities } = await import('../../services/locationService')
      const results = await searchCities('ci')
      expect(results.length).toBeLessThanOrEqual(10)
    })

    it('matches cities by country name', async () => {
      vi.resetModules()
      mockFetchCsv()
      const { searchCities } = await import('../../services/locationService')
      const results = await searchCities('spa')
      expect(results.some((c) => c.country === 'Spain')).toBe(true)
    })

    it('returns empty array when no city matches the query', async () => {
      vi.resetModules()
      mockFetchCsv()
      const { searchCities } = await import('../../services/locationService')
      const results = await searchCities('zzzzz')
      expect(results).toEqual([])
    })
  })

  describe('resolveCityCoordinates', () => {
    it('returns provided coordinates directly when both lat and lon are given', async () => {
      vi.resetModules()
      mockFetchCsv()
      const { resolveCityCoordinates } = await import('../../services/locationService')
      const result = await resolveCityCoordinates('Paris', '48.8566', '2.3522')
      expect(result.lat).toBe('48.8566')
      expect(result.lon).toBe('2.3522')
      expect(result.destination).toBe('Paris')
    })

    it('does not fetch CSV when lat/lon are already provided', async () => {
      vi.resetModules()
      const fetchSpy = mockFetchCsv()
      const { resolveCityCoordinates } = await import('../../services/locationService')
      await resolveCityCoordinates('Paris', '48.8566', '2.3522')
      expect(fetchSpy).not.toHaveBeenCalled()
    })

    it('searches CSV and returns best match when no coordinates provided', async () => {
      vi.resetModules()
      mockFetchCsv()
      const { resolveCityCoordinates } = await import('../../services/locationService')
      const result = await resolveCityCoordinates('Paris')
      expect(result.lat).toBe('48.8566')
      expect(result.lon).toBe('2.3522')
    })

    it('returns formatted destination as "city, country"', async () => {
      vi.resetModules()
      mockFetchCsv()
      const { resolveCityCoordinates } = await import('../../services/locationService')
      const result = await resolveCityCoordinates('Madrid')
      expect(result.destination).toBe('Madrid, Spain')
    })

    it('throws when city is not found and no coordinates given', async () => {
      vi.resetModules()
      mockFetchCsv()
      const { resolveCityCoordinates } = await import('../../services/locationService')
      await expect(resolveCityCoordinates('Zzzzzland')).rejects.toThrow('City not found')
    })
  })
})
