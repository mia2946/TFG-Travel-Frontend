import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import PointsOfInterestForm from '../../components/user/PointsOfInterestForm'
import {
  mockTravelPlan,
  mockRestaurantPoi,
  mockHospitalPoi,
  mockUser,
} from '../mocks/mockData'

vi.mock('../../services/travelService', () => ({
  getTravelPlans: vi.fn(),
  createTravelPlan: vi.fn(),
  addPoiToTravel: vi.fn(),
  addAccommodationToTravel: vi.fn(),
  addActivityToTravel: vi.fn(),
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

vi.mock('../../services/poiService', () => ({
  searchPois: vi.fn(),
  filterPoiResults: vi.fn(),
  isPlannablePoi: vi.fn(),
  getPoiName: vi.fn(),
  getPoiCategory: vi.fn(),
  getPoiAddress: vi.fn(),
  getPoiDescription: vi.fn(),
  getPoiId: vi.fn(),
  getPoiImageUrl: vi.fn(),
  getPoiLatitude: vi.fn(),
  getPoiLongitude: vi.fn(),
  getPoiOpeningHours: vi.fn(),
  getPoiPhone: vi.fn(),
  getPoiPrice: vi.fn(),
  getPoiWebsite: vi.fn(),
}))

vi.mock('../../services/authService', () => ({
  getSession: vi.fn(),
  saveSession: vi.fn(),
  logout: vi.fn(),
}))

import { getTravelPlans, addPoiToTravel } from '../../services/travelService'
import { resolveCityCoordinates } from '../../services/locationService'
import {
  searchPois,
  filterPoiResults,
  isPlannablePoi,
  getPoiName,
  getPoiCategory,
  getPoiAddress,
  getPoiDescription,
  getPoiId,
  getPoiImageUrl,
  getPoiLatitude,
  getPoiLongitude,
  getPoiOpeningHours,
  getPoiPhone,
  getPoiPrice,
  getPoiWebsite,
} from '../../services/poiService'
import { getSession } from '../../services/authService'

function setupPoiMocksForRestaurant() {
  vi.mocked(isPlannablePoi).mockImplementation((poi: any) =>
    poi?.tags?.amenity === 'restaurant' || poi?.tags?.amenity === 'cafe'
  )
  vi.mocked(getPoiName).mockImplementation((poi: any) => poi?.tags?.name || 'Unknown POI')
  vi.mocked(getPoiCategory).mockImplementation((poi: any) => poi?.tags?.amenity || '')
  vi.mocked(getPoiAddress).mockReturnValue('123 Test Street')
  vi.mocked(getPoiDescription).mockReturnValue('')
  vi.mocked(getPoiId).mockImplementation((_poi: any, index: number) => `poi-${index}`)
  vi.mocked(getPoiImageUrl).mockReturnValue('')
  vi.mocked(getPoiLatitude).mockImplementation((poi: any) => poi?.lat || 0)
  vi.mocked(getPoiLongitude).mockImplementation((poi: any) => poi?.lon || 0)
  vi.mocked(getPoiOpeningHours).mockReturnValue('')
  vi.mocked(getPoiPhone).mockImplementation((poi: any) => poi?.tags?.phone || '')
  vi.mocked(getPoiPrice).mockReturnValue('')
  vi.mocked(getPoiWebsite).mockImplementation((poi: any) => poi?.tags?.website || '')
}

describe('PointsOfInterestForm', () => {
  beforeEach(() => {
    vi.mocked(getTravelPlans).mockResolvedValue([mockTravelPlan])
    vi.mocked(getSession).mockReturnValue(mockUser as any)
    vi.mocked(resolveCityCoordinates).mockResolvedValue({ lat: '48.8566', lon: '2.3522' })
    vi.mocked(searchPois).mockResolvedValue([mockRestaurantPoi, mockHospitalPoi])
    vi.mocked(filterPoiResults).mockReturnValue([mockRestaurantPoi, mockHospitalPoi])
    vi.mocked(addPoiToTravel).mockResolvedValue({})
    setupPoiMocksForRestaurant()
  })

  it('renders Search Points of Interest heading', async () => {
    render(<PointsOfInterestForm />)
    await waitFor(() => {
      expect(screen.getByText('Search Points of Interest')).toBeInTheDocument()
    })
  })

  it('renders destination input as required', async () => {
    render(<PointsOfInterestForm />)
    await waitFor(() => {
      const destInput = screen.getByPlaceholderText('Destination')
      expect(destInput).toHaveAttribute('required')
    })
  })

  it('renders POI type select with expected groups', async () => {
    render(<PointsOfInterestForm />)
    await waitFor(() => {
      expect(screen.getByRole('option', { name: 'All POIs' })).toBeInTheDocument()
      expect(screen.getByRole('option', { name: 'Restaurant' })).toBeInTheDocument()
      expect(screen.getByRole('option', { name: 'Hospital' })).toBeInTheDocument()
      expect(screen.getByRole('option', { name: 'Embassy' })).toBeInTheDocument()
    })
  })

  it('renders radius input', async () => {
    render(<PointsOfInterestForm />)
    await waitFor(() => {
      const radiusInput = document.querySelector('input[name="radius"]') as HTMLInputElement
      expect(radiusInput).toBeInTheDocument()
    })
  })

  it('renders Search POIs submit button', async () => {
    render(<PointsOfInterestForm />)
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Search POIs/i })).toBeInTheDocument()
    })
  })

  it('displays plannable POIs section after search', async () => {
    vi.mocked(isPlannablePoi).mockImplementation((poi: any) => poi?.tags?.amenity === 'restaurant')
    vi.mocked(filterPoiResults).mockReturnValue([mockRestaurantPoi])

    render(<PointsOfInterestForm />)

    await waitFor(() =>
      expect(screen.getByRole('option', { name: 'Summer Trip' })).toBeInTheDocument()
    )

    fireEvent.submit(document.querySelector('form')!)

    await waitFor(() => {
      expect(screen.getByText(/Plannable POIs/i)).toBeInTheDocument()
      expect(screen.getByText('Le Jules Verne')).toBeInTheDocument()
    })
  })

  it('displays access-only POIs section after search', async () => {
    vi.mocked(isPlannablePoi).mockImplementation((poi: any) => poi?.tags?.amenity === 'restaurant')
    vi.mocked(filterPoiResults).mockReturnValue([mockRestaurantPoi, mockHospitalPoi])

    render(<PointsOfInterestForm />)

    await waitFor(() =>
      expect(screen.getByRole('option', { name: 'Summer Trip' })).toBeInTheDocument()
    )

    fireEvent.submit(document.querySelector('form')!)

    await waitFor(() => {
      expect(screen.getByText(/Access-only POIs/i)).toBeInTheDocument()
      expect(screen.getByText('Hôpital de la Pitié-Salpêtrière')).toBeInTheDocument()
    })
  })

  it('displays total result count', async () => {
    render(<PointsOfInterestForm />)

    await waitFor(() =>
      expect(screen.getByRole('option', { name: 'Summer Trip' })).toBeInTheDocument()
    )

    fireEvent.submit(document.querySelector('form')!)

    await waitFor(() => {
      expect(screen.getByText(/Results \(2\)/i)).toBeInTheDocument()
    })
  })

  it('"Add to travel" button is absent for access-only POIs', async () => {
    vi.mocked(isPlannablePoi).mockReturnValue(false)
    vi.mocked(filterPoiResults).mockReturnValue([mockHospitalPoi])

    render(<PointsOfInterestForm />)

    await waitFor(() =>
      expect(screen.getByRole('option', { name: 'Summer Trip' })).toBeInTheDocument()
    )

    fireEvent.submit(document.querySelector('form')!)

    await waitFor(() => {
      expect(screen.getByText('Hôpital de la Pitié-Salpêtrière')).toBeInTheDocument()
    })

    expect(screen.queryByRole('button', { name: /Add to travel/i })).not.toBeInTheDocument()
  })

  it('"Add to travel" button is disabled without a travel plan for plannable POIs', async () => {
    vi.mocked(isPlannablePoi).mockReturnValue(true)
    vi.mocked(filterPoiResults).mockReturnValue([mockRestaurantPoi])

    render(<PointsOfInterestForm />)

    await waitFor(() =>
      expect(screen.getByRole('option', { name: 'Summer Trip' })).toBeInTheDocument()
    )

    fireEvent.submit(document.querySelector('form')!)

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Add to travel/i })).toBeDisabled()
    })
  })

  it('saves plannable POI to travel plan when plan is selected', async () => {
    vi.mocked(isPlannablePoi).mockReturnValue(true)
    vi.mocked(filterPoiResults).mockReturnValue([mockRestaurantPoi])
    const user = userEvent.setup()
    render(<PointsOfInterestForm />)

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
      expect(addPoiToTravel).toHaveBeenCalledWith(
        1,
        expect.objectContaining({
          name: 'Le Jules Verne',
          source: 'OSM',
        })
      )
    })
  })

  it('shows success message after saving POI', async () => {
    vi.mocked(isPlannablePoi).mockReturnValue(true)
    vi.mocked(filterPoiResults).mockReturnValue([mockRestaurantPoi])
    const user = userEvent.setup()
    render(<PointsOfInterestForm />)

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
      expect(screen.getByText(/Le Jules Verne added to the travel plan/i)).toBeInTheDocument()
    })
  })

  it('calls searchPois with resolved coordinates', async () => {
    render(<PointsOfInterestForm />)

    await waitFor(() =>
      expect(screen.getByRole('option', { name: 'Summer Trip' })).toBeInTheDocument()
    )

    fireEvent.submit(document.querySelector('form')!)

    await waitFor(() => {
      expect(searchPois).toHaveBeenCalledWith(
        expect.objectContaining({
          lat: '48.8566',
          lon: '2.3522',
        })
      )
    })
  })

  it('shows restaurant website link when available', async () => {
    vi.mocked(isPlannablePoi).mockReturnValue(true)
    vi.mocked(filterPoiResults).mockReturnValue([mockRestaurantPoi])
    vi.mocked(getPoiWebsite).mockReturnValue('https://lejulesverne-paris.com')

    render(<PointsOfInterestForm />)

    await waitFor(() =>
      expect(screen.getByRole('option', { name: 'Summer Trip' })).toBeInTheDocument()
    )

    fireEvent.submit(document.querySelector('form')!)

    await waitFor(() => {
      expect(screen.getByRole('link', { name: /Website/i })).toBeInTheDocument()
    })
  })

  it('shows restaurant phone when available', async () => {
    vi.mocked(isPlannablePoi).mockReturnValue(true)
    vi.mocked(filterPoiResults).mockReturnValue([mockRestaurantPoi])
    vi.mocked(getPoiPhone).mockReturnValue('+33 1 45 55 61 44')

    render(<PointsOfInterestForm />)

    await waitFor(() =>
      expect(screen.getByRole('option', { name: 'Summer Trip' })).toBeInTheDocument()
    )

    fireEvent.submit(document.querySelector('form')!)

    await waitFor(() => {
      expect(screen.getByText('+33 1 45 55 61 44')).toBeInTheDocument()
    })
  })
})
