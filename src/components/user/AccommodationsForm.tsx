import { useState } from "react";
import CityAutocompleteInput from "./CityAutocompleteInput";
import TravelPlanSelector from "./TravelPlanSelector";
import { searchCities } from "../../services/locationService";
import { searchAccommodations } from "../../services/accommodationService";
import { addAccommodationToTravel } from "../../services/travelService";
import type {
  AccommodationResult,
  AccommodationSearchRequest,
} from "../../types/search";

type AccommodationFormState = AccommodationSearchRequest & {
  lat?: string;
  lon?: string;
  cityName?: string;
  country?: string;
  countryCode?: string;
};

// ── helpers to extract fields from either GeoJSON or flat format ──────────────

function getField<T>(
  result: AccommodationResult,
  propKey: keyof NonNullable<AccommodationResult["properties"]>,
  flatKey: keyof AccommodationResult
): T | undefined {
  return (result.properties?.[propKey] ?? result[flatKey]) as T | undefined;
}

function getName(r: AccommodationResult): string {
  return getField<string>(r, "name", "name") || "Unnamed accommodation";
}

function getAddress(r: AccommodationResult): string | undefined {
  return (
    getField<string>(r, "formatted", "formatted") ||
    (r.properties?.address_line1
      ? [r.properties.address_line1, r.properties.address_line2]
          .filter(Boolean)
          .join(", ")
      : undefined) ||
    (r.address as string | undefined)
  );
}

function getCategories(r: AccommodationResult): string[] {
  return (
    (r.properties?.categories ?? (r.categories as string[] | undefined)) || []
  );
}

function getWebsite(r: AccommodationResult): string | undefined {
  return getField<string>(r, "website", "website");
}

function getPhone(r: AccommodationResult): string | undefined {
  return getField<string>(r, "phone", "phone");
}

function getOpeningHours(r: AccommodationResult): string | undefined {
  return r.properties?.opening_hours;
}

function getRating(r: AccommodationResult): number | undefined {
  return getField<number>(r, "rating", "rating");
}

function getCoordinates(
  r: AccommodationResult
): { lat: number; lon: number } | undefined {
  // GeoJSON format: geometry.coordinates = [lon, lat]
  if (r.geometry?.coordinates?.length === 2) {
    return { lon: r.geometry.coordinates[0], lat: r.geometry.coordinates[1] };
  }
  // Flat format: some backends use lat/lon, others use latitude/longitude
  const flatLat = r.latitude ?? r.lat;
  const flatLon = r.longitude ?? r.lon;
  if (flatLat != null && flatLon != null) {
    return { lat: Number(flatLat), lon: Number(flatLon) };
  }
  return undefined;
}

function formatCategory(cat: string): string {
  return cat
    .split(/[._-]/)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

// ── component ─────────────────────────────────────────────────────────────────

export default function AccommodationsForm() {
  const [form, setForm] = useState<AccommodationFormState>({
    destination: "",
    lat: "",
    lon: "",
    cityName: "",
    country: "",
    countryCode: "",
    checkIn: "",
    checkOut: "",
    guests: 1,
    radius: 5000,
    limit: 20,
  });

  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<AccommodationResult[]>([]);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [selectedTravelId, setSelectedTravelId] = useState<number | "">("");
  const [savingIndex, setSavingIndex] = useState<number | null>(null);
  const [plannedDateTimeByIndex, setPlannedDateTimeByIndex] = useState<
    Record<number, string>
  >({});

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]:
        name === "guests" || name === "radius" || name === "limit"
          ? Number(value)
          : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setResults([]);
    setLoading(true);

    try {
      let finalForm = { ...form };

      if (!finalForm.lat || !finalForm.lon) {
        const matches = await searchCities(finalForm.destination);

        if (matches.length > 0) {
          const best = matches[0];
          finalForm = {
            ...finalForm,
            destination: `${best.name}, ${best.country}`,
            cityName: best.name,
            country: best.country,
            countryCode: best.countryCode,
            lat: best.lat,
            lon: best.lon,
          };
          setForm(finalForm);
        } else {
          setError("City not found");
          return;
        }
      }

      const data = await searchAccommodations(finalForm);
      setResults(data);
    } catch (err) {
      console.error(err);
      setError("Accommodations not found");
    } finally {
      setLoading(false);
    }
  };

  const handleAddToTravel = async (
    result: AccommodationResult,
    index: number
  ) => {
    if (!selectedTravelId) {
      setError("Please select a travel plan first.");
      return;
    }

    const name = getName(result);
    const address = getAddress(result) || "";
    const categories = getCategories(result);
    const category = categories[0] || "accommodation";
    const phone = getPhone(result) || "";
    const website = getWebsite(result) || "";
    const coords = getCoordinates(result);
    const plannedDateTime = plannedDateTimeByIndex[index];

    try {
      setError("");
      setSuccess("");
      setSavingIndex(index);

      const destCityName =
        form.cityName || form.destination.split(", ")[0] || form.destination;
      const destCountry =
        form.country ||
        (form.destination.includes(", ")
          ? form.destination.split(", ").slice(1).join(", ")
          : "");

      const savePayload = {
        idPoi: null,
        externalId: `accommodation-${index}-${name}`,
        source:
          (result.properties?.datasource?.sourcename as string) || "GEOAPIFY",
        name,
        category,
        type: category,
        latitude: coords?.lat ?? null,
        longitude: coords?.lon ?? null,
        address,
      };
      console.log("save accommodation payload", savePayload);

      await addAccommodationToTravel(Number(selectedTravelId), {
        idPoi: null,
        externalId: `accommodation-${index}-${name}`,
        source:
          (result.properties?.datasource?.sourcename as string) || "GEOAPIFY",
        name,
        category,
        type: category,
        latitude: coords?.lat ?? null,
        longitude: coords?.lon ?? null,
        address,
        description: address,
        bookingLink: website,
        phone,
        price: "",
        imageUrl: "",
        plannedDateTime: plannedDateTime
          ? new Date(plannedDateTime).toISOString()
          : null,
        destination: {
          cityName: destCityName,
          country: destCountry,
          countryCode: form.countryCode || "",
          latitude: form.lat ? Number(form.lat) : null,
          longitude: form.lon ? Number(form.lon) : null,
        },
        rawData: {
          ...result,
          searchDestination: form.destination,
        },
      });

      setSuccess(`${name} added to the travel plan.`);
    } catch (err) {
      console.error(err);
      setError("Accommodation could not be added to the travel plan.");
    } finally {
      setSavingIndex(null);
    }
  };

  const renderCard = (result: AccommodationResult, index: number) => {
    const name = getName(result);
    const address = getAddress(result);
    const categories = getCategories(result);
    const website = getWebsite(result);
    const phone = getPhone(result);
    const openingHours = getOpeningHours(result);
    const rating = getRating(result);
    const coords = getCoordinates(result);
    const primaryCategory = categories[0];

    return (
      <div className="col-12 col-md-6" key={`accommodation-${index}`}>
        <div className="card bg-dark text-light border-secondary h-100 shadow-sm">
          <div className="card-body">
            <div className="d-flex justify-content-between align-items-start mb-2">
              <h6 className="card-title text-primary mb-0">{name}</h6>
              {rating != null && (
                <span className="badge bg-warning text-dark ms-2 flex-shrink-0">
                  <i className="bi bi-star-fill me-1"></i>
                  {rating.toFixed(1)}
                </span>
              )}
            </div>

            {primaryCategory && (
              <span className="badge bg-secondary mb-2">
                {formatCategory(primaryCategory)}
              </span>
            )}

            {categories.length > 1 && (
              <div className="mb-2">
                {categories.slice(1).map((cat) => (
                  <span
                    key={cat}
                    className="badge bg-dark border border-secondary me-1"
                  >
                    {formatCategory(cat)}
                  </span>
                ))}
              </div>
            )}

            {address && (
              <p className="mb-1 small">
                <i className="bi bi-geo-alt me-1 text-secondary"></i>
                {address}
              </p>
            )}

            {openingHours && (
              <p className="mb-1 small">
                <i className="bi bi-clock me-1 text-secondary"></i>
                {openingHours}
              </p>
            )}

            {phone && (
              <p className="mb-1 small">
                <i className="bi bi-telephone me-1 text-secondary"></i>
                {phone}
              </p>
            )}

            {coords && (
              <p className="mb-1 small text-secondary">
                <i className="bi bi-pin-map me-1"></i>
                {coords.lat.toFixed(5)}, {coords.lon.toFixed(5)}
              </p>
            )}

            {website && (
              <a
                href={website}
                target="_blank"
                rel="noreferrer"
                className="btn btn-outline-primary btn-sm mt-2 me-2"
              >
                <i className="bi bi-box-arrow-up-right me-1"></i>
                Website
              </a>
            )}

            <div className="mt-3">
              <label className="form-label small mb-1">
                Planned date and time
              </label>
              <input
                type="datetime-local"
                className="form-control form-control-sm"
                value={plannedDateTimeByIndex[index] || ""}
                onChange={(e) =>
                  setPlannedDateTimeByIndex((prev) => ({
                    ...prev,
                    [index]: e.target.value,
                  }))
                }
              />
            </div>

            <button
              type="button"
              className="btn btn-success btn-sm mt-2"
              disabled={!selectedTravelId || savingIndex === index}
              onClick={() => handleAddToTravel(result, index)}
            >
              {savingIndex === index ? "Adding..." : "Add to travel"}
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <>
      <TravelPlanSelector
        selectedTravelId={selectedTravelId}
        onTravelSelected={setSelectedTravelId}
      />

      <form onSubmit={handleSubmit}>
        <h4 className="mb-3 text-center">Search Accommodations</h4>

        <CityAutocompleteInput
          name="destination"
          label="Destination"
          icon="bi-building"
          value={form.destination}
          required
          onCityChange={({ value, cityName, country, countryCode, lat, lon }) => {
            setForm((prev) => ({
              ...prev,
              destination: value,
              cityName,
              country,
              countryCode,
              lat,
              lon,
            }));
          }}
        />

        <div className="form-floating input-icon mb-3">
          <i className="bi bi-calendar"></i>
          <input
            type="date"
            className="form-control"
            name="checkIn"
            placeholder="Check-in"
            value={form.checkIn}
            onChange={handleChange}
            required
          />
          <label>Check-in</label>
        </div>

        <div className="form-floating input-icon mb-3">
          <i className="bi bi-calendar2"></i>
          <input
            type="date"
            className="form-control"
            name="checkOut"
            placeholder="Check-out"
            value={form.checkOut}
            onChange={handleChange}
            required
          />
          <label>Check-out</label>
        </div>

        <div className="form-floating input-icon mb-3">
          <i className="bi bi-people"></i>
          <input
            type="number"
            className="form-control"
            name="guests"
            placeholder="Guests"
            value={form.guests}
            onChange={handleChange}
            min="1"
            required
          />
          <label>Guests</label>
        </div>

        <div className="form-floating input-icon mb-3">
          <i className="bi bi-geo"></i>
          <input
            type="number"
            className="form-control"
            name="radius"
            placeholder="Search radius (m)"
            value={form.radius}
            onChange={handleChange}
            min="100"
            required
          />
          <label>Search radius (m)</label>
        </div>

        <div className="form-floating input-icon mb-3">
          <i className="bi bi-list-ol"></i>
          <input
            type="number"
            className="form-control"
            name="limit"
            placeholder="Max results"
            value={form.limit}
            onChange={handleChange}
            min="1"
            max="100"
            required
          />
          <label>Max results</label>
        </div>

        <button
          type="submit"
          className="btn btn-primary w-100"
          disabled={loading}
        >
          {loading ? "Searching..." : "Search Accommodations"}
        </button>
      </form>

      {error && <div className="alert alert-danger mt-3">{error}</div>}
      {success && <div className="alert alert-success mt-3">{success}</div>}

      {results.length > 0 && (
        <div className="mt-4">
          <h5 className="mb-3">Results ({results.length})</h5>
          <div className="row g-3">
            {results.map((result, index) => renderCard(result, index))}
          </div>
        </div>
      )}
    </>
  );
}
