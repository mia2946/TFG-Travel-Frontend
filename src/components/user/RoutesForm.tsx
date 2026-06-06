import { useEffect, useState } from "react";
import type { TravelPlan } from "../../types/travel";
import type { RoutePoint, RoutePointType, RouteSearchResponse } from "../../types/route";
import { getTravelPlans, createTravelPlan } from "../../services/travelService";
import { searchRoute, saveRoute } from "../../services/routeService";
import { getAirportCoordinates, getRouteableAirportCoordinates } from "../../services/airportService";
import TravelRouteMap from "../routes/TravelRouteMap";

// ── group config ──────────────────────────────────────────────────────────────

const GROUP_CONFIG: { type: RoutePointType; label: string }[] = [
  { type: "AIRPORT",       label: "Airports"           },
  { type: "ACCOMMODATION", label: "Accommodations"     },
  { type: "ACTIVITY",      label: "Activities"         },
  { type: "POI",           label: "Points of Interest" },
];

// ── helpers ───────────────────────────────────────────────────────────────────

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

// Builds route points from all non-airport sources synchronously.
function buildSyncRoutePoints(travel: TravelPlan): RoutePoint[] {
  const points: RoutePoint[] = [];
  const seen = new Set<string>();

  function addPoint(point: RoutePoint) {
    const key = `${point.type}-${point.latitude.toFixed(6)},${point.longitude.toFixed(6)}`;
    if (seen.has(key)) return;
    seen.add(key);
    points.push(point);
  }

  // ── Accommodations ────────────────────────────────────────────────────────
  travel.savedAccommodations?.forEach((item: any) => {
    const lat = Number(
      item.latitude ??
      item.lat ??
      item.locationLatitude ??
      item.destinationLatitude ??
      item.accommodationLatitude
    );
    const lon = Number(
      item.longitude ??
      item.lon ??
      item.lng ??
      item.locationLongitude ??
      item.destinationLongitude ??
      item.accommodationLongitude
    );
    if (!isValidCoordinate(lat, lon)) return;
    const rawId = item.id ?? item.idAccommodation ?? item.externalId;
    addPoint({
      id: `ACCOMMODATION-${rawId}`,
      label: item.name ?? item.hotelName ?? "Accommodation",
      type: "ACCOMMODATION",
      latitude: lat,
      longitude: lon,
      address: item.address,
      entityId: rawId != null ? Number(rawId) : null,
    });
  });

  // ── Activities ────────────────────────────────────────────────────────────
  travel.savedActivities?.forEach((item: any) => {
    const lat = Number(item.latitude ?? item.lat);
    const lon = Number(item.longitude ?? item.lon ?? item.lng);
    if (!isValidCoordinate(lat, lon)) return;
    const rawId = item.id ?? item.externalId;
    addPoint({
      id: `ACTIVITY-${rawId}`,
      label: item.name ?? item.title ?? "Activity",
      type: "ACTIVITY",
      latitude: lat,
      longitude: lon,
      address: item.location ?? item.address ?? item.description,
      entityId: rawId != null ? Number(rawId) : null,
    });
  });

  // ── POIs ──────────────────────────────────────────────────────────────────
  travel.savedPois?.forEach((item: any) => {
    const lat = Number(item.latitude ?? item.lat);
    const lon = Number(item.longitude ?? item.lon ?? item.lng);
    if (!isValidCoordinate(lat, lon)) return;
    const rawId = item.id ?? item.idPoi ?? item.externalId;
    addPoint({
      id: `POI-${rawId}`,
      label: item.name ?? "POI",
      type: "POI",
      latitude: lat,
      longitude: lon,
      address: item.address,
      entityId: rawId != null ? Number(rawId) : null,
    });
  });

  return points;
}

// ── grouped select ────────────────────────────────────────────────────────────

function GroupedRouteSelect({
  id,
  value,
  placeholder,
  routePoints,
  onChange,
}: {
  id: string;
  value: string;
  placeholder: string;
  routePoints: RoutePoint[];
  onChange: (value: string) => void;
}) {
  const activeGroups = GROUP_CONFIG.filter((g) =>
    routePoints.some((p) => p.type === g.type)
  );

  return (
    <select
      id={id}
      className="form-select"
      value={value}
      onChange={(e) => onChange(e.target.value)}
    >
      <option value="">{placeholder}</option>
      {activeGroups.map((group) => (
        <optgroup key={group.type} label={group.label}>
          {routePoints
            .filter((p) => p.type === group.type)
            .map((point) => (
              <option key={point.id} value={point.id}>
                {point.label}
              </option>
            ))}
        </optgroup>
      ))}
    </select>
  );
}

// ── main component ────────────────────────────────────────────────────────────

export default function RoutesForm() {
  const [travelPlans, setTravelPlans] = useState<TravelPlan[]>([]);
  const [selectedTravelId, setSelectedTravelId] = useState<number | "">("");
  const [newTravelName, setNewTravelName] = useState("");
  const [loadingPlans, setLoadingPlans] = useState(false);
  const [creatingPlan, setCreatingPlan] = useState(false);

  const [routePoints, setRoutePoints] = useState<RoutePoint[]>([]);
  const [loadingPoints, setLoadingPoints] = useState(false);

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

  // Build route points: sync sources first, then async airport resolution.
  useEffect(() => {
    setOriginId("");
    setDestinationId("");
    setRoute(null);
    setRawData(null);
    setError("");
    setSuccess("");

    if (!selectedTravel) {
      setRoutePoints([]);
      return;
    }

    console.log("selectedTravel", selectedTravel);
    console.log("savedFlights", selectedTravel?.savedFlights);
    console.log("savedAccommodations", selectedTravel?.savedAccommodations);

    const syncPoints = buildSyncRoutePoints(selectedTravel);
    setRoutePoints(syncPoints);

    // Collect unique IATA codes from saved flights.
    const iataSet = new Set<string>();
    selectedTravel.savedFlights?.forEach((f: any) => {
      if (f.originAirport?.trim())
        iataSet.add(f.originAirport.trim().toUpperCase());
      if (f.destinationAirport?.trim())
        iataSet.add(f.destinationAirport.trim().toUpperCase());
    });

    if (iataSet.size === 0) {
      console.log("routePoints", syncPoints);
      return;
    }

    const iataList = [...iataSet];
    setLoadingPoints(true);

    Promise.all(iataList.map((iata) => getAirportCoordinates(iata)))
      .then((results) => {
        const airportPoints: RoutePoint[] = [];
        results.forEach((airport, i) => {
          if (!airport) return;
          const iata = iataList[i];
          const lat = airport.latitude;
          const lon = airport.longitude;
          if (!isValidCoordinate(lat, lon)) return;
          airportPoints.push({
            id: `AIRPORT-${iata}`,
            label: airport.name ?? airport.city ?? iata,
            type: "AIRPORT",
            latitude: lat!,
            longitude: lon!,
            iata,
            entityId: null,
          });
        });

        setRoutePoints((prev) => {
          const existingIds = new Set(prev.map((p) => p.id));
          const combined = [
            ...prev,
            ...airportPoints.filter((p) => !existingIds.has(p.id)),
          ];
          console.log("routePoints", combined);
          return combined;
        });
      })
      .catch((err) => {
        console.error("Error loading airport coordinates:", err);
        console.log("routePoints", syncPoints);
      })
      .finally(() => setLoadingPoints(false));
  }, [selectedTravelId]); // eslint-disable-line react-hooks/exhaustive-deps

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
      setError("Please select both origin and destination.");
      return;
    }
    if (origin.id === destination.id) {
      setError("Origin and destination must be different.");
      return;
    }
    if (!isValidCoordinate(origin.latitude, origin.longitude)) {
      setError("The selected origin does not have valid coordinates.");
      return;
    }
    if (!isValidCoordinate(destination.latitude, destination.longitude)) {
      setError("The selected destination does not have valid coordinates.");
      return;
    }

    console.log("[route] selected origin", origin);
    console.log("[route] selected destination", destination);

    try {
      setLoading(true);
      setError("");
      setSuccess("");
      setRoute(null);
      setRawData(null);

      // Resolve routeable coordinates for AIRPORT points before calling the route API.
      let startLat = origin.latitude;
      let startLon = origin.longitude;
      let endLat = destination.latitude;
      let endLon = destination.longitude;

      if (origin.type === "AIRPORT" && origin.iata) {
        console.log(`[route] origin is AIRPORT (${origin.iata}) — resolving routeable coordinates`);
        const routeable = await getRouteableAirportCoordinates(origin.iata);
        if (routeable?.latitude != null && routeable?.longitude != null) {
          console.log(`[route] origin routeable coordinate: lat=${routeable.latitude} lon=${routeable.longitude} point="${routeable.routePointName ?? "centroid"}"`);
          startLat = routeable.latitude;
          startLon = routeable.longitude;
        } else {
          console.log(`[route] origin routeable lookup failed, using display coordinate`);
        }
      }

      if (destination.type === "AIRPORT" && destination.iata) {
        console.log(`[route] destination is AIRPORT (${destination.iata}) — resolving routeable coordinates`);
        const routeable = await getRouteableAirportCoordinates(destination.iata);
        if (routeable?.latitude != null && routeable?.longitude != null) {
          console.log(`[route] destination routeable coordinate: lat=${routeable.latitude} lon=${routeable.longitude} point="${routeable.routePointName ?? "centroid"}"`);
          endLat = routeable.latitude;
          endLon = routeable.longitude;
        } else {
          console.log(`[route] destination routeable lookup failed, using display coordinate`);
        }
      }

      const routeRequest = {
        startLatitude: startLat,
        startLongitude: startLon,
        endLatitude: endLat,
        endLongitude: endLon,
      };
      console.log("[route] final route request body", routeRequest);

      const { route: result, rawData: raw } = await searchRoute(routeRequest);

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
        originName: origin?.label ?? null,
        destinationName: destination?.label ?? null,
        originType: origin?.type ?? null,
        destinationType: destination?.type ?? null,
        originEntityId: origin?.entityId ?? null,
        destinationEntityId: destination?.entityId ?? null,
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

      {/* Guidance when no plan is selected */}
      {!selectedTravel && !loadingPlans && (
        <div className="alert alert-info d-flex align-items-start gap-2">
          <i className="bi bi-info-circle-fill fs-5 mt-1 flex-shrink-0"></i>
          <div>
            <strong>How routes work</strong>
            <p className="mb-0 mt-1">
              Select a travel plan to generate routes between its saved
              airports, accommodations, activities, and points of interest.
              You need at least two saved locations with coordinates.
            </p>
          </div>
        </div>
      )}

      {/* Route Search */}
      {selectedTravel && (
        <div className="card bg-dark text-light border-secondary">
          <div className="card-body">
            <h5 className="mb-4 text-center">Search Route</h5>

            {loadingPoints ? (
              <div className="text-center py-3">
                <span className="spinner-border spinner-border-sm me-2" role="status" />
                Loading locations…
              </div>
            ) : routePoints.length === 0 ? (
              <div className="alert alert-warning">
                <i className="bi bi-exclamation-triangle me-2"></i>
                This travel plan has no saved locations with valid coordinates.
                Save airports, accommodations, activities, or POIs with
                coordinate data first.
              </div>
            ) : routePoints.length < 2 ? (
              <div className="alert alert-warning">
                <i className="bi bi-exclamation-triangle me-2"></i>
                Only one location found. Add at least one more saved location
                with valid coordinates to generate a route.
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
                    <GroupedRouteSelect
                      id="origin-select"
                      value={originId}
                      placeholder="Select origin"
                      routePoints={routePoints}
                      onChange={(v) => {
                        setOriginId(v);
                        setRoute(null);
                        setSuccess("");
                      }}
                    />
                  </div>

                  <div className="col-12 col-md-5">
                    <label className="form-label text-light">Destination</label>
                    <GroupedRouteSelect
                      id="destination-select"
                      value={destinationId}
                      placeholder="Select destination"
                      routePoints={routePoints}
                      onChange={(v) => {
                        setDestinationId(v);
                        setRoute(null);
                        setSuccess("");
                      }}
                    />
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
                          <small>Distance</small>
                          <p className="mb-0 fw-semibold">
                            {formatDistance(route.distanceMeters)}
                          </p>
                        </div>
                        <div className="col-6">
                          <small>Duration</small>
                          <p className="mb-0 fw-semibold">
                            {formatDuration(route.durationSeconds)}
                          </p>
                        </div>
                        <div className="col-12 mt-2">
                          <small>From</small>
                          <p className="mb-0">{origin.label}</p>
                          <small>To</small>
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
