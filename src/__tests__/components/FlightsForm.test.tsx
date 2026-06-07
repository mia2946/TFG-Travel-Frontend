import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import FlightsForm from '../../components/user/FlightsForm'
import {
  mockTravelPlan,
  mockFlightsApiResponse,
  mockAirportMAD,
  mockAirportCDG,
  mockCityParis,
  mockCityMadrid,
  mockUser,
} from '../mocks/mockData'

vi.mock('../../services/travelService', () => ({
  getTravelPlans: vi.fn(),
  createTravelPlan: vi.fn(),
  addAccommodationToTravel: vi.fn(),
  addActivityToTravel: vi.fn(),
  addPoiToTravel: vi.fn(),
  deleteFlightFromTravel: vi.fn(),
  deleteAccommodationFromTravel: vi.fn(),
  deleteActivityFromTravel: vi.fn(),
  deletePoiFromTravel: vi.fn(),
  deleteTransportFromTravel: vi.fn(),
}))

vi.mock('../../services/locationService', () => ({
  loadCities: vi.fn().mockResolvedValue([]),
  searchCities: vi.fn().mockResolvedValue([]),
  resolveCityCoordinates: vi.fn(),
}))

vi.mock('../../services/flightService', () => ({
  searchFlights: vi.fn(),
  addFlightToTravel: vi.fn(),
}))

vi.mock('../../services/airportService', () => ({
  getAirportsByCoordinates: vi.fn(),
  getAirportCoordinates: vi.fn(),
  getRouteableAirportCoordinates: vi.fn(),
}))

vi.mock('../../services/authService', () => ({
  getSession: vi.fn(),
  saveSession: vi.fn(),
  logout: vi.fn(),
}))

import { getTravelPlans } from '../../services/travelService'
import { searchFlights, addFlightToTravel } from '../../services/flightService'
import { getAirportsByCoordinates } from '../../services/airportService'
import { resolveCityCoordinates } from '../../services/locationService'
import { getSession } from '../../services/authService'

describe('FlightsForm', () => {
  beforeEach(() => {
    vi.mocked(getTravelPlans).mockResolvedValue([mockTravelPlan])
    vi.mocked(getSession).mockReturnValue(mockUser as any)
    vi.mocked(resolveCityCoordinates).mockImplementation(async (_dest, lat, lon) => ({
      lat: lat || '48.8566',
      lon: lon || '2.3522',
    }))
    vi.mocked(getAirportsByCoordinates).mockResolvedValueOnce([mockAirportMAD]).mockResolvedValueOnce([mockAirportCDG])
    vi.mocked(searchFlights).mockResolvedValue(mockFlightsApiResponse)
    vi.mocked(addFlightToTravel).mockResolvedValue({})
  })

  it('renders Search Flights heading', async () => {
    render(<FlightsForm />)
    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /Search Flights/i })).toBeInTheDocument()
    })
  })

  it('renders origin input as required', async () => {
    render(<FlightsForm />)
    await waitFor(() => {
      const originInput = screen.getByPlaceholderText('Origin')
      expect(originInput).toHaveAttribute('required')
    })
  })

  it('renders destination input as required', async () => {
    render(<FlightsForm />)
    await waitFor(() => {
      const destInput = screen.getByPlaceholderText('Destination')
      expect(destInput).toHaveAttribute('required')
    })
  })

  it('renders outbound date input as required', async () => {
    render(<FlightsForm />)
    await waitFor(() => {
      const dateInput = document.querySelector('input[name="outboundDate"]') as HTMLInputElement
      expect(dateInput).toHaveAttribute('required')
    })
  })

  it('renders Search Flights submit button', async () => {
    render(<FlightsForm />)
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Search Flights/i })).toBeInTheDocument()
    })
  })

  it('shows loading state while searching', async () => {
    let resolveSearch: (v: any) => void
    vi.mocked(searchFlights).mockReturnValue(
      new Promise((r) => { resolveSearch = r })
    )
    const user = userEvent.setup()
    render(<FlightsForm />)

    await waitFor(() =>
      expect(screen.getByRole('option', { name: 'Summer Trip' })).toBeInTheDocument()
    )

    fireEvent.change(document.querySelector('input[name="outboundDate"]')!, {
      target: { value: '2026-07-01' },
    })

    // Trigger submit via the form (bypass HTML5 validation by using fireEvent.submit)
    const form = document.querySelector('form')!
    fireEvent.submit(form)

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Searching.../i })).toBeInTheDocument()
    })

    resolveSearch!(mockFlightsApiResponse)
  })

  it('displays best flights results after successful search', async () => {
    render(<FlightsForm />)

    await waitFor(() =>
      expect(screen.getByRole('option', { name: 'Summer Trip' })).toBeInTheDocument()
    )

    fireEvent.change(document.querySelector('input[name="outboundDate"]')!, {
      target: { value: '2026-07-01' },
    })

    const form = document.querySelector('form')!
    fireEvent.submit(form)

    await waitFor(() => {
      expect(screen.getByText('Best Flights')).toBeInTheDocument()
      expect(screen.getByText('Iberia')).toBeInTheDocument()
    })
  })

  it('displays other flights results', async () => {
    render(<FlightsForm />)

    await waitFor(() =>
      expect(screen.getByRole('option', { name: 'Summer Trip' })).toBeInTheDocument()
    )

    fireEvent.change(document.querySelector('input[name="outboundDate"]')!, {
      target: { value: '2026-07-01' },
    })

    fireEvent.submit(document.querySelector('form')!)

    await waitFor(() => {
      expect(screen.getByText('Other Flights')).toBeInTheDocument()
      expect(screen.getByText('Air France')).toBeInTheDocument()
    })
  })

  it('shows total result count', async () => {
    render(<FlightsForm />)

    await waitFor(() =>
      expect(screen.getByRole('option', { name: 'Summer Trip' })).toBeInTheDocument()
    )

    fireEvent.change(document.querySelector('input[name="outboundDate"]')!, {
      target: { value: '2026-07-01' },
    })

    fireEvent.submit(document.querySelector('form')!)

    await waitFor(() => {
      expect(screen.getByText(/Results \(2\)/i)).toBeInTheDocument()
    })
  })

  it('shows flight price in results', async () => {
    render(<FlightsForm />)

    await waitFor(() =>
      expect(screen.getByRole('option', { name: 'Summer Trip' })).toBeInTheDocument()
    )

    fireEvent.change(document.querySelector('input[name="outboundDate"]')!, {
      target: { value: '2026-07-01' },
    })

    fireEvent.submit(document.querySelector('form')!)

    await waitFor(() => {
      expect(screen.getByText('150 €')).toBeInTheDocument()
    })
  })

  it('shows route label in flight card (MAD → CDG)', async () => {
    render(<FlightsForm />)

    await waitFor(() =>
      expect(screen.getByRole('option', { name: 'Summer Trip' })).toBeInTheDocument()
    )

    fireEvent.change(document.querySelector('input[name="outboundDate"]')!, {
      target: { value: '2026-07-01' },
    })

    fireEvent.submit(document.querySelector('form')!)

    await waitFor(() => {
      expect(screen.getAllByText('MAD → CDG').length).toBeGreaterThan(0)
    })
  })

  it('shows "Add to travel" button for each flight result', async () => {
    render(<FlightsForm />)

    await waitFor(() =>
      expect(screen.getByRole('option', { name: 'Summer Trip' })).toBeInTheDocument()
    )

    fireEvent.change(document.querySelector('input[name="outboundDate"]')!, {
      target: { value: '2026-07-01' },
    })

    fireEvent.submit(document.querySelector('form')!)

    await waitFor(() => {
      const addButtons = screen.getAllByRole('button', { name: /Add to travel/i })
      expect(addButtons).toHaveLength(2)
    })
  })

  it('shows error when no travel plan is selected and "Add to travel" is clicked', async () => {
    render(<FlightsForm />)

    await waitFor(() =>
      expect(screen.getByRole('option', { name: 'Summer Trip' })).toBeInTheDocument()
    )

    fireEvent.change(document.querySelector('input[name="outboundDate"]')!, {
      target: { value: '2026-07-01' },
    })

    fireEvent.submit(document.querySelector('form')!)

    await waitFor(() => {
      expect(screen.getAllByRole('button', { name: /Add to travel/i })).toHaveLength(2)
    })

    // Add buttons are disabled when no travel plan is selected
    const addButtons = screen.getAllByRole('button', { name: /Add to travel/i })
    expect(addButtons[0]).toBeDisabled()
  })

  it('saves flight to travel plan when "Add to travel" is clicked with a plan selected', async () => {
    const user = userEvent.setup()
    render(<FlightsForm />)

    await waitFor(() =>
      expect(screen.getByRole('option', { name: 'Summer Trip' })).toBeInTheDocument()
    )

    await user.selectOptions(screen.getAllByRole('combobox')[0], '1')

    fireEvent.change(document.querySelector('input[name="outboundDate"]')!, {
      target: { value: '2026-07-01' },
    })

    fireEvent.submit(document.querySelector('form')!)

    await waitFor(() => {
      expect(screen.getAllByRole('button', { name: /Add to travel/i })).toHaveLength(2)
    })

    vi.mocked(getAirportsByCoordinates).mockResolvedValue([mockAirportMAD])

    await user.click(screen.getAllByRole('button', { name: /Add to travel/i })[0])

    await waitFor(() => {
      expect(addFlightToTravel).toHaveBeenCalledWith(42, 1, expect.objectContaining({
        transport: expect.objectContaining({ transportType: 'FLIGHT' }),
      }))
    })
  })

  it('shows success message after saving flight', async () => {
    const user = userEvent.setup()
    render(<FlightsForm />)

    await waitFor(() =>
      expect(screen.getByRole('option', { name: 'Summer Trip' })).toBeInTheDocument()
    )

    await user.selectOptions(screen.getAllByRole('combobox')[0], '1')

    fireEvent.change(document.querySelector('input[name="outboundDate"]')!, {
      target: { value: '2026-07-01' },
    })

    fireEvent.submit(document.querySelector('form')!)

    await waitFor(() => {
      expect(screen.getAllByRole('button', { name: /Add to travel/i })).toHaveLength(2)
    })

    await user.click(screen.getAllByRole('button', { name: /Add to travel/i })[0])

    await waitFor(() => {
      expect(screen.getByText(/Flight added to the travel plan/i)).toBeInTheDocument()
    })
  })

  it('shows "no flights" message when results are empty', async () => {
    vi.mocked(searchFlights).mockResolvedValue({ best_flights: [], other_flights: [] })

    render(<FlightsForm />)

    await waitFor(() =>
      expect(screen.getByRole('option', { name: 'Summer Trip' })).toBeInTheDocument()
    )

    fireEvent.change(document.querySelector('input[name="outboundDate"]')!, {
      target: { value: '2026-07-01' },
    })

    fireEvent.submit(document.querySelector('form')!)

    await waitFor(() => {
      expect(screen.getByText(/No flights were found for this search/i)).toBeInTheDocument()
    })
  })

  it('shows error when flight search fails', async () => {
    vi.mocked(getAirportsByCoordinates).mockReset()
    vi.mocked(getAirportsByCoordinates).mockRejectedValue(new Error('API error'))

    render(<FlightsForm />)

    await waitFor(() =>
      expect(screen.getByRole('option', { name: 'Summer Trip' })).toBeInTheDocument()
    )

    fireEvent.change(document.querySelector('input[name="outboundDate"]')!, {
      target: { value: '2026-07-01' },
    })

    fireEvent.submit(document.querySelector('form')!)

    await waitFor(() => {
      expect(document.querySelector('.alert-danger')).toBeInTheDocument()
    })
  })

  it('shows return date field when round trip is selected', async () => {
    const user = userEvent.setup()
    render(<FlightsForm />)

    await waitFor(() =>
      expect(screen.getByRole('heading', { name: /Search Flights/i })).toBeInTheDocument()
    )

    await user.selectOptions(document.querySelector('select[name="type"]')! as HTMLSelectElement, '1')

    expect(document.querySelector('input[name="returnDate"]')).toBeInTheDocument()
  })

  it('hides return date field for one-way trips', async () => {
    render(<FlightsForm />)

    await waitFor(() =>
      expect(screen.getByRole('heading', { name: /Search Flights/i })).toBeInTheDocument()
    )

    expect(document.querySelector('input[name="returnDate"]')).not.toBeInTheDocument()
  })

  it('flight search calls getAirportsByCoordinates for both origin and destination', async () => {
    render(<FlightsForm />)

    await waitFor(() =>
      expect(screen.getByRole('option', { name: 'Summer Trip' })).toBeInTheDocument()
    )

    fireEvent.change(document.querySelector('input[name="outboundDate"]')!, {
      target: { value: '2026-07-01' },
    })

    fireEvent.submit(document.querySelector('form')!)

    await waitFor(() => {
      expect(getAirportsByCoordinates).toHaveBeenCalledTimes(2)
    })
  })

  it('flight search calls searchFlights with the correct IATA codes', async () => {
    render(<FlightsForm />)

    await waitFor(() =>
      expect(screen.getByRole('option', { name: 'Summer Trip' })).toBeInTheDocument()
    )

    fireEvent.change(document.querySelector('input[name="outboundDate"]')!, {
      target: { value: '2026-07-01' },
    })

    fireEvent.submit(document.querySelector('form')!)

    await waitFor(() => {
      expect(searchFlights).toHaveBeenCalledWith(
        expect.objectContaining({
          departureId: 'MAD',
          arrivalId: 'CDG',
          outboundDate: '2026-07-01',
        })
      )
    })
  })
})
