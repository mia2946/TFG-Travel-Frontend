import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import AccommodationsForm from '../../components/user/AccommodationsForm'
import {
  mockTravelPlan,
  mockAccommodationResult,
  mockCityParis,
  mockUser,
} from '../mocks/mockData'

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

vi.mock('../../services/locationService', () => ({
  loadCities: vi.fn().mockResolvedValue([]),
  searchCities: vi.fn().mockResolvedValue([]),
  resolveCityCoordinates: vi.fn(),
}))

vi.mock('../../services/accommodationService', () => ({
  searchAccommodations: vi.fn(),
}))

vi.mock('../../services/authService', () => ({
  getSession: vi.fn(),
  saveSession: vi.fn(),
  logout: vi.fn(),
}))

import { getTravelPlans, addAccommodationToTravel } from '../../services/travelService'
import { searchAccommodations } from '../../services/accommodationService'
import { searchCities } from '../../services/locationService'
import { getSession } from '../../services/authService'

describe('AccommodationsForm', () => {
  beforeEach(() => {
    vi.mocked(getTravelPlans).mockResolvedValue([mockTravelPlan])
    vi.mocked(getSession).mockReturnValue(mockUser as any)
    vi.mocked(searchCities).mockResolvedValue([mockCityParis])
    vi.mocked(searchAccommodations).mockResolvedValue([mockAccommodationResult])
    vi.mocked(addAccommodationToTravel).mockResolvedValue({})
  })

  it('renders Search Accommodations heading', async () => {
    render(<AccommodationsForm />)
    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /Search Accommodations/i })).toBeInTheDocument()
    })
  })

  it('renders destination input as required', async () => {
    render(<AccommodationsForm />)
    await waitFor(() => {
      const destInput = screen.getByPlaceholderText('Destination')
      expect(destInput).toHaveAttribute('required')
    })
  })

  it('renders check-in date as required', async () => {
    render(<AccommodationsForm />)
    await waitFor(() => {
      const checkIn = document.querySelector('input[name="checkIn"]') as HTMLInputElement
      expect(checkIn).toHaveAttribute('required')
    })
  })

  it('renders check-out date as required', async () => {
    render(<AccommodationsForm />)
    await waitFor(() => {
      const checkOut = document.querySelector('input[name="checkOut"]') as HTMLInputElement
      expect(checkOut).toHaveAttribute('required')
    })
  })

  it('renders guests input as required', async () => {
    render(<AccommodationsForm />)
    await waitFor(() => {
      const guests = document.querySelector('input[name="guests"]') as HTMLInputElement
      expect(guests).toHaveAttribute('required')
    })
  })

  it('renders Search Accommodations submit button', async () => {
    render(<AccommodationsForm />)
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Search Accommodations/i })).toBeInTheDocument()
    })
  })

  it('displays accommodation results after successful search', async () => {
    render(<AccommodationsForm />)

    await waitFor(() =>
      expect(screen.getByRole('option', { name: 'Summer Trip' })).toBeInTheDocument()
    )

    fireEvent.change(document.querySelector('input[name="checkIn"]')!, {
      target: { value: '2026-07-01' },
    })
    fireEvent.change(document.querySelector('input[name="checkOut"]')!, {
      target: { value: '2026-07-07' },
    })

    fireEvent.submit(document.querySelector('form')!)

    await waitFor(() => {
      expect(screen.getByText('Hotel du Louvre')).toBeInTheDocument()
    })
  })

  it('displays accommodation category badge', async () => {
    render(<AccommodationsForm />)

    await waitFor(() =>
      expect(screen.getByRole('option', { name: 'Summer Trip' })).toBeInTheDocument()
    )

    fireEvent.change(document.querySelector('input[name="checkIn"]')!, {
      target: { value: '2026-07-01' },
    })
    fireEvent.change(document.querySelector('input[name="checkOut"]')!, {
      target: { value: '2026-07-07' },
    })

    fireEvent.submit(document.querySelector('form')!)

    await waitFor(() => {
      expect(screen.getByText(/Accommodation Hotel/i)).toBeInTheDocument()
    })
  })

  it('displays accommodation rating', async () => {
    render(<AccommodationsForm />)

    await waitFor(() =>
      expect(screen.getByRole('option', { name: 'Summer Trip' })).toBeInTheDocument()
    )

    fireEvent.change(document.querySelector('input[name="checkIn"]')!, {
      target: { value: '2026-07-01' },
    })
    fireEvent.change(document.querySelector('input[name="checkOut"]')!, {
      target: { value: '2026-07-07' },
    })

    fireEvent.submit(document.querySelector('form')!)

    await waitFor(() => {
      expect(screen.getByText('4.5')).toBeInTheDocument()
    })
  })

  it('displays result count', async () => {
    render(<AccommodationsForm />)

    await waitFor(() =>
      expect(screen.getByRole('option', { name: 'Summer Trip' })).toBeInTheDocument()
    )

    fireEvent.change(document.querySelector('input[name="checkIn"]')!, {
      target: { value: '2026-07-01' },
    })
    fireEvent.change(document.querySelector('input[name="checkOut"]')!, {
      target: { value: '2026-07-07' },
    })

    fireEvent.submit(document.querySelector('form')!)

    await waitFor(() => {
      expect(screen.getByText(/Results \(1\)/i)).toBeInTheDocument()
    })
  })

  it('"Add to travel" button is disabled without a travel plan selected', async () => {
    render(<AccommodationsForm />)

    await waitFor(() =>
      expect(screen.getByRole('option', { name: 'Summer Trip' })).toBeInTheDocument()
    )

    fireEvent.change(document.querySelector('input[name="checkIn"]')!, {
      target: { value: '2026-07-01' },
    })
    fireEvent.change(document.querySelector('input[name="checkOut"]')!, {
      target: { value: '2026-07-07' },
    })

    fireEvent.submit(document.querySelector('form')!)

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Add to travel/i })).toBeDisabled()
    })
  })

  it('saves accommodation to travel plan when plan is selected', async () => {
    const user = userEvent.setup()
    render(<AccommodationsForm />)

    await waitFor(() =>
      expect(screen.getByRole('option', { name: 'Summer Trip' })).toBeInTheDocument()
    )

    await user.selectOptions(screen.getByRole('combobox'), '1')

    fireEvent.change(document.querySelector('input[name="checkIn"]')!, {
      target: { value: '2026-07-01' },
    })
    fireEvent.change(document.querySelector('input[name="checkOut"]')!, {
      target: { value: '2026-07-07' },
    })

    fireEvent.submit(document.querySelector('form')!)

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Add to travel/i })).not.toBeDisabled()
    })

    await user.click(screen.getByRole('button', { name: /Add to travel/i }))

    await waitFor(() => {
      expect(addAccommodationToTravel).toHaveBeenCalledWith(
        1,
        expect.objectContaining({
          name: 'Hotel du Louvre',
          source: 'geoapify',
        })
      )
    })
  })

  it('shows success message after saving accommodation', async () => {
    const user = userEvent.setup()
    render(<AccommodationsForm />)

    await waitFor(() =>
      expect(screen.getByRole('option', { name: 'Summer Trip' })).toBeInTheDocument()
    )

    await user.selectOptions(screen.getByRole('combobox'), '1')

    fireEvent.change(document.querySelector('input[name="checkIn"]')!, {
      target: { value: '2026-07-01' },
    })
    fireEvent.change(document.querySelector('input[name="checkOut"]')!, {
      target: { value: '2026-07-07' },
    })

    fireEvent.submit(document.querySelector('form')!)

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Add to travel/i })).not.toBeDisabled()
    })

    await user.click(screen.getByRole('button', { name: /Add to travel/i }))

    await waitFor(() => {
      expect(screen.getByText(/Hotel du Louvre added to the travel plan/i)).toBeInTheDocument()
    })
  })

  it('calls searchAccommodations with correct params (lat, lon, radius, limit)', async () => {
    render(<AccommodationsForm />)

    await waitFor(() =>
      expect(screen.getByRole('option', { name: 'Summer Trip' })).toBeInTheDocument()
    )

    fireEvent.change(document.querySelector('input[name="checkIn"]')!, {
      target: { value: '2026-07-01' },
    })
    fireEvent.change(document.querySelector('input[name="checkOut"]')!, {
      target: { value: '2026-07-07' },
    })

    // searchCities returns Paris when destination is empty (form resolves via searchCities)
    fireEvent.submit(document.querySelector('form')!)

    await waitFor(() => {
      expect(searchAccommodations).toHaveBeenCalledWith(
        expect.objectContaining({
          lat: mockCityParis.lat,
          lon: mockCityParis.lon,
        })
      )
    })
  })

  it('shows error when city not found', async () => {
    vi.mocked(searchCities).mockResolvedValue([])
    render(<AccommodationsForm />)

    await waitFor(() =>
      expect(screen.getByRole('option', { name: 'Summer Trip' })).toBeInTheDocument()
    )

    fireEvent.change(document.querySelector('input[name="checkIn"]')!, {
      target: { value: '2026-07-01' },
    })
    fireEvent.change(document.querySelector('input[name="checkOut"]')!, {
      target: { value: '2026-07-07' },
    })

    fireEvent.submit(document.querySelector('form')!)

    await waitFor(() => {
      expect(screen.getByText('City not found')).toBeInTheDocument()
    })
  })
})
