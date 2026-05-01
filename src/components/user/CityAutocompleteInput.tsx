import { useEffect, useRef, useState } from "react";
import { loadCities, searchCities } from "../../services/locationService";

type CitySuggestion = {
  name: string;
  country: string;
  lat: string;
  lon: string;
};

type Props = {
  name: string;
  label: string;
  icon?: string;
  value: string;
  required?: boolean;
  onCityChange: (data: {
    name: string;
    value: string;
    lat: string;
    lon: string;
  }) => void;
};

export default function CityAutocompleteInput({
  name,
  label,
  icon = "bi-geo-alt",
  value,
  required = false,
  onCityChange,
}: Props) {
  const [suggestions, setSuggestions] = useState<CitySuggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadCities();
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        wrapperRef.current &&
        !wrapperRef.current.contains(event.target as Node)
      ) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);

    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (value.trim().length < 2) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    const timer = setTimeout(async () => {
      const results = await searchCities(value);
      setSuggestions(results);
      setShowSuggestions(results.length > 0);
    }, 300);

    return () => clearTimeout(timer);
  }, [value]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onCityChange({
      name,
      value: e.target.value,
      lat: "",
      lon: "",
    });
  };

  const handleSelectCity = (city: CitySuggestion) => {
    onCityChange({
      name,
      value: `${city.name}, ${city.country}`,
      lat: city.lat,
      lon: city.lon,
    });

    setShowSuggestions(false);
  };

  return (
    <div ref={wrapperRef} className="position-relative mb-3">
      <div className="form-floating input-icon">
        <i className={`bi ${icon}`}></i>

        <input
          type="text"
          className="form-control"
          name={name}
          placeholder={label}
          value={value}
          onChange={handleInputChange}
          onFocus={() => {
            if (suggestions.length > 0) {
              setShowSuggestions(true);
            }
          }}
          autoComplete="off"
          required={required}
        />

        <label>{label}</label>
      </div>

      {showSuggestions && suggestions.length > 0 && (
        <div className="suggestions-dropdown">
          {suggestions.map((city, index) => (
            <div
              key={`${city.name}-${city.country}-${index}`}
              className="suggestion-item"
              onClick={() => handleSelectCity(city)}
            >
              {city.name}, {city.country}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}