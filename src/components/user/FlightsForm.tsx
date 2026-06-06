import { useState } from "react";
import CityAutocompleteInput from "./CityAutocompleteInput";
import TravelPlanSelector from "./TravelPlanSelector";
import { resolveCityCoordinates } from "../../services/locationService";
import { searchFlights } from "../../services/flightService";
import { getAirportsByCoordinates } from "../../services/airportService";
import { addFlightToTravel } from "../../services/flightService";
import { getSession } from "../../services/authService";
import type {
  FlightOption,
  FlightSearchRequest,
  FlightsApiResponse,
} from "../../types/search";

type FlightFormState = {
  origin: string;
  destination: string;

  originLat?: string;
  originLon?: string;
  originCity?: string;
  originCountry?: string;
  originCountryCode?: string;
  destinationLat?: string;
  destinationLon?: string;
  destinationCity?: string;
  destinationCountry?: string;
  destinationCountryCode?: string;

  departureId: string;
  arrivalId: string;

  outboundDate: string;
  returnDate?: string;

  passengers: number;

  currency: string;
  hl: string;
  gl: string;

  type: 1 | 2 | 3;

  travelClass: 1 | 2 | 3 | 4;
  sortBy: 1 | 2 | 3 | 4 | 5;

  showHidden: boolean;
  deepSearch: boolean;
};

export default function FlightsForm() {
  const [form, setForm] = useState<FlightFormState>({
    origin: "",
    destination: "",

    originLat: "",
    originLon: "",
    destinationLat: "",
    destinationLon: "",

    departureId: "",
    arrivalId: "",

    outboundDate: "",
    returnDate: "",

    passengers: 1,

    currency: "EUR",
    hl: "es",
    gl: "es",

    type: 2,

    travelClass: 1,
    sortBy: 1,

    showHidden: false,
    deepSearch: false,
  });

  const [selectedTravelId, setSelectedTravelId] = useState<number | "">("");
  const [savingFlightId, setSavingFlightId] = useState<string | null>(null);

  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<FlightsApiResponse | null>(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target;

    let parsedValue: string | number | boolean = value;

    if (
      name === "passengers" ||
      name === "type" ||
      name === "travelClass" ||
      name === "sortBy"
    ) {
      parsedValue = Number(value);
    }

    if (type === "checkbox") {
      parsedValue = (e.target as HTMLInputElement).checked;
    }

    setForm((prev) => ({
      ...prev,
      [name]: parsedValue,
      ...(name === "type" && Number(value) === 2 ? { returnDate: "" } : {}),
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    setError("");
    setSuccess("");
    setResults(null);
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

      const departureAirports = await getAirportsByCoordinates(
        Number(originCoords.lat),
        Number(originCoords.lon)
      );

      const arrivalAirports = await getAirportsByCoordinates(
        Number(destinationCoords.lat),
        Number(destinationCoords.lon)
      );

      const departureId = departureAirports
        .map((airport) => airport.iata)
        .filter(Boolean)
        .join(",");

      const arrivalId = arrivalAirports
        .map((airport) => airport.iata)
        .filter(Boolean)
        .join(",");

      if (!departureId) {
        throw new Error("No IATA code found for origin.");
      }

      if (!arrivalId) {
        throw new Error("No IATA code found for destination.");
      }

      if (form.type === 1 && !form.returnDate) {
        throw new Error("Return date is required for round trips.");
      }

      const request: FlightSearchRequest = {
        departureId,
        arrivalId,
        outboundDate: form.outboundDate,
        returnDate: form.type === 1 ? form.returnDate : undefined,
        passengers: form.passengers,
        currency: form.currency,
        hl: form.hl,
        gl: form.gl,
        type: form.type,
        travelClass: form.travelClass,
        sortBy: form.sortBy,
        showHidden: form.showHidden,
        deepSearch: form.deepSearch,
      };

      const data = await searchFlights(request);
      setResults(data);
    } catch (err) {
      console.error(err);
      setError(
        err instanceof Error
          ? err.message
          : "Flight results could not be retrieved."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleAddFlightToTravel = async (
    flight: FlightOption,
    index: number
  ) => {
    if (!selectedTravelId) {
      setError("Please select a travel plan first.");
      return;
    }

    const session = getSession();
    const userId = session?.id;

    if (!userId) {
      setError("User session not found.");
      return;
    }

    const firstLeg = flight.flights?.[0];
    const lastLeg = flight.flights?.[flight.flights.length - 1];

    const flightId = `${firstLeg?.flight_number || "flight"}-${index}`;

    try {
      setError("");
      setSuccess("");
      setSavingFlightId(flightId);

      const toISOString = (dateTimeStr?: string) => {
        if (!dateTimeStr) return new Date().toISOString();
        return new Date(dateTimeStr.replace(" ", "T")).toISOString();
      };

      await addFlightToTravel(userId, Number(selectedTravelId), {
        origin: {
          cityName: form.originCity || form.origin.split(", ")[0],
          country: form.originCountry || form.origin.split(", ").slice(1).join(", "),
          countryCode: form.originCountryCode || "",
          latitude: Number(form.originLat) || 0,
          longitude: Number(form.originLon) || 0,
          description: "",
        },
        destination: {
          cityName: form.destinationCity || form.destination.split(", ")[0],
          country: form.destinationCountry || form.destination.split(", ").slice(1).join(", "),
          countryCode: form.destinationCountryCode || "",
          latitude: Number(form.destinationLat) || 0,
          longitude: Number(form.destinationLon) || 0,
          description: "",
        },
        transport: {
          transportType: "FLIGHT",
          provider: firstLeg?.airline || "",
          departureTime: toISOString(firstLeg?.departure_airport?.time),
          arrivalTime: toISOString(lastLeg?.arrival_airport?.time),
          price: flight.price || 0,
          currency: form.currency || "EUR",
          apiProvider: "GOOGLE_FLIGHTS",
        },
        details: {
          flightCode: firstLeg?.flight_number || "",
          airline: firstLeg?.airline || "",
          originAirport: firstLeg?.departure_airport?.id || "",
          destinationAirport: lastLeg?.arrival_airport?.id || "",
          cabinClass: firstLeg?.travel_class || "",
          luggageIncluded: false,
        },
      });

      setSuccess("Flight added to the travel plan.");
    } catch (err) {
      console.error(err);
      setError("Flight could not be added to the travel plan.");
    } finally {
      setSavingFlightId(null);
    }
  };

  const totalResults =
    (results?.best_flights?.length || 0) +
    (results?.other_flights?.length || 0);

  return (
    <>
      <TravelPlanSelector
        selectedTravelId={selectedTravelId}
        onTravelSelected={setSelectedTravelId}
      />

      <form onSubmit={handleSubmit}>
        <h4 className="mb-3 text-center">Search Flights</h4>

        <div className="form-floating input-icon mb-3">
          <i className="bi bi-arrow-left-right"></i>
          <select
            className="form-select"
            name="type"
            value={form.type}
            onChange={handleChange}
          >
            <option value={2}>One-way</option>
            <option value={1}>Round trip</option>
          </select>
          <label>Trip Type</label>
        </div>

        <CityAutocompleteInput
          name="origin"
          label="Origin"
          icon="bi-airplane"
          value={form.origin}
          required
          onCityChange={({ value, cityName, country, countryCode, lat, lon }) => {
            setForm((prev) => ({
              ...prev,
              origin: value,
              originCity: cityName,
              originCountry: country,
              originCountryCode: countryCode,
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
          onCityChange={({ value, cityName, country, countryCode, lat, lon }) => {
            setForm((prev) => ({
              ...prev,
              destination: value,
              destinationCity: cityName,
              destinationCountry: country,
              destinationCountryCode: countryCode,
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
            name="outboundDate"
            placeholder="Outbound Date"
            value={form.outboundDate}
            onChange={handleChange}
            required
          />
          <label>Outbound Date</label>
        </div>

        {form.type === 1 && (
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

        <div className="form-floating input-icon mb-3">
          <i className="bi bi-seat"></i>
          <select
            className="form-select"
            name="travelClass"
            value={form.travelClass}
            onChange={handleChange}
          >
            <option value={1}>Economy</option>
            <option value={2}>Premium economy</option>
            <option value={3}>Business</option>
            <option value={4}>First</option>
          </select>
          <label>Travel Class</label>
        </div>

        <div className="form-floating input-icon mb-3">
          <i className="bi bi-sort-down"></i>
          <select
            className="form-select"
            name="sortBy"
            value={form.sortBy}
            onChange={handleChange}
          >
            <option value={1}>Top flights</option>
            <option value={2}>Price</option>
            <option value={3}>Departure time</option>
            <option value={4}>Arrival time</option>
            <option value={5}>Duration</option>
          </select>
          <label>Sort By</label>
        </div>

        <div className="form-check form-switch mb-2 text-start">
          <input
            className="form-check-input"
            type="checkbox"
            id="showHidden"
            name="showHidden"
            checked={form.showHidden}
            onChange={handleChange}
          />
          <label className="form-check-label" htmlFor="showHidden">
            Show hidden results
          </label>
        </div>

        <div className="form-check form-switch mb-3 text-start">
          <input
            className="form-check-input"
            type="checkbox"
            id="deepSearch"
            name="deepSearch"
            checked={form.deepSearch}
            onChange={handleChange}
          />
          <label className="form-check-label" htmlFor="deepSearch">
            Deep search
          </label>
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
      {success && <div className="alert alert-success mt-3">{success}</div>}

      {results && totalResults === 0 && !error && (
        <div className="alert alert-warning mt-3">
          <i className="bi bi-airplane me-2"></i>
          No flights were found for this search.
        </div>
      )}

      {results && totalResults > 0 && (
        <div className="mt-4 text-center">
          <h4 className="mb-4">Results ({totalResults})</h4>

          {results.best_flights && results.best_flights.length > 0 && (
            <>
              <h5 className="text-primary mb-3">Best Flights</h5>

              <div className="row g-4 mb-5">
                {results.best_flights.map((flight, index) => (
                  <FlightCard
                    key={`best-flight-${index}`}
                    flight={flight}
                    index={index}
                    selectedTravelId={selectedTravelId}
                    savingFlightId={savingFlightId}
                    onAddToTravel={handleAddFlightToTravel}
                  />
                ))}
              </div>
            </>
          )}

          {results.other_flights && results.other_flights.length > 0 && (
            <>
              <h5 className="text-primary mb-3">Other Flights</h5>

              <div className="row g-4">
                {results.other_flights.map((flight, index) => (
                  <FlightCard
                    key={`other-flight-${index}`}
                    flight={flight}
                    index={index}
                    selectedTravelId={selectedTravelId}
                    savingFlightId={savingFlightId}
                    onAddToTravel={handleAddFlightToTravel}
                  />
                ))}
              </div>
            </>
          )}
        </div>
      )}
    </>
  );
}

function FlightCard({
  flight,
  index,
  selectedTravelId,
  savingFlightId,
  onAddToTravel,
}: {
  flight: FlightOption;
  index: number;
  selectedTravelId: number | "";
  savingFlightId: string | null;
  onAddToTravel: (flight: FlightOption, index: number) => void;
}) {
  const firstLeg = flight.flights?.[0];
  const lastLeg = flight.flights?.[flight.flights.length - 1];
  const flightId = `${firstLeg?.flight_number || "flight"}-${index}`;

  const formatDuration = (minutes?: number) => {
    if (!minutes) return "";
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;

    if (hours === 0) return `${mins}m`;
    if (mins === 0) return `${hours}h`;

    return `${hours}h ${mins}m`;
  };

  const formatTime = (time?: string) => {
    if (!time) return "";
    return time.split(" ")[1] || time;
  };

  const formatDate = (time?: string) => {
    if (!time) return "";
    return time.split(" ")[0] || "";
  };

  const formatEmissions = (grams?: number) => {
    if (!grams) return "";
    return `${Math.round(grams / 1000)} kg CO₂`;
  };

  const routeLabel =
    firstLeg?.departure_airport?.id && lastLeg?.arrival_airport?.id
      ? `${firstLeg.departure_airport.id} → ${lastLeg.arrival_airport.id}`
      : "Flight route";

  return (
    <div className="col-12 col-md-6">
      <div className="card bg-dark text-light border-secondary h-100 shadow-sm">
        <div className="card-body">
          <div className="d-flex align-items-center justify-content-between mb-3">
            <div className="d-flex align-items-center gap-2">
              {flight.airline_logo && (
                <img
                  src={flight.airline_logo}
                  alt="Airline logo"
                  style={{
                    width: "42px",
                    height: "42px",
                    objectFit: "contain",
                  }}
                />
              )}

              <div className="text-start">
                <h5 className="card-title text-primary mb-0">
                  {firstLeg?.airline || "Flight"}
                </h5>

                {firstLeg?.flight_number && (
                  <small className="text-secondary">
                    {firstLeg.flight_number}
                  </small>
                )}
              </div>
            </div>

            {flight.price !== undefined && (
              <h4 className="text-success mb-0">{flight.price} €</h4>
            )}
          </div>

          <h6 className="mb-3">{routeLabel}</h6>

          {firstLeg?.departure_airport && (
            <p className="mb-2">
              <strong>From:</strong> {firstLeg.departure_airport.id}
              {firstLeg.departure_airport.name
                ? ` - ${firstLeg.departure_airport.name}`
                : ""}
            </p>
          )}

          {lastLeg?.arrival_airport && (
            <p className="mb-2">
              <strong>To:</strong> {lastLeg.arrival_airport.id}
              {lastLeg.arrival_airport.name
                ? ` - ${lastLeg.arrival_airport.name}`
                : ""}
            </p>
          )}

          {(firstLeg?.departure_airport?.time ||
            lastLeg?.arrival_airport?.time) && (
            <p className="mb-2">
              <strong>Time:</strong>{" "}
              {formatTime(firstLeg?.departure_airport?.time)} →{" "}
              {formatTime(lastLeg?.arrival_airport?.time)}
            </p>
          )}

          {firstLeg?.departure_airport?.time && (
            <p className="mb-2">
              <strong>Date:</strong>{" "}
              {formatDate(firstLeg.departure_airport.time)}
            </p>
          )}

          {flight.total_duration && (
            <p className="mb-2">
              <strong>Duration:</strong> {formatDuration(flight.total_duration)}
            </p>
          )}

          {firstLeg?.travel_class && (
            <p className="mb-2">
              <strong>Class:</strong> {firstLeg.travel_class}
            </p>
          )}

          {firstLeg?.airplane && (
            <p className="mb-2">
              <strong>Aircraft:</strong> {firstLeg.airplane}
            </p>
          )}

          {firstLeg?.legroom && (
            <p className="mb-2">
              <strong>Legroom:</strong> {firstLeg.legroom}
            </p>
          )}

          {flight.layovers && flight.layovers.length > 0 ? (
            <p className="mb-2">
              <strong>Layovers:</strong>{" "}
              {flight.layovers
                .map((layover) => {
                  const duration = formatDuration(layover.duration);
                  return `${layover.id || "Stop"}${
                    duration ? ` (${duration})` : ""
                  }`;
                })
                .join(", ")}
            </p>
          ) : (
            <p className="mb-2">
              <strong>Route:</strong> Direct flight
            </p>
          )}

          {flight.carbon_emissions?.this_flight && (
            <p className="mb-2">
              <strong>Emissions:</strong>{" "}
              {formatEmissions(flight.carbon_emissions.this_flight)}
              {flight.carbon_emissions.difference_percent !== undefined && (
                <>
                  {" "}
                  ({flight.carbon_emissions.difference_percent > 0 ? "+" : ""}
                  {flight.carbon_emissions.difference_percent}%)
                </>
              )}
            </p>
          )}

          {firstLeg?.often_delayed_by_over_30_min && (
            <p className="text-warning mb-2">
              <i className="bi bi-exclamation-triangle me-1"></i>
              Often delayed by over 30 minutes
            </p>
          )}

          {flight.flights && flight.flights.length > 1 && (
            <div className="mt-3 text-start">
              <strong>Segments:</strong>

              <ul className="mt-2 mb-0">
                {flight.flights.map((leg, legIndex) => (
                  <li key={`${leg.flight_number || "leg"}-${legIndex}`}>
                    {leg.departure_airport?.id} → {leg.arrival_airport?.id} ·{" "}
                    {leg.airline} {leg.flight_number}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {firstLeg?.extensions && firstLeg.extensions.length > 0 && (
            <div className="mt-3 text-start">
              {firstLeg.extensions.map((extension, extIndex) => (
                <span
                  key={`${extension}-${extIndex}`}
                  className="badge bg-secondary me-2 mb-2"
                >
                  {extension}
                </span>
              ))}
            </div>
          )}

          <button
            type="button"
            className="btn btn-success btn-sm mt-3"
            disabled={!selectedTravelId || savingFlightId === flightId}
            onClick={() => onAddToTravel(flight, index)}
          >
            {savingFlightId === flightId ? "Adding..." : "Add to travel"}
          </button>
        </div>
      </div>
    </div>
  );
}