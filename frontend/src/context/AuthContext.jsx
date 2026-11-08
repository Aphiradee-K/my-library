/* eslint-disable react-refresh/only-export-components */
import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from 'react'
import {
  deviceLabel,
  hashPassword,
  load,
  makeSalt,
  remove,
  save,
  uid,
} from '../lib/storage'
import { demoBooks } from '../lib/seed'

const AuthContext = createContext(null)

const USERS_KEY = 'users'
const SESSION_KEY = 'session'
const ACTIVITY_KEY = 'activity'

function readUsers() {
  const users = load(USERS_KEY, [])
  return Array.isArray(users) ? users : []
}

function readActivity(userId) {
  if (!userId) return []
  const all = load(ACTIVITY_KEY, {})
  const list = all[userId]
  return Array.isArray(list) ? list : []
}

function logActivity(userId, type) {
  const all = load(ACTIVITY_KEY, {})
  const entry = {
    id: uid(),
    type,
    at: new Date().toISOString(),
    device: deviceLabel(),
  }
  all[userId] = [entry, ...readActivity(userId)].slice(0, 100)
  save(ACTIVITY_KEY, all)
  return entry
}

function publicUser(record) {
  return {
    id: record.id,
    username: record.username,
    displayName: record.displayName,
    createdAt: record.createdAt,
  }
}

const USERNAME_RE = /^[a-zA-Z0-9._-]{3,20}$/

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const session = load(SESSION_KEY, null)
    if (!session?.userId) return null

    const found = readUsers().find((item) => item.id === session.userId)
    if (!found) {
      remove(SESSION_KEY)
      return null
    }
    return publicUser(found)
  })

  const activity = useMemo(() => readActivity(user?.id), [user])

  const register = useCallback(
    async ({ username, displayName, password }) => {
      const clean = username.trim()
      if (!USERNAME_RE.test(clean)) {
        return {
          ok: false,
          error: 'ชื่อผู้ใช้ต้องเป็น a-z, 0-9, จุด หรือขีดล่าง 3–20 ตัวอักษร',
        }
      }
      if (password.length < 6) {
        return { ok: false, error: 'รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร' }
      }

      const users = readUsers()
      if (users.some((item) => item.username === clean.toLowerCase())) {
        return { ok: false, error: 'ชื่อผู้ใช้นี้ถูกใช้แล้ว' }
      }

      const salt = makeSalt()
      const passwordHash = await hashPassword(password, salt)
      const record = {
        id: uid(),
        username: clean.toLowerCase(),
        displayName: displayName.trim() || clean,
        salt,
        passwordHash,
        createdAt: new Date().toISOString(),
      }

      save(USERS_KEY, [...users, record])
      save(`books.${record.id}`, [])
      save(SESSION_KEY, {
        userId: record.id,
        startedAt: new Date().toISOString(),
      })
      logActivity(record.id, 'register')
      setUser(publicUser(record))
      return { ok: true }
    },
    [],
  )

  const login = useCallback(async ({ username, password }) => {
    const clean = username.trim().toLowerCase()
    const found = readUsers().find((item) => item.username === clean)

    if (!found) {
      return { ok: false, error: 'ไม่พบบัญชีนี้ในระบบ' }
    }

    const passwordHash = await hashPassword(password, found.salt)
    if (passwordHash !== found.passwordHash) {
      return { ok: false, error: 'รหัสผ่านไม่ถูกต้อง' }
    }

    save(SESSION_KEY, { userId: found.id, startedAt: new Date().toISOString() })
    logActivity(found.id, 'login')
    setUser(publicUser(found))
    return { ok: true }
  }, [])

  const loginDemo = useCallback(async () => {
    const users = readUsers()
    let found = users.find((item) => item.username === 'demo')

    if (!found) {
      const salt = makeSalt()
      found = {
        id: uid(),
        username: 'demo',
        displayName: 'นักอ่านตัวอย่าง',
        salt,
        passwordHash: await hashPassword('demo1234', salt),
        createdAt: new Date().toISOString(),
      }
      save(USERS_KEY, [...users, found])
      save(`books.${found.id}`, demoBooks())
    }

    save(SESSION_KEY, { userId: found.id, startedAt: new Date().toISOString() })
    logActivity(found.id, 'login')
    setUser(publicUser(found))
    return { ok: true }
  }, [])

  const logout = useCallback(() => {
    if (user) logActivity(user.id, 'logout')
    remove(SESSION_KEY)
    setUser(null)
  }, [user])

  const value = useMemo(
    () => ({
      user,
      activity,
      register,
      login,
      loginDemo,
      logout,
    }),
    [user, activity, register, login, loginDemo, logout],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used inside AuthProvider')
  return context
}
