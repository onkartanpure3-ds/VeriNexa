import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Shield, Lock, Mail, User, Sparkles, CheckCircle2 } from 'lucide-react'
import { useAuth } from '../context/AuthContext'

export default function AuthModal({ isOpen, onClose }) {
  const { login } = useAuth()
  const [isSignUp, setIsSignUp] = useState(false)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [role, setRole] = useState('Fact-Checking Specialist')

  if (!isOpen) return null

  const handleSubmit = (e) => {
    e.preventDefault()
    login({
      name: name || (isSignUp ? 'New Analyst' : 'Alex Hunter'),
      email: email || 'alex.hunter@factcheck.org',
      role: role || 'Senior Intelligence Analyst'
    })
    onClose()
  }

  const handleDemoLogin = () => {
    login({
      name: 'Alex Hunter',
      email: 'alex.hunter@factcheck.org',
      role: 'Senior Fact-Checking Analyst',
      verifiedCount: 58
    })
    onClose()
  }

  return (
    <AnimatePresence>
      <div style={{
        position: 'fixed',
        inset: 0,
        zIndex: 100,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1.5rem',
        background: 'rgba(5, 8, 16, 0.75)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)'
      }}>
        {/* Backdrop click */}
        <div style={{ position: 'absolute', inset: 0 }} onClick={onClose} />

        {/* Modal Card */}
        <motion.div
          initial={{ opacity: 0, scale: 0.94, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.94, y: 15 }}
          transition={{ duration: 0.25 }}
          className="glass-panel"
          style={{
            position: 'relative',
            zIndex: 10,
            width: '100%',
            maxWidth: '440px',
            padding: '2.5rem',
            background: 'var(--color-bg-elevated)',
            boxShadow: '0 25px 60px -15px rgba(0, 0, 0, 0.6), 0 0 30px rgba(59, 130, 246, 0.2)'
          }}
        >
          {/* Close Button */}
          <button
            onClick={onClose}
            style={{
              position: 'absolute',
              top: '1.25rem',
              right: '1.25rem',
              color: 'var(--color-text-dim)',
              padding: '0.4rem',
              borderRadius: 'var(--radius-md)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <X size={20} />
          </button>

          {/* Modal Header */}
          <div style={{ textAlign: 'center', marginBottom: '1.75rem' }}>
            <div style={{
              width: '3.5rem',
              height: '3.5rem',
              margin: '0 auto 1rem',
              borderRadius: '1rem',
              background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.2), rgba(99, 102, 241, 0.3))',
              border: '1px solid rgba(59, 130, 246, 0.4)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 0 25px rgba(59, 130, 246, 0.3)'
            }}>
              <img src="/logo.png" alt="VeriNexa" style={{ width: '36px', height: '36px', objectFit: 'contain' }} />
            </div>
            
            <h3 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--color-text)' }}>
              {isSignUp ? 'Create VeriNexa Account' : 'Welcome to VeriNexa'}
            </h3>
            <p style={{ color: 'var(--color-text-muted)', fontSize: '0.88rem', marginTop: '0.25rem' }}>
              {isSignUp ? 'Join the evidence intelligence verification network' : 'Sign in to access your ledger and verify claims'}
            </p>
          </div>

          {/* Quick Demo Sign In */}
          <button
            onClick={handleDemoLogin}
            className="btn btn-secondary"
            style={{
              width: '100%',
              marginBottom: '1.5rem',
              padding: '0.75rem',
              border: '1px solid var(--badge-border)',
              background: 'var(--badge-bg)',
              color: 'var(--color-primary)',
              fontSize: '0.9rem',
              fontWeight: 600,
              gap: '0.5rem'
            }}
          >
            <Sparkles size={16} color="var(--color-primary)" />
            Instant Demo Sign-In (Fact-Checker)
          </button>

          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '1rem',
            margin: '1.25rem 0',
            color: 'var(--color-text-dim)',
            fontSize: '0.8rem'
          }}>
            <div style={{ flex: 1, height: '1px', background: 'var(--color-border)' }} />
            <span>OR CONTINUE WITH EMAIL</span>
            <div style={{ flex: 1, height: '1px', background: 'var(--color-border)' }} />
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {isSignUp && (
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--color-text-dim)', marginBottom: '0.35rem' }}>
                  Full Name
                </label>
                <div style={{ position: 'relative' }}>
                  <User size={16} color="var(--color-text-dim)" style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)' }} />
                  <input
                    type="text"
                    required
                    className="input"
                    placeholder="Alex Hunter"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    style={{ paddingLeft: '2.4rem' }}
                  />
                </div>
              </div>
            )}

            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--color-text-dim)', marginBottom: '0.35rem' }}>
                Email Address
              </label>
              <div style={{ position: 'relative' }}>
                <Mail size={16} color="var(--color-text-dim)" style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)' }} />
                <input
                  type="email"
                  required
                  className="input"
                  placeholder="analyst@verinexa.ai"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  style={{ paddingLeft: '2.4rem' }}
                />
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--color-text-dim)', marginBottom: '0.35rem' }}>
                Password
              </label>
              <div style={{ position: 'relative' }}>
                <Lock size={16} color="var(--color-text-dim)" style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)' }} />
                <input
                  type="password"
                  required
                  className="input"
                  placeholder="••••••••••••"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  style={{ paddingLeft: '2.4rem' }}
                />
              </div>
            </div>

            <button
              type="submit"
              className="btn btn-primary"
              style={{ width: '100%', marginTop: '0.5rem', padding: '0.85rem' }}
            >
              {isSignUp ? 'Create Account' : 'Sign In to VeriNexa'}
            </button>
          </form>

          {/* Toggle between Sign in & Sign up */}
          <div style={{ textAlign: 'center', marginTop: '1.5rem', fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>
            {isSignUp ? (
              <>
                Already have an account?{' '}
                <button
                  type="button"
                  onClick={() => setIsSignUp(false)}
                  style={{ color: 'var(--color-primary)', fontWeight: 600, textDecoration: 'underline' }}
                >
                  Sign In
                </button>
              </>
            ) : (
              <>
                Don't have an account yet?{' '}
                <button
                  type="button"
                  onClick={() => setIsSignUp(true)}
                  style={{ color: 'var(--color-primary)', fontWeight: 600, textDecoration: 'underline' }}
                >
                  Register Free
                </button>
              </>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  )
}
