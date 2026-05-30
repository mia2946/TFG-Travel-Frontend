import { useEffect, useMemo, useState } from "react";
import type { TravelPlan } from "../../types/travel";
import type { RoutePoint, RouteSearchResponse } from "../../types/route";
import { getTravelPlans, createTravelPlan } from "../../services/travelService";
import { searchRoute, saveRoute } from "../../services/routeService";
import TravelRouteMap from "../routes/TravelRouteMap";

function isValidCoordinate(lat?: number | null, lon?: number | null): boolean {
  return (
    lat !== undefined &&
    lat !== null &&
    lon !== undefined &&
    lon !== null &&
    !Number.isNaN(Number(lat)) &&
    Number(lat) !== 0 &&
    !Number.isNaN(Number(lon)) &&
    Number(lon) !== 0
  );
}

function formatDistance(meters: number): string {
  if (meters >= 1000) return `${(meters / 1000).toFixed(2)} km`;
  return `${Math.round(meters)} m`;
}

function formatDuration(seconds: number): string {
  const minutes = Math.round(seconds / 60);
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  const restMinutes = minutes % 60;
  return `${hours} h ${restMinutes} min`;
}

function buildRoutePoints(travel: TravelPlan): RoutePoint[] {
  const points: RoutePoint[] = [];

  travel.savedAccommodations?.forEach((item: any) => {
    const lat = Number(item.latitude ?? item.lat);
    const lon = Number(item.longitude ?? item.lon ?? item.lng);
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
    const lat = Number(item.latitude ?? item.lat);
    const lon = Number(item.longitude ?? item.lon ?? item.lng);
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
    const lat = Number(item.latitude ?? item.lat);
    const lon = Number(item.longitude ?? item.lon ?? item.lng);
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
    const originLat = Number(
      item.originLatitude ?? item.departureLatitude ?? item.fromLatitude
    );
    const originLon = Number(
      item.originLongitude ?? item.departureLongitude ?? item.fromLongitude
    );
    const destLat = Number(
      item.destinationLatitude ?? item.arrivalLatitude ?? item.toLatitude
    );
    const destLon = Number(
      item.destinationLongitude ?? item.arrivalLongitude ?? item.toLongitude
    );

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

    if (isValidCoordinate(destLat, destLon)) {
      points.push({
        id: `AIRPORT-DESTINATION-${item.id ?? item.idTransport}`,
        label:
          item.destinationAirportName ??
          item.arrivalAirportName ??
          item.destination ??
          "Destination airport",
        type: "AIRPORT",
        latitude: destLat,
        longitude: destLon,
      });
    }
  });

  return points;
}

export default function RoutesForm() {
  const [travelPlans, setTravelPlans] = useState<TravelPlan[]>([]);
  const [selectedTravelId, setSelectedTravelId] = useState<number | "">("");
  const [newTravelName, setNewTravelName] = useState("");
  const [loadingPlans, setLoadingPlans] = useState(false);
  const [creatingPlan, setCreatingPlan] = useState(false);

  const [originId, setOriginId] = useState("");
  const [destinationId, setDestinationId] = useState("");
  const [route, setRoute] = useState<RouteSearchResponse | null>(null);
  const [rawData, setRawData] = useState<unknown>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    loadPlans();
  }, []);

  const loadPlans = async () => {
    try {
      setLoadingPlans(true);
      const plans = await getTravelPlans();
      setTravelPlans(plans);
    } catch (err) {
      console.error("Error loading travel plans:", err);
    } finally {
      setLoadingPlans(false);
    }
  };

  const selectedTravel =
    travelPlans.find((p) => p.id === Number(selectedTravelId)) ?? null;

  const routePoints: RoutePoint[] = useMemo(() => {
    if (!selectedTravel) return [];
    return buildRoutePoints(selectedTravel);
  }, [selectedTravel]);

  // Reset search state when a different plan is selected
  useEffect(() => {
    setOriginId("");
    setDestinationId("");
    setRoute(null);
    setRawData(null);
    setError("");
    setSuccess("");
  }, [selectedTravelId]);

  const origin = routePoints.find((p) => p.id === originId);
  const destination = routePoints.find((p) => p.id === destinationId);

  const handleCreatePlan = async () => {
    if (!newTravelName.trim()) return;
    try {
      setCreatingPlan(true);
      const created = await createTravelPlan(newTravelName.trim());
      setTravelPlans((prev) => [...prev, created]);
      setSelectedTravelId(created.id);
      setNewTravelName("");
    } catch (err) {
      console.error("Error creating travel plan:", err);
      setError("Could not create the travel plan.");
    } finally {
      setCreatingPlan(false);
    }
  };

  const handleSearch = async () => {
    if (!origin || !destination) {
      setError("Please select origin and destination.");
      return;
    }
    if (origin.id === destination.id) {
      setError("Origin and destination must be different.");
      return;
    }

    try {
      setLoading(true);
      setError("");
      setSuccess("");
      setRoute(null);
      setRawData(null);

      const { route: result, rawData: raw } = await searchRoute({
        startLatitude: origin.latitude,
        startLongitude: origin.longitude,
        endLatitude: destination.latitude,
        endLongitude: destination.longitude,
      });

      setRoute(result);
      setRawData(raw);
    } catch (err) {
      console.error("Error searching route:", err);
      setError("Could not search the route. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!route || !rawData || !selectedTravelId) return;

    try {
      setSaving(true);
      setError("");

      await saveRoute(Number(selectedTravelId), {
        apiProvider: "geoapify",
        totalDistanceMeters: route.distanceMeters,
        totalTimeSeconds: route.durationSeconds,
        rawData,
      });

      setSuccess("Route saved to the travel plan.");
    } catch (err) {
      console.error("Error saving route:", err);
      setError("Could not save the route.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      {/* Travel Plan Selector */}
      <div className="card bg-dark text-light border-secondary mb-4">
        <div className="card-body">
          <h5 className="mb-3 text-center">Travel Plan</h5>

          <div className="input-group mb-3">
            <input
              type="text"
              className="form-control"
              placeholder="New travel plan name"
              value={newTravelName}
              onChange={(e) => setNewTravelName(e.target.value)}
            />
            <button
              type="button"
              className="btn btn-outline-primary"
              onClick={handleCreatePlan}
              disabled={creatingPlan || !newTravelName.trim()}
            >
              {creatingPlan ? "Creating..." : "Create"}
            </button>
          </div>

          <select
            className="form-select"
            value={selectedTravelId}
            disabled={loadingPlans}
            onChange={(e) =>
              setSelectedTravelId(e.target.value ? Number(e.target.value) : "")
            }
          >
            <option value="">
              {loadingPlans ? "Loading travel plans..." : "Select travel plan"}
            </option>
            {travelPlans.map((plan) => (
              <option key={plan.id} value={plan.id}>
                {plan.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Route Search — only when a plan is selected */}
      {selectedTravel && (
        <div className="card bg-dark text-light border-secondary">
          <div className="card-body">
            <h5 className="mb-4 text-center">Search Route</h5>

            {routePoints.length < 2 ? (
              <div className="alert alert-warning">
                <i className="bi bi-exclamation-triangle me-2"></i>
                This travel plan has fewer than 2 locations with coordinates.
                Add accommodations, activities, or POIs first.
              </div>
            ) : (
              <>
                {error && (
                  <div className="alert alert-danger">
                    <i className="bi bi-x-circle me-2"></i>
                    {error}
                  </div>
                )}
                {success && (
                  <div className="alert alert-success">
                    <i className="bi bi-check-circle me-2"></i>
                    {success}
                  </div>
                )}

                <div className="row g-3 align-items-end mb-3">
                  <div className="col-12 col-md-5">
                    <label className="form-label text-light">Origin</label>
                    <select
                      className="form-select"
                      value={originId}
                      onChange={(e) => {
                        setOriginId(e.target.value);
                        setRoute(null);
                        setSuccess("");
                      }}
                    >
                      <option value="">Select origin</option>
                      {routePoints.map((point) => (
                        <option key={point.id} value={point.id}>
                          [{point.type}] {point.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="col-12 col-md-5">
                    <label className="form-label text-light">Destination</label>
                    <select
                      className="form-select"
                      value={destinationId}
                      onChange={(e) => {
                        setDestinationId(e.target.value);
                        setRoute(null);
                        setSuccess("");
                      }}
                    >
                      <option value="">Select destination</option>
                      {routePoints.map((point) => (
                        <option key={point.id} value={point.id}>
                          [{point.type}] {point.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="col-12 col-md-2">
                    <button
                      type="button"
                      className="btn btn-primary w-100"
                      onClick={handleSearch}
                      disabled={loading || !originId || !destinationId}
                    >
                      {loading ? (
                        <>
                          <span
                            className="spinner-border spinner-border-sm me-2"
                            role="status"
                          />
                          Searching...
                        </>
                      ) : (
                        <>
                          <i className="bi bi-search me-2"></i>
                          Search
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {route && origin && destination && (
                  <>
                    {/* Route summary */}
                    <div className="p-3 rounded border border-secondary mb-3">
                      <h6 className="mb-3">
                        <i className="bi bi-signpost-2 me-2 text-primary"></i>
                        Route Summary
                      </h6>
                      <div className="row g-2">
                        <div className="col-6">
                          <small className="text-muted">Distance</small>
                          <p className="mb-0 fw-semibold">
                            {formatDistance(route.distanceMeters)}
                          </p>
                        </div>
                        <div className="col-6">
                          <small className="text-muted">Duration</small>
                          <p className="mb-0 fw-semibold">
                            {formatDuration(route.durationSeconds)}
                          </p>
                        </div>
                        <div className="col-12 mt-2">
                          <small className="text-muted">From</small>
                          <p className="mb-0">{origin.label}</p>
                          <small className="text-muted">To</small>
                          <p className="mb-0">{destination.label}</p>
                        </div>
                      </div>
                    </div>

                    {/* Map */}
                    <TravelRouteMap
                      key={`${originId}-${destinationId}`}
                      origin={origin}
                      destination={destination}
                      route={route}
                    />

                    {/* Steps */}
                    {route.steps?.length > 0 && (
                      <div className="mt-4">
                        <h6 className="mb-3">
                          <i className="bi bi-list-ol me-2 text-primary"></i>
                          Instructions
                        </h6>
                        <ol className="list-group list-group-numbered">
                          {route.steps.map((step, index) => (
                            <li
                              key={index}
                              className="list-group-item list-group-item-dark d-flex justify-content-between align-items-start"
                            >
                              <div className="ms-2 me-auto">
                                <div>{step.instruction}</div>
                                <small className="text-muted">
                                  {formatDistance(step.distanceMeters)} ·{" "}
                                  {formatDuration(step.durationSeconds)}
                                </small>
                              </div>
                            </li>
                          ))}
                        </ol>
                      </div>
                    )}

                    {/* Save button */}
                    <div className="mt-4 text-end">
                      <button
                        type="button"
                        className="btn btn-success"
                        onClick={handleSave}
                        disabled={saving}
                      >
                        {saving ? (
                          <>
                            <span
                              className="spinner-border spinner-border-sm me-2"
                              role="status"
                            />
                            Saving...
                          </>
                        ) : (
                          <>
                            <i className="bi bi-floppy me-2"></i>
                            Save Route
                          </>
                        )}
                      </button>
                    </div>
                  </>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}
