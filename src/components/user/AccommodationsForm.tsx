import { useState } from "react";
import CityAutocompleteInput from "./CityAutocompleteInput";
import { searchCities } from "../../services/locationService";
import { searchAccommodations } from "../../services/accommodationService";
import type {
  AccommodationResult,
  AccommodationSearchRequest,
} from "../../types/search";

type AccommodationFormState = AccommodationSearchRequest & {
  lat?: string;
  lon?: string;
};

export default function AccommodationsForm() {
  const [form, setForm] = useState<AccommodationFormState>({
    destination: "",
    lat: "",
    lon: "",
    checkIn: "",
    checkOut: "",
    guests: 1,
  });

  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<AccommodationResult[]>([]);
  const [error, setError] = useState("");

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]: name === "guests" ? Number(value) : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    setError("");
    setResults([]);
    setLoading(true);

    try {
      let finalForm = { ...form };

      if (!finalForm.lat || !finalForm.lon) {
        const matches = await searchCities(finalForm.destination);

        if (matches.length > 0) {
          finalForm = {
            ...finalForm,
            destination: `${matches[0].name}, ${matches[0].country}`,
            lat: matches[0].lat,
            lon: matches[0].lon,
          };

          setForm(finalForm);
        } else {
          setError("City not found");
          return;
        }
      }

      console.log("ACCOMMODATIONS SEARCH:", finalForm);

      const data = await searchAccommodations(finalForm);
      setResults(data);
    } catch (err) {
      console.error(err);
      setError("Accommodations not found");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <form onSubmit={handleSubmit}>
        <h4 className="mb-3 text-center">Search Accommodations</h4>

        <CityAutocompleteInput
          name="destination"
          label="Destination"
          icon="bi-building"
          value={form.destination}
          required
          onCityChange={({ value, lat, lon }) => {
            setForm((prev) => ({
              ...prev,
              destination: value,
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

        <button
          type="submit"
          className="btn btn-primary w-100"
          disabled={loading}
        >
          {loading ? "Searching..." : "Search Accommodations"}
        </button>
      </form>

      {error && <div className="alert alert-danger mt-3">{error}</div>}

      {results.length > 0 && (
        <div className="mt-4">
          <h5>Results</h5>
          <pre className="bg-dark text-light p-3 rounded">
            {JSON.stringify(results, null, 2)}
          </pre>
        </div>
      )}
    </>
  );
}