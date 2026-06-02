import { useState } from "react";
import CityAutocompleteInput from "./CityAutocompleteInput";
import { resolveCityCoordinates } from "../../services/locationService";
import { searchTransportPois } from "../../services/transportService";

type TransportPoiFormState = {
  destination: string;
  lat: string;
  lon: string;
  radius: number;
};

export default function TransportForm() {
  const [poiForm, setPoiForm] = useState<TransportPoiFormState>({
    destination: "",
    lat: "",
    lon: "",
    radius: 2000,
  });

  const [loadingPois, setLoadingPois] = useState(false);
  const [transportPoiResults, setTransportPoiResults] = useState<any[]>([]);
  const [poiError, setPoiError] = useState("");

  const handlePoiChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setPoiForm((prev) => ({
      ...prev,
      [name]: name === "radius" ? Number(value) : value,
    }));
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
            Nearby Transport Points ({transportPoiResults.length})
          </h5>

          <div className="row g-3">
            {transportPoiResults.map((poi: any, index) => {
              const tags = poi.tags || {};

              const name = tags.name || tags.operator || "Unnamed stop";
              const operator = tags.operator && tags.name ? tags.operator : null;

              const transportTypeLabel = (() => {
                if (tags.station === "subway" || tags.subway === "yes") return "Subway";
                if (tags.station === "light_rail") return "Light Rail";
                if (tags.station === "tram" || tags.tram === "yes") return "Tram";
                if (tags.station === "bus" || tags.bus === "yes") return "Bus";
                if (tags.railway === "subway_entrance") return "Subway Entrance";
                if (tags.railway === "tram_stop") return "Tram Stop";
                if (tags.railway === "station") return "Train Station";
                if (tags.railway === "stop") return "Rail Stop";
                if (tags.highway === "bus_stop") return "Bus Stop";
                if (tags.highway === "elevator") return "Elevator";
                if (tags.public_transport === "stop_position") return "Stop";
                if (tags.public_transport === "platform") return "Platform";
                if (tags.public_transport === "station") return "Station";
                if (tags.amenity === "ferry_terminal") return "Ferry Terminal";
                return "Transport Point";
              })();

              const transportIcon = (() => {
                if (tags.station === "subway" || tags.subway === "yes") return "bi-train-front";
                if (tags.railway === "subway_entrance") return "bi-sign-intersection-t";
                if (tags.railway?.includes("tram") || tags.tram === "yes") return "bi-train-lightrail-front";
                if (tags.highway === "bus_stop" || tags.bus === "yes") return "bi-bus-front";
                if (tags.highway === "elevator") return "bi-arrow-up-square";
                if (tags.amenity === "ferry_terminal") return "bi-tsunami";
                return "bi-geo-alt";
              })();

              const fareZone = tags.fare_area || tags.zone;
              const wheelchair = tags.wheelchair;
              const wheelchairLabel =
                wheelchair === "yes" ? "Accessible"
                : wheelchair === "no" ? "No wheelchair access"
                : null;

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
                      <h6 className="card-title text-primary mb-2">
                        <i className={`bi ${transportIcon} me-2`}></i>
                        {name}
                      </h6>

                      <span className="badge bg-secondary mb-2">{transportTypeLabel}</span>

                      {operator && (
                        <p className="mb-1 small">
                          <i className="bi bi-building me-1"></i>
                          {operator}
                        </p>
                      )}

                      {fareZone && (
                        <p className="mb-1 small">
                          <i className="bi bi-ticket-perforated me-1"></i>
                          Zone {fareZone}
                        </p>
                      )}

                      {address && (
                        <p className="mb-1 small">
                          <i className="bi bi-map-fill me-1"></i>
                          {address}
                        </p>
                      )}

                      {wheelchairLabel && (
                        <p className="mb-0 small">
                          <i className="bi bi-person-wheelchair me-1"></i>
                          <span className={wheelchair === "yes" ? "text-success" : "text-warning"}>
                            {wheelchairLabel}
                          </span>
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
