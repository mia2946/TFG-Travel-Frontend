import { describe, it, expect, vi, beforeEach } from 'vitest'
import { apiRequest } from '../../services/apiClient'

const BASE = 'http://localhost:8080/test'

function mockFetch(data: unknown, ok = true, status = 200, statusText = 'OK') {
  return vi.spyOn(global, 'fetch').mockResolvedValue({
    ok,
    status,
    statusText,
    json: async () => data,
    text: async () => (typeof data === 'string' ? data : JSON.stringify(data)),
  } as Response)
}

describe('apiClient – apiRequest', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  it('calls fetch with the provided URL', async () => {
    const fetchSpy = mockFetch({ ok: true })
    await apiRequest(BASE, { method: 'GET' })
    expect(fetchSpy).toHaveBeenCalledWith(BASE, expect.any(Object))
  })

  it('sets Content-Type: application/json by default', async () => {
    const fetchSpy = mockFetch({})
    await apiRequest(BASE, { method: 'GET' })
    const opts = fetchSpy.mock.calls[0][1] as RequestInit
    expect((opts.headers as Record<string, string>)['Content-Type']).toBe('application/json')
  })

  it('uses the supplied HTTP method', async () => {
    const fetchSpy = mockFetch({})
    await apiRequest(BASE, { method: 'POST' })
    const opts = fetchSpy.mock.calls[0][1] as RequestInit
    expect(opts.method).toBe('POST')
  })

  it('does not attach a body for GET requests', async () => {
    const fetchSpy = mockFetch({})
    await apiRequest(BASE, { method: 'GET', body: { foo: 'bar' } })
    const opts = fetchSpy.mock.calls[0][1] as RequestInit
    expect(opts.body).toBeUndefined()
  })

  it('serializes body to JSON for POST requests', async () => {
    const fetchSpy = mockFetch({ id: 1 })
    const body = { name: 'Paris', lat: 48.8566 }
    await apiRequest(BASE, { method: 'POST', body })
    const opts = fetchSpy.mock.calls[0][1] as RequestInit
    expect(opts.body).toBe(JSON.stringify(body))
  })

  it('serializes body to JSON for PUT requests', async () => {
    const fetchSpy = mockFetch({ id: 2 })
    const body = { name: 'Updated' }
    await apiRequest(BASE, { method: 'PUT', body })
    const opts = fetchSpy.mock.calls[0][1] as RequestInit
    expect(opts.body).toBe(JSON.stringify(body))
  })

  it('returns the parsed JSON response on success', async () => {
    const data = { id: 42, name: 'Hotel Paris' }
    mockFetch(data)
    const result = await apiRequest(BASE, { method: 'GET' })
    expect(result).toEqual(data)
  })

  it('merges custom headers with the default Content-Type', async () => {
    const fetchSpy = mockFetch({})
    await apiRequest(BASE, {
      method: 'GET',
      headers: { Authorization: 'Bearer token-abc' },
    })
    const opts = fetchSpy.mock.calls[0][1] as RequestInit
    const headers = opts.headers as Record<string, string>
    expect(headers['Content-Type']).toBe('application/json')
    expect(headers['Authorization']).toBe('Bearer token-abc')
  })

  it('custom headers override defaults when keys match', async () => {
    const fetchSpy = mockFetch({})
    await apiRequest(BASE, {
      method: 'GET',
      headers: { 'Content-Type': 'text/plain' },
    })
    const opts = fetchSpy.mock.calls[0][1] as RequestInit
    const headers = opts.headers as Record<string, string>
    expect(headers['Content-Type']).toBe('text/plain')
  })

  it('throws when the response is not ok (4xx)', async () => {
    mockFetch('Not Found', false, 404, 'Not Found')
    await expect(apiRequest(BASE, { method: 'GET' })).rejects.toThrow('404')
  })

  it('throws when the response is not ok (5xx)', async () => {
    mockFetch('Server Error', false, 500, 'Internal Server Error')
    await expect(apiRequest(BASE, { method: 'GET' })).rejects.toThrow('500')
  })
})
