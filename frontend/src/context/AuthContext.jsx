import { createContext, useContext, useState, useEffect } from 'react'

const AuthContext = createContext()

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      const saved = localStorage.getItem('verinexa_user')
      return saved ? JSON.parse(saved) : null
    } catch {
      return null
    }
  })

  useEffect(() => {
    if (user) {
      localStorage.setItem('verinexa_user', JSON.stringify(user))
    } else {
      localStorage.removeItem('verinexa_user')
    }
  }, [user])

  const login = (userData) => {
    const newUser = {
      name: userData.name || 'Alex Hunter',
      email: userData.email || 'alex.hunter@factcheck.org',
      role: userData.role || 'Senior Intelligence Analyst',
      avatar: userData.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
      verifiedCount: userData.verifiedCount || 42,
      joinedAt: 'March 2026'
    }
    setUser(newUser)
    return newUser
  }

  const logout = () => {
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, isAuthenticated: !!user, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
