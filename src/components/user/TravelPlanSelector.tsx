import { useEffect, useState } from "react";
import type { TravelPlan } from "../../types/travel";
import {
  getTravelPlans,
  createTravelPlan,
} from "../../services/travelService";

type TravelPlanSelectorProps = {
  selectedTravelId: number | "";
  onTravelSelected: (travelId: number | "") => void;
};

export default function TravelPlanSelector({
  selectedTravelId,
  onTravelSelected,
}: TravelPlanSelectorProps) {
  const [travelPlans, setTravelPlans] = useState<TravelPlan[]>([]);
  const [newTravelName, setNewTravelName] = useState("");
  const [loadingTravels, setLoadingTravels] = useState(false);
  const [creatingTravel, setCreatingTravel] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadTravels = async () => {
      try {
        setError("");
        setLoadingTravels(true);

        const travels = await getTravelPlans();
        setTravelPlans(travels);
      } catch (err) {
        console.error(err);
        setError("Travel plans could not be loaded.");
      } finally {
        setLoadingTravels(false);
      }
    };

    loadTravels();
  }, []);

  const handleCreateTravelPlan = async () => {
    if (!newTravelName.trim()) return;

    try {
      setError("");
      setCreatingTravel(true);

      const created = await createTravelPlan(newTravelName.trim());

      setTravelPlans((prev) => [...prev, created]);
      onTravelSelected(created.id);
      setNewTravelName("");
    } catch (err) {
      console.error(err);
      setError("Travel plan could not be created.");
    } finally {
      setCreatingTravel(false);
    }
  };

  return (
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
            onClick={handleCreateTravelPlan}
            disabled={creatingTravel || !newTravelName.trim()}
          >
            {creatingTravel ? "Creating..." : "Create"}
          </button>
        </div>

        <select
          className="form-select"
          value={selectedTravelId}
          disabled={loadingTravels}
          onChange={(e) =>
            onTravelSelected(e.target.value ? Number(e.target.value) : "")
          }
        >
          <option value="">
            {loadingTravels ? "Loading travels..." : "Select travel plan"}
          </option>

          {travelPlans.map((travel) => (
            <option key={travel.id} value={travel.id}>
              {travel.name}
            </option>
          ))}
        </select>

        {error && <div className="alert alert-danger mt-3">{error}</div>}
      </div>
    </div>
  );
}