import { useEffect, useState } from "react";
import { deleteTravelPlan, getTravelPlans } from "../../services/travelService";
import type { TravelPlan } from "../../types/travel";

type DetailTab = "accommodations" | "activities" | "pois" | "transports";

export default function TravelPlans() {
  const [plans, setPlans] = useState<TravelPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [openPlanId, setOpenPlanId] = useState<number | null>(null);
  const [activeDetailTabs, setActiveDetailTabs] = useState<Record<number, DetailTab>>({});

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
      setPlans((currentPlans) =>
        currentPlans.filter((plan) => plan.id !== travelId)
      );
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
    setActiveDetailTabs((current) => ({
      ...current,
      [planId]: tab,
    }));
  };

  if (loading) {
    return <div className="text-center mt-4">Loading travels...</div>;
  }

  if (error) {
    return <div className="alert alert-danger mt-3">{error}</div>;
  }

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
          const activeDetailTab = activeDetailTabs[plan.id] ?? "accommodations";

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
                          label={`Accommodations (${plan.savedAccommodations?.length ?? 0})`}
                          active={activeDetailTab === "accommodations"}
                          onClick={() => setDetailTab(plan.id, "accommodations")}
                        />

                        <DetailButton
                          label={`Activities (${plan.savedActivities?.length ?? 0})`}
                          active={activeDetailTab === "activities"}
                          onClick={() => setDetailTab(plan.id, "activities")}
                        />

                        <DetailButton
                          label={`POIs (${plan.savedPois?.length ?? 0})`}
                          active={activeDetailTab === "pois"}
                          onClick={() => setDetailTab(plan.id, "pois")}
                        />

                        <DetailButton
                          label={`Transport (${plan.savedTransports?.length ?? 0})`}
                          active={activeDetailTab === "transports"}
                          onClick={() => setDetailTab(plan.id, "transports")}
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
                                <div key={activity.id} className="col-12 col-md-6">
                                  <div className="p-3 rounded border border-secondary h-100">
                                    <h6>{activity.title ?? activity.name}</h6>
                                    <p className="mb-0">
                                      {activity.description ?? "No description"}
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
                                    <p className="mb-1">
                                      <strong>Type:</strong>{" "}
                                      {poi.type ?? ""}
                                    </p>
                                    {poi.category && poi.category.trim() !== "" && (
                                      <p className="mb-1">
                                        <strong>Category:</strong> {poi.category}
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

                      {activeDetailTab === "transports" && (
                        <div>
                          <h5 className="mb-3">Transport</h5>

                          {plan.savedTransports?.length ? (
                            <div className="row g-3">
                              {plan.savedTransports.map((transport) => (
                                <div
                                  key={transport.id}
                                  className="col-12 col-md-6"
                                >
                                  <div className="p-3 rounded border border-secondary h-100">
                                    <h6>
                                      {transport.transportType ?? "Transport"} -{" "}
                                      {transport.provider ?? "Unknown provider"}
                                    </h6>
                                    <p className="mb-1">
                                      <strong>Departure:</strong>{" "}
                                      {formatDateTime(transport.departureTime)}
                                    </p>
                                    <p className="mb-1">
                                      <strong>Arrival:</strong>{" "}
                                      {formatDateTime(transport.arrivalTime)}
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
                      )}
                    </div>
                  )}
                </div>

                <div className="card-footer text-end">
                  <small className="text-muted">
                    Created: {new Date(plan.createdAt).toLocaleDateString()}
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