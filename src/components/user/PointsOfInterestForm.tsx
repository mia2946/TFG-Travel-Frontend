import { useState } from "react";
import CityAutocompleteInput from "./CityAutocompleteInput";
import TravelPlanSelector from "./TravelPlanSelector";
import { resolveCityCoordinates } from "../../services/locationService";
import { addPoiToTravel } from "../../services/travelService";
import type { PoiSearchRequest } from "../../types/search";

import {
  filterPoiResults,
  getPoiAddress,
  getPoiCategory,
  getPoiDescription,
  getPoiId,
  getPoiImageUrl,
  getPoiLatitude,
  getPoiLongitude,
  getPoiName,
  getPoiOpeningHours,
  getPoiPhone,
  getPoiPrice,
  getPoiWebsite,
  isPlannablePoi,
  searchPois,
  type PoiLike,
} from "../../services/poiService";

export default function PointsOfInterestForm() {
  const [form, setForm] = useState<PoiSearchRequest>({
    destination: "",
    lat: "",
    lon: "",
    poiType: "",
    radius: 2000,
  });

  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<PoiLike[]>([]);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [selectedTravelId, setSelectedTravelId] = useState<number | "">("");
  const [savingPoiId, setSavingPoiId] = useState<string | number | null>(null);

  const [plannedDateTimeByPoiId, setPlannedDateTimeByPoiId] = useState<
    Record<string | number, string>
  >({});

  const plannablePois = results.filter(isPlannablePoi);
  const accessOnlyPois = results.filter((poi) => !isPlannablePoi(poi));

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]: name === "radius" ? Number(value) : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    setError("");
    setSuccess("");
    setResults([]);
    setLoading(true);

    try {
      const coords = await resolveCityCoordinates(
        form.destination,
        form.lat,
        form.lon
      );

      const data = await searchPois({
        ...form,
        ...coords,
      });

      setResults(filterPoiResults(data, form.poiType));
    } catch (err) {
      console.error(err);
      setError("Points of interest could not be retrieved.");
    } finally {
      setLoading(false);
    }
  };

  const handleAddPoiToTravel = async (poi: PoiLike, index: number) => {
    if (!selectedTravelId) {
      setError("Please select a travel plan first.");
      return;
    }

    const poiId = getPoiId(poi, index);
    const plannedDateTime = plannedDateTimeByPoiId[poiId];

    try {
      setError("");
      setSuccess("");
      setSavingPoiId(poiId);

      await addPoiToTravel(Number(selectedTravelId), {
        idPoi: null,
        externalId: String(poi.id || poiId),
        source: "OSM",
        name: getPoiName(poi),
        category: getPoiCategory(poi),
        type: getPoiCategory(poi),
        latitude: getPoiLatitude(poi),
        longitude: getPoiLongitude(poi),
        address: getPoiAddress(poi) || "",
        description: getPoiDescription(poi) || "",
        bookingLink: getPoiWebsite(poi) || "",
        phone: getPoiPhone(poi) || "",
        price: getPoiPrice(poi) || "",
        imageUrl: getPoiImageUrl(poi) || "",
        plannedDateTime: plannedDateTime
          ? new Date(plannedDateTime).toISOString()
          : null,
        rawData: {
          ...poi,
          searchDestination: form.destination,
          searchCountry: "Spain",
        },
      });
      setSuccess(`${getPoiName(poi)} added to the travel plan.`);
    } catch (err) {
      console.error(err);
      setError("POI could not be added to the travel plan.");
    } finally {
      setSavingPoiId(null);
    }
  };

  const renderPoiCard = (poi: PoiLike, index: number, plannable: boolean) => {
    const poiId = getPoiId(poi, index);

    const name = getPoiName(poi);
    const imageUrl = getPoiImageUrl(poi);
    const category = getPoiCategory(poi);
    const description = getPoiDescription(poi);
    const address = getPoiAddress(poi);
    const openingHours = getPoiOpeningHours(poi);
    const website = getPoiWebsite(poi);
    const phone = getPoiPhone(poi);
    const price = getPoiPrice(poi);

    return (
      <div
        className="col-12 col-md-6"
        key={`${poi.type || "poi"}-${poiId}-${index}`}
      >
        <div className="card bg-dark text-light border-secondary h-100">
          {imageUrl && (
            <img
              src={imageUrl}
              alt={name}
              className="card-img-top"
              style={{ height: "180px", objectFit: "cover" }}
              onError={(e) => {
                e.currentTarget.style.display = "none";
              }}
            />
          )}

          <div className="card-body">
            <h6 className="card-title text-primary">{name}</h6>

            {category && (
              <p className="mb-1">
                <strong>Category:</strong> {category}
              </p>
            )}

            {description && (
              <p className="mb-1">
                <strong>Description:</strong> {description}
              </p>
            )}

            {address && (
              <p className="mb-1">
                <strong>Address:</strong> {address}
              </p>
            )}

            {openingHours && (
              <p className="mb-1">
                <strong>Opening hours:</strong> {openingHours}
              </p>
            )}

            {price && (
              <p className="mb-1">
                <strong>Price:</strong> {price}
              </p>
            )}

            {phone && (
              <p className="mb-1">
                <strong>Phone:</strong> {phone}
              </p>
            )}

            {website && (
              <a
                href={website}
                target="_blank"
                rel="noreferrer"
                className="btn btn-outline-primary btn-sm mt-2"
              >
                Website
              </a>
            )}

            {plannable && (
              <>
                <div className="mt-2">
                  <label className="form-label small mb-1">
                    Planned date and time
                  </label>

                  <input
                    type="datetime-local"
                    className="form-control form-control-sm"
                    value={plannedDateTimeByPoiId[poiId] || ""}
                    onChange={(e) =>
                      setPlannedDateTimeByPoiId((prev) => ({
                        ...prev,
                        [poiId]: e.target.value,
                      }))
                    }
                  />
                </div>

                <button
                  type="button"
                  className="btn btn-success btn-sm mt-2"
                  disabled={!selectedTravelId || savingPoiId === poiId}
                  onClick={() => handleAddPoiToTravel(poi, index)}
                >
                  {savingPoiId === poiId ? "Adding..." : "Add to travel"}
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <>
      <TravelPlanSelector
        selectedTravelId={selectedTravelId}
        onTravelSelected={setSelectedTravelId}
      />

      <form onSubmit={handleSubmit}>
        <h4 className="mb-3 text-center">Search Points of Interest</h4>

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
              lat,
              lon,
            }));
          }}
        />

        <div className="form-floating input-icon mb-3">
          <i className="bi bi-pin-map"></i>

          <select
            className="form-select"
            name="poiType"
            value={form.poiType || ""}
            onChange={handleChange}
          >
            <option value="">All POIs</option>

            <optgroup label="Plannable - can be saved">
              <option value="restaurant">Restaurant</option>
              <option value="cafe">Cafe</option>
              <option value="bar">Bar</option>
              <option value="pub">Pub</option>
              <option value="fast_food">Fast Food</option>
              <option value="food_court">Food Court</option>
              <option value="bakery">Bakery</option>
              <option value="luggage">Luggage lockers</option>
            </optgroup>

            <optgroup label="Access only - not saved">
              <option value="hospital">Hospital</option>
              <option value="pharmacy">Pharmacy</option>
              <option value="police">Police</option>
              <option value="atm">ATM</option>
              <option value="toilets">Toilets</option>
              <option value="embassy">Embassy</option>
            </optgroup>
          </select>

          <label>POI Type</label>
        </div>

        <div className="form-floating input-icon mb-3">
          <i className="bi bi-bullseye"></i>

          <input
            type="number"
            className="form-control"
            name="radius"
            value={form.radius}
            onChange={handleChange}
            min="100"
            step="100"
          />

          <label>Radius meters</label>
        </div>

        <button
          type="submit"
          className="btn btn-primary w-100"
          disabled={loading}
        >
          {loading ? "Searching..." : "Search POIs"}
        </button>
      </form>

      {error && <div className="alert alert-danger mt-3">{error}</div>}
      {success && <div className="alert alert-success mt-3">{success}</div>}

      {results.length > 0 && (
        <div className="mt-4">
          <h5 className="mb-3">Results ({results.length})</h5>

          {plannablePois.length > 0 && (
            <section className="mb-4">
              <h6 className="text-success mb-1">
                Plannable POIs ({plannablePois.length})
              </h6>

              <p className="text-secondary small mb-3">
                Restaurants, cafes, bars, bakeries and luggage lockers.
              </p>

              <div className="row g-3">
                {plannablePois.map((poi, index) =>
                  renderPoiCard(poi, index, true)
                )}
              </div>
            </section>
          )}

          {accessOnlyPois.length > 0 && (
            <section>
              <h6 className="text-warning mb-1">
                Access-only POIs ({accessOnlyPois.length})
              </h6>

              <p className="text-secondary small mb-3">
                Hospitals, embassies, ATMs, pharmacies, police stations and
                toilets.
              </p>

              <div className="row g-3">
                {accessOnlyPois.map((poi, index) =>
                  renderPoiCard(poi, index, false)
                )}
              </div>
            </section>
          )}
        </div>
      )}
    </>
  );
}