import { useState } from "react";
import { searchFlights } from "../../services/flightService";
import type { FlightResult, FlightSearchRequest } from "../../types/search";

export default function FlightsForm() {
  const [form, setForm] = useState<FlightSearchRequest>({
    origin: "",
    destination: "",
    departureDate: "",
    returnDate: "",
    passengers: 1,
  });

  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<FlightResult[]>([]);
  const [error, setError] = useState("");

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]: name === "passengers" ? Number(value) : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setResults([]);
    setLoading(true);

    try {
      const data = await searchFlights(form);
      setResults(data);
    } catch (err) {
      console.error(err);
      setError("No se pudieron obtener los vuelos");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <form onSubmit={handleSubmit}>
        <h4 className="mb-3 text-center">Search Flights</h4>

        <div className="form-floating input-icon mb-3">
          <i className="bi bi-airplane"></i>
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
          <i className="bi bi-calendar"></i>
          <input
            type="date"
            className="form-control"
            name="departureDate"
            placeholder="Departure Date"
            value={form.departureDate}
            onChange={handleChange}
            required
          />
          <label>Departure Date</label>
        </div>

        <div className="form-floating input-icon mb-3">
          <i className="bi bi-calendar2"></i>
          <input
            type="date"
            className="form-control"
            name="returnDate"
            placeholder="Return Date"
            value={form.returnDate || ""}
            onChange={handleChange}
          />
          <label>Return Date</label>
        </div>

        <div className="form-floating input-icon mb-3">
          <i className="bi bi-people"></i>
          <input
            type="number"
            className="form-control"
            name="passengers"
            placeholder="Passengers"
            value={form.passengers}
            onChange={handleChange}
            min="1"
            required
          />
          <label>Passengers</label>
        </div>

        <button type="submit" className="btn btn-primary w-100" disabled={loading}>
          {loading ? "Searching..." : "Search Flights"}
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