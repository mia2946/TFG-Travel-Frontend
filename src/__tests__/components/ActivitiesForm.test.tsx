import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import ActivitiesForm from '../../components/user/ActivitiesForm'
import {
  mockTravelPlan,
  mockActivityResult,
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

vi.mock('../../services/activityService', () => ({
  searchActivities: vi.fn(),
}))

vi.mock('../../services/authService', () => ({
  getSession: vi.fn(),
  saveSession: vi.fn(),
  logout: vi.fn(),
}))

import { getTravelPlans, addActivityToTravel } from '../../services/travelService'
import { searchActivities } from '../../services/activityService'
import { searchCities } from '../../services/locationService'
import { getSession } from '../../services/authService'

describe('ActivitiesForm', () => {
  beforeEach(() => {
    vi.mocked(getTravelPlans).mockResolvedValue([mockTravelPlan])
    vi.mocked(getSession).mockReturnValue(mockUser as any)
    vi.mocked(searchCities).mockResolvedValue([mockCityParis])
    vi.mocked(searchActivities).mockResolvedValue([mockActivityResult])
    vi.mocked(addActivityToTravel).mockResolvedValue({})
  })

  it('renders Search Activities heading', async () => {
    render(<ActivitiesForm />)
    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /Search Activities/i })).toBeInTheDocument()
    })
  })

  it('renders destination input as required', async () => {
    render(<ActivitiesForm />)
    await waitFor(() => {
      const destInput = screen.getByPlaceholderText('Destination')
      expect(destInput).toHaveAttribute('required')
    })
  })

  it('renders Search Activities submit button', async () => {
    render(<ActivitiesForm />)
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Search Activities/i })).toBeInTheDocument()
    })
  })

  it('renders activity type select', async () => {
    render(<ActivitiesForm />)
    await waitFor(() => {
      expect(document.querySelector('select[name="activityType"]')).toBeInTheDocument()
    })
  })

  it('activity type select has expected options', async () => {
    render(<ActivitiesForm />)
    await waitFor(() => {
      expect(screen.getByRole('option', { name: 'All' })).toBeInTheDocument()
      expect(screen.getByRole('option', { name: 'Culture' })).toBeInTheDocument()
      expect(screen.getByRole('option', { name: 'Nature' })).toBeInTheDocument()
      expect(screen.getByRole('option', { name: 'Museums' })).toBeInTheDocument()
      expect(screen.getByRole('option', { name: 'Tours' })).toBeInTheDocument()
    })
  })

  it('displays activity results after successful search', async () => {
    render(<ActivitiesForm />)

    await waitFor(() =>
      expect(screen.getByRole('option', { name: 'Summer Trip' })).toBeInTheDocument()
    )

    fireEvent.submit(document.querySelector('form')!)

    await waitFor(() => {
      expect(screen.getByText('Eiffel Tower')).toBeInTheDocument()
    })
  })

  it('displays activity inferred type', async () => {
    render(<ActivitiesForm />)

    await waitFor(() =>
      expect(screen.getByRole('option', { name: 'Summer Trip' })).toBeInTheDocument()
    )

    fireEvent.submit(document.querySelector('form')!)

    await waitFor(() => {
      expect(screen.getByText(/ATTRACTION/)).toBeInTheDocument()
    })
  })

  it('displays activity address', async () => {
    render(<ActivitiesForm />)

    await waitFor(() =>
      expect(screen.getByRole('option', { name: 'Summer Trip' })).toBeInTheDocument()
    )

    fireEvent.submit(document.querySelector('form')!)

    await waitFor(() => {
      expect(
        screen.getByText(/Champ de Mars, 5 Avenue Anatole France/i)
      ).toBeInTheDocument()
    })
  })

  it('displays result count', async () => {
    render(<ActivitiesForm />)

    await waitFor(() =>
      expect(screen.getByRole('option', { name: 'Summer Trip' })).toBeInTheDocument()
    )

    fireEvent.submit(document.querySelector('form')!)

    await waitFor(() => {
      expect(screen.getByText(/Results \(1\)/i)).toBeInTheDocument()
    })
  })

  it('"Add to travel" button is disabled without a travel plan selected', async () => {
    render(<ActivitiesForm />)

    await waitFor(() =>
      expect(screen.getByRole('option', { name: 'Summer Trip' })).toBeInTheDocument()
    )

    fireEvent.submit(document.querySelector('form')!)

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Add to travel/i })).toBeDisabled()
    })
  })

  it('saves activity to travel plan when plan is selected', async () => {
    const user = userEvent.setup()
    render(<ActivitiesForm />)

    await waitFor(() =>
      expect(screen.getByRole('option', { name: 'Summer Trip' })).toBeInTheDocument()
    )

    await user.selectOptions(screen.getAllByRole('combobox')[0], '1')

    fireEvent.submit(document.querySelector('form')!)

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Add to travel/i })).not.toBeDisabled()
    })

    await user.click(screen.getByRole('button', { name: /Add to travel/i }))

    await waitFor(() => {
      expect(addActivityToTravel).toHaveBeenCalledWith(
        1,
        expect.objectContaining({
          name: 'Eiffel Tower',
          source: 'geoapify',
          category: 'ATTRACTION',
        })
      )
    })
  })

  it('shows success message after saving activity', async () => {
    const user = userEvent.setup()
    render(<ActivitiesForm />)

    await waitFor(() =>
      expect(screen.getByRole('option', { name: 'Summer Trip' })).toBeInTheDocument()
    )

    await user.selectOptions(screen.getAllByRole('combobox')[0], '1')

    fireEvent.submit(document.querySelector('form')!)

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Add to travel/i })).not.toBeDisabled()
    })

    await user.click(screen.getByRole('button', { name: /Add to travel/i }))

    await waitFor(() => {
      expect(screen.getByText(/Eiffel Tower added to the travel plan/i)).toBeInTheDocument()
    })
  })

  it('shows error when no city found for destination', async () => {
    vi.mocked(searchCities).mockResolvedValue([])
    render(<ActivitiesForm />)

    await waitFor(() =>
      expect(screen.getByRole('option', { name: 'Summer Trip' })).toBeInTheDocument()
    )

    fireEvent.submit(document.querySelector('form')!)

    await waitFor(() => {
      expect(screen.getByText(/Activities cannot be found/i)).toBeInTheDocument()
    })
  })

  it('calls searchActivities with lat/lon from resolved city', async () => {
    render(<ActivitiesForm />)

    await waitFor(() =>
      expect(screen.getByRole('option', { name: 'Summer Trip' })).toBeInTheDocument()
    )

    fireEvent.submit(document.querySelector('form')!)

    await waitFor(() => {
      expect(searchActivities).toHaveBeenCalledWith(
        expect.objectContaining({
          lat: mockCityParis.lat,
          lon: mockCityParis.lon,
        })
      )
    })
  })

  it('shows loading state while searching', async () => {
    let resolveSearch: (v: any) => void
    vi.mocked(searchActivities).mockReturnValue(
      new Promise((r) => { resolveSearch = r })
    )

    render(<ActivitiesForm />)

    await waitFor(() =>
      expect(screen.getByRole('option', { name: 'Summer Trip' })).toBeInTheDocument()
    )

    fireEvent.submit(document.querySelector('form')!)

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Searching.../i })).toBeInTheDocument()
    })

    resolveSearch!([])
  })
})
