import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import Home from '../../Pages/Home'

const mockNavigate = vi.fn()

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom')
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  }
})

// Mock the hero image import
vi.mock('../../assets/hero.png', () => ({ default: 'hero.png' }))

function renderHome() {
  return render(
    <MemoryRouter>
      <Home />
    </MemoryRouter>
  )
}

describe('Home page', () => {
  it('renders welcome message', () => {
    renderHome()
    expect(screen.getByText('Bienvenido')).toBeInTheDocument()
  })

  it('renders subtitle text', () => {
    renderHome()
    expect(screen.getByText(/Accede a tu cuenta o crea una nueva/i)).toBeInTheDocument()
  })

  it('renders Login button', () => {
    renderHome()
    expect(screen.getByRole('button', { name: /Login/i })).toBeInTheDocument()
  })

  it('renders Sign In button', () => {
    renderHome()
    expect(screen.getByRole('button', { name: /Sign In/i })).toBeInTheDocument()
  })

  it('navigates to /login when Login button is clicked', async () => {
    const user = userEvent.setup()
    renderHome()
    await user.click(screen.getByRole('button', { name: /Login/i }))
    expect(mockNavigate).toHaveBeenCalledWith('/login')
  })

  it('navigates to /signup when Sign In button is clicked', async () => {
    const user = userEvent.setup()
    renderHome()
    await user.click(screen.getByRole('button', { name: /Sign In/i }))
    expect(mockNavigate).toHaveBeenCalledWith('/signup')
  })
})
