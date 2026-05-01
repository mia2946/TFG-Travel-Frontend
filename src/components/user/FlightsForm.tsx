import { useState } from "react";
import CityAutocompleteInput from "./CityAutocompleteInput";
import { resolveCityCoordinates } from "../../services/locationService";
import { searchFlights } from "../../services/flightService";
import type { FlightResult, FlightSearchRequest } from "../../types/search";

type FlightFormState = FlightSearchRequest & {
  originLat?: string;
  originLon?: string;
  destinationLat?: string;
  destinationLon?: string;
  tripType: "oneWay" | "roundTrip";
};

export default function FlightsForm() {
  const [form, setForm] = useState<FlightFormState>({
    origin: "",
    originLat: "",
    originLon: "",
    destination: "",
    destinationLat: "",
    destinationLon: "",
    departureDate: "",
    returnDate: "",
    passengers: 1,
    tripType: "oneWay",
  });

  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<FlightResult[]>([]);
  const [error, setError] = useState("");

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]: name === "passengers" ? Number(value) : value,
      ...(name === "tripType" && value === "oneWay" ? { returnDate: "" } : {}),
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    setError("");
    setResults([]);
    setLoading(true);

    try {
      const originCoords = await resolveCityCoordinates(
        form.origin,
        form.originLat,
        form.originLon
      );

      const destinationCoords = await resolveCityCoordinates(
        form.destination,
        form.destinationLat,
        form.destinationLon
      );

      const finalForm = {
        ...form,
        origin: originCoords.destination,
        originLat: originCoords.lat,
        originLon: originCoords.lon,
        destination: destinationCoords.destination,
        destinationLat: destinationCoords.lat,
        destinationLon: destinationCoords.lon,
        returnDate: form.tripType === "roundTrip" ? form.returnDate : "",
      };

      console.log("FLIGHTS SEARCH:", finalForm);

      const data = await searchFlights(finalForm);
      setResults(data);
    } catch (err) {
      console.error(err);
      setError("Flight results could not be retrieved.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <form onSubmit={handleSubmit}>
        <h4 className="mb-3 text-center">Search Flights</h4>

        <div className="form-floating input-icon mb-3">
          <i className="bi bi-arrow-left-right"></i>
          <select
            className="form-select"
            name="tripType"
            value={form.tripType}
            onChange={handleChange}
          >
            <option value="oneWay">One-way</option>
            <option value="roundTrip">Round trip</option>
          </select>
          <label>Trip Type</label>
        </div>

        <CityAutocompleteInput
          name="origin"
          label="Origin"
          icon="bi-airplane"
          value={form.origin}
          required
          onCityChange={({ value, lat, lon }) => {
            setForm((prev) => ({
              ...prev,
              origin: value,
              originLat: lat,
              originLon: lon,
            }));
          }}
        />

        <CityAutocompleteInput
          name="destination"
          label="Destination"
          icon="bi-geo-alt"
          value={form.destination}
          required
          onCityChange={({ value, lat, lon }) => {
            setForm((prev) => ({
              ...prev,
              destination: value,
              destinationLat: lat,
              destinationLon: lon,
            }));
          }}
        />

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

        {form.tripType === "roundTrip" && (
          <div className="form-floating input-icon mb-3">
            <i className="bi bi-calendar2"></i>
            <input
              type="date"
              className="form-control"
              name="returnDate"
              placeholder="Return Date"
              value={form.returnDate || ""}
              onChange={handleChange}
              required
            />
            <label>Return Date</label>
          </div>
        )}

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

        <button
          type="submit"
          className="btn btn-primary w-100"
          disabled={loading}
        >
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