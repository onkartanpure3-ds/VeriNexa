import { useState } from 'react'
import { Routes, Route } from 'react-router-dom'
import { AnimatePresence } from 'framer-motion'
import { ThemeProvider } from './context/ThemeContext'
import { AuthProvider } from './context/AuthContext'
import Layout from './components/Layout'
import BootLoader from './components/BootLoader'
import Home from './pages/Home'
import Verify from './pages/Verify'
import Results from './pages/Results'
import VerifiedHistory from './pages/VerifiedHistory'
import HowItWorks from './pages/HowItWorks'
import NewsFeed from './pages/NewsFeed'
import SystemStatus from './pages/SystemStatus'

function App() {
  const [booting, setBooting] = useState(true)

  return (
    <ThemeProvider>
      <AuthProvider>
        <AnimatePresence>
          {booting && <BootLoader onComplete={() => setBooting(false)} />}
        </AnimatePresence>
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<Home />} />
            <Route path="verify" element={<Verify />} />
            <Route path="results" element={<Results />} />
            <Route path="history" element={<VerifiedHistory />} />
            <Route path="how-it-works" element={<HowItWorks />} />
            <Route path="news" element={<NewsFeed />} />
            <Route path="status" element={<SystemStatus />} />
          </Route>
        </Routes>
      </AuthProvider>
    </ThemeProvider>
  )
}

export default App
