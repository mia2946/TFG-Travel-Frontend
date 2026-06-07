import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import TravelPlanSelector from '../../components/user/TravelPlanSelector'
import { mockTravelPlan, mockEmptyTravelPlan } from '../mocks/mockData'

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

import { getTravelPlans, createTravelPlan } from '../../services/travelService'

const defaultProps = {
  selectedTravelId: '' as number | '',
  onTravelSelected: vi.fn(),
}

describe('TravelPlanSelector', () => {
  beforeEach(() => {
    vi.mocked(getTravelPlans).mockResolvedValue([mockTravelPlan, mockEmptyTravelPlan])
    vi.mocked(createTravelPlan).mockResolvedValue({
      id: 99,
      userId: 42,
      name: 'New Plan',
      startDate: '2026-06-12',
      endDate: '2026-06-15',
      createdAt: new Date().toISOString(),
    })
    defaultProps.onTravelSelected.mockClear()
  })

  it('renders Travel Plan heading', () => {
    render(<TravelPlanSelector {...defaultProps} />)
    expect(screen.getByText('Travel Plan')).toBeInTheDocument()
  })

  it('renders input for new travel plan name', () => {
    render(<TravelPlanSelector {...defaultProps} />)
    expect(screen.getByPlaceholderText('New travel plan name')).toBeInTheDocument()
  })

  it('renders Create button', () => {
    render(<TravelPlanSelector {...defaultProps} />)
    expect(screen.getByRole('button', { name: /Create/i })).toBeInTheDocument()
  })

  it('shows loading state while fetching plans', async () => {
    let resolve: (v: any) => void
    vi.mocked(getTravelPlans).mockReturnValue(new Promise((r) => (resolve = r)))

    render(<TravelPlanSelector {...defaultProps} />)

    expect(screen.getByText(/Loading travels/i)).toBeInTheDocument()

    resolve!([])
  })

  it('loads and displays travel plans in the dropdown', async () => {
    render(<TravelPlanSelector {...defaultProps} />)

    await waitFor(() => {
      expect(screen.getByRole('option', { name: 'Summer Trip' })).toBeInTheDocument()
      expect(screen.getByRole('option', { name: 'Empty Trip' })).toBeInTheDocument()
    })
  })

  it('shows default "Select travel plan" option', async () => {
    render(<TravelPlanSelector {...defaultProps} />)

    await waitFor(() => {
      expect(screen.getByRole('option', { name: /Select travel plan/i })).toBeInTheDocument()
    })
  })

  it('calls onTravelSelected when a plan is selected', async () => {
    const user = userEvent.setup()
    render(<TravelPlanSelector {...defaultProps} />)

    await waitFor(() => {
      expect(screen.getByRole('option', { name: 'Summer Trip' })).toBeInTheDocument()
    })

    await user.selectOptions(screen.getByRole('combobox'), '1')
    expect(defaultProps.onTravelSelected).toHaveBeenCalledWith(1)
  })

  it('Create button is disabled when name is empty', () => {
    render(<TravelPlanSelector {...defaultProps} />)
    expect(screen.getByRole('button', { name: /Create/i })).toBeDisabled()
  })

  it('Create button is enabled when name is typed', async () => {
    const user = userEvent.setup()
    render(<TravelPlanSelector {...defaultProps} />)

    await user.type(screen.getByPlaceholderText('New travel plan name'), 'My Trip')
    expect(screen.getByRole('button', { name: /Create/i })).not.toBeDisabled()
  })

  it('creates a new travel plan and selects it', async () => {
    const user = userEvent.setup()
    render(<TravelPlanSelector {...defaultProps} />)

    await user.type(screen.getByPlaceholderText('New travel plan name'), 'New Plan')
    await user.click(screen.getByRole('button', { name: /Create/i }))

    await waitFor(() => {
      expect(createTravelPlan).toHaveBeenCalledWith('New Plan')
      expect(defaultProps.onTravelSelected).toHaveBeenCalledWith(99)
    })
  })

  it('shows error when loading plans fails', async () => {
    vi.mocked(getTravelPlans).mockRejectedValue(new Error('Network error'))

    render(<TravelPlanSelector {...defaultProps} />)

    await waitFor(() => {
      expect(screen.getByText(/Travel plans could not be loaded/i)).toBeInTheDocument()
    })
  })

  it('shows error when creating a plan fails', async () => {
    vi.mocked(createTravelPlan).mockRejectedValue(new Error('Creation failed'))
    const user = userEvent.setup()
    render(<TravelPlanSelector {...defaultProps} />)

    await user.type(screen.getByPlaceholderText('New travel plan name'), 'Bad Plan')
    await user.click(screen.getByRole('button', { name: /Create/i }))

    await waitFor(() => {
      expect(screen.getByText(/Travel plan could not be created/i)).toBeInTheDocument()
    })
  })
})
