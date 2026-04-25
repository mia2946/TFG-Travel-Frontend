import { useState } from "react";
import { searchTransport } from "../../services/transportService";
import type {
  TransportResult,
  TransportSearchRequest,
} from "../../types/search";

export default function TransportForm() {
  const [form, setForm] = useState<TransportSearchRequest>({
    origin: "",
    destination: "",
    date: "",
    transportType: "",
  });

  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<TransportResult[]>([]);
  const [error, setError] = useState("");

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
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
      const data = await searchTransport(form);
      setResults(data);
    } catch (err) {
      console.error(err);
      setError("No se pudieron obtener los transportes");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <form onSubmit={handleSubmit}>
        <h4 className="mb-3 text-center">Search Transport</h4>

        <div className="form-floating input-icon mb-3">
          <i className="bi bi-box-arrow-right"></i>
          <input
            type="text"
            className="form-control"
            name="origin"
            placeholder="Origin"
            value={form.origin}
            onChange={handleChange}
            required
          />
          <label>Origin</label>
        </div>

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
          <i className="bi bi-calendar-event"></i>
          <input
            type="date"
            className="form-control"
            name="date"
            placeholder="Date"
            value={form.date || ""}
            onChange={handleChange}
          />
          <label>Date</label>
        </div>

        <div className="form-floating input-icon mb-3">
          <i className="bi bi-bus-front"></i>
          <select
            className="form-select"
            name="transportType"
            value={form.transportType || ""}
            onChange={handleChange}
          >
            <option value="">All</option>
            <option value="train">Train</option>
            <option value="bus">Bus</option>
            <option value="car">Car</option>
            <option value="plane">Plane</option>
          </select>
          <label>Transport Type</label>
        </div>

        <button type="submit" className="btn btn-primary w-100" disabled={loading}>
          {loading ? "Searching..." : "Search Transport"}
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