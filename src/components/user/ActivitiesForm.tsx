import { useState } from "react";
import CityAutocompleteInput from "./CityAutocompleteInput";
import { resolveCityCoordinates } from "../../services/locationService";
import { searchActivities } from "../../services/activityService";
import type {
  ActivityResult,
  ActivitySearchRequest,
} from "../../types/search";

export default function ActivitiesForm() {
  const [form, setForm] = useState<ActivitySearchRequest>({
    destination: "",
    lat: "",
    lon: "",
    activityType: "",
  });

  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<ActivityResult[]>([]);
  const [error, setError] = useState("");

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const { name, value } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    setError("");
    setResults([]);
    setLoading(true);

    try {
      const coords = await resolveCityCoordinates(
        form.destination,
        form.lat,
        form.lon
      );

      const finalForm = {
        ...form,
        ...coords,
      };

      console.log("ACTIVITIES SEARCH:", finalForm);

      const data = await searchActivities(finalForm);
      setResults(data);
    } catch (err) {
      console.error(err);
      setError("Activities cannot be found.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <form onSubmit={handleSubmit}>
        <h4 className="mb-3 text-center">Search Activities</h4>

        <CityAutocompleteInput
          name="destination"
          label="Destination"
          icon="bi-map"
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
          <i className="bi bi-stars"></i>
          <select
            className="form-select"
            name="activityType"
            value={form.activityType || ""}
            onChange={handleChange}
          >
            <option value="">All</option>
            <option value="culture">Culture</option>
            <option value="nature">Nature</option>
            <option value="museums">Museums</option>
            <option value="tours">Tours</option>
          </select>
          <label>Activity Type</label>
        </div>

        <button
          type="submit"
          className="btn btn-primary w-100"
          disabled={loading}
        >
          {loading ? "Searching..." : "Search Activities"}
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