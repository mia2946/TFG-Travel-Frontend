import { useState, useEffect, useRef } from "react";
import { searchCities, loadCities } from "../../services/locationService";
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
  });

  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<ActivityResult[]>([]);
  const [error, setError] = useState("");

  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  const destinationRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadCities();
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        destinationRef.current &&
        !destinationRef.current.contains(event.target as Node)
      ) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setShowSuggestions(false);
      }
    };

    document.addEventListener("keydown", handleEsc);
    return () => document.removeEventListener("keydown", handleEsc);
  }, []);

  useEffect(() => {
    if (form.destination.trim().length < 2) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    const timer = setTimeout(async () => {
      const results = await searchCities(form.destination);
      setSuggestions(results);
      setShowSuggestions(results.length > 0);
    }, 300);

    return () => clearTimeout(timer);
  }, [form.destination]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]: value,
      ...(name === "destination" ? { lat: "", lon: "" } : {}),
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    setError("");
    setResults([]);
    setLoading(true);

    try {
      let finalForm = { ...form };

      if (!form.lat || !form.lon) {
        const matches = await searchCities(form.destination);

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
          setLoading(false);
          return;
        }
      }

      console.log("LATITUDE:", finalForm.lat);
      console.log("LONGITUDE:", finalForm.lon);

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

        <div ref={destinationRef} className="position-relative mb-3">
          <div className="form-floating input-icon">
            <i className="bi bi-building"></i>

            <input
              type="text"
              className="form-control"
              name="destination"
              placeholder="Destination"
              value={form.destination}
              onChange={handleChange}
              onFocus={() => {
                if (suggestions.length > 0) {
                  setShowSuggestions(true);
                }
              }}
              autoComplete="off"
              required
            />

            <label>Destination</label>
          </div>

          {showSuggestions && suggestions.length > 0 && (
            <div className="suggestions-dropdown">
              {suggestions.map((city, index) => (
                <div
                  key={`${city.name}-${city.country}-${index}`}
                  className="suggestion-item"
                  onClick={() => {
                    setForm((prev) => ({
                      ...prev,
                      destination: `${city.name}, ${city.country}`,
                      lat: city.lat,
                      lon: city.lon,
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