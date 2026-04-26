import { useState, useEffect } from "react";
import { searchCities, loadCities } from "../../services/locationService";
import { searchActivities } from "../../services/activityService";
import type {
  ActivityResult,
  ActivitySearchRequest,
} from "../../types/search";

export default function AccommodationsForm() {
  const [form, setForm] = useState<ActivitySearchRequest>({
    destination: ""
  });

  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<ActivityResult[]>([]);
  const [error, setError] = useState("");

  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  useEffect(() => {
    loadCities(); // precarga silenciosa
  }, []);

  useEffect(() => {
    if (form.destination.trim().length < 2) {
      setSuggestions([]);
      return;
    }

    const timer = setTimeout(async () => {
      const results = await searchCities(form.destination);
      setSuggestions(results);
      setShowSuggestions(true);
    }, 300);

    return () => clearTimeout(timer);
  }, [form.destination]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
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
      const data = await searchActivities(form);
      setResults(data);
    } catch (err) {
      console.error(err);
      setError("Activities connot be found.");
    } finally {
      setLoading(false);
    }
  };
 
  return (
    <>
      <form onSubmit={handleSubmit}>
        <h4 className="mb-3 text-center">Search Activities</h4>

        <div className="form-floating input-icon mb-3 position-relative">
          <i className="bi bi-building"></i>

          <input
            type="text"
            className="form-control"
            name="destination"
            placeholder="Destination"
            value={form.destination}
            onChange={handleChange}
            onFocus={() => setShowSuggestions(true)}
            autoComplete="off"
            required
          />

          <label>Destination</label>

          {showSuggestions && suggestions.length > 0 && (
            <div
              className="suggestions-dropdown"
              onClick={(e) => e.stopPropagation()}
            >
              {suggestions.map((city, index) => (
                <div
                  key={index}
                  className="suggestion-item"
                  onClick={() => {
                    setForm((prev) => ({
                      ...prev,
                      destination: `${city.name}, ${city.country}`,
                    }));
                    setShowSuggestions(false);
                  }}
                >
                  {city.name}, {city.country}
                </div>
              ))}
            </div>
          )}
        </div>

        <button type="submit" className="btn btn-primary w-100" disabled={loading}>
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