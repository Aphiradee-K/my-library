/* eslint-disable react-refresh/only-export-components */
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react'
import { api, clearToken, getToken, setToken } from '../lib/api'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [ready, setReady] = useState(false)
  const [activity, setActivity] = useState([])

  useEffect(() => {
    let cancelled = false

    async function restore() {
      if (!getToken()) {
        setReady(true)
        return
      }

      try {
        const data = await api.me()
        if (!cancelled) setUser(data.user)
      } catch (error) {
        if (error.status === 401) clearToken()
      } finally {
        if (!cancelled) setReady(true)
      }
    }

    restore()
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    if (!user) return undefined

    let cancelled = false

    api
      .listActivity()
      .then((data) => {
        if (!cancelled) setActivity(data.activity)
      })
      .catch((error) => {
        if (cancelled) return
        if (error.status === 401) {
          clearToken()
          setUser(null)
        }
      })

    return () => {
      cancelled = true
    }
  }, [user])

  const applySession = useCallback((data) => {
    setToken(data.token)
    setUser(data.user)
  }, [])

  const register = useCallback(
    async ({ username, displayName, password }) => {
      try {
        const data = await api.register({ username, displayName, password })
        applySession(data)
        return { ok: true }
      } catch (error) {
        return { ok: false, error: error.message }
      }
    },
    [applySession],
  )

  const login = useCallback(
    async ({ username, password }) => {
      try {
        const data = await api.login({ username, password })
        applySession(data)
        return { ok: true }
      } catch (error) {
        return { ok: false, error: error.message }
      }
    },
    [applySession],
  )

  const loginDemo = useCallback(async () => {
    try {
      const data = await api.demo()
      applySession(data)
      return { ok: true }
    } catch (error) {
      return { ok: false, error: error.message }
    }
  }, [applySession])

  const logout = useCallback(async () => {
    try {
      await api.logout()
    } catch {
      /* ออกจากระบบฝั่งเครื่องแม้เซิร์ฟเวอร์จะตอบไม่สำเร็จ */
    }
    clearToken()
    setUser(null)
    setActivity([])
  }, [])

  const value = useMemo(
    () => ({
      user,
      ready,
      activity,
      register,
      login,
      loginDemo,
      logout,
    }),
    [user, ready, activity, register, login, loginDemo, logout],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used inside AuthProvider')
  return context
}
