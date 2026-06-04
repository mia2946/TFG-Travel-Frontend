import { useState } from "react";
import CityAutocompleteInput from "./CityAutocompleteInput";
import TravelPlanSelector from "./TravelPlanSelector";
import { searchCities } from "../../services/locationService";
import { searchActivities } from "../../services/activityService";
import { addActivityToTravel } from "../../services/travelService";
import type {
  ActivityResult,
  ActivitySearchRequest,
} from "../../types/search";

type ActivityFormState = ActivitySearchRequest & {
  cityName?: string;
  country?: string;
  countryCode?: string;
};

export default function ActivitiesForm() {
  const [form, setForm] = useState<ActivityFormState>({
    destination: "",
    lat: "",
    lon: "",
    activityType: "",
    cityName: "",
    country: "",
    countryCode: "",
  });

  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<ActivityResult[]>([]);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [selectedTravelId, setSelectedTravelId] = useState<number | "">("");
  const [savingActivityId, setSavingActivityId] = useState<string | number | null>(null);

  const [plannedDateTimeByActivityId, setPlannedDateTimeByActivityId] =
    useState<Record<string | number, string>>({});

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const { name, value } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const getActivityId = (activity: ActivityResult, index: number) => {
    const coords = activity.geometry?.coordinates;
    const name = activity.properties?.name;

    return `${name || "activity"}-${coords?.[0] || "lon"}-${
      coords?.[1] || "lat"
    }-${index}`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    setError("");
    setSuccess("");
    setResults([]);
    setLoading(true);

    try {
      let resolvedForm = { ...form };

      if (!resolvedForm.lat || !resolvedForm.lon) {
        const matches = await searchCities(resolvedForm.destination);

        if (matches.length === 0) {
          setError("Activities cannot be found.");
          return;
        }

        const best = matches[0];
        resolvedForm = {
          ...resolvedForm,
          destination: `${best.name}, ${best.country}`,
          cityName: best.name,
          country: best.country,
          countryCode: best.countryCode,
          lat: best.lat,
          lon: best.lon,
        };
        setForm(resolvedForm);
      }

      const data = await searchActivities(resolvedForm);
      setResults(data);
    } catch (err) {
      console.error(err);
      setError("Activities cannot be found.");
    } finally {
      setLoading(false);
    }
  };

  const handleAddActivityToTravel = async (
    activity: ActivityResult,
    index: number
  ) => {
    if (!selectedTravelId) {
      setError("Please select a travel plan first.");
      return;
    }

    const activityId = getActivityId(activity, index);
    const props = activity.properties;
    const coords = activity.geometry?.coordinates;

    const name = props?.name || "Unnamed activity";
    const category = props?.inferredType || props?.categories?.[0] || "";
    const address = props?.formatted || "";
    const lon = coords?.[0];
    const lat = coords?.[1];
    const plannedDateTime = plannedDateTimeByActivityId[activityId];

    try {
      setError("");
      setSuccess("");
      setSavingActivityId(activityId);

      const destCityName =
        form.cityName ||
        form.destination.split(", ")[0] ||
        form.destination;
      const destCountry =
        form.country ||
        (form.destination.includes(", ")
          ? form.destination.split(", ").slice(1).join(", ")
          : "");

      await addActivityToTravel(Number(selectedTravelId), {
        idPoi: null,
        externalId: activityId,
        source: props?.datasource?.sourcename || "GEOAPIFY",
        name,
        category,
        type: category,
        latitude: lat,
        longitude: lon,
        address,
        description: address,
        bookingLink: "",
        phone: "",
        price: "",
        imageUrl: "",
        plannedDateTime: plannedDateTime
          ? new Date(plannedDateTime).toISOString()
          : null,
        destination: {
          cityName: destCityName,
          country: destCountry,
          countryCode: form.countryCode || "",
          latitude: form.lat ? Number(form.lat) : null,
          longitude: form.lon ? Number(form.lon) : null,
        },
        rawData: {
          ...activity,
          searchDestination: destCityName,
          searchCountry: destCountry,
          searchCountryCode: form.countryCode || "",
          searchLat: form.lat,
          searchLon: form.lon,
        },
      });

      setSuccess(`${name} added to the travel plan.`);
    } catch (err) {
      console.error(err);
      setError("Activity could not be added to the travel plan.");
    } finally {
      setSavingActivityId(null);
    }
  };

  return (
    <>
      <TravelPlanSelector
        selectedTravelId={selectedTravelId}
        onTravelSelected={setSelectedTravelId}
      />

      <form onSubmit={handleSubmit}>
        <h4 className="mb-3 text-center">Search Activities</h4>

        <CityAutocompleteInput
          name="destination"
          label="Destination"
          icon="bi-map"
          value={form.destination}
          required
          onCityChange={({ value, cityName, country, countryCode, lat, lon }) => {
            setForm((prev) => ({
              ...prev,
              destination: value,
              cityName,
              country,
              countryCode,
              lat,
              lon,
            }));
          }}
        />

        <div className="form-floating input-icon mb-3">
          <i className="bi bi-stars"></i>

          <select
            className="form-select"
            name="activityType"
            value={form.activityType || ""}
            onChange={handleChange}
          >
            <option value="">All</option>
            <option value="culture">Culture</option>
            <option value="nature">Nature</option>
            <option value="museums">Museums</option>
            <option value="tours">Tours</option>
          </select>

          <label>Activity Type</label>
        </div>

        <button
          type="submit"
          className="btn btn-primary w-100"
          disabled={loading}
        >
          {loading ? "Searching..." : "Search Activities"}
        </button>
      </form>

      {error && <div className="alert alert-danger mt-3">{error}</div>}
      {success && <div className="alert alert-success mt-3">{success}</div>}

      {results.length > 0 && (
        <div className="mt-4 text-center">
          <h4 className="mb-4">Results ({results.length})</h4>

          <div className="row g-4">
            {results.map((activity, index) => {
              const props = activity.properties;
              const coords = activity.geometry?.coordinates;

              const activityId = getActivityId(activity, index);
              const name = props?.name || "Unnamed activity";
              const category =
                props?.inferredType || props?.categories?.[0];
              const address = props?.formatted;
              const lon = coords?.[0];
              const lat = coords?.[1];

              return (
                <div className="col-12 col-md-6" key={activityId}>
                  <div className="card bg-dark text-light border-secondary h-100 shadow-sm">
                    <div className="card-body">
                      <h5 className="card-title text-primary mb-3">{name}</h5>

                      {category && (
                        <p className="mb-2">
                          <strong>Category:</strong> {category}
                        </p>
                      )}

                      {address && (
                        <p className="mb-2">
                          <strong>Address:</strong> {address}
                        </p>
                      )}

                      {lat && lon && (
                        <p className="mb-2">
                          <strong>Coordinates:</strong> {lat}, {lon}
                        </p>
                      )}

                      <div className="mt-3">
                        <label className="form-label small mb-1">
                          Planned date and time
                        </label>

                        <input
                          type="datetime-local"
                          className="form-control form-control-sm"
                          value={plannedDateTimeByActivityId[activityId] || ""}
                          onChange={(e) =>
                            setPlannedDateTimeByActivityId((prev) => ({
                              ...prev,
                              [activityId]: e.target.value,
                            }))
                          }
                        />
                      </div>

                      <button
                        type="button"
                        className="btn btn-success btn-sm mt-3"
                        disabled={
                          !selectedTravelId || savingActivityId === activityId
                        }
                        onClick={() => handleAddActivityToTravel(activity, index)}
                      >
                        {savingActivityId === activityId
                          ? "Adding..."
                          : "Add to travel"}
                      </button>
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