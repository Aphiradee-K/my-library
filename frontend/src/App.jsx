import Icon from './components/Icon'
import AppShell from './components/AppShell'
import AuthPage from './pages/AuthPage'
import { AuthProvider, useAuth } from './context/AuthContext'

function Gate() {
  const { user, ready } = useAuth()

  if (!ready) {
    return (
      <div className="splash">
        <span className="brand-mark">
          <Icon name="book" size={24} />
        </span>
        <p>กำลังเปิดชั้นหนังสือ...</p>
      </div>
    )
  }

  return user ? <AppShell key={user.id} /> : <AuthPage />
}

export default function App() {
  return (
    <AuthProvider>
      <Gate />
    </AuthProvider>
  )
}
