import { useMemo, useState } from "react";
import type { TravelPlan } from "../../types/travel";
import type {
  RoutePoint,
  RouteSearchResponse,
} from "../../types/route";
import { searchRoute } from "../../services/routeService";
import TravelRouteMap from "./TravelRouteMap";

type Props = {
  travel: TravelPlan;
};

function isValidCoordinate(lat?: number | null, lon?: number | null): boolean {
  return (
    lat !== undefined &&
    lat !== null &&
    lon !== undefined &&
    lon !== null &&
    !Number.isNaN(lat) &&
    !Number.isNaN(lon)
  );
}

function formatDistance(meters: number): string {
  if (meters >= 1000) {
    return `${(meters / 1000).toFixed(2)} km`;
  }

  return `${Math.round(meters)} m`;
}

function formatDuration(seconds: number): string {
  const minutes = Math.round(seconds / 60);

  if (minutes < 60) {
    return `${minutes} min`;
  }

  const hours = Math.floor(minutes / 60);
  const restMinutes = minutes % 60;

  return `${hours} h ${restMinutes} min`;
}

export default function TravelRoutesSearch({ travel }: Props) {
  const [originId, setOriginId] = useState("");
  const [destinationId, setDestinationId] = useState("");
  const [route, setRoute] = useState<RouteSearchResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const routePoints: RoutePoint[] = useMemo(() => {
    const points: RoutePoint[] = [];

    travel.savedAccommodations?.forEach((item: any) => {
      const lat = item.latitude ?? item.lat;
      const lon = item.longitude ?? item.lon ?? item.lng;

      if (!isValidCoordinate(lat, lon)) return;

      points.push({
        id: `ACCOMMODATION-${item.id ?? item.idAccommodation ?? item.externalId}`,
        label: item.name ?? item.hotelName ?? "Accommodation",
        type: "ACCOMMODATION",
        latitude: lat,
        longitude: lon,
        address: item.address,
      });
    });

    travel.savedActivities?.forEach((item: any) => {
      const lat = item.latitude ?? item.lat;
      const lon = item.longitude ?? item.lon ?? item.lng;

      if (!isValidCoordinate(lat, lon)) return;

      points.push({
        id: `ACTIVITY-${item.id ?? item.idActivity ?? item.externalId}`,
        label: item.name ?? item.title ?? "Activity",
        type: "ACTIVITY",
        latitude: lat,
        longitude: lon,
        address: item.address,
      });
    });

    travel.savedPois?.forEach((item: any) => {
      const lat = item.latitude ?? item.lat;
      const lon = item.longitude ?? item.lon ?? item.lng;

      if (!isValidCoordinate(lat, lon)) return;

      points.push({
        id: `POI-${item.id ?? item.idPoi ?? item.externalId}`,
        label: item.name ?? "POI",
        type: "POI",
        latitude: lat,
        longitude: lon,
        address: item.address,
      });
    });

    travel.savedTransports?.forEach((item: any) => {
      const originLat =
        item.originLatitude ?? item.departureLatitude ?? item.fromLatitude;
      const originLon =
        item.originLongitude ??
        item.departureLongitude ??
        item.fromLongitude;

      const destinationLat =
        item.destinationLatitude ??
        item.arrivalLatitude ??
        item.toLatitude;
      const destinationLon =
        item.destinationLongitude ??
        item.arrivalLongitude ??
        item.toLongitude;

      if (isValidCoordinate(originLat, originLon)) {
        points.push({
          id: `AIRPORT-ORIGIN-${item.id ?? item.idTransport}`,
          label:
            item.originAirportName ??
            item.departureAirportName ??
            item.origin ??
            "Origin airport",
          type: "AIRPORT",
          latitude: originLat,
          longitude: originLon,
        });
      }

      if (isValidCoordinate(destinationLat, destinationLon)) {
        points.push({
          id: `AIRPORT-DESTINATION-${item.id ?? item.idTransport}`,
          label:
            item.destinationAirportName ??
            item.arrivalAirportName ??
            item.destination ??
            "Destination airport",
          type: "AIRPORT",
          latitude: destinationLat,
          longitude: destinationLon,
        });
      }
    });

    return points;
  }, [travel]);

  const origin = routePoints.find((point) => point.id === originId);
  const destination = routePoints.find((point) => point.id === destinationId);

  const handleSearchRoute = async () => {
    if (!origin || !destination) {
      setError("Please select origin and destination.");
      return;
    }

    if (origin.id === destination.id) {
      setError("Origin and destination cannot be the same.");
      return;
    }

    try {
      setLoading(true);
      setError("");
      setRoute(null);

      const { route: result } = await searchRoute({
        startLatitude: origin.latitude,
        startLongitude: origin.longitude,
        endLatitude: destination.latitude,
        endLongitude: destination.longitude,
      });

      setRoute(result);
    } catch (err) {
      console.error("Error searching route:", err);
      setError("Could not search route.");
    } finally {
      setLoading(false);
    }
  };

  if (routePoints.length < 2) {
    return (
      <div className="alert alert-warning mt-3">
        You need at least two saved locations with coordinates to search routes.
      </div>
    );
  }

  return (
    <div className="card mt-3 shadow-sm">
      <div className="card-body">
        <h5 className="card-title mb-3">Search route</h5>

        {error && <div className="alert alert-danger">{error}</div>}

        <div className="row g-3">
          <div className="col-md-4">
            <label className="form-label">Origin</label>
            <select
              className="form-select"
              value={originId}
              onChange={(e) => setOriginId(e.target.value)}
            >
              <option value="">Select origin</option>
              {routePoints.map((point) => (
                <option key={point.id} value={point.id}>
                  [{point.type}] {point.label}
                </option>
              ))}
            </select>
          </div>

          <div className="col-md-4">
            <label className="form-label">Destination</label>
            <select
              className="form-select"
              value={destinationId}
              onChange={(e) => setDestinationId(e.target.value)}
            >
              <option value="">Select destination</option>
              {routePoints.map((point) => (
                <option key={point.id} value={point.id}>
                  [{point.type}] {point.label}
                </option>
              ))}
            </select>
          </div>

          <div className="col-md-2 d-flex align-items-end">
            <button
              className="btn btn-primary w-100"
              onClick={handleSearchRoute}
              disabled={loading}
            >
              {loading ? "Searching..." : "Search"}
            </button>
          </div>
        </div>

        {route && origin && destination && (
          <>
            <div className="mt-4">
              <h6>Route summary</h6>

              <p className="mb-1">
                <strong>Distance:</strong>{" "}
                {formatDistance(route.distanceMeters)}
              </p>

              <p className="mb-1">
                <strong>Duration:</strong>{" "}
                {formatDuration(route.durationSeconds)}
              </p>
            </div>

            <TravelRouteMap
              key={`${originId}-${destinationId}`}
              origin={origin}
              destination={destination}
              route={route}
            />

            {route.steps?.length > 0 && (
              <div className="mt-4">
                <h6>Instructions</h6>

                <ol className="list-group list-group-numbered">
                  {route.steps.map((step, index) => (
                    <li
                      key={index}
                      className="list-group-item d-flex justify-content-between align-items-start"
                    >
                      <div className="ms-2 me-auto">
                        <div>{step.instruction}</div>
                        <small>
                          {formatDistance(step.distanceMeters)} ·{" "}
                          {formatDuration(step.durationSeconds)}
                        </small>
                      </div>
                    </li>
                  ))}
                </ol>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}