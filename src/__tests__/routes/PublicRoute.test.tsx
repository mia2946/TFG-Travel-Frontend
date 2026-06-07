import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import PublicRoute from '../../routes/PublicRoute'
import { mockUser, mockAdminUser } from '../mocks/mockData'

vi.mock('../../services/authService', () => ({
  getSession: vi.fn(),
  saveSession: vi.fn(),
  logout: vi.fn(),
}))

import { getSession } from '../../services/authService'

function renderPublic() {
  return render(
    <MemoryRouter initialEntries={['/login']}>
      <Routes>
        <Route
          path="/login"
          element={
            <PublicRoute>
              <div data-testid="login-content">Login Content</div>
            </PublicRoute>
          }
        />
        <Route path="/user" element={<div data-testid="user-page">User Page</div>} />
        <Route path="/admin" element={<div data-testid="admin-page">Admin Page</div>} />
      </Routes>
    </MemoryRouter>
  )
}

describe('PublicRoute', () => {
  beforeEach(() => {
    vi.mocked(getSession).mockReturnValue(null)
  })

  describe('when the user is not authenticated', () => {
    it('renders the children', () => {
      renderPublic()
      expect(screen.getByTestId('login-content')).toBeInTheDocument()
    })

    it('does not redirect', () => {
      renderPublic()
      expect(screen.queryByTestId('user-page')).not.toBeInTheDocument()
      expect(screen.queryByTestId('admin-page')).not.toBeInTheDocument()
    })
  })

  describe('when a USER is already authenticated', () => {
    it('redirects to /user', () => {
      vi.mocked(getSession).mockReturnValue(mockUser as any)
      renderPublic()
      expect(screen.getByTestId('user-page')).toBeInTheDocument()
    })

    it('does not render the public children', () => {
      vi.mocked(getSession).mockReturnValue(mockUser as any)
      renderPublic()
      expect(screen.queryByTestId('login-content')).not.toBeInTheDocument()
    })
  })

  describe('when an ADMIN is already authenticated', () => {
    it('redirects to /admin', () => {
      vi.mocked(getSession).mockReturnValue(mockAdminUser as any)
      renderPublic()
      expect(screen.getByTestId('admin-page')).toBeInTheDocument()
    })

    it('does not render the public children', () => {
      vi.mocked(getSession).mockReturnValue(mockAdminUser as any)
      renderPublic()
      expect(screen.queryByTestId('login-content')).not.toBeInTheDocument()
    })
  })
})
