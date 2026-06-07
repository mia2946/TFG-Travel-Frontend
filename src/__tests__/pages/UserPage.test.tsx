import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import UserPage from '../../Pages/AppUser/UserPage'
import { mockUser, mockTravelPlan } from '../mocks/mockData'

// Mock all services to prevent network calls
vi.mock('../../services/authService', () => ({
  getSession: vi.fn(),
  saveSession: vi.fn(),
  logout: vi.fn(),
}))

vi.mock('../../services/userService', () => ({
  loadUsers: vi.fn(),
  login: vi.fn(),
}))

vi.mock('../../services/travelService', () => ({
  getTravelPlans: vi.fn(),
  createTravelPlan: vi.fn(),
  addAccommodationToTravel: vi.fn(),
  addActivityToTravel: vi.fn(),
  addPoiToTravel: vi.fn(),
  deleteAccommodationFromTravel: vi.fn(),
  deleteActivityFromTravel: vi.fn(),
  deletePoiFromTravel: vi.fn(),
  deleteFlightFromTravel: vi.fn(),
  deleteTransportFromTravel: vi.fn(),
  deleteTravelPlan: vi.fn(),
}))

vi.mock('../../services/locationService', () => ({
  loadCities: vi.fn().mockResolvedValue([]),
  searchCities: vi.fn().mockResolvedValue([]),
  resolveCityCoordinates: vi.fn().mockResolvedValue({ lat: '0', lon: '0' }),
}))

vi.mock('../../services/flightService', () => ({
  searchFlights: vi.fn(),
  addFlightToTravel: vi.fn(),
}))

vi.mock('../../services/accommodationService', () => ({
  searchAccommodations: vi.fn().mockResolvedValue([]),
}))

vi.mock('../../services/activityService', () => ({
  searchActivities: vi.fn().mockResolvedValue([]),
}))

vi.mock('../../services/airportService', () => ({
  getAirportsByCoordinates: vi.fn().mockResolvedValue([]),
  getAirportCoordinates: vi.fn().mockResolvedValue(null),
  getRouteableAirportCoordinates: vi.fn().mockResolvedValue(null),
}))

vi.mock('../../services/poiService', () => ({
  searchPois: vi.fn().mockResolvedValue([]),
  filterPoiResults: vi.fn().mockReturnValue([]),
  isPlannablePoi: vi.fn().mockReturnValue(false),
  getPoiName: vi.fn().mockReturnValue(''),
  getPoiCategory: vi.fn().mockReturnValue(''),
  getPoiAddress: vi.fn().mockReturnValue(''),
  getPoiDescription: vi.fn().mockReturnValue(''),
  getPoiId: vi.fn().mockReturnValue(''),
  getPoiImageUrl: vi.fn().mockReturnValue(''),
  getPoiLatitude: vi.fn().mockReturnValue(0),
  getPoiLongitude: vi.fn().mockReturnValue(0),
  getPoiOpeningHours: vi.fn().mockReturnValue(''),
  getPoiPhone: vi.fn().mockReturnValue(''),
  getPoiPrice: vi.fn().mockReturnValue(''),
  getPoiWebsite: vi.fn().mockReturnValue(''),
}))

vi.mock('../../services/routeService', () => ({
  searchRoute: vi.fn(),
  saveRoute: vi.fn(),
  deleteRoute: vi.fn(),
  getRoute: vi.fn(),
}))

// Mock TravelRouteMap to avoid Leaflet
vi.mock('../../components/routes/TravelRouteMap', () => ({
  default: () => <div data-testid="travel-route-map" />,
}))

import { getSession } from '../../services/authService'
import { loadUsers } from '../../services/userService'
import { getTravelPlans } from '../../services/travelService'

function renderUserPage() {
  return render(
    <MemoryRouter>
      <UserPage />
    </MemoryRouter>
  )
}

describe('UserPage', () => {
  beforeEach(() => {
    vi.mocked(getSession).mockReturnValue(mockUser as any)
    vi.mocked(loadUsers).mockResolvedValue([mockUser] as any)
    vi.mocked(getTravelPlans).mockResolvedValue([mockTravelPlan])
  })

  it('renders the page without crashing', async () => {
    renderUserPage()
    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /Search Flights/i })).toBeInTheDocument()
    })
  })

  it('shows Flights tab active by default', async () => {
    renderUserPage()
    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /Search Flights/i })).toBeInTheDocument()
    })
    const flightsTab = screen.getByRole('button', { name: /^Flights$/i })
    expect(flightsTab).toHaveClass('active')
  })

  it('renders all navigation tabs', async () => {
    renderUserPage()
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /^Flights$/i })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /^Accommodations$/i })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /^Activities$/i })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /^Transport$/i })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /^Routes$/i })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /^Points of Interest$/i })).toBeInTheDocument()
    })
  })

  it('renders My Travels button', async () => {
    renderUserPage()
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /My Travels/i })).toBeInTheDocument()
    })
  })

  it('switches to Accommodations tab when clicked', async () => {
    const user = userEvent.setup()
    renderUserPage()

    await waitFor(() =>
      expect(screen.getByRole('button', { name: /^Accommodations$/i })).toBeInTheDocument()
    )

    await user.click(screen.getByRole('button', { name: /^Accommodations$/i }))

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /Search Accommodations/i })).toBeInTheDocument()
    })
  })

  it('switches to Activities tab when clicked', async () => {
    const user = userEvent.setup()
    renderUserPage()

    await waitFor(() =>
      expect(screen.getByRole('button', { name: /Activities/i })).toBeInTheDocument()
    )

    await user.click(screen.getByRole('button', { name: /Activities/i }))

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /Search Activities/i })).toBeInTheDocument()
    })
  })

  it('switches to Routes tab when clicked', async () => {
    const user = userEvent.setup()
    renderUserPage()

    await waitFor(() =>
      expect(screen.getByRole('button', { name: /Routes/i })).toBeInTheDocument()
    )

    await user.click(screen.getByRole('button', { name: /Routes/i }))

    await waitFor(() => {
      expect(screen.getByText('Travel Plan')).toBeInTheDocument()
    })
  })

  it('switches to Points of Interest tab when clicked', async () => {
    const user = userEvent.setup()
    renderUserPage()

    await waitFor(() =>
      expect(screen.getByRole('button', { name: /Points of Interest/i })).toBeInTheDocument()
    )

    await user.click(screen.getByRole('button', { name: /Points of Interest/i }))

    await waitFor(() => {
      expect(screen.getByText('Search Points of Interest')).toBeInTheDocument()
    })
  })

  it('shows My Travels view when "My Travels" button is clicked', async () => {
    const user = userEvent.setup()
    renderUserPage()

    await waitFor(() =>
      expect(screen.getByRole('button', { name: /My Travels/i })).toBeInTheDocument()
    )

    await user.click(screen.getByRole('button', { name: /My Travels/i }))

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Back to Search/i })).toBeInTheDocument()
    })
  })

  it('returns to search view when "Back to Search" is clicked', async () => {
    const user = userEvent.setup()
    renderUserPage()

    await waitFor(() =>
      expect(screen.getByRole('button', { name: /My Travels/i })).toBeInTheDocument()
    )

    await user.click(screen.getByRole('button', { name: /My Travels/i }))

    await waitFor(() =>
      expect(screen.getByRole('button', { name: /Back to Search/i })).toBeInTheDocument()
    )

    await user.click(screen.getByRole('button', { name: /Back to Search/i }))

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /Search Flights/i })).toBeInTheDocument()
    })
  })

  it('selected tab remains active after switching', async () => {
    const user = userEvent.setup()
    renderUserPage()

    await waitFor(() =>
      expect(screen.getByRole('button', { name: /^Accommodations$/i })).toBeInTheDocument()
    )

    await user.click(screen.getByRole('button', { name: /^Accommodations$/i }))

    await waitFor(() => {
      const accomTab = screen.getByRole('button', { name: /^Accommodations$/i })
      expect(accomTab).toHaveClass('active')
    })
  })
})
