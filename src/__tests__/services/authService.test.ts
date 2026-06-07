import { describe, it, expect, beforeEach } from 'vitest'
import { saveSession, getSession, logout } from '../../services/authService'
import type { User } from '../../utils/csvParser'

const mockUser: User = {
  id: 1,
  username: 'john@example.com',
  password: 'secret123',
  email: 'john@example.com',
  firstName: 'John',
  lastName: 'Doe',
  phone: '+34600000000',
  country: 'Spain',
  language: 'ES',
  active: true,
  rol: 'USER',
  fecha: '2025-01-01',
}

describe('authService', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  describe('saveSession', () => {
    it('persists user data in localStorage under the "session" key', () => {
      saveSession(mockUser)
      expect(localStorage.getItem('session')).not.toBeNull()
    })

    it('strips the password field before saving', () => {
      saveSession(mockUser)
      const stored = JSON.parse(localStorage.getItem('session')!)
      expect(stored.password).toBeUndefined()
    })

    it('preserves all other user fields', () => {
      saveSession(mockUser)
      const stored = JSON.parse(localStorage.getItem('session')!)
      expect(stored.id).toBe(1)
      expect(stored.username).toBe('john@example.com')
      expect(stored.email).toBe('john@example.com')
      expect(stored.firstName).toBe('John')
      expect(stored.lastName).toBe('Doe')
      expect(stored.phone).toBe('+34600000000')
      expect(stored.country).toBe('Spain')
      expect(stored.language).toBe('ES')
      expect(stored.rol).toBe('USER')
    })

    it('does not mutate the original user object', () => {
      saveSession(mockUser)
      expect(mockUser.password).toBe('secret123')
    })

    it('overwrites an existing session', () => {
      saveSession(mockUser)
      const updatedUser = { ...mockUser, firstName: 'Jane' }
      saveSession(updatedUser)
      const stored = JSON.parse(localStorage.getItem('session')!)
      expect(stored.firstName).toBe('Jane')
    })
  })

  describe('getSession', () => {
    it('returns null when no session is stored', () => {
      expect(getSession()).toBeNull()
    })

    it('returns the stored user object after saveSession', () => {
      saveSession(mockUser)
      const session = getSession()
      expect(session).not.toBeNull()
      expect(session!.id).toBe(1)
      expect(session!.email).toBe('john@example.com')
    })

    it('returns null when localStorage contains invalid JSON', () => {
      localStorage.setItem('session', 'not-valid-json')
      expect(() => getSession()).toThrow()
    })
  })

  describe('logout', () => {
    it('removes the session from localStorage', () => {
      saveSession(mockUser)
      logout()
      expect(localStorage.getItem('session')).toBeNull()
    })

    it('returns undefined and does not throw when no session exists', () => {
      expect(() => logout()).not.toThrow()
    })

    it('getSession returns null after logout', () => {
      saveSession(mockUser)
      logout()
      expect(getSession()).toBeNull()
    })
  })
})
