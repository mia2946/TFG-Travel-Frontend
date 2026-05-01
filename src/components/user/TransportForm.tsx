import { useState } from "react";
import CityAutocompleteInput from "./CityAutocompleteInput";
import { resolveCityCoordinates } from "../../services/locationService";
import {
  searchTransport,
  searchTransportPois,
} from "../../services/transportService";
import type {
  TransportResult,
  TransportSearchRequest,
} from "../../types/search";

type TransportFormState = TransportSearchRequest & {
  originLat?: string;
  originLon?: string;
  destinationLat?: string;
  destinationLon?: string;
};

type TransportPoiFormState = {
  destination: string;
  lat: string;
  lon: string;
  radius: number;
};

export default function TransportForm() {
  const [form, setForm] = useState<TransportFormState>({
    origin: "",
    destination: "",
    originLat: "",
    originLon: "",
    destinationLat: "",
    destinationLon: "",
    date: "",
    transportType: "",
  });

  const [poiForm, setPoiForm] = useState<TransportPoiFormState>({
    destination: "",
    lat: "",
    lon: "",
    radius: 2000,
  });

  const [loadingTransport, setLoadingTransport] = useState(false);
  const [loadingPois, setLoadingPois] = useState(false);

  const [transportResults, setTransportResults] = useState<TransportResult[]>([]);
  const [transportPoiResults, setTransportPoiResults] = useState<any[]>([]);

  const [transportError, setTransportError] = useState("");
  const [poiError, setPoiError] = useState("");

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handlePoiChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;

    setPoiForm((prev) => ({
      ...prev,
      [name]: name === "radius" ? Number(value) : value,
    }));
  };

  const handleTransportSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    setTransportError("");
    setTransportResults([]);
    setLoadingTransport(true);

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
      };

      console.log("TRANSPORT SEARCH:", finalForm);

      const data = await searchTransport(finalForm);
      setTransportResults(data);
    } catch (err) {
      console.error(err);
      setTransportError("Transport results could not be retrieved.");
    } finally {
      setLoadingTransport(false);
    }
  };

  const handleTransportPoisSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    setPoiError("");
    setTransportPoiResults([]);
    setLoadingPois(true);

    try {
      const coords = await resolveCityCoordinates(
        poiForm.destination,
        poiForm.lat,
        poiForm.lon
      );

      const finalPoiForm = {
        ...poiForm,
        destination: coords.destination,
        lat: coords.lat,
        lon: coords.lon,
      };

      console.log("TRANSPORT POIS SEARCH:", finalPoiForm);

      const data = await searchTransportPois(
        coords.lat,
        coords.lon,
        poiForm.radius
      );

      setTransportPoiResults(data);
    } catch (err) {
      console.error(err);
      setPoiError("Transport POIs could not be retrieved.");
    } finally {
      setLoadingPois(false);
    }
  };

  return (
    <>
      {/* NORMAL TRANSPORT SEARCH */}
      <form onSubmit={handleTransportSubmit}>
        <h4 className="mb-3 text-center">Search Transport</h4>

        <CityAutocompleteInput
          name="origin"
          label="Origin"
          icon="bi-box-arrow-right"
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
          </select>
          <label>Transport Type</label>
        </div>

        <button
          type="submit"
          className="btn btn-primary w-100"
          disabled={loadingTransport}
        >
          {loadingTransport ? "Searching..." : "Search Transport"}
        </button>
      </form>

      {transportError && (
        <div className="alert alert-danger mt-3">{transportError}</div>
      )}

      {transportResults.length > 0 && (
        <div className="mt-4">
          <h5>Transport Results</h5>
          <pre className="bg-dark text-light p-3 rounded">
            {JSON.stringify(transportResults, null, 2)}
          </pre>
        </div>
      )}

      <hr className="my-4 border-secondary" />

      {/* TRANSPORT POIS SEARCH */}
      <form onSubmit={handleTransportPoisSubmit}>
        <h4 className="mb-3 text-center">Search Nearby Transport POIs</h4>

        <CityAutocompleteInput
          name="destination"
          label="Area / City"
          icon="bi-geo-alt"
          value={poiForm.destination}
          required
          onCityChange={({ value, lat, lon }) => {
            setPoiForm((prev) => ({
              ...prev,
              destination: value,
              lat,
              lon,
            }));
          }}
        />

        <div className="form-floating input-icon mb-3">
          <i className="bi bi-bullseye"></i>
          <input
            type="number"
            className="form-control"
            name="radius"
            placeholder="Radius"
            value={poiForm.radius}
            onChange={handlePoiChange}
            min="100"
            step="100"
          />
          <label>Radius (meters)</label>
        </div>

        <button
          type="submit"
          className="btn btn-primary w-100"
          disabled={loadingPois}
        >
          {loadingPois ? "Searching..." : "Search Transport POIs"}
        </button>
      </form>

      {poiError && <div className="alert alert-danger mt-3">{poiError}</div>}

      {transportPoiResults.length > 0 && (
        <div className="mt-4">
          <h5 className="mb-3">
            Nearby Transport POIs ({transportPoiResults.length})
          </h5>

          <div className="row g-3">
            {transportPoiResults.map((poi: any, index) => {
              const tags = poi.tags || {};

              const name =
                tags.name ||
                tags.operator ||
                tags.amenity ||
                tags.highway ||
                tags.railway ||
                tags.public_transport ||
                "Transport point";

              const type =
                tags.amenity ||
                tags.highway ||
                tags.public_transport ||
                tags.railway ||
                tags.station ||
                "transport";

              const address = [
                tags["addr:street"],
                tags["addr:housenumber"],
                tags["addr:postcode"],
                tags["addr:city"],
              ]
                .filter(Boolean)
                .join(", ");

              return (
                <div
                  className="col-12 col-md-6"
                  key={`${poi.type}-${poi.id}-${index}`}
                >
                  <div className="card bg-dark text-light border-secondary h-100">
                    <div className="card-body">
                      <h6 className="card-title text-primary">
                        <i className="bi bi-bus-front me-2"></i>
                        {name}
                      </h6>

                      <p className="mb-1">
                        <strong>Type:</strong> {type}
                      </p>

                      {address && (
                        <p className="mb-1">
                          <strong>Address:</strong> {address}
                        </p>
                      )}

                      {poi.lat && poi.lon && (
                        <p className="mb-1">
                          <strong>Coordinates:</strong> {poi.lat}, {poi.lon}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </>
  );
}