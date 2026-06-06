import { useEffect, useState } from "react";
import {
  deleteTravelPlan,
  getTravelPlans,
  deleteAccommodationFromTravel,
  deleteActivityFromTravel,
  deletePoiFromTravel,
  deleteFlightFromTravel,
  deleteTransportFromTravel,
} from "../../services/travelService";
import { getRoute, deleteRoute } from "../../services/routeService";
import { getAirportCoordinates } from "../../services/airportService";
import type { TravelPlan, SavedFlight } from "../../types/travel";
import type {
  StoredRoute,
  RoutePoint,
  RouteSearchResponse,
} from "../../types/route";
import TravelRouteMap from "../routes/TravelRouteMap";
import ConfirmationModal from "../common/ConfirmationModal";

type DetailTab =
  | "accommodations"
  | "activities"
  | "pois"
  | "transports"
  | "flights"
  | "routes";

type ConfirmState = {
  isOpen: boolean;
  title: string;
  message: string;
  details?: string;
  confirmText: string;
  cancelText: string;
  destructive: boolean;
  onConfirm: () => void;
};

const CONFIRM_CLOSED: ConfirmState = {
  isOpen: false,
  title: "",
  message: "",
  confirmText: "Delete",
  cancelText: "Cancel",
  destructive: true,
  onConfirm: () => {},
};

// Returns the best available category string for an activity, or null.
function getActivityCategory(activity: any): string | null {
  for (const field of [
    activity.category,
    activity.type,
    activity.activityType,
    activity.activityCategory,
    activity.kinds,
  ]) {
    if (typeof field === "string" && field.trim()) return field.trim();
    if (Array.isArray(field) && field.length > 0)
      return field.filter(Boolean).join(", ");
  }

  const cats = activity.properties?.categories;
  if (Array.isArray(cats) && cats.length > 0)
    return cats.filter(Boolean).join(", ");
  if (typeof cats === "string" && cats.trim()) return cats.trim();

  const raw = activity.properties?.datasource?.raw;
  if (raw) {
    for (const v of [raw.tourism, raw.amenity, raw.leisure, raw.historic]) {
      if (typeof v === "string" && v.trim()) return v.trim();
    }
  }

  return null;
}

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

function hasValue(v: unknown): boolean {
  if (v === null || v === undefined) return false;
  const s = String(v).trim();
  return s !== "" && s !== "N/A";
}

// ─── Type badge ───────────────────────────────────────────────────────────────

const TYPE_BADGE_CLASS: Record<string, string> = {
  AIRPORT: "bg-info text-dark",
  ACCOMMODATION: "bg-success",
  ACTIVITY: "bg-warning text-dark",
  POI: "bg-secondary",
};

function TypeBadge({ type }: { type?: string | null }) {
  if (!type) return null;
  const cls = TYPE_BADGE_CLASS[type] ?? "bg-secondary";
  return <span className={`badge ${cls} me-1`}>{type}</span>;
}

// ─── Stored route card ────────────────────────────────────────────────────────

function StoredRouteCard({
  route,
  onDelete,
}: {
  route: StoredRoute;
  onDelete: () => void;
}) {
  const [showMap, setShowMap] = useState(false);

  const originLabel =
    route.originName ??
    `${route.startLat.toFixed(6)}, ${route.startLon.toFixed(6)}`;
  const destinationLabel =
    route.destinationName ??
    `${route.endLat.toFixed(6)}, ${route.endLon.toFixed(6)}`;

  const origin: RoutePoint = {
    id: "origin",
    label: originLabel,
    type: (route.originType as any) ?? "POI",
    latitude: route.startLat,
    longitude: route.startLon,
  };

  const destination: RoutePoint = {
    id: "destination",
    label: destinationLabel,
    type: (route.destinationType as any) ?? "POI",
    latitude: route.endLat,
    longitude: route.endLon,
  };

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
            <div className="d-flex align-items-center flex-wrap gap-1">
              <TypeBadge type={route.originType} />
              <span className="fw-semibold">{originLabel}</span>
              <span className="mx-1 text-secondary">→</span>
              <TypeBadge type={route.destinationType} />
              <span className="fw-semibold">{destinationLabel}</span>
            </div>
          </div>
          <div className="d-flex align-items-center gap-3">
            <span>
              <i className="bi bi-rulers me-1 text-primary"></i>
              {formatDistance(route.totalDistanceMeters)}
            </span>
            <span>
              <i className="bi bi-clock me-1 text-primary"></i>
              {formatDuration(route.totalTimeSeconds)}
            </span>
            <button
              type="button"
              className="btn btn-outline-danger btn-sm"
              onClick={onDelete}
            >
              <i className="bi bi-trash"></i>
            </button>
          </div>
        </div>

        {/* Map toggle */}
        <button
          type="button"
          className="btn btn-outline-secondary btn-sm mb-3"
          onClick={() => setShowMap((v) => !v)}
        >
          <i className="bi bi-map me-1"></i>
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
                    <small>
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
  onDeleteRoute,
  openConfirm,
}: {
  planId: number;
  savedRouteEntries: any[];
  onDeleteRoute: (routeId: number) => void;
  openConfirm: (cfg: Omit<ConfirmState, "isOpen">) => void;
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

  const requestDeleteRoute = (routeId: number) => {
    openConfirm({
      title: "Info",
      message: "Are you sure you want to delete this route?",
      details: "This action cannot be undone.",
      confirmText: "Delete",
      cancelText: "Cancel",
      destructive: true,
      onConfirm: async () => {
        try {
          await deleteRoute(planId, routeId);
          setRoutes((prev) => prev.filter((r) => r.id !== routeId));
          onDeleteRoute(routeId);
        } catch (err) {
          console.error("Error deleting route:", err);
          setError("Could not delete route.");
        }
      },
    });
  };

  if (savedRouteEntries.length === 0) {
    return (
      <div>
        <h5 className="mb-3">Saved Routes</h5>
        <p className="text-warning mb-0">
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
          <StoredRouteCard
            key={route.id}
            route={route}
            onDelete={() => requestDeleteRoute(route.id)}
          />
        ))}
      </div>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function TravelPlans({
  onGoToSearch,
  onPlansLoaded,
}: {
  onGoToSearch?: () => void;
  onPlansLoaded?: (count: number) => void;
} = {}) {
  const [plans, setPlans] = useState<TravelPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [openPlanId, setOpenPlanId] = useState<number | null>(null);
  const [activeDetailTabs, setActiveDetailTabs] = useState<
    Record<number, DetailTab>
  >({});
  const [confirmState, setConfirmState] = useState<ConfirmState>(CONFIRM_CLOSED);

  const openConfirm = (cfg: Omit<ConfirmState, "isOpen">) =>
    setConfirmState({ ...cfg, isOpen: true });

  const closeConfirm = () =>
    setConfirmState((c) => ({ ...c, isOpen: false }));

  const loadTravels = async () => {
    try {
      setLoading(true);
      setError("");
      const data = await getTravelPlans();
      setPlans(data);
      onPlansLoaded?.(data.length);
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

  // ── Generic item removal ───────────────────────────────────────────────────

  const removePlanItem = (
    planId: number,
    field: keyof TravelPlan,
    itemId: number
  ) => {
    setPlans((prev) =>
      prev.map((p) =>
        p.id !== planId
          ? p
          : { ...p, [field]: (p[field] as any[])?.filter((i: any) => i.id !== itemId) }
      )
    );
  };

  // ── Delete handlers ────────────────────────────────────────────────────────

  const handleDeletePlan = (travelId: number) => {
    openConfirm({
      title: "Info",
      message: "Are you sure you want to delete this travel plan?",
      details:
        "All saved flights, accommodations, activities, POIs, routes and transport information associated with this travel plan will also be removed. This action cannot be undone.",
      confirmText: "Delete Travel Plan",
      cancelText: "Cancel",
      destructive: true,
      onConfirm: async () => {
        try {
          await deleteTravelPlan(travelId);
          setPlans((current) => current.filter((p) => p.id !== travelId));
        } catch (err) {
          console.error("Error deleting travel:", err);
          setError("Could not delete travel plan.");
        }
      },
    });
  };

  const handleDeleteAccommodation = (planId: number, itemId: number) => {
    openConfirm({
      title: "Info",
      message: "Are you sure you want to delete this accommodation from the travel plan?",
      details: "This action cannot be undone.",
      confirmText: "Delete",
      cancelText: "Cancel",
      destructive: true,
      onConfirm: async () => {
        try {
          await deleteAccommodationFromTravel(planId, itemId);
          removePlanItem(planId, "savedAccommodations", itemId);
        } catch (err) {
          console.error(err);
          setError("Could not delete accommodation.");
        }
      },
    });
  };

  const handleDeleteActivity = (planId: number, itemId: number) => {
    openConfirm({
      title: "Info",
      message: "Are you sure you want to delete this activity from the travel plan?",
      details: "This action cannot be undone.",
      confirmText: "Delete",
      cancelText: "Cancel",
      destructive: true,
      onConfirm: async () => {
        try {
          await deleteActivityFromTravel(planId, itemId);
          removePlanItem(planId, "savedActivities", itemId);
        } catch (err) {
          console.error(err);
          setError("Could not delete activity.");
        }
      },
    });
  };

  const handleDeletePoi = (planId: number, itemId: number) => {
    openConfirm({
      title: "Info",
      message: "Are you sure you want to delete this point of interest from the travel plan?",
      details: "This action cannot be undone.",
      confirmText: "Delete",
      cancelText: "Cancel",
      destructive: true,
      onConfirm: async () => {
        try {
          await deletePoiFromTravel(planId, itemId);
          removePlanItem(planId, "savedPois", itemId);
        } catch (err) {
          console.error(err);
          setError("Could not delete point of interest.");
        }
      },
    });
  };

  const handleDeleteTransport = (planId: number, itemId: number) => {
    openConfirm({
      title: "Info",
      message: "Are you sure you want to delete this transport from the travel plan?",
      details: "This action cannot be undone.",
      confirmText: "Delete",
      cancelText: "Cancel",
      destructive: true,
      onConfirm: async () => {
        try {
          await deleteTransportFromTravel(planId, itemId);
          removePlanItem(planId, "savedTransports", itemId);
        } catch (err) {
          console.error(err);
          setError("Could not delete transport.");
        }
      },
    });
  };

  const handleDeleteFlight = (planId: number, flightId: number) => {
    openConfirm({
      title: "Info",
      message: "Are you sure you want to delete this flight from the travel plan?",
      details: "This action cannot be undone.",
      confirmText: "Delete",
      cancelText: "Cancel",
      destructive: true,
      onConfirm: async () => {
        try {
          await deleteFlightFromTravel(planId, flightId);
          removePlanItem(planId, "savedFlights", flightId);
        } catch (err) {
          console.error(err);
          setError("Could not delete flight.");
        }
      },
    });
  };

  const handleDeleteRoute = (planId: number, routeId: number) => {
    setPlans((prev) =>
      prev.map((p) => {
        if (p.id !== planId) return p;
        const resolveId = (r: any) =>
          r.transportId ?? r.idTransport ?? r.transport?.id ?? r.id;
        return {
          ...p,
          savedRoutes: p.savedRoutes?.filter((r) => resolveId(r) !== routeId),
        };
      })
    );
  };

  // ── UI helpers ─────────────────────────────────────────────────────────────

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
      <div className="text-center pt-1 pb-2 px-3">
        <i className="bi bi-suitcase-lg text-secondary d-block mb-1" style={{ fontSize: "4rem" }}></i>
        <h4 className="mb-3 text-light">No travel plans yet</h4>
        <p className="text-secondary mb-4" style={{ maxWidth: 440, margin: "0 auto 1.5rem" }}>
          You haven't saved any travel plans yet.
          <br />
          Create a travel plan from the search page to start organizing flights,
          accommodations, activities, points of interest and routes.
        </p>
        {onGoToSearch && (
          <button
            type="button"
            className="btn btn-primary"
            onClick={onGoToSearch}
          >
            <i className="bi bi-search me-2"></i>
            Go to Search
          </button>
        )}
      </div>
    );
  }

  return (
    <>
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
                          onClick={() => handleDeletePlan(plan.id)}
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
                                      <div className="d-flex justify-content-between align-items-start mb-2">
                                        <h6 className="mb-0">{acc.name}</h6>
                                        <button
                                          type="button"
                                          className="btn btn-outline-danger btn-sm ms-2"
                                          onClick={() =>
                                            handleDeleteAccommodation(plan.id, acc.id)
                                          }
                                        >
                                          <i className="bi bi-trash"></i>
                                        </button>
                                      </div>
                                      {hasValue(acc.address) && (
                                        <p className="mb-1">
                                          <strong>Address:</strong>{" "}
                                          {acc.address}
                                        </p>
                                      )}
                                      {hasValue(acc.propertyType) && (
                                        <p className="mb-1">
                                          <strong>Type:</strong>{" "}
                                          {acc.propertyType}
                                        </p>
                                      )}
                                      {hasValue(acc.rating) && (
                                        <p className="mb-1">
                                          <strong>Rating:</strong>{" "}
                                          {acc.rating}
                                        </p>
                                      )}
                                      {hasValue(acc.pricePerNight) && (
                                        <p className="mb-1">
                                          <strong>Price/night:</strong>{" "}
                                          {acc.pricePerNight}
                                          {hasValue(acc.currency) && ` ${acc.currency}`}
                                        </p>
                                      )}
                                      {hasValue(acc.destination?.cityName) && (
                                        <p className="mb-0">
                                          <strong>Destination:</strong>{" "}
                                          {acc.destination.cityName}
                                          {hasValue(acc.destination?.country) && `, ${acc.destination.country}`}
                                        </p>
                                      )}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <p className="text-warning mb-0">
                                <i className="bi bi-building me-2"></i>
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
                                {plan.savedActivities.map((activity) => {
                                  const categoryLabel = getActivityCategory(activity);
                                  const addressText =
                                    activity.location || activity.description;
                                  const destination = activity.destination;

                                  return (
                                    <div
                                      key={activity.id}
                                      className="col-12 col-md-6"
                                    >
                                      <div className="p-3 rounded border border-secondary h-100">
                                        <div className="d-flex justify-content-between align-items-start mb-2">
                                          <h6 className="mb-0">
                                            {activity.title ?? activity.name}
                                          </h6>
                                          <button
                                            type="button"
                                            className="btn btn-outline-danger btn-sm ms-2"
                                            onClick={() =>
                                              handleDeleteActivity(plan.id, activity.id)
                                            }
                                          >
                                            <i className="bi bi-trash"></i>
                                          </button>
                                        </div>

                                        {categoryLabel && (
                                          <p className="mb-1 small">
                                            <strong>Category:</strong>{" "}
                                            {categoryLabel}
                                          </p>
                                        )}

                                        {addressText?.trim() && (
                                          <p className="mb-1 small">
                                            <strong>Address:</strong>{" "}
                                            {addressText}
                                          </p>
                                        )}

                                        {destination?.cityName && (
                                          <p className="mb-1 small">
                                            <strong>Destination:</strong>{" "}
                                            {destination.cityName}
                                            {destination.country
                                              ? `, ${destination.country}`
                                              : ""}
                                          </p>
                                        )}
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            ) : (
                              <p className="text-warning mb-0">
                                <i className="bi bi-map me-2"></i>
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
                                      <div className="d-flex justify-content-between align-items-start mb-2">
                                        <h6 className="mb-0">{poi.name}</h6>
                                        <button
                                          type="button"
                                          className="btn btn-outline-danger btn-sm ms-2"
                                          onClick={() =>
                                            handleDeletePoi(plan.id, poi.id)
                                          }
                                        >
                                          <i className="bi bi-trash"></i>
                                        </button>
                                      </div>
                                      {hasValue(poi.address) && (
                                        <p className="mb-1">
                                          <strong>Address:</strong> {poi.address}
                                        </p>
                                      )}
                                      {hasValue(poi.type) && (
                                        <p className="mb-1">
                                          <strong>Type:</strong> {poi.type}
                                        </p>
                                      )}
                                      {hasValue(poi.category) && (
                                        <p className="mb-1">
                                          <strong>Category:</strong>{" "}
                                          {poi.category}
                                        </p>
                                      )}
                                      {hasValue(poi.description) && (
                                        <p className="mb-0">{poi.description}</p>
                                      )}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <p className="text-warning mb-0">
                                <i className="bi bi-geo-alt me-2"></i>
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
                                          <div className="d-flex justify-content-between align-items-start mb-2">
                                            <h6 className="mb-0">
                                              {transport.transportType ??
                                                "Transport"}{" "}
                                              -{" "}
                                              {transport.provider ??
                                                "Unknown provider"}
                                            </h6>
                                            <button
                                              type="button"
                                              className="btn btn-outline-danger btn-sm ms-2"
                                              onClick={() =>
                                                handleDeleteTransport(plan.id, transport.id)
                                              }
                                            >
                                              <i className="bi bi-trash"></i>
                                            </button>
                                          </div>
                                          {hasValue(transport.departureTime) && (
                                            <p className="mb-1">
                                              <strong>Departure:</strong>{" "}
                                              {formatDateTime(transport.departureTime)}
                                            </p>
                                          )}
                                          {hasValue(transport.arrivalTime) && (
                                            <p className="mb-1">
                                              <strong>Arrival:</strong>{" "}
                                              {formatDateTime(transport.arrivalTime)}
                                            </p>
                                          )}
                                          {hasValue(transport.price) && (
                                            <p className="mb-0">
                                              <strong>Price:</strong>{" "}
                                              {transport.price}
                                              {hasValue(transport.currency) && ` ${transport.currency}`}
                                            </p>
                                          )}
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                ) : (
                                  <p className="text-warning mb-0">
                                    <i className="bi bi-bus-front me-2"></i>
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
                                  <FlightDetailCard
                                    key={flight.id}
                                    flight={flight}
                                    onDelete={() =>
                                      handleDeleteFlight(plan.id, flight.id)
                                    }
                                  />
                                ))}
                              </div>
                            ) : (
                              <p className="text-warning mb-0">
                                <i className="bi bi-airplane me-2"></i>
                                No flights saved.
                              </p>
                            )}
                          </div>
                        )}

                        {activeDetailTab === "routes" && (
                          <SavedRoutesTab
                            planId={plan.id}
                            savedRouteEntries={plan.savedRoutes ?? []}
                            onDeleteRoute={(routeId) =>
                              handleDeleteRoute(plan.id, routeId)
                            }
                            openConfirm={openConfirm}
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

      <ConfirmationModal
        isOpen={confirmState.isOpen}
        title={confirmState.title}
        message={confirmState.message}
        details={confirmState.details}
        confirmText={confirmState.confirmText}
        cancelText={confirmState.cancelText}
        destructive={confirmState.destructive}
        onConfirm={confirmState.onConfirm}
        onCancel={closeConfirm}
      />
    </>
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

function FlightDetailCard({
  flight,
  onDelete,
}: {
  flight: SavedFlight;
  onDelete: () => void;
}) {
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
        getAirportCoordinates(flight.originAirport),
        getAirportCoordinates(flight.destinationAirport),
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
          <div className="d-flex align-items-center gap-2 ms-2">
            <span className="badge bg-primary">FLIGHT</span>
            <button
              type="button"
              className="btn btn-outline-danger btn-sm"
              onClick={onDelete}
            >
              <i className="bi bi-trash"></i>
            </button>
          </div>
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
        {hasValue(flight.cabinClass) && (
          <p className="mb-1">
            <strong>Cabin class:</strong> {flight.cabinClass}
          </p>
        )}
        <p className="mb-1">
          <strong>Luggage included:</strong>{" "}
          {flight.luggageIncluded ? "Yes" : "No"}
        </p>
        {hasValue(flight.price) && (
          <p className="mb-2">
            <strong>Price:</strong> {flight.price}
            {hasValue(flight.currency) && ` ${flight.currency}`}
          </p>
        )}

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
              <i className="bi bi-map me-1"></i>
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
