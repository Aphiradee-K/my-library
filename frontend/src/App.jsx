import AppShell from './components/AppShell'
import AuthPage from './pages/AuthPage'
import { AuthProvider, useAuth } from './context/AuthContext'

function Gate() {
  const { user } = useAuth()
  return user ? <AppShell key={user.id} /> : <AuthPage />
}

export default function App() {
  return (
    <AuthProvider>
      <Gate />
    </AuthProvider>
  )
}
