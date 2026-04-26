export type CitySuggestion = {
  name: string;
  country: string;
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

  if (cityIndex === -1 || countryIndex === -1) {
    console.error("CSV headers not found:", headers);
    return [];
  }

  citiesCache = lines.slice(1)
    .map((line) => {
      const cols = parseCSVLine(line);

      return {
        name: cols[cityIndex],
        country: cols[countryIndex],
      };
    })
    .filter((city) => city.name && city.country);

  return citiesCache;
}

export async function searchCities(query: string): Promise<CitySuggestion[]> {
  const cities = await loadCities();

  const q = query.toLowerCase().trim();

  if (q.length < 2) return [];

  return cities
    .filter((city) =>
      `${city.name} ${city.country}`.toLowerCase().includes(q)
    )
    .slice(0, 10);
}