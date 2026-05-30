import { useEffect, useState } from "react";
import { deleteTravelPlan, getTravelPlans } from "../../services/travelService";
import { getRoute } from "../../services/routeService";
import { getAirportByIata } from "../../services/airportService";
import type { TravelPlan, SavedFlight } from "../../types/travel";
import type {
  StoredRoute,
  RoutePoint,
  RouteSearchResponse,
} from "../../types/route";
import TravelRouteMap from "../routes/TravelRouteMap";

type DetailTab =
  | "accommodations"
  | "activities"
  | "pois"
  | "transports"
  | "flights"
  | "routes";

function formatDistance(meters: number): string {
  if (meters >= 1000) return `${(meters / 1000).toFixed(2)} km`;
  return `${Math.round(meters)} m`;
}

function formatDuration(seconds: number): string {
  const minutes = Math.round(seconds / 60);
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  return `${hours} h ${rest} min`;
}

// ─── Stored route card ────────────────────────────────────────────────────────

function StoredRouteCard({ route }: { route: StoredRoute }) {
  const [showMap, setShowMap] = useState(false);

  const origin: RoutePoint = {
    id: "origin",
    label: "Origin",
    type: "POI",
    latitude: route.startLat,
    longitude: route.startLon,
  };

  const destination: RoutePoint = {
    id: "destination",
    label: "Destination",
    type: "POI",
    latitude: route.endLat,
    longitude: route.endLon,
  };

  // Flatten MultiLineString → LineString for TravelRouteMap
  const flatCoords: [number, number][] = route.geometryCoordinates.flat();

  const sortedSteps = [...(route.steps ?? [])].sort(
    (a, b) => a.stepOrder - b.stepOrder
  );

  const routeResponse: RouteSearchResponse = {
    distanceMeters: route.totalDistanceMeters,
    durationSeconds: route.totalTimeSeconds,
    geometry: { type: "LineString", coordinates: flatCoords },
    steps: sortedSteps.map((s) => ({
      instruction: s.instructionText,
      distanceMeters: s.distanceMeters,
      durationSeconds: s.timeSeconds,
    })),
  };

  return (
    <div className="col-12">
      <div className="p-3 rounded border border-secondary">
        {/* Header row */}
        <div className="d-flex justify-content-between align-items-start flex-wrap gap-2 mb-3">
          <div>
            <span className="badge bg-primary me-2">{route.apiProvider}</span>
            <span className="text-muted small">Route #{route.id}</span>
          </div>
          <div className="d-flex gap-3">
            <span>
              <i className="bi bi-rulers me-1 text-primary"></i>
              {formatDistance(route.totalDistanceMeters)}
            </span>
            <span>
              <i className="bi bi-clock me-1 text-primary"></i>
              {formatDuration(route.totalTimeSeconds)}
            </span>
          </div>
        </div>

        {/* Coordinates */}
        <div className="row g-2 mb-3">
          <div className="col-12 col-md-6">
            <small className="text-muted d-block">Origin</small>
            <code className="text-light small">
              {route.startLat.toFixed(6)}, {route.startLon.toFixed(6)}
            </code>
          </div>
          <div className="col-12 col-md-6">
            <small className="text-muted d-block">Destination</small>
            <code className="text-light small">
              {route.endLat.toFixed(6)}, {route.endLon.toFixed(6)}
            </code>
          </div>
        </div>

        {/* Map toggle */}
        <button
          type="button"
          className="btn btn-outline-secondary btn-sm mb-3"
          onClick={() => setShowMap((v) => !v)}
        >
          <i className={`bi ${showMap ? "bi-map" : "bi-map"} me-1`}></i>
          {showMap ? "Hide map" : "Show map"}
        </button>

        {showMap && flatCoords.length > 0 && (
          <TravelRouteMap
            key={`stored-${route.id}`}
            origin={origin}
            destination={destination}
            route={routeResponse}
          />
        )}

        {/* Steps */}
        {sortedSteps.length > 0 && (
          <div className="mt-3">
            <h6 className="mb-2">
              <i className="bi bi-list-ol me-2 text-primary"></i>
              Steps ({sortedSteps.length})
            </h6>
            <ol className="list-group list-group-numbered">
              {sortedSteps.map((step, i) => (
                <li
                  key={i}
                  className="list-group-item list-group-item-dark d-flex justify-content-between align-items-start"
                >
                  <div className="ms-2 me-auto">
                    <div>{step.instructionText}</div>
                    <small className="text-muted">
                      {formatDistance(step.distanceMeters)} ·{" "}
                      {formatDuration(step.timeSeconds)}
                    </small>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Saved routes tab ─────────────────────────────────────────────────────────

function SavedRoutesTab({
  planId,
  savedRouteEntries,
}: {
  planId: number;
  savedRouteEntries: any[];
}) {
  const [routes, setRoutes] = useState<StoredRoute[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (savedRouteEntries.length > 0) {
      console.log("[SavedRoutesTab] savedRouteEntries raw:", JSON.stringify(savedRouteEntries, null, 2));
    }

    const ids: number[] = savedRouteEntries
      .map((r: any) => {
        // Log every entry to find the correct transport ID field
        const candidate =
          r.transportId ??
          r.idTransport ??
          r.transport?.id ??
          r.id;
        console.log("[SavedRoutesTab] entry:", r, "→ resolved transport id:", candidate);
        return candidate;
      })
      .filter((id: any): id is number => typeof id === "number" && id > 0);

    if (ids.length === 0) return;

    let cancelled = false;

    const fetchAll = async () => {
      setLoading(true);
      setError("");
      try {
        const results = await Promise.all(
          ids.map((id) => getRoute(planId, id))
        );
        if (!cancelled) setRoutes(results);
      } catch (err) {
        console.error("Error loading stored routes:", err);
        if (!cancelled) setError("Could not load route details.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchAll();
    return () => {
      cancelled = true;
    };
  }, [planId, savedRouteEntries]);

  if (savedRouteEntries.length === 0) {
    return (
      <div>
        <h5 className="mb-3">Saved Routes</h5>
        <p className="text-muted mb-0">
          <i className="bi bi-signpost-2 me-2"></i>
          No routes saved yet. Use the Routes tab in the sidebar to search and
          save routes.
        </p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="text-center py-4">
        <div className="spinner-border spinner-border-sm me-2" role="status" />
        Loading routes...
      </div>
    );
  }

  if (error) {
    return <div className="alert alert-danger">{error}</div>;
  }

  return (
    <div>
      <h5 className="mb-3">Saved Routes ({routes.length})</h5>
      <div className="row g-3">
        {routes.map((route) => (
          <StoredRouteCard key={route.id} route={route} />
        ))}
      </div>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function TravelPlans() {
  const [plans, setPlans] = useState<TravelPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [openPlanId, setOpenPlanId] = useState<number | null>(null);
  const [activeDetailTabs, setActiveDetailTabs] = useState<
    Record<number, DetailTab>
  >({});

  const loadTravels = async () => {
    try {
      setLoading(true);
      setError("");
      const data = await getTravelPlans();
      setPlans(data);
    } catch (err) {
      console.error("Error loading travels:", err);
      setError("Could not load travel plans");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTravels();
  }, []);

  const handleDelete = async (travelId: number) => {
    try {
      await deleteTravelPlan(travelId);
      setPlans((current) => current.filter((p) => p.id !== travelId));
    } catch (err) {
      console.error("Error deleting travel:", err);
      setError("Could not delete travel plan");
    }
  };

  const toggleDetails = (planId: number) => {
    setOpenPlanId((current) => (current === planId ? null : planId));
    setActiveDetailTabs((current) => ({
      ...current,
      [planId]: current[planId] ?? "accommodations",
    }));
  };

  const setDetailTab = (planId: number, tab: DetailTab) => {
    setActiveDetailTabs((current) => ({ ...current, [planId]: tab }));
  };

  if (loading) return <div className="text-center mt-4">Loading travels...</div>;
  if (error) return <div className="alert alert-danger mt-3">{error}</div>;
  if (plans.length === 0) {
    return (
      <div className="text-center mt-4 text-muted">
        No travel plans saved yet.
      </div>
    );
  }

  return (
    <div className="mt-3">
      <h3 className="text-center mb-4">My Travel Plans</h3>

      <div className="row g-4">
        {plans.map((plan) => {
          const isOpen = openPlanId === plan.id;
          const activeDetailTab =
            activeDetailTabs[plan.id] ?? "accommodations";

          return (
            <div key={plan.id} className="col-12">
              <div className="card bg-dark text-light shadow border-secondary">
                <div className="card-body">
                  <div className="d-flex justify-content-between align-items-start flex-wrap gap-3">
                    <div>
                      <h5 className="card-title mb-1">{plan.name}</h5>
                      {plan.description && (
                        <p className="text-muted mb-2">{plan.description}</p>
                      )}
                      <p className="mb-1">
                        <strong>Start:</strong> {plan.startDate}
                      </p>
                      <p className="mb-0">
                        <strong>End:</strong> {plan.endDate}
                      </p>
                    </div>

                    <div className="text-end">
                      <button
                        type="button"
                        className="btn btn-outline-primary btn-sm me-2"
                        onClick={() => toggleDetails(plan.id)}
                      >
                        <i
                          className={`bi ${
                            isOpen ? "bi-eye-slash" : "bi-eye"
                          } me-1`}
                        ></i>
                        {isOpen ? "Hide details" : "View details"}
                      </button>
                      <button
                        type="button"
                        className="btn btn-outline-danger btn-sm"
                        onClick={() => handleDelete(plan.id)}
                      >
                        <i className="bi bi-trash me-1"></i>
                        Delete
                      </button>
                    </div>
                  </div>

                  {isOpen && (
                    <div className="mt-4 p-3 rounded bg-secondary bg-opacity-10 border border-secondary">
                      <ul className="nav nav-pills mb-4 gap-2">
                        <DetailButton
                          label={`Accommodations (${
                            plan.savedAccommodations?.length ?? 0
                          })`}
                          active={activeDetailTab === "accommodations"}
                          onClick={() =>
                            setDetailTab(plan.id, "accommodations")
                          }
                        />
                        <DetailButton
                          label={`Activities (${
                            plan.savedActivities?.length ?? 0
                          })`}
                          active={activeDetailTab === "activities"}
                          onClick={() => setDetailTab(plan.id, "activities")}
                        />
                        <DetailButton
                          label={`POIs (${plan.savedPois?.length ?? 0})`}
                          active={activeDetailTab === "pois"}
                          onClick={() => setDetailTab(plan.id, "pois")}
                        />
                        <DetailButton
                          label={`Transport (${
                            plan.savedTransports?.filter(
                              (t) => t.transportType !== "FLIGHT"
                            ).length ?? 0
                          })`}
                          active={activeDetailTab === "transports"}
                          onClick={() => setDetailTab(plan.id, "transports")}
                        />
                        <DetailButton
                          label={`Flights (${plan.savedFlights?.length ?? 0})`}
                          active={activeDetailTab === "flights"}
                          onClick={() => setDetailTab(plan.id, "flights")}
                        />
                        <DetailButton
                          label={`Routes (${
                            plan.savedRoutes?.length ?? 0
                          })`}
                          active={activeDetailTab === "routes"}
                          onClick={() => setDetailTab(plan.id, "routes")}
                        />
                      </ul>

                      {activeDetailTab === "accommodations" && (
                        <div>
                          <h5 className="mb-3">Accommodations</h5>
                          {plan.savedAccommodations?.length ? (
                            <div className="row g-3">
                              {plan.savedAccommodations.map((acc) => (
                                <div key={acc.id} className="col-12 col-md-6">
                                  <div className="p-3 rounded border border-secondary h-100">
                                    <h6>{acc.name}</h6>
                                    <p className="mb-1">
                                      <strong>Address:</strong>{" "}
                                      {acc.address ?? "N/A"}
                                    </p>
                                    <p className="mb-1">
                                      <strong>Type:</strong>{" "}
                                      {acc.propertyType ?? "N/A"}
                                    </p>
                                    <p className="mb-1">
                                      <strong>Rating:</strong>{" "}
                                      {acc.rating ?? "N/A"}
                                    </p>
                                    <p className="mb-1">
                                      <strong>Price/night:</strong>{" "}
                                      {acc.pricePerNight ?? "N/A"}{" "}
                                      {acc.currency ?? ""}
                                    </p>
                                    <p className="mb-0">
                                      <strong>Destination:</strong>{" "}
                                      {acc.destination?.cityName ?? "N/A"},{" "}
                                      {acc.destination?.country ?? ""}
                                    </p>
                                  </div>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <p className="text-muted mb-0">
                              No accommodations saved.
                            </p>
                          )}
                        </div>
                      )}

                      {activeDetailTab === "activities" && (
                        <div>
                          <h5 className="mb-3">Activities</h5>
                          {plan.savedActivities?.length ? (
                            <div className="row g-3">
                              {plan.savedActivities.map((activity) => (
                                <div
                                  key={activity.id}
                                  className="col-12 col-md-6"
                                >
                                  <div className="p-3 rounded border border-secondary h-100">
                                    <h6>{activity.title ?? activity.name}</h6>
                                    <p className="mb-0">
                                      {activity.description ??
                                        "No description"}
                                    </p>
                                  </div>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <p className="text-muted mb-0">
                              No activities saved.
                            </p>
                          )}
                        </div>
                      )}

                      {activeDetailTab === "pois" && (
                        <div>
                          <h5 className="mb-3">Points of Interest</h5>
                          {plan.savedPois?.length ? (
                            <div className="row g-3">
                              {plan.savedPois.map((poi) => (
                                <div key={poi.id} className="col-12 col-md-6">
                                  <div className="p-3 rounded border border-secondary h-100">
                                    <h6>{poi.name}</h6>
                                    {poi.address?.trim() && (
                                      <p className="mb-1">
                                        <strong>Address:</strong> {poi.address}
                                      </p>
                                    )}
                                    <p className="mb-1">
                                      <strong>Type:</strong> {poi.type ?? ""}
                                    </p>
                                    {poi.category?.trim() && (
                                      <p className="mb-1">
                                        <strong>Category:</strong>{" "}
                                        {poi.category}
                                      </p>
                                    )}
                                    <p className="mb-0">
                                      {poi.description || ""}
                                    </p>
                                  </div>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <p className="text-muted mb-0">
                              No points of interest saved.
                            </p>
                          )}
                        </div>
                      )}

                      {activeDetailTab === "transports" &&
                        (() => {
                          const nonFlights =
                            plan.savedTransports?.filter(
                              (t) => t.transportType !== "FLIGHT"
                            ) ?? [];
                          return (
                            <div>
                              <h5 className="mb-3">Transport</h5>
                              {nonFlights.length ? (
                                <div className="row g-3">
                                  {nonFlights.map((transport) => (
                                    <div
                                      key={transport.id}
                                      className="col-12 col-md-6"
                                    >
                                      <div className="p-3 rounded border border-secondary h-100">
                                        <h6>
                                          {transport.transportType ??
                                            "Transport"}{" "}
                                          -{" "}
                                          {transport.provider ??
                                            "Unknown provider"}
                                        </h6>
                                        <p className="mb-1">
                                          <strong>Departure:</strong>{" "}
                                          {formatDateTime(
                                            transport.departureTime
                                          )}
                                        </p>
                                        <p className="mb-1">
                                          <strong>Arrival:</strong>{" "}
                                          {formatDateTime(
                                            transport.arrivalTime
                                          )}
                                        </p>
                                        <p className="mb-0">
                                          <strong>Price:</strong>{" "}
                                          {transport.price ?? "N/A"}{" "}
                                          {transport.currency ?? ""}
                                        </p>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              ) : (
                                <p className="text-muted mb-0">
                                  No transport saved.
                                </p>
                              )}
                            </div>
                          );
                        })()}

                      {activeDetailTab === "flights" && (
                        <div>
                          <h5 className="mb-3">Flights</h5>
                          {plan.savedFlights?.length ? (
                            <div className="row g-3">
                              {plan.savedFlights.map((flight) => (
                                <FlightDetailCard key={flight.id} flight={flight} />
                              ))}
                            </div>
                          ) : (
                            <p className="text-muted mb-0">No flights saved.</p>
                          )}
                        </div>
                      )}

                      {activeDetailTab === "routes" && (
                        <SavedRoutesTab
                          planId={plan.id}
                          savedRouteEntries={plan.savedRoutes ?? []}
                        />
                      )}
                    </div>
                  )}
                </div>

                <div className="card-footer text-end">
                  <small className="text-muted">
                    Created:{" "}
                    {new Date(plan.createdAt).toLocaleDateString()}
                  </small>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Shared helpers ───────────────────────────────────────────────────────────

function DetailButton({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <li className="nav-item">
      <button
        type="button"
        className={`nav-link ${active ? "active" : "text-light"}`}
        onClick={onClick}
      >
        {label}
      </button>
    </li>
  );
}

function formatDateTime(value?: string) {
  if (!value) return "N/A";
  return new Date(value).toLocaleString();
}

function formatDurationFromTimes(departureTime: string, arrivalTime: string) {
  const diff =
    new Date(arrivalTime).getTime() - new Date(departureTime).getTime();
  if (isNaN(diff) || diff <= 0) return null;
  const hours = Math.floor(diff / 3600000);
  const minutes = Math.floor((diff % 3600000) / 60000);
  if (hours === 0) return `${minutes}m`;
  if (minutes === 0) return `${hours}h`;
  return `${hours}h ${minutes}m`;
}

function FlightDetailCard({ flight }: { flight: SavedFlight }) {
  const duration = formatDurationFromTimes(flight.departureTime, flight.arrivalTime);
  const [showMap, setShowMap] = useState(false);
  const [mapError, setMapError] = useState("");
  const [originCoords, setOriginCoords] = useState<{ lat: number; lon: number } | null>(null);
  const [destCoords, setDestCoords] = useState<{ lat: number; lon: number } | null>(null);
  const [loadingMap, setLoadingMap] = useState(false);

  const handleShowMap = async () => {
    if (showMap) { setShowMap(false); return; }

    if (originCoords && destCoords) { setShowMap(true); return; }

    setLoadingMap(true);
    setMapError("");
    try {
      const [origin, dest] = await Promise.all([
        getAirportByIata(flight.originAirport),
        getAirportByIata(flight.destinationAirport),
      ]);

      if (!origin?.latitude || !origin?.longitude) {
        throw new Error(`Coordinates not found for ${flight.originAirport}`);
      }
      if (!dest?.latitude || !dest?.longitude) {
        throw new Error(`Coordinates not found for ${flight.destinationAirport}`);
      }

      setOriginCoords({ lat: origin.latitude, lon: origin.longitude });
      setDestCoords({ lat: dest.latitude, lon: dest.longitude });
      setShowMap(true);
    } catch (err) {
      console.error("Flight map error:", err);
      setMapError("Map not available for these airports.");
    } finally {
      setLoadingMap(false);
    }
  };

  const flightRouteMap =
    showMap && originCoords && destCoords ? (() => {
      const origin: RoutePoint = {
        id: "origin",
        label: flight.originAirport,
        type: "AIRPORT",
        latitude: originCoords.lat,
        longitude: originCoords.lon,
      };
      const destination: RoutePoint = {
        id: "destination",
        label: flight.destinationAirport,
        type: "AIRPORT",
        latitude: destCoords.lat,
        longitude: destCoords.lon,
      };
      const route: RouteSearchResponse = {
        distanceMeters: 0,
        durationSeconds: 0,
        geometry: {
          type: "LineString",
          coordinates: [
            [originCoords.lon, originCoords.lat],
            [destCoords.lon, destCoords.lat],
          ],
        },
        steps: [],
      };
      return { origin, destination, route };
    })() : null;

  return (
    <div className="col-12 col-md-6">
      <div className="p-3 rounded border border-secondary h-100">
        <div className="d-flex justify-content-between align-items-start mb-2">
          <div>
            <h6 className="mb-0">
              {flight.originAirport} → {flight.destinationAirport}
            </h6>
            <small>
              {flight.airline}
              {flight.flightCode ? ` · ${flight.flightCode}` : ""}
            </small>
          </div>
          <span className="badge bg-primary ms-2">FLIGHT</span>
        </div>

        <p className="mb-1">
          <strong>Departure:</strong> {formatDateTime(flight.departureTime)}
        </p>
        <p className="mb-1">
          <strong>Arrival:</strong> {formatDateTime(flight.arrivalTime)}
        </p>
        {duration && (
          <p className="mb-1">
            <strong>Duration:</strong> {duration}
          </p>
        )}
        <p className="mb-1">
          <strong>Cabin class:</strong> {flight.cabinClass}
        </p>
        <p className="mb-1">
          <strong>Luggage included:</strong>{" "}
          {flight.luggageIncluded ? "Yes" : "No"}
        </p>
        <p className="mb-2">
          <strong>Price:</strong> {flight.price} {flight.currency}
        </p>

        <button
          type="button"
          className="btn btn-outline-secondary btn-sm"
          onClick={handleShowMap}
          disabled={loadingMap}
        >
          {loadingMap ? (
            <>
              <span className="spinner-border spinner-border-sm me-1" role="status" />
              Loading map...
            </>
          ) : (
            <>
              <i className={`bi ${showMap ? "bi-map" : "bi-map"} me-1`}></i>
              {showMap ? "Hide map" : "Show map"}
            </>
          )}
        </button>

        {mapError && (
          <div className="alert alert-warning mt-2 mb-0 py-1 px-2">
            <small>{mapError}</small>
          </div>
        )}

        {flightRouteMap && (
          <TravelRouteMap
            key={`flight-${flight.id}`}
            origin={flightRouteMap.origin}
            destination={flightRouteMap.destination}
            route={flightRouteMap.route}
          />
        )}
      </div>
    </div>
  );
}
