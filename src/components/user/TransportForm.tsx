import { useState } from "react";
import CityAutocompleteInput from "./CityAutocompleteInput";
import TravelPlanSelector from "./TravelPlanSelector";
import { resolveCityCoordinates } from "../../services/locationService";
import {
  searchPublicTransportRoute,
  searchTransportPois,
  addTransportRouteToTravel,
} from "../../services/transportService";
import { getSession } from "../../services/authService";

type TransportFormState = {
  origin: string;
  destination: string;
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

type RouteStep = {
  distance?: number;
  time?: number;
  instruction?: {
    text?: string;
  };
};

type RouteLeg = {
  distance?: number;
  time?: number;
  steps?: RouteStep[];
};

type RouteFeature = {
  geometry?: {
    type?: string;
    coordinates?: number[][][];
  };
  properties?: {
    distance?: number;
    distance_units?: string;
    time?: number;
    mode?: string;
    units?: string;
    legs?: RouteLeg[];
  };
};

type TransportRouteResponse = {
  type?: string;
  features?: RouteFeature[];
  properties?: {
    mode?: string;
    units?: string;
  };
};

type LastRouteRequest = {
  startLatitude: number;
  startLongitude: number;
  endLatitude: number;
  endLongitude: number;
};

export default function TransportForm() {
  const [form, setForm] = useState<TransportFormState>({
    origin: "",
    destination: "",
    originLat: "",
    originLon: "",
    destinationLat: "",
    destinationLon: "",
  });

  const [poiForm, setPoiForm] = useState<TransportPoiFormState>({
    destination: "",
    lat: "",
    lon: "",
    radius: 2000,
  });

  const [selectedTravelId, setSelectedTravelId] = useState<number | "">("");

  const [loadingTransport, setLoadingTransport] = useState(false);
  const [loadingPois, setLoadingPois] = useState(false);
  const [savingRoute, setSavingRoute] = useState(false);

  const [transportRoute, setTransportRoute] =
    useState<TransportRouteResponse | null>(null);

  const [lastRouteRequest, setLastRouteRequest] =
    useState<LastRouteRequest | null>(null);

  const [transportPoiResults, setTransportPoiResults] = useState<any[]>([]);

  const [transportError, setTransportError] = useState("");
  const [poiError, setPoiError] = useState("");
  const [success, setSuccess] = useState("");

  const handlePoiChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;

    setPoiForm((prev) => ({
      ...prev,
      [name]: name === "radius" ? Number(value) : value,
    }));
  };

  const formatDuration = (seconds?: number) => {
    if (!seconds && seconds !== 0) return "";

    const minutes = Math.round(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;

    if (hours === 0) return `${minutes} min`;
    if (remainingMinutes === 0) return `${hours} h`;

    return `${hours} h ${remainingMinutes} min`;
  };

  const formatDistance = (meters?: number) => {
    if (!meters && meters !== 0) return "";

    if (meters < 1000) {
      return `${Math.round(meters)} m`;
    }

    return `${(meters / 1000).toFixed(2)} km`;
  };

  const getMainRoute = () => {
    return transportRoute?.features?.[0];
  };

  const handleTransportSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    setTransportError("");
    setSuccess("");
    setTransportRoute(null);
    setLastRouteRequest(null);
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

      const routeRequest: LastRouteRequest = {
        startLatitude: Number(originCoords.lat),
        startLongitude: Number(originCoords.lon),
        endLatitude: Number(destinationCoords.lat),
        endLongitude: Number(destinationCoords.lon),
      };

      const data = await searchPublicTransportRoute(routeRequest);

      setLastRouteRequest(routeRequest);
      setTransportRoute(data);
    } catch (err) {
      console.error(err);
      setTransportError(
        err instanceof Error
          ? err.message
          : "Transport route could not be retrieved."
      );
    } finally {
      setLoadingTransport(false);
    }
  };

  const handleAddRouteToTravel = async () => {
    if (!selectedTravelId) {
      setTransportError("Please select a travel plan first.");
      return;
    }

    if (!transportRoute || !lastRouteRequest) {
      setTransportError("Please search a route first.");
      return;
    }

    const session = getSession();
    const userId = session?.id;

    if (!userId) {
      setTransportError("User session not found.");
      return;
    }

    const mainRoute = getMainRoute();

    try {
      setTransportError("");
      setSuccess("");
      setSavingRoute(true);

      await addTransportRouteToTravel(userId, Number(selectedTravelId), {
        origin: form.origin,
        destination: form.destination,
        startLatitude: lastRouteRequest.startLatitude,
        startLongitude: lastRouteRequest.startLongitude,
        endLatitude: lastRouteRequest.endLatitude,
        endLongitude: lastRouteRequest.endLongitude,
        type: "PUBLIC_TRANSPORT",
        mode: mainRoute?.properties?.mode || "transit",
        distance: mainRoute?.properties?.distance || 0,
        duration: mainRoute?.properties?.time || 0,
        steps: mainRoute?.properties?.legs?.[0]?.steps || [],
        geometry: mainRoute?.geometry || null,
        rawData: transportRoute,
      });

      setSuccess("Transport route added to the travel plan.");
    } catch (err) {
      console.error(err);
      setTransportError("Transport route could not be added to the travel plan.");
    } finally {
      setSavingRoute(false);
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

  const mainRoute = getMainRoute();
  const routeSteps = mainRoute?.properties?.legs?.[0]?.steps || [];

  return (
    <>
      <TravelPlanSelector
        selectedTravelId={selectedTravelId}
        onTravelSelected={setSelectedTravelId}
      />

      <form onSubmit={handleTransportSubmit}>
        <h4 className="mb-3 text-center">Search Public Transport Route</h4>

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

        <button
          type="submit"
          className="btn btn-primary w-100"
          disabled={loadingTransport}
        >
          {loadingTransport ? "Searching..." : "Search Public Transport Route"}
        </button>
      </form>

      {transportError && (
        <div className="alert alert-danger mt-3">{transportError}</div>
      )}

      {success && <div className="alert alert-success mt-3">{success}</div>}

      {transportRoute && mainRoute && (
        <div className="mt-4">
          <h5 className="mb-3">Transport Route</h5>

          <div className="card bg-dark text-light border-secondary">
            <div className="card-body">
              <h6 className="card-title text-primary">
                <i className="bi bi-signpost-split me-2"></i>
                {form.origin} → {form.destination}
              </h6>

              <p className="mb-1">
                <strong>Mode:</strong> {mainRoute.properties?.mode || "Transit"}
              </p>

              <p className="mb-1">
                <strong>Distance:</strong>{" "}
                {formatDistance(mainRoute.properties?.distance)}
              </p>

              <p className="mb-1">
                <strong>Duration:</strong>{" "}
                {formatDuration(mainRoute.properties?.time)}
              </p>

              <p className="mb-3">
                <strong>Steps:</strong> {routeSteps.length}
              </p>

              {routeSteps.length > 0 && (
                <div className="mt-3">
                  <h6 className="text-primary">Route Instructions</h6>

                  <ol className="mb-0 text-start">
                    {routeSteps.map((step, index) => (
                      <li key={`route-step-${index}`} className="mb-2">
                        <div>{step.instruction?.text || "Continue"}</div>

                        <small className="text-secondary">
                          {formatDistance(step.distance)}
                          {step.time !== undefined &&
                            ` · ${formatDuration(step.time)}`}
                        </small>
                      </li>
                    ))}
                  </ol>
                </div>
              )}

              <button
                type="button"
                className="btn btn-success btn-sm mt-3"
                disabled={!selectedTravelId || savingRoute}
                onClick={handleAddRouteToTravel}
              >
                {savingRoute ? "Adding..." : "Add route to travel"}
              </button>
            </div>
          </div>
        </div>
      )}

      <hr className="my-4 border-secondary" />

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