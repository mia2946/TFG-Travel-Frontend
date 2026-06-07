import '@testing-library/jest-dom/vitest'
import { afterEach, vi } from 'vitest'

// Mock leaflet to avoid canvas/SVG errors in jsdom
vi.mock('leaflet', () => ({
  default: {
    map: vi.fn(() => ({
      setView: vi.fn().mockReturnThis(),
      remove: vi.fn(),
      on: vi.fn(),
    })),
    tileLayer: vi.fn(() => ({ addTo: vi.fn() })),
    polyline: vi.fn(() => ({ addTo: vi.fn(), getBounds: vi.fn(() => ({})) })),
    marker: vi.fn(() => ({
      addTo: vi.fn().mockReturnThis(),
      bindPopup: vi.fn().mockReturnThis(),
    })),
    icon: vi.fn(() => ({})),
    latLngBounds: vi.fn(() => ({ isValid: vi.fn(() => true) })),
  },
  map: vi.fn(),
  tileLayer: vi.fn(),
  polyline: vi.fn(),
  marker: vi.fn(),
  icon: vi.fn(),
}))

// Mock react-leaflet without JSX to keep this a plain .ts file
vi.mock('react-leaflet', () => ({
  MapContainer: () => null,
  TileLayer: () => null,
  Polyline: () => null,
  Marker: () => null,
  Popup: () => null,
  useMap: vi.fn(() => ({
    fitBounds: vi.fn(),
    setView: vi.fn(),
  })),
}))

afterEach(() => {
  vi.clearAllMocks()
  localStorage.clear()
})
