import { useState } from "react";
import { searchAccommodations } from "../../services/accommodationService";
import type {
  AccommodationResult,
  AccommodationSearchRequest,
} from "../../types/search";

export default function AccommodationsForm() {
  const [form, setForm] = useState<AccommodationSearchRequest>({
    destination: "",
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
      const data = await searchAccommodations(form);
      setResults(data);
    } catch (err) {
      console.error(err);
      setError("No se pudieron obtener los alojamientos");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <form onSubmit={handleSubmit}>
        <h4 className="mb-3 text-center">Search Activities</h4>

        <div className="form-floating input-icon mb-3">
          <i className="bi bi-building"></i>
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