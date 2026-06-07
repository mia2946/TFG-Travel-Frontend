import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import RoutesForm from '../../components/user/RoutesForm'
import {
  mockTravelPlan,
  mockEmptyTravelPlan,
  mockAirportMAD,
  mockAirportCDG,
  mockRouteSearchResponse,
  mockUser,
} from '../mocks/mockData'

// Mock TravelRouteMap to avoid Leaflet DOM issues
vi.mock('../../components/routes/TravelRouteMap', () => ({
  default: ({
    origin,
    destination,
    route,
  }: {
    origin: { label: string }
    destination: { label: string }
    route: { distanceMeters: number; steps: { instruction: string }[] }
  }) => (
    <div data-testid="travel-route-map">
      <span data-testid="map-origin">{origin.label}</span>
      <span data-testid="map-destination">{destination.label}</span>
      <span data-testid="map-distance">{route.distanceMeters}</span>
    </div>
  ),
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
}))

vi.mock('../../services/airportService', () => ({
  getAirportCoordinates: vi.fn(),
  getRouteableAirportCoordinates: vi.fn(),
  getAirportsByCoordinates: vi.fn(),
}))

vi.mock('../../services/routeService', () => ({
  searchRoute: vi.fn(),
  saveRoute: vi.fn(),
  deleteRoute: vi.fn(),
  getRoute: vi.fn(),
}))

vi.mock('../../services/authService', () => ({
  getSession: vi.fn(),
  saveSession: vi.fn(),
  logout: vi.fn(),
}))

import { getTravelPlans, createTravelPlan } from '../../services/travelService'
import { getAirportCoordinates, getRouteableAirportCoordinates } from '../../services/airportService'
import { searchRoute, saveRoute } from '../../services/routeService'
import { getSession } from '../../services/authService'

describe('RoutesForm', () => {
  beforeEach(() => {
    vi.mocked(getSession).mockReturnValue(mockUser as any)
    vi.mocked(getTravelPlans).mockResolvedValue([mockTravelPlan])
    vi.mocked(getAirportCoordinates).mockImplementation(async (iata: string) => {
      if (iata === 'MAD') return mockAirportMAD
      if (iata === 'CDG') return mockAirportCDG
      return null
    })
    vi.mocked(getRouteableAirportCoordinates).mockResolvedValue(null)
    vi.mocked(searchRoute).mockResolvedValue({
      route: mockRouteSearchResponse,
      rawData: { features: [] },
    })
    vi.mocked(saveRoute).mockResolvedValue({ id: 1 } as any)
    vi.mocked(createTravelPlan).mockResolvedValue({
      id: 99,
      userId: 42,
      name: 'New Route Plan',
      startDate: '2026-06-12',
      endDate: '2026-06-15',
      createdAt: new Date().toISOString(),
    })
  })

  it('renders Travel Plan heading', async () => {
    render(<RoutesForm />)
    await waitFor(() => {
      expect(screen.getByText('Travel Plan')).toBeInTheDocument()
    })
  })

  it('renders plan creation input', async () => {
    render(<RoutesForm />)
    await waitFor(() => {
      expect(screen.getByPlaceholderText('New travel plan name')).toBeInTheDocument()
    })
  })

  it('renders Create button', async () => {
    render(<RoutesForm />)
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Create/i })).toBeInTheDocument()
    })
  })

  it('loads and displays travel plans in dropdown', async () => {
    render(<RoutesForm />)
    await waitFor(() => {
      expect(screen.getByRole('option', { name: 'Summer Trip' })).toBeInTheDocument()
    })
  })

  it('shows informational alert when no travel plan is selected', async () => {
    render(<RoutesForm />)
    await waitFor(() => {
      expect(screen.getByText(/How routes work/i)).toBeInTheDocument()
    })
  })

  it('shows route search section when a travel plan is selected', async () => {
    const user = userEvent.setup()
    render(<RoutesForm />)

    await waitFor(() =>
      expect(screen.getByRole('option', { name: 'Summer Trip' })).toBeInTheDocument()
    )

    // Select the Summer Trip plan (id=1)
    await user.selectOptions(
      screen.getAllByRole('combobox')[0],
      '1'
    )

    await waitFor(() => {
      expect(screen.getByText('Search Route')).toBeInTheDocument()
    })
  })

  it('shows warning when travel plan has no locations with valid coordinates', async () => {
    vi.mocked(getTravelPlans).mockResolvedValue([mockEmptyTravelPlan])
    vi.mocked(getAirportCoordinates).mockResolvedValue(null)
    const user = userEvent.setup()
    render(<RoutesForm />)

    await waitFor(() =>
      expect(screen.getByRole('option', { name: 'Empty Trip' })).toBeInTheDocument()
    )

    await user.selectOptions(screen.getAllByRole('combobox')[0], '2')

    await waitFor(() => {
      expect(
        screen.getByText(/This travel plan has no saved locations with valid coordinates/i)
      ).toBeInTheDocument()
    })
  })

  it('origin combobox contains airport option from saved flights', async () => {
    const user = userEvent.setup()
    render(<RoutesForm />)

    await waitFor(() =>
      expect(screen.getByRole('option', { name: 'Summer Trip' })).toBeInTheDocument()
    )

    await user.selectOptions(screen.getAllByRole('combobox')[0], '1')

    await waitFor(() => {
      expect(screen.getAllByRole('option', { name: /Barajas/i }).length).toBeGreaterThan(0)
    })
  })

  it('origin combobox contains airport CDG from saved flights', async () => {
    const user = userEvent.setup()
    render(<RoutesForm />)

    await waitFor(() =>
      expect(screen.getByRole('option', { name: 'Summer Trip' })).toBeInTheDocument()
    )

    await user.selectOptions(screen.getAllByRole('combobox')[0], '1')

    await waitFor(() => {
      expect(screen.getAllByRole('option', { name: /Charles de Gaulle/i }).length).toBeGreaterThan(0)
    })
  })

  it('origin combobox contains accommodation from saved travel', async () => {
    const user = userEvent.setup()
    render(<RoutesForm />)

    await waitFor(() =>
      expect(screen.getByRole('option', { name: 'Summer Trip' })).toBeInTheDocument()
    )

    await user.selectOptions(screen.getAllByRole('combobox')[0], '1')

    await waitFor(() => {
      expect(screen.getAllByRole('option', { name: /Hotel Paris/i }).length).toBeGreaterThan(0)
    })
  })

  it('origin combobox contains activity from saved travel', async () => {
    const user = userEvent.setup()
    render(<RoutesForm />)

    await waitFor(() =>
      expect(screen.getByRole('option', { name: 'Summer Trip' })).toBeInTheDocument()
    )

    await user.selectOptions(screen.getAllByRole('combobox')[0], '1')

    await waitFor(() => {
      expect(screen.getAllByRole('option', { name: /Eiffel Tower Tour/i }).length).toBeGreaterThan(0)
    })
  })

  it('origin combobox contains POI from saved travel', async () => {
    const user = userEvent.setup()
    render(<RoutesForm />)

    await waitFor(() =>
      expect(screen.getByRole('option', { name: 'Summer Trip' })).toBeInTheDocument()
    )

    await user.selectOptions(screen.getAllByRole('combobox')[0], '1')

    await waitFor(() => {
      expect(screen.getAllByRole('option', { name: /Le Café de Flore/i }).length).toBeGreaterThan(0)
    })
  })

  it('options are grouped hierarchically by type (Airports, Accommodations, Activities, Points of Interest)', async () => {
    const user = userEvent.setup()
    render(<RoutesForm />)

    await waitFor(() =>
      expect(screen.getByRole('option', { name: 'Summer Trip' })).toBeInTheDocument()
    )

    await user.selectOptions(screen.getAllByRole('combobox')[0], '1')

    await waitFor(() => {
      const groups = document.querySelectorAll('optgroup')
      const groupLabels = Array.from(groups).map((g) => g.getAttribute('label'))
      expect(groupLabels).toContain('Airports')
      expect(groupLabels).toContain('Accommodations')
      expect(groupLabels).toContain('Activities')
      expect(groupLabels).toContain('Points of Interest')
    })
  })

  it('Search button is disabled when origin or destination is not selected', async () => {
    const user = userEvent.setup()
    render(<RoutesForm />)

    await waitFor(() =>
      expect(screen.getByRole('option', { name: 'Summer Trip' })).toBeInTheDocument()
    )

    await user.selectOptions(screen.getAllByRole('combobox')[0], '1')

    await waitFor(() => {
      expect(screen.getByText('Search Route')).toBeInTheDocument()
    })

    const searchButton = screen.getByRole('button', { name: /Search/i })
    expect(searchButton).toBeDisabled()
  })

  it('searching route shows route summary with distance and duration', async () => {
    const user = userEvent.setup()
    render(<RoutesForm />)

    await waitFor(() =>
      expect(screen.getByRole('option', { name: 'Summer Trip' })).toBeInTheDocument()
    )

    await user.selectOptions(screen.getAllByRole('combobox')[0], '1')

    await waitFor(() => {
      expect(screen.getAllByRole('option', { name: /Hotel Paris/i }).length).toBeGreaterThan(0)
    })

    const originSelect = document.getElementById('origin-select')! as HTMLSelectElement
    const destSelect = document.getElementById('destination-select')! as HTMLSelectElement

    await user.selectOptions(originSelect, 'ACCOMMODATION-20')
    await user.selectOptions(destSelect, 'ACTIVITY-30')

    await user.click(screen.getByRole('button', { name: /Search/i }))

    await waitFor(() => {
      expect(screen.getByText('Route Summary')).toBeInTheDocument()
    })
  })

  it('route summary shows distance', async () => {
    const user = userEvent.setup()
    render(<RoutesForm />)

    await waitFor(() =>
      expect(screen.getByRole('option', { name: 'Summer Trip' })).toBeInTheDocument()
    )

    await user.selectOptions(screen.getAllByRole('combobox')[0], '1')

    await waitFor(() => {
      expect(screen.getAllByRole('option', { name: /Hotel Paris/i }).length).toBeGreaterThan(0)
    })

    await user.selectOptions(document.getElementById('origin-select')! as HTMLSelectElement, 'ACCOMMODATION-20')
    await user.selectOptions(document.getElementById('destination-select')! as HTMLSelectElement, 'ACTIVITY-30')
    await user.click(screen.getByRole('button', { name: /Search/i }))

    await waitFor(() => {
      expect(screen.getByText(/5\.20 km/i)).toBeInTheDocument()
    })
  })

  it('route summary shows duration', async () => {
    const user = userEvent.setup()
    render(<RoutesForm />)

    await waitFor(() =>
      expect(screen.getByRole('option', { name: 'Summer Trip' })).toBeInTheDocument()
    )

    await user.selectOptions(screen.getAllByRole('combobox')[0], '1')

    await waitFor(() => {
      expect(screen.getAllByRole('option', { name: /Hotel Paris/i }).length).toBeGreaterThan(0)
    })

    await user.selectOptions(document.getElementById('origin-select')! as HTMLSelectElement, 'ACCOMMODATION-20')
    await user.selectOptions(document.getElementById('destination-select')! as HTMLSelectElement, 'ACTIVITY-30')
    await user.click(screen.getByRole('button', { name: /Search/i }))

    await waitFor(() => {
      expect(screen.getByText(/30 min/i)).toBeInTheDocument()
    })
  })

  it('route steps are rendered in the correct order', async () => {
    const user = userEvent.setup()
    render(<RoutesForm />)

    await waitFor(() =>
      expect(screen.getByRole('option', { name: 'Summer Trip' })).toBeInTheDocument()
    )

    await user.selectOptions(screen.getAllByRole('combobox')[0], '1')

    await waitFor(() => {
      expect(screen.getAllByRole('option', { name: /Hotel Paris/i }).length).toBeGreaterThan(0)
    })

    await user.selectOptions(document.getElementById('origin-select')! as HTMLSelectElement, 'ACCOMMODATION-20')
    await user.selectOptions(document.getElementById('destination-select')! as HTMLSelectElement, 'ACTIVITY-30')
    await user.click(screen.getByRole('button', { name: /Search/i }))

    await waitFor(() => {
      const steps = screen.getAllByRole('listitem')
      expect(steps[0]).toHaveTextContent('Head north on Rue de Rivoli')
      expect(steps[1]).toHaveTextContent('Turn left on Avenue des Champs-Élysées')
    })
  })

  it('route map receives correct origin and destination labels', async () => {
    const user = userEvent.setup()
    render(<RoutesForm />)

    await waitFor(() =>
      expect(screen.getByRole('option', { name: 'Summer Trip' })).toBeInTheDocument()
    )

    await user.selectOptions(screen.getAllByRole('combobox')[0], '1')

    await waitFor(() => {
      expect(screen.getAllByRole('option', { name: /Hotel Paris/i }).length).toBeGreaterThan(0)
    })

    await user.selectOptions(document.getElementById('origin-select')! as HTMLSelectElement, 'ACCOMMODATION-20')
    await user.selectOptions(document.getElementById('destination-select')! as HTMLSelectElement, 'ACTIVITY-30')
    await user.click(screen.getByRole('button', { name: /Search/i }))

    await waitFor(() => {
      expect(screen.getByTestId('map-origin')).toHaveTextContent('Hotel Paris')
      expect(screen.getByTestId('map-destination')).toHaveTextContent('Eiffel Tower Tour')
    })
  })

  it('can save the generated route to the travel plan', async () => {
    const user = userEvent.setup()
    render(<RoutesForm />)

    await waitFor(() =>
      expect(screen.getByRole('option', { name: 'Summer Trip' })).toBeInTheDocument()
    )

    await user.selectOptions(screen.getAllByRole('combobox')[0], '1')

    await waitFor(() => {
      expect(screen.getAllByRole('option', { name: /Hotel Paris/i }).length).toBeGreaterThan(0)
    })

    await user.selectOptions(document.getElementById('origin-select')! as HTMLSelectElement, 'ACCOMMODATION-20')
    await user.selectOptions(document.getElementById('destination-select')! as HTMLSelectElement, 'ACTIVITY-30')
    await user.click(screen.getByRole('button', { name: /Search/i }))

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Save Route/i })).toBeInTheDocument()
    })

    await user.click(screen.getByRole('button', { name: /Save Route/i }))

    await waitFor(() => {
      expect(saveRoute).toHaveBeenCalledWith(
        1,
        expect.objectContaining({
          apiProvider: 'geoapify',
          totalDistanceMeters: 5200,
          totalTimeSeconds: 1800,
          originName: 'Hotel Paris',
          destinationName: 'Eiffel Tower Tour',
        })
      )
    })
  })

  it('shows success message after saving route', async () => {
    const user = userEvent.setup()
    render(<RoutesForm />)

    await waitFor(() =>
      expect(screen.getByRole('option', { name: 'Summer Trip' })).toBeInTheDocument()
    )

    await user.selectOptions(screen.getAllByRole('combobox')[0], '1')

    await waitFor(() => {
      expect(screen.getAllByRole('option', { name: /Hotel Paris/i }).length).toBeGreaterThan(0)
    })

    await user.selectOptions(document.getElementById('origin-select')! as HTMLSelectElement, 'ACCOMMODATION-20')
    await user.selectOptions(document.getElementById('destination-select')! as HTMLSelectElement, 'ACTIVITY-30')
    await user.click(screen.getByRole('button', { name: /Search/i }))

    await waitFor(() =>
      expect(screen.getByRole('button', { name: /Save Route/i })).toBeInTheDocument()
    )

    await user.click(screen.getByRole('button', { name: /Save Route/i }))

    await waitFor(() => {
      expect(screen.getByText(/Route saved to the travel plan/i)).toBeInTheDocument()
    })
  })

  it('shows error when origin and destination are the same', async () => {
    const user = userEvent.setup()
    render(<RoutesForm />)

    await waitFor(() =>
      expect(screen.getByRole('option', { name: 'Summer Trip' })).toBeInTheDocument()
    )

    await user.selectOptions(screen.getAllByRole('combobox')[0], '1')

    await waitFor(() => {
      expect(screen.getAllByRole('option', { name: /Hotel Paris/i }).length).toBeGreaterThan(0)
    })

    await user.selectOptions(document.getElementById('origin-select')! as HTMLSelectElement, 'ACCOMMODATION-20')
    await user.selectOptions(document.getElementById('destination-select')! as HTMLSelectElement, 'ACCOMMODATION-20')
    await user.click(screen.getByRole('button', { name: /Search/i }))

    await waitFor(() => {
      expect(screen.getByText(/Origin and destination must be different/i)).toBeInTheDocument()
    })
  })

  it('creates a new travel plan and selects it', async () => {
    const user = userEvent.setup()
    render(<RoutesForm />)

    await waitFor(() =>
      expect(screen.getByRole('option', { name: 'Summer Trip' })).toBeInTheDocument()
    )

    await user.type(screen.getByPlaceholderText('New travel plan name'), 'New Route Plan')
    await user.click(screen.getByRole('button', { name: /Create/i }))

    await waitFor(() => {
      expect(createTravelPlan).toHaveBeenCalledWith('New Route Plan')
    })

    await waitFor(() => {
      expect(screen.getByRole('option', { name: 'New Route Plan' })).toBeInTheDocument()
    })
  })

  it('calls getAirportCoordinates for each IATA from saved flights', async () => {
    const user = userEvent.setup()
    render(<RoutesForm />)

    await waitFor(() =>
      expect(screen.getByRole('option', { name: 'Summer Trip' })).toBeInTheDocument()
    )

    await user.selectOptions(screen.getAllByRole('combobox')[0], '1')

    await waitFor(() => {
      expect(getAirportCoordinates).toHaveBeenCalledWith('MAD')
      expect(getAirportCoordinates).toHaveBeenCalledWith('CDG')
    })
  })

  it('generates correct searchRoute request from selected origin/destination', async () => {
    const user = userEvent.setup()
    render(<RoutesForm />)

    await waitFor(() =>
      expect(screen.getByRole('option', { name: 'Summer Trip' })).toBeInTheDocument()
    )

    await user.selectOptions(screen.getAllByRole('combobox')[0], '1')

    await waitFor(() => {
      expect(screen.getAllByRole('option', { name: /Hotel Paris/i }).length).toBeGreaterThan(0)
    })

    await user.selectOptions(document.getElementById('origin-select')! as HTMLSelectElement, 'ACCOMMODATION-20')
    await user.selectOptions(document.getElementById('destination-select')! as HTMLSelectElement, 'ACTIVITY-30')
    await user.click(screen.getByRole('button', { name: /Search/i }))

    await waitFor(() => {
      expect(searchRoute).toHaveBeenCalledWith(
        expect.objectContaining({
          startLatitude: 48.8566,
          startLongitude: 2.3522,
          endLatitude: 48.8584,
          endLongitude: 2.2945,
        })
      )
    })
  })
})
