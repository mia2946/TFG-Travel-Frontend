import { Component, useEffect, type ReactNode } from "react";
import { MapContainer, Marker, Polyline, Popup, TileLayer, useMap } from "react-leaflet";
import type { RoutePoint, RouteSearchResponse } from "../../types/route";
import L from "leaflet";

class MapErrorBoundary extends Component<
  { children: ReactNode },
  { hasError: boolean }
> {
  state = { hasError: false };
  static getDerivedStateFromError() {
    return { hasError: true };
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="alert alert-danger mt-3">
          Could not load the map. Try searching again.
        </div>
      );
    }
    return this.props.children;
  }
}

function FitBounds({ positions }: { positions: [number, number][] }) {
  const map = useMap();
  useEffect(() => {
    if (positions.length < 2) return;
    const bounds = L.latLngBounds(positions);
    if (bounds.isValid()) {
      map.fitBounds(bounds, { padding: [50, 50] });
    }
  }, [map, positions]);
  return null;
}

type Props = {
  origin: RoutePoint;
  destination: RoutePoint;
  route: RouteSearchResponse;
};

const defaultIcon = new L.Icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
});

export default function TravelRouteMap({ origin, destination, route }: Props) {
  const polylinePositions: [number, number][] =
    route.geometry.coordinates.map(([lon, lat]) => [lat, lon]);

  const allPositions: [number, number][] = [
    [origin.latitude, origin.longitude],
    [destination.latitude, destination.longitude],
    ...polylinePositions,
  ];

  const center: [number, number] = [
    (origin.latitude + destination.latitude) / 2,
    (origin.longitude + destination.longitude) / 2,
  ];

  return (
    <MapErrorBoundary>
      <div style={{ height: "420px", width: "100%", marginTop: "1rem" }}>
        <MapContainer
          center={center}
          zoom={15}
          style={{ height: "100%", width: "100%", borderRadius: "12px" }}
        >
          <TileLayer
            attribution="© OpenStreetMap contributors"
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <FitBounds positions={allPositions} />
          <Marker
            position={[origin.latitude, origin.longitude]}
            icon={defaultIcon}
          >
            <Popup>
              <strong>Origin</strong>
              <br />
              {origin.label}
            </Popup>
          </Marker>
          <Marker
            position={[destination.latitude, destination.longitude]}
            icon={defaultIcon}
          >
            <Popup>
              <strong>Destination</strong>
              <br />
              {destination.label}
            </Popup>
          </Marker>
          <Polyline positions={polylinePositions} />
        </MapContainer>
      </div>
    </MapErrorBoundary>
  );
}
