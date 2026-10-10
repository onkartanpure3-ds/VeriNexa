import { useState, useEffect } from 'react'
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom'
import { 
  Home, Sparkles, Newspaper, History, HelpCircle, Activity, 
  Sun, Moon, User, LogOut, Menu, X, ChevronDown, CheckCircle2, Shield
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useTheme } from '../context/ThemeContext'
import { useAuth } from '../context/AuthContext'
import AuthModal from './AuthModal'

export default function Layout() {
  const location = useLocation()
  const navigate = useNavigate()
  const { theme, toggleTheme, isDark } = useTheme()
  const { user, isAuthenticated, logout } = useAuth()
  
  const [authModalOpen, setAuthModalOpen] = useState(false)
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  // Navigation Items
  const navItems = [
    { path: '/', label: 'Home', icon: <Home size={15} /> },
    { path: '/verify', label: 'Verify', icon: <Sparkles size={15} /> },
    { path: '/news', label: 'News / Blog', icon: <Newspaper size={15} /> },
    { path: '/history', label: 'History', icon: <History size={15} /> },
    { path: '/how-it-works', label: 'How It Works', icon: <HelpCircle size={15} /> },
    { path: '/status', label: 'System Engine', icon: <Activity size={15} /> },
  ]

  // Close menus on route change
  useEffect(() => {
    setMobileMenuOpen(false)
    setProfileDropdownOpen(false)
  }, [location.pathname])

  return (
    <>
      {/* ─── Glowing Top Square Box Net Overlay ───────────────────── */}
      <div className="bg-top-accent-net" aria-hidden="true" />

      {/* ─── Fixed Transparent Glass Navbar ───────────────────────── */}
      <header style={{ 
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 1000,
        width: '100%',
        borderBottom: '1px solid var(--color-border)',
        background: 'var(--navbar-bg)',
        backdropFilter: 'blur(28px) saturate(180%)',
        WebkitBackdropFilter: 'blur(28px) saturate(180%)',
        boxShadow: isDark ? '0 4px 20px -2px rgba(0, 0, 0, 0.4)' : '0 2px 16px -2px rgba(0, 0, 0, 0.05)',
        transition: 'background-color 0.3s ease, border-color 0.3s ease'
      }}>
        <div className="container" style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          height: '4.75rem',
          gap: '2rem',
          maxWidth: '1240px'
        }}>
          
          {/* 1. Brand Logo & Title */}
          <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', textDecoration: 'none', flexShrink: 0 }}>
            <div style={{
              width: '2.75rem',
              height: '2.75rem',
              borderRadius: '0.85rem',
              background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.2), rgba(37, 99, 235, 0.4))',
              border: '1px solid rgba(59, 130, 246, 0.35)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 0 20px rgba(59, 130, 246, 0.3)',
              overflow: 'hidden'
            }}>
              <img 
                src="/logo.png" 
                alt="VeriNexa" 
                style={{ width: '85%', height: '85%', objectFit: 'contain' }}
              />
            </div>

            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                <span className="brand-title" style={{ 
                  fontSize: '1.45rem', 
                  fontWeight: 900, 
                  letterSpacing: '-0.03em', 
                  fontFamily: 'var(--font-display)',
                  color: 'var(--color-text)'
                }}>
                  Veri<span className="text-gradient-multi">Nexa</span>
                </span>
              </div>
              <div className="brand-subtitle" style={{ fontSize: '0.72rem', color: 'var(--color-text-dim)', letterSpacing: '0.02em', marginTop: '-2px' }}>
                Trust Score & Live Verification
              </div>
            </div>
          </Link>

          {/* 2. Semi-rounded Rectangle Scroll-Switch Tabs with Spacing */}
          <nav 
            className="desktop-nav"
            style={{ 
              display: 'flex', 
              alignItems: 'center',
              background: 'var(--nav-track-bg)',
              border: '1px solid var(--color-border)',
              borderRadius: '9999px',
              padding: '0.35rem 0.4rem',
              gap: '0.35rem',
              position: 'relative',
              boxShadow: isDark ? 'inset 0 1px 3px rgba(0, 0, 0, 0.4)' : 'inset 0 1px 3px rgba(0, 0, 0, 0.05)',
              margin: '0 0.5rem'
            }}
          >
            {navItems.map((item) => {
              const isActive = location.pathname === item.path

              return (
                <Link
                  key={item.path}
                  to={item.path}
                  style={{
                    position: 'relative',
                    padding: '0.55rem 1.15rem',
                    borderRadius: '9999px',
                    fontSize: '0.88rem',
                    fontWeight: isActive ? 700 : 500,
                    color: isActive ? 'var(--nav-text-active)' : 'var(--nav-text-inactive)',
                    textDecoration: 'none',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.45rem',
                    zIndex: 1,
                    transition: 'color 0.2s ease',
                    whiteSpace: 'nowrap'
                  }}
                >
                  {/* Semi-rounded Rectangle Indicator */}
                  {isActive && (
                    <motion.div
                      layoutId="navbar-tab-indicator"
                      style={{
                        position: 'absolute',
                        inset: 0,
                        borderRadius: '9999px',
                        background: 'var(--nav-indicator-bg)',
                        boxShadow: 'var(--nav-indicator-shadow)',
                        zIndex: -1
                      }}
                      transition={{ type: 'spring', stiffness: 420, damping: 32 }}
                    />
                  )}
                  {item.icon}
                  <span>{item.label}</span>
                </Link>
              )
            })}
          </nav>

          {/* 3. Right Controls: Theme Toggle & Authentication */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', flexShrink: 0 }}>
            
            {/* Theme Toggle Button */}
            <motion.button
              whileTap={{ scale: 0.92 }}
              onClick={toggleTheme}
              title={`Switch to ${isDark ? 'light' : 'dark'} mode`}
              style={{
                width: '2.5rem',
                height: '2.5rem',
                borderRadius: '0.75rem',
                background: 'var(--color-bg-elevated)',
                border: '1px solid var(--color-border)',
                color: isDark ? '#fbbf24' : '#2563eb',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: 'var(--shadow-sm)',
                cursor: 'pointer'
              }}
            >
              <AnimatePresence mode="wait" initial={false}>
                <motion.div
                  key={theme}
                  initial={{ rotate: -90, opacity: 0, scale: 0.8 }}
                  animate={{ rotate: 0, opacity: 1, scale: 1 }}
                  exit={{ rotate: 90, opacity: 0, scale: 0.8 }}
                  transition={{ duration: 0.2 }}
                >
                  {isDark ? <Sun size={18} /> : <Moon size={18} />}
                </motion.div>
              </AnimatePresence>
            </motion.button>

            {/* Authentication Controls */}
            {isAuthenticated ? (
              <div style={{ position: 'relative' }}>
                <button
                  onClick={() => setProfileDropdownOpen(prev => !prev)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.6rem',
                    padding: '0.35rem 0.85rem 0.35rem 0.4rem',
                    borderRadius: '9999px',
                    background: 'var(--color-bg-elevated)',
                    border: '1px solid var(--color-border)',
                    cursor: 'pointer',
                    boxShadow: 'var(--shadow-sm)'
                  }}
                >
                  <img
                    src={user.avatar}
                    alt={user.name}
                    style={{ width: '28px', height: '28px', borderRadius: '50%', objectFit: 'cover' }}
                  />
                  <div style={{ textAlign: 'left', display: 'none' }} className="user-text-pill">
                    <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--color-text)', display: 'block', lineHeight: 1.2 }}>
                      {user.name.split(' ')[0]}
                    </span>
                  </div>
                  <ChevronDown size={14} color="var(--color-text-dim)" />
                </button>

                {/* Profile Dropdown Menu */}
                <AnimatePresence>
                  {profileDropdownOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.95 }}
                      transition={{ duration: 0.2 }}
                      className="glass-panel"
                      style={{
                        position: 'absolute',
                        right: 0,
                        top: '115%',
                        width: '260px',
                        padding: '1.25rem',
                        background: 'var(--color-bg-elevated)',
                        zIndex: 60,
                        boxShadow: 'var(--shadow-lg)',
                        borderRadius: 'var(--radius-lg)'
                      }}
                    >
                      {/* User Info Header */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem', paddingBottom: '0.75rem', borderBottom: '1px solid var(--color-border)' }}>
                        <img src={user.avatar} alt={user.name} style={{ width: '40px', height: '40px', borderRadius: '50%', objectFit: 'cover' }} />
                        <div>
                          <div style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--color-text)' }}>{user.name}</div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>{user.email}</div>
                          <span style={{
                            display: 'inline-block',
                            marginTop: '0.2rem',
                            fontSize: '0.68rem',
                            fontWeight: 600,
                            padding: '0.1rem 0.45rem',
                            borderRadius: '4px',
                            background: 'var(--badge-bg)',
                            color: 'var(--badge-text)'
                          }}>
                            {user.role}
                          </span>
                        </div>
                      </div>

                      {/* Menu Links */}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                        <Link
                          to="/history"
                          onClick={() => setProfileDropdownOpen(false)}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.6rem',
                            padding: '0.55rem 0.75rem',
                            borderRadius: 'var(--radius-md)',
                            color: 'var(--color-text)',
                            fontSize: '0.88rem',
                            fontWeight: 500
                          }}
                          className="dropdown-item"
                        >
                          <History size={16} color="#3b82f6" />
                          <span>My Verified History</span>
                        </Link>

                        <button
                          onClick={() => {
                            logout()
                            setProfileDropdownOpen(false)
                          }}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.6rem',
                            padding: '0.55rem 0.75rem',
                            borderRadius: 'var(--radius-md)',
                            color: '#ef4444',
                            fontSize: '0.88rem',
                            fontWeight: 600,
                            width: '100%',
                            textAlign: 'left'
                          }}
                          className="dropdown-item"
                        >
                          <LogOut size={16} />
                          <span>Sign Out</span>
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ) : (
              <button
                className="btn btn-primary"
                onClick={() => setAuthModalOpen(true)}
                style={{
                  padding: '0.55rem 1.35rem',
                  fontSize: '0.88rem',
                  borderRadius: '9999px',
                  boxShadow: 'var(--shadow-sm)'
                }}
              >
                <User size={15} /> Sign In
              </button>
            )}

            {/* Mobile Hamburger Toggle */}
            <button
              className="mobile-hamburger"
              onClick={() => setMobileMenuOpen(prev => !prev)}
              style={{
                width: '2.5rem',
                height: '2.5rem',
                borderRadius: '0.75rem',
                background: 'var(--color-bg-elevated)',
                border: '1px solid var(--color-border)',
                color: 'var(--color-text)',
                display: 'none',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer'
              }}
            >
              {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>

        </div>

        {/* 4. Mobile Drawer Menu */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.25 }}
              style={{
                overflow: 'hidden',
                background: 'var(--color-bg-elevated)',
                borderTop: '1px solid var(--color-border)',
                padding: '1rem 1.5rem'
              }}
            >
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {navItems.map((item) => {
                  const isActive = location.pathname === item.path
                  return (
                    <Link
                      key={item.path}
                      to={item.path}
                      onClick={() => setMobileMenuOpen(false)}
                      style={{
                        padding: '0.75rem 1rem',
                        borderRadius: 'var(--radius-md)',
                        background: isActive ? 'var(--badge-bg)' : 'transparent',
                        color: isActive ? 'var(--color-primary)' : 'var(--color-text-muted)',
                        fontWeight: isActive ? 700 : 500,
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.6rem',
                        textDecoration: 'none'
                      }}
                    >
                      {item.icon}
                      <span>{item.label}</span>
                    </Link>
                  )
                })}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      {/* Main Page Body with Distance from Locked Navbar */}
      <main className="page-container" style={{ minHeight: 'calc(100vh - 4.75rem - 12rem)' }}>
        <AnimatePresence mode="wait">
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, y: 14, filter: 'blur(3px)' }}
            animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
            exit={{ opacity: 0, y: -10, filter: 'blur(3px)' }}
            transition={{ duration: 0.32, ease: [0.16, 1, 0.3, 1] }}
            style={{ width: '100%', maxWidth: '100vw', overflowX: 'hidden' }}
          >
            <Outlet />
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Footer */}
      <footer style={{ 
        borderTop: '1px solid var(--color-border)', 
        padding: '2.5rem 0 1.75rem', 
        marginTop: 'auto',
        background: 'var(--color-bg-secondary)',
        transition: 'background-color 0.3s ease, border-color 0.3s ease'
      }}>
        <div className="container" style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem', maxWidth: '1200px' }}>
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'flex-start', 
            flexWrap: 'wrap', 
            gap: '2rem' 
          }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem' }}>
                <img src="/logo.png" alt="VeriNexa" style={{ width: '28px', height: '28px', objectFit: 'contain' }} />
                <span style={{ fontWeight: 800, fontSize: '1.25rem', color: 'var(--color-text)', fontFamily: 'var(--font-display)' }}>
                  Veri<span className="text-gradient-multi">Nexa</span>
                </span>
              </div>
              <p style={{ color: 'var(--color-text-muted)', fontSize: '0.88rem', maxWidth: '420px', lineHeight: 1.6, marginBottom: '0.9rem' }}>
                Empowering readers, researchers, and journalists with instant factual claim verification, live multi-source evidence cross-referencing, and unbiased truth discovery to combat online misinformation.
              </p>
              <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap' }}>
                <span style={{ fontSize: '0.75rem', padding: '0.2rem 0.6rem', borderRadius: '9999px', background: 'var(--color-cyan-bg)', border: '1px solid var(--color-cyan-border)', color: 'var(--color-cyan)', fontWeight: 600 }}>
                  ✓ 100% Free Public Verification
                </span>
                <span style={{ fontSize: '0.75rem', padding: '0.2rem 0.6rem', borderRadius: '9999px', background: 'var(--color-success-bg)', border: '1px solid var(--color-success-border)', color: 'var(--color-success)', fontWeight: 600 }}>
                  ✓ Live Evidence Consensus
                </span>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '3rem', flexWrap: 'wrap' }}>
              <div>
                <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--color-text)', textTransform: 'uppercase', marginBottom: '0.75rem', letterSpacing: '0.05em' }}>
                  Platform
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.88rem' }}>
                  <Link to="/" style={{ color: 'var(--color-text-muted)' }}>Home</Link>
                  <Link to="/verify" style={{ color: 'var(--color-text-muted)' }}>Verify Claim</Link>
                  <Link to="/news" style={{ color: 'var(--color-text-muted)' }}>Daily News</Link>
                  <Link to="/history" style={{ color: 'var(--color-text-muted)' }}>Verified History</Link>
                </div>
              </div>

              <div>
                <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--color-text)', textTransform: 'uppercase', marginBottom: '0.75rem', letterSpacing: '0.05em' }}>
                  Knowledge & Trust
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.88rem' }}>
                  <Link to="/how-it-works" style={{ color: 'var(--color-text-muted)' }}>How It Works</Link>
                  <Link to="/status" style={{ color: 'var(--color-text-muted)' }}>System Engine</Link>
                  <a href="http://localhost:8000/docs" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--color-text-muted)' }}>API Documentation</a>
                </div>
              </div>
            </div>
          </div>

          <div style={{ 
            borderTop: '1px solid var(--color-border)', 
            paddingTop: '1.5rem',
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center', 
            flexWrap: 'wrap', 
            gap: '1rem',
            fontSize: '0.8rem',
            color: 'var(--color-text-dim)'
          }}>
            <div>© 2026 VeriNexa Platform. Dedicated to public truth and factual integrity.</div>
            <div style={{ display: 'flex', gap: '1.25rem', flexWrap: 'wrap' }}>
              <span>Real-Time Multi-Source Consensus</span>
              <span>•</span>
              <span>Unbiased Evidence Ranking</span>
              <span>•</span>
              <span>Global Public Reach</span>
            </div>
          </div>
        </div>
      </footer>

      {/* Auth Modal */}
      <AuthModal isOpen={authModalOpen} onClose={() => setAuthModalOpen(false)} />

      {/* Responsive Styles */}
      <style>{`
        @media (max-width: 960px) {
          .desktop-nav {
            display: none !important;
          }
          .mobile-hamburger {
            display: flex !important;
          }
        }
        @media (max-width: 480px) {
          .brand-subtitle {
            display: none !important;
          }
          .brand-title {
            font-size: 1.2rem !important;
          }
        }
        @media (min-width: 640px) {
          .user-text-pill {
            display: block !important;
          }
        }
        .dropdown-item:hover {
          background: var(--badge-bg) !important;
          color: var(--color-primary) !important;
        }
      `}</style>
    </>
  )
}
