import { useState } from "react";
import { searchPois } from "../../services/poiService";
import type { PoiResult, PoiSearchRequest } from "../../types/search";

export default function PointsOfInterestForm() {
  const [form, setForm] = useState<PoiSearchRequest>({
    destination: "",
    poiType: "",
    radius: 2000,
  });

  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<PoiResult[]>([]);
  const [error, setError] = useState("");

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]: name === "radius" ? Number(value) : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setResults([]);
    setLoading(true);

    try {
      const data = await searchPois(form);
      setResults(data);
    } catch (err) {
      console.error(err);
      setError("No se pudieron obtener los puntos de interés");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <form onSubmit={handleSubmit}>
        <h4 className="mb-3 text-center">Search Points of Interest</h4>

        <div className="form-floating input-icon mb-3">
          <i className="bi bi-geo-alt"></i>
          <input
            type="text"
            className="form-control"
            name="destination"
            placeholder="Destination"
            value={form.destination}
            onChange={handleChange}
            required
          />
          <label>Destination</label>
        </div>

        <div className="form-floating input-icon mb-3">
          <i className="bi bi-pin-map"></i>
          <select
            className="form-select"
            name="poiType"
            value={form.poiType || ""}
            onChange={handleChange}
          >
            <option value="">All</option>
            <option value="restaurant">Restaurant</option>
            <option value="hospital">Hospital</option>
            <option value="pharmacy">Pharmacy</option>
            <option value="police">Police</option>
            <option value="atm">ATM</option>
            <option value="toilets">Toilets</option>
          </select>
          <label>POI Type</label>
        </div>

        <div className="form-floating input-icon mb-3">
          <i className="bi bi-bullseye"></i>
          <input
            type="number"
            className="form-control"
            name="radius"
            placeholder="Radius"
            value={form.radius}
            onChange={handleChange}
            min="100"
            step="100"
          />
          <label>Radius (meters)</label>
        </div>

        <button type="submit" className="btn btn-primary w-100" disabled={loading}>
          {loading ? "Searching..." : "Search POIs"}
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