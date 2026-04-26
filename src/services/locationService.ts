export type CitySuggestion = {
  name: string;
  country: string;
  lat: string;
  lon: string;
};

let citiesCache: CitySuggestion[] = [];

function parseCSVLine(line: string): string[] {
  return line
    .split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/)
    .map((value) => value.replace(/^"|"$/g, "").trim());
}

export async function loadCities(): Promise<CitySuggestion[]> {
  if (citiesCache.length) return citiesCache;

  const res = await fetch("/data/worldcities.csv");

  if (!res.ok) {
    console.error("Could not load cities CSV:", res.status);
    return [];
  }

  const text = await res.text();
  const lines = text.split("\n").filter(Boolean);

  const headers = parseCSVLine(lines[0]);

  const cityIndex = headers.indexOf("city");
  const countryIndex = headers.indexOf("country");
  const latIndex = headers.indexOf("lat");
  const lngIndex = headers.indexOf("lng");

  if (
    cityIndex === -1 ||
    countryIndex === -1 ||
    latIndex === -1 ||
    lngIndex === -1
  ) {
    console.error("CSV headers not found:", headers);
    return [];
  }

  citiesCache = lines
    .slice(1)
    .map((line) => {
      const cols = parseCSVLine(line);

      return {
        name: cols[cityIndex],
        country: cols[countryIndex],
        lat: cols[latIndex],
        lon: cols[lngIndex],
      };
    })
    .filter((city) => city.name && city.country && city.lat && city.lon);

  return citiesCache;
}

export async function searchCities(query: string): Promise<CitySuggestion[]> {
  const cities = await loadCities();

  const q = query.toLowerCase().trim();

  if (q.length < 2) return [];

  return cities
    .filter((city) =>
        city.name.toLowerCase().startsWith(q) ||
        city.country.toLowerCase().startsWith(q)
    )
    .slice(0, 10);
}