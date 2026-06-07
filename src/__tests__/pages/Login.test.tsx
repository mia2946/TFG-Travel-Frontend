import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import Login from '../../Pages/Login'
import { mockUser, mockAdminUser } from '../mocks/mockData'

const mockNavigate = vi.fn()

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom')
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  }
})

vi.mock('../../services/userService', () => ({
  login: vi.fn(),
  loadUsers: vi.fn(),
}))

import { login } from '../../services/userService'

function renderLogin() {
  return render(
    <MemoryRouter>
      <Login />
    </MemoryRouter>
  )
}

describe('Login page', () => {
  beforeEach(() => {
    mockNavigate.mockClear()
    vi.mocked(login).mockReset()
  })

  it('renders the login form heading', () => {
    renderLogin()
    expect(screen.getByRole('heading', { name: /Login/i })).toBeInTheDocument()
  })

  it('renders username input', () => {
    renderLogin()
    expect(screen.getByPlaceholderText('Username')).toBeInTheDocument()
  })

  it('renders password input', () => {
    renderLogin()
    expect(screen.getByPlaceholderText('Password')).toBeInTheDocument()
  })

  it('renders submit button', () => {
    renderLogin()
    expect(screen.getByRole('button', { name: /Entrar/i })).toBeInTheDocument()
  })

  it('renders registration link', () => {
    renderLogin()
    expect(screen.getByRole('button', { name: /Register here/i })).toBeInTheDocument()
  })

  it('navigates to /signup when registration link is clicked', async () => {
    const user = userEvent.setup()
    renderLogin()
    await user.click(screen.getByRole('button', { name: /Register here/i }))
    expect(mockNavigate).toHaveBeenCalledWith('/signup')
  })

  it('navigates to /user after successful USER login', async () => {
    vi.mocked(login).mockResolvedValue(mockUser as any)
    const user = userEvent.setup()
    renderLogin()

    await user.type(screen.getByPlaceholderText('Username'), 'testuser')
    await user.type(screen.getByPlaceholderText('Password'), 'password123')
    await user.click(screen.getByRole('button', { name: /Entrar/i }))

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/user')
    })
  })

  it('navigates to /admin after successful ADMIN login', async () => {
    vi.mocked(login).mockResolvedValue(mockAdminUser as any)
    const user = userEvent.setup()
    renderLogin()

    await user.type(screen.getByPlaceholderText('Username'), 'adminuser')
    await user.type(screen.getByPlaceholderText('Password'), 'adminpass')
    await user.click(screen.getByRole('button', { name: /Entrar/i }))

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/admin')
    })
  })

  it('shows error message when login returns null (wrong credentials)', async () => {
    vi.mocked(login).mockResolvedValue(null as any)
    const user = userEvent.setup()
    renderLogin()

    await user.type(screen.getByPlaceholderText('Username'), 'wronguser')
    await user.type(screen.getByPlaceholderText('Password'), 'wrongpass')
    await user.click(screen.getByRole('button', { name: /Entrar/i }))

    await waitFor(() => {
      expect(screen.getByText('Credenciales incorrectas')).toBeInTheDocument()
    })
  })

  it('shows error message when login throws (server error)', async () => {
    vi.mocked(login).mockRejectedValue(new Error('Network error'))
    const user = userEvent.setup()
    renderLogin()

    await user.type(screen.getByPlaceholderText('Username'), 'testuser')
    await user.type(screen.getByPlaceholderText('Password'), 'password123')
    await user.click(screen.getByRole('button', { name: /Entrar/i }))

    await waitFor(() => {
      expect(screen.getByText('Error conectando con el servidor')).toBeInTheDocument()
    })
  })

  it('shows loading state while logging in', async () => {
    let resolveLogin: (value: any) => void
    vi.mocked(login).mockReturnValue(
      new Promise((resolve) => {
        resolveLogin = resolve
      })
    )
    const user = userEvent.setup()
    renderLogin()

    await user.type(screen.getByPlaceholderText('Username'), 'testuser')
    await user.type(screen.getByPlaceholderText('Password'), 'password123')
    await user.click(screen.getByRole('button', { name: /Entrar/i }))

    expect(screen.getByRole('button', { name: /Entrando/i })).toBeDisabled()

    resolveLogin!(mockUser)
  })
})
