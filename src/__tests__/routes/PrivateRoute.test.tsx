import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import PrivateRoute from '../../routes/PrivateRoute'
import { mockUser, mockAdminUser } from '../mocks/mockData'

vi.mock('../../services/authService', () => ({
  getSession: vi.fn(),
  saveSession: vi.fn(),
  logout: vi.fn(),
}))

import { getSession } from '../../services/authService'

function renderPrivate(role?: 'ADMIN' | 'USER') {
  return render(
    <MemoryRouter initialEntries={['/protected']}>
      <Routes>
        <Route
          path="/protected"
          element={
            <PrivateRoute role={role}>
              <div data-testid="protected-content">Protected Content</div>
            </PrivateRoute>
          }
        />
        <Route path="/login" element={<div data-testid="login-page">Login Page</div>} />
      </Routes>
    </MemoryRouter>
  )
}

describe('PrivateRoute', () => {
  beforeEach(() => {
    vi.mocked(getSession).mockReturnValue(null)
  })

  describe('when the user is not authenticated', () => {
    it('redirects to /login', () => {
      renderPrivate()
      expect(screen.getByTestId('login-page')).toBeInTheDocument()
    })

    it('does not render the protected children', () => {
      renderPrivate()
      expect(screen.queryByTestId('protected-content')).not.toBeInTheDocument()
    })
  })

  describe('when the user is authenticated with no role restriction', () => {
    it('renders the children for a USER session', () => {
      vi.mocked(getSession).mockReturnValue(mockUser as any)
      renderPrivate()
      expect(screen.getByTestId('protected-content')).toBeInTheDocument()
    })

    it('renders the children for an ADMIN session', () => {
      vi.mocked(getSession).mockReturnValue(mockAdminUser as any)
      renderPrivate()
      expect(screen.getByTestId('protected-content')).toBeInTheDocument()
    })
  })

  describe('when role="USER"', () => {
    it('renders children when the session role is USER', () => {
      vi.mocked(getSession).mockReturnValue(mockUser as any)
      renderPrivate('USER')
      expect(screen.getByTestId('protected-content')).toBeInTheDocument()
    })

    it('redirects to /login when the session role is ADMIN', () => {
      vi.mocked(getSession).mockReturnValue(mockAdminUser as any)
      renderPrivate('USER')
      expect(screen.getByTestId('login-page')).toBeInTheDocument()
    })

    it('does not render children when role is ADMIN', () => {
      vi.mocked(getSession).mockReturnValue(mockAdminUser as any)
      renderPrivate('USER')
      expect(screen.queryByTestId('protected-content')).not.toBeInTheDocument()
    })
  })

  describe('when role="ADMIN"', () => {
    it('renders children when the session role is ADMIN', () => {
      vi.mocked(getSession).mockReturnValue(mockAdminUser as any)
      renderPrivate('ADMIN')
      expect(screen.getByTestId('protected-content')).toBeInTheDocument()
    })

    it('redirects to /login when the session role is USER', () => {
      vi.mocked(getSession).mockReturnValue(mockUser as any)
      renderPrivate('ADMIN')
      expect(screen.getByTestId('login-page')).toBeInTheDocument()
    })

    it('does not render children when role is USER', () => {
      vi.mocked(getSession).mockReturnValue(mockUser as any)
      renderPrivate('ADMIN')
      expect(screen.queryByTestId('protected-content')).not.toBeInTheDocument()
    })
  })
})
