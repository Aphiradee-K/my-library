import { deviceLabel, load, remove, save } from './storage'

const API_BASE = (import.meta.env.VITE_API_URL || 'http://localhost:5000').replace(
  /\/+$/,
  '',
)

const TOKEN_KEY = 'token'

export class ApiError extends Error {
  constructor(message, status = 0) {
    super(message)
    this.name = 'ApiError'
    this.status = status
  }
}

export function getToken() {
  const token = load(TOKEN_KEY, null)
  return typeof token === 'string' && token ? token : null
}

export function setToken(token) {
  save(TOKEN_KEY, token)
}

export function clearToken() {
  remove(TOKEN_KEY)
}

async function request(path, { method = 'GET', body, auth = true } = {}) {
  const headers = { Accept: 'application/json' }

  if (body !== undefined) {
    headers['Content-Type'] = 'application/json'
  }

  const device = deviceLabel()
  if (device) headers['X-Device'] = device

  if (auth) {
    const token = getToken()
    if (token) headers.Authorization = `Bearer ${token}`
  }

  let response
  try {
    response = await fetch(`${API_BASE}${path}`, {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
    })
  } catch {
    throw new ApiError(
      'เชื่อมต่อเซิร์ฟเวอร์ไม่ได้ กรุณาตรวจสอบว่า backend ทำงานอยู่',
      0,
    )
  }

  let data
  try {
    data = await response.json()
  } catch {
    data = null
  }

  if (!response.ok) {
    throw new ApiError(
      data?.error || 'เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง',
      response.status,
    )
  }

  return data ?? {}
}

export const api = {
  register: (payload) =>
    request('/api/auth/register', {
      method: 'POST',
      body: payload,
      auth: false,
    }),
  login: (payload) =>
    request('/api/auth/login', { method: 'POST', body: payload, auth: false }),
  demo: () => request('/api/auth/demo', { method: 'POST', auth: false }),
  logout: () => request('/api/auth/logout', { method: 'POST' }),
  me: () => request('/api/auth/me'),
  listBooks: () => request('/api/books'),
  createBook: (payload) =>
    request('/api/books', { method: 'POST', body: payload }),
  updateBook: (id, payload) =>
    request(`/api/books/${id}`, { method: 'PATCH', body: payload }),
  deleteBook: (id) => request(`/api/books/${id}`, { method: 'DELETE' }),
  listActivity: () => request('/api/activity'),
  health: () => request('/api/health', { auth: false }),
}
