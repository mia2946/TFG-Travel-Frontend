import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import { mockUser, mockAdminUser } from '../mocks/mockData'

// ── Asset mocks ──────────────────────────────────────────────────────────────
vi.mock('../../assets/hero.png', () => ({ default: 'hero.png' }))

// ── Service mocks ─────────────────────────────────────────────────────────────
vi.mock('../../services/authService', () => ({
  getSession: vi.fn(),
  saveSession: vi.fn(),
  logout: vi.fn(),
}))

vi.mock('../../services/userService', () => ({
  login: vi.fn(),
  loadUsers: vi.fn().mockResolvedValue([]),
  clearUsersCache: vi.fn(),
  register: vi.fn(),
}))

// ── Heavy page mocks ──────────────────────────────────────────────────────────
vi.mock('../../Pages/AppUser/UserPage', () => ({
  default: () => <div data-testid="user-page">User Page</div>,
}))

vi.mock('../../Pages/AppAdmin/AdminPage', () => ({
  default: () => <div data-testid="admin-page">Admin Page</div>,
}))

// ── Import after mocks ────────────────────────────────────────────────────────
import Home from '../../Pages/Home'
import Login from '../../Pages/Login'
import SignUp from '../../Pages/SignUp'
import UserPage from '../../Pages/AppUser/UserPage'
import AdminPage from '../../Pages/AppAdmin/AdminPage'
import PrivateRoute from '../../routes/PrivateRoute'
import PublicRoute from '../../routes/PublicRoute'
import Navbar from '../../components/Navbar'
import { getSession, logout } from '../../services/authService'

// ── Helpers ───────────────────────────────────────────────────────────────────

function renderRoutes(initialPath: string) {
  return render(
    <MemoryRouter initialEntries={[initialPath]}>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route
          path="/login"
          element={
            <PublicRoute>
              <Login />
            </PublicRoute>
          }
        />
        <Route
          path="/signup"
          element={
            <PublicRoute>
              <SignUp />
            </PublicRoute>
          }
        />
        <Route
          path="/admin"
          element={
            <PrivateRoute role="ADMIN">
              <AdminPage />
            </PrivateRoute>
          }
        />
        <Route
          path="/user"
          element={
            <PrivateRoute role="USER">
              <UserPage />
            </PrivateRoute>
          }
        />
      </Routes>
    </MemoryRouter>
  )
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('Application routes', () => {
  beforeEach(() => {
    vi.mocked(getSession).mockReturnValue(null)
  })

  // ── Route rendering ───────────────────────────────────────────────────────

  describe('route rendering', () => {
    it('renders the Home page at /', () => {
      renderRoutes('/')
      expect(screen.getByRole('heading', { name: /Bienvenido/i })).toBeInTheDocument()
    })

    it('renders the Login page at /login when not authenticated', () => {
      renderRoutes('/login')
      expect(screen.getByRole('heading', { name: /Login/i })).toBeInTheDocument()
    })

    it('renders the SignUp page at /signup when not authenticated', () => {
      renderRoutes('/signup')
      expect(screen.getByRole('heading', { name: /Crear cuenta/i })).toBeInTheDocument()
    })

    it('renders the User page at /user when authenticated as USER', () => {
      vi.mocked(getSession).mockReturnValue(mockUser as any)
      renderRoutes('/user')
      expect(screen.getByTestId('user-page')).toBeInTheDocument()
    })

    it('renders the Admin page at /admin when authenticated as ADMIN', () => {
      vi.mocked(getSession).mockReturnValue(mockAdminUser as any)
      renderRoutes('/admin')
      expect(screen.getByTestId('admin-page')).toBeInTheDocument()
    })

    it('renders nothing for an unknown path (no fallback route defined)', () => {
      renderRoutes('/this-route-does-not-exist')
      expect(screen.queryByRole('heading')).not.toBeInTheDocument()
      expect(screen.queryByTestId('user-page')).not.toBeInTheDocument()
      expect(screen.queryByTestId('admin-page')).not.toBeInTheDocument()
    })
  })

  // ── PrivateRoute guards ───────────────────────────────────────────────────

  describe('PrivateRoute guards', () => {
    it('redirects /user to /login when not authenticated', () => {
      renderRoutes('/user')
      expect(screen.getByRole('heading', { name: /Login/i })).toBeInTheDocument()
      expect(screen.queryByTestId('user-page')).not.toBeInTheDocument()
    })

    it('redirects /admin to /login when not authenticated', () => {
      renderRoutes('/admin')
      expect(screen.getByRole('heading', { name: /Login/i })).toBeInTheDocument()
      expect(screen.queryByTestId('admin-page')).not.toBeInTheDocument()
    })

    it('redirects /admin to /user when authenticated as USER (wrong role: /login → PublicRoute → /user)', () => {
      // PrivateRoute redirects to /login, then PublicRoute sees the session and sends USER to /user
      vi.mocked(getSession).mockReturnValue(mockUser as any)
      renderRoutes('/admin')
      expect(screen.getByTestId('user-page')).toBeInTheDocument()
      expect(screen.queryByTestId('admin-page')).not.toBeInTheDocument()
    })

    it('redirects /user to /admin when authenticated as ADMIN (wrong role: /login → PublicRoute → /admin)', () => {
      // PrivateRoute redirects to /login, then PublicRoute sees the session and sends ADMIN to /admin
      vi.mocked(getSession).mockReturnValue(mockAdminUser as any)
      renderRoutes('/user')
      expect(screen.getByTestId('admin-page')).toBeInTheDocument()
      expect(screen.queryByTestId('user-page')).not.toBeInTheDocument()
    })
  })

  // ── PublicRoute guards ────────────────────────────────────────────────────

  describe('PublicRoute guards', () => {
    it('redirects /login to /user when already authenticated as USER', () => {
      vi.mocked(getSession).mockReturnValue(mockUser as any)
      renderRoutes('/login')
      expect(screen.getByTestId('user-page')).toBeInTheDocument()
      expect(screen.queryByRole('heading', { name: /Login/i })).not.toBeInTheDocument()
    })

    it('redirects /login to /admin when already authenticated as ADMIN', () => {
      vi.mocked(getSession).mockReturnValue(mockAdminUser as any)
      renderRoutes('/login')
      expect(screen.getByTestId('admin-page')).toBeInTheDocument()
    })

    it('redirects /signup to /user when already authenticated as USER', () => {
      vi.mocked(getSession).mockReturnValue(mockUser as any)
      renderRoutes('/signup')
      expect(screen.getByTestId('user-page')).toBeInTheDocument()
    })

    it('redirects /signup to /admin when already authenticated as ADMIN', () => {
      vi.mocked(getSession).mockReturnValue(mockAdminUser as any)
      renderRoutes('/signup')
      expect(screen.getByTestId('admin-page')).toBeInTheDocument()
    })
  })

  // ── Navigation from Home ──────────────────────────────────────────────────

  describe('navigation from the Home page', () => {
    it('navigates to /login when the Login button is clicked', async () => {
      const user = userEvent.setup()
      renderRoutes('/')
      await user.click(screen.getByRole('button', { name: /Login/i }))
      await waitFor(() => {
        expect(screen.getByRole('heading', { name: /Login/i })).toBeInTheDocument()
      })
    })

    it('navigates to /signup when the Sign In button is clicked', async () => {
      const user = userEvent.setup()
      renderRoutes('/')
      await user.click(screen.getByRole('button', { name: /Sign In/i }))
      await waitFor(() => {
        expect(screen.getByRole('heading', { name: /Crear cuenta/i })).toBeInTheDocument()
      })
    })
  })

  // ── Navigation from the Login page ───────────────────────────────────────

  describe('navigation from the Login page', () => {
    it('navigates to /signup when the "Register here" link is clicked', async () => {
      const user = userEvent.setup()
      renderRoutes('/login')
      await user.click(screen.getByRole('button', { name: /Register here/i }))
      await waitFor(() => {
        expect(screen.getByRole('heading', { name: /Crear cuenta/i })).toBeInTheDocument()
      })
    })
  })

  // ── Navigation from the SignUp page ──────────────────────────────────────

  describe('navigation from the SignUp page', () => {
    it('navigates to /login when the "Log in here" link is clicked', async () => {
      const user = userEvent.setup()
      renderRoutes('/signup')
      await user.click(screen.getByRole('button', { name: /Log in here/i }))
      await waitFor(() => {
        expect(screen.getByRole('heading', { name: /Login/i })).toBeInTheDocument()
      })
    })
  })

  // ── Route paths match component associations ──────────────────────────────

  describe('route path to component associations', () => {
    it('/ is associated with the Home component (shows Bienvenido heading)', () => {
      renderRoutes('/')
      expect(screen.getByRole('heading', { name: /Bienvenido/i })).toBeInTheDocument()
    })

    it('/login is associated with the Login component (shows Login heading)', () => {
      renderRoutes('/login')
      expect(screen.getByRole('heading', { name: /Login/i })).toBeInTheDocument()
    })

    it('/signup is associated with the SignUp component (shows Crear cuenta heading)', () => {
      renderRoutes('/signup')
      expect(screen.getByRole('heading', { name: /Crear cuenta/i })).toBeInTheDocument()
    })

    it('/user renders the UserPage component when authenticated', () => {
      vi.mocked(getSession).mockReturnValue(mockUser as any)
      renderRoutes('/user')
      expect(screen.getByTestId('user-page')).toBeInTheDocument()
    })

    it('/admin renders the AdminPage component when authenticated as ADMIN', () => {
      vi.mocked(getSession).mockReturnValue(mockAdminUser as any)
      renderRoutes('/admin')
      expect(screen.getByTestId('admin-page')).toBeInTheDocument()
    })
  })
})

// ── Navbar navigation ─────────────────────────────────────────────────────────

describe('Navbar navigation', () => {
  beforeEach(() => {
    vi.mocked(getSession).mockReturnValue(mockUser as any)
    vi.mocked(logout).mockImplementation(() => {
      vi.mocked(getSession).mockReturnValue(null)
    })
  })

  it('renders null when there is no authenticated session', () => {
    vi.mocked(getSession).mockReturnValue(null)
    render(
      <MemoryRouter>
        <Routes>
          <Route path="/" element={<Navbar />} />
        </Routes>
      </MemoryRouter>
    )
    expect(screen.queryByRole('navigation')).not.toBeInTheDocument()
  })

  it('displays the user first name when a session exists', () => {
    render(
      <MemoryRouter>
        <Routes>
          <Route path="/" element={<Navbar />} />
        </Routes>
      </MemoryRouter>
    )
    expect(screen.getByText('Test')).toBeInTheDocument()
  })

  it('renders a Logout button', () => {
    render(
      <MemoryRouter>
        <Routes>
          <Route path="/" element={<Navbar />} />
        </Routes>
      </MemoryRouter>
    )
    expect(screen.getByRole('button', { name: /Logout/i })).toBeInTheDocument()
  })

  it('navigates to /login when the Logout button is clicked', async () => {
    const user = userEvent.setup()
    render(
      <MemoryRouter initialEntries={['/']}>
        <Routes>
          <Route path="/" element={<Navbar />} />
          <Route path="/login" element={<div data-testid="login-page">Login Page</div>} />
        </Routes>
      </MemoryRouter>
    )
    await user.click(screen.getByRole('button', { name: /Logout/i }))
    await waitFor(() => {
      expect(screen.getByTestId('login-page')).toBeInTheDocument()
    })
  })

  it('calls logout() before navigating away', async () => {
    const user = userEvent.setup()
    render(
      <MemoryRouter initialEntries={['/']}>
        <Routes>
          <Route path="/" element={<Navbar />} />
          <Route path="/login" element={<div>Login</div>} />
        </Routes>
      </MemoryRouter>
    )
    await user.click(screen.getByRole('button', { name: /Logout/i }))
    expect(logout).toHaveBeenCalledOnce()
  })
})
