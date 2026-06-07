import { describe, it, expect, vi, beforeEach } from 'vitest'

const BASE = 'http://localhost:8080'
const LOGIN_PATH = '/users/login'
const USERS_ALL_PATH = '/users/all'
const USERS_CREATE_PATH = '/users/'

const backendUserFixture = {
  id: 42,
  firstName: 'Maria',
  lastName: 'Garcia',
  email: 'maria@example.com',
  passwordHash: 'abc123hash',
  phone: '+34600111222',
  role: 'USER' as const,
  registrationDate: '2025-06-01T10:00:00Z',
  language: 'ES',
  country: 'Spain',
}

function mockFetch(data: unknown, ok = true, status = 200) {
  return vi.spyOn(global, 'fetch').mockResolvedValue({
    ok,
    status,
    statusText: ok ? 'OK' : 'Error',
    json: async () => data,
    text: async () => JSON.stringify(data),
  } as Response)
}

describe('userService', () => {
  beforeEach(async () => {
    vi.restoreAllMocks()
    localStorage.clear()
    // Reset module-level usersCache between tests
    vi.resetModules()
  })

  describe('login', () => {
    it('calls fetch with the login URL', async () => {
      const fetchSpy = mockFetch(backendUserFixture)
      const { login } = await import('../../services/userService')
      await login('maria@example.com', 'secret')
      const calledUrl: string = fetchSpy.mock.calls[0][0] as string
      expect(calledUrl).toContain(`${BASE}${LOGIN_PATH}`)
    })

    it('sends username as a query parameter', async () => {
      const fetchSpy = mockFetch(backendUserFixture)
      const { login } = await import('../../services/userService')
      await login('maria@example.com', 'secret')
      const calledUrl: string = fetchSpy.mock.calls[0][0] as string
      expect(calledUrl).toContain('username=maria%40example.com')
    })

    it('sends password hash (not plaintext) as a query parameter', async () => {
      const fetchSpy = mockFetch(backendUserFixture)
      const { login } = await import('../../services/userService')
      await login('maria@example.com', 'secret')
      const calledUrl: string = fetchSpy.mock.calls[0][0] as string
      expect(calledUrl).toContain('password=')
      expect(calledUrl).not.toContain('password=secret')
    })

    it('uses GET method', async () => {
      const fetchSpy = mockFetch(backendUserFixture)
      const { login } = await import('../../services/userService')
      await login('maria@example.com', 'secret')
      const opts = fetchSpy.mock.calls[0][1] as RequestInit
      expect(opts.method).toBe('GET')
    })

    it('maps backend user fields to frontend User shape', async () => {
      mockFetch(backendUserFixture)
      const { login } = await import('../../services/userService')
      const user = await login('maria@example.com', 'secret')
      expect(user).not.toBeNull()
      expect(user!.id).toBe(42)
      expect(user!.firstName).toBe('Maria')
      expect(user!.lastName).toBe('Garcia')
      expect(user!.email).toBe('maria@example.com')
      expect(user!.username).toBe('maria@example.com')
      expect(user!.phone).toBe('+34600111222')
      expect(user!.country).toBe('Spain')
      expect(user!.language).toBe('ES')
      expect(user!.rol).toBe('USER')
    })

    it('saves session after successful login', async () => {
      mockFetch(backendUserFixture)
      const { login } = await import('../../services/userService')
      await login('maria@example.com', 'secret')
      const session = JSON.parse(localStorage.getItem('session')!)
      expect(session.email).toBe('maria@example.com')
    })

    it('returns null on 401 response', async () => {
      mockFetch({}, false, 401)
      const { login } = await import('../../services/userService')
      const result = await login('wrong@example.com', 'wrong')
      expect(result).toBeNull()
    })

    it('returns null on 404 response', async () => {
      mockFetch({}, false, 404)
      const { login } = await import('../../services/userService')
      const result = await login('notfound@example.com', 'pass')
      expect(result).toBeNull()
    })
  })

  describe('loadUsers', () => {
    it('fetches the correct users/all URL', async () => {
      const fetchSpy = mockFetch([backendUserFixture])
      const { loadUsers } = await import('../../services/userService')
      await loadUsers()
      const calledUrl: string = fetchSpy.mock.calls[0][0] as string
      expect(calledUrl).toBe(`${BASE}${USERS_ALL_PATH}`)
    })

    it('uses GET method', async () => {
      const fetchSpy = mockFetch([backendUserFixture])
      const { loadUsers } = await import('../../services/userService')
      await loadUsers()
      const opts = fetchSpy.mock.calls[0][1] as RequestInit
      expect(opts.method).toBe('GET')
    })

    it('maps each backend user to frontend User shape', async () => {
      mockFetch([backendUserFixture])
      const { loadUsers } = await import('../../services/userService')
      const users = await loadUsers()
      expect(users).toHaveLength(1)
      expect(users[0].id).toBe(42)
      expect(users[0].email).toBe('maria@example.com')
      expect(users[0].rol).toBe('USER')
    })

    it('returns cached result without extra fetch on second call', async () => {
      const fetchSpy = mockFetch([backendUserFixture])
      const { loadUsers } = await import('../../services/userService')
      await loadUsers()
      await loadUsers()
      expect(fetchSpy).toHaveBeenCalledTimes(1)
    })

    it('cache is cleared after clearUsersCache is called', async () => {
      const fetchSpy = mockFetch([backendUserFixture])
      const { loadUsers, clearUsersCache } = await import('../../services/userService')
      await loadUsers()
      clearUsersCache()
      await loadUsers()
      expect(fetchSpy).toHaveBeenCalledTimes(2)
    })
  })

  describe('register', () => {
    const registerData = {
      password: 'newPass123',
      email: 'new@example.com',
      firstName: 'New',
      lastName: 'User',
      phone: '+34600999888',
      country: 'Spain',
      language: 'ES',
    }

    it('calls fetch with the users create URL', async () => {
      const fetchSpy = mockFetch(backendUserFixture)
      const { register } = await import('../../services/userService')
      await register(registerData)
      const calledUrl: string = fetchSpy.mock.calls[0][0] as string
      expect(calledUrl).toBe(`${BASE}${USERS_CREATE_PATH}`)
    })

    it('uses POST method', async () => {
      const fetchSpy = mockFetch(backendUserFixture)
      const { register } = await import('../../services/userService')
      await register(registerData)
      const opts = fetchSpy.mock.calls[0][1] as RequestInit
      expect(opts.method).toBe('POST')
    })

    it('sends JSON body with firstName, lastName, email', async () => {
      const fetchSpy = mockFetch(backendUserFixture)
      const { register } = await import('../../services/userService')
      await register(registerData)
      const opts = fetchSpy.mock.calls[0][1] as RequestInit
      const body = JSON.parse(opts.body as string)
      expect(body.firstName).toBe('New')
      expect(body.lastName).toBe('User')
      expect(body.email).toBe('new@example.com')
    })

    it('sends passwordHash (not plaintext) in the body', async () => {
      const fetchSpy = mockFetch(backendUserFixture)
      const { register } = await import('../../services/userService')
      await register(registerData)
      const opts = fetchSpy.mock.calls[0][1] as RequestInit
      const body = JSON.parse(opts.body as string)
      expect(body.passwordHash).toBeDefined()
      expect(body.passwordHash).not.toBe('newPass123')
    })

    it('sends role: USER in the body', async () => {
      const fetchSpy = mockFetch(backendUserFixture)
      const { register } = await import('../../services/userService')
      await register(registerData)
      const opts = fetchSpy.mock.calls[0][1] as RequestInit
      const body = JSON.parse(opts.body as string)
      expect(body.role).toBe('USER')
    })

    it('returns a mapped frontend User on success', async () => {
      mockFetch(backendUserFixture)
      const { register } = await import('../../services/userService')
      const user = await register(registerData)
      expect(user.id).toBe(42)
      expect(user.email).toBe('maria@example.com')
    })

    it('clears the users cache after successful registration', async () => {
      const fetchSpy = mockFetch([backendUserFixture])
      const { loadUsers, clearUsersCache } = await import('../../services/userService')
      await loadUsers()

      vi.restoreAllMocks()
      mockFetch(backendUserFixture)
      const { register } = await import('../../services/userService')
      await register(registerData)

      // After register, cache was cleared — next loadUsers must fetch again
      vi.restoreAllMocks()
      const fetchSpy2 = mockFetch([backendUserFixture])
      await loadUsers()
      expect(fetchSpy2).toHaveBeenCalledTimes(1)
    })
  })
})
