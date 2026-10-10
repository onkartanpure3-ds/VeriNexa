import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { ShieldCheck, Radio, CheckCircle2, Sparkles, Cpu } from 'lucide-react'

export default function BootLoader({ onComplete }) {
  const [progress, setProgress] = useState(0)
  const [statusText, setStatusText] = useState('Initializing VeriNexa Core Engine...')
  const [isDone, setIsDone] = useState(false)

  useEffect(() => {
    const steps = [
      { at: 0, text: 'Initializing VeriNexa Core Engine...' },
      { at: 20, text: 'Connecting Global Wire Feeds & RSS Streams...' },
      { at: 45, text: 'Loading Neural Stance Cross-Encoder Models...' },
      { at: 70, text: 'Calibrating Multi-Source Evidence Consensus...' },
      { at: 88, text: 'Verifying Factual Integrity & Reputation Matrix...' },
      { at: 100, text: 'VeriNexa Intelligence Network Online' }
    ]

    // Slower, smooth progression over ~3.0 seconds total
    const totalDurationMs = 3000
    let startTime = null
    let animationFrame

    const updateBoot = (timestamp) => {
      if (!startTime) startTime = timestamp
      const elapsed = timestamp - startTime
      const rawProgress = Math.min((elapsed / totalDurationMs), 1)

      // Smooth ease-out cubic curve so it glides steadily without sudden jumps
      const ease = 1 - Math.pow(1 - rawProgress, 2.6)
      const currentVal = Math.min(Math.round(ease * 100), 100)

      setProgress(currentVal)

      const matched = steps.filter(s => currentVal >= s.at).pop()
      if (matched) {
        setStatusText(matched.text)
      }

      if (rawProgress < 1) {
        animationFrame = requestAnimationFrame(updateBoot)
      } else {
        setProgress(100)
        setIsDone(true)
        setStatusText('VeriNexa Intelligence Network Online')
        setTimeout(() => {
          if (onComplete) onComplete()
        }, 550)
      }
    }

    animationFrame = requestAnimationFrame(updateBoot)
    return () => cancelAnimationFrame(animationFrame)
  }, [onComplete])

  return (
    <motion.div
      initial={{ opacity: 1 }}
      exit={{ opacity: 0, scale: 1.02 }}
      transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 99999,
        background: 'radial-gradient(ellipse at 50% 40%, #0d1527 0%, #080c15 80%, #04070e 100%)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1.5rem',
        overflow: 'hidden'
      }}
    >
      {/* Background Subtle Cyber Net Grid */}
      <div 
        style={{
          position: 'absolute',
          inset: 0,
          opacity: 0.25,
          backgroundImage: `
            linear-gradient(to right, rgba(59, 130, 246, 0.2) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(59, 130, 246, 0.2) 1px, transparent 1px)
          `,
          backgroundSize: '40px 40px',
          pointerEvents: 'none'
        }}
      />

      {/* Radiant Ambient Glow Behind Logo */}
      <div 
        style={{
          position: 'absolute',
          width: '360px',
          height: '360px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(37, 99, 235, 0.35) 0%, rgba(6, 182, 212, 0.15) 50%, transparent 70%)',
          filter: 'blur(50px)',
          pointerEvents: 'none'
        }}
      />

      {/* Main Boot Center Panel */}
      <motion.div
        initial={{ scale: 0.92, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        style={{
          position: 'relative',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          maxWidth: '460px',
          width: '100%',
          textAlign: 'center',
          zIndex: 1
        }}
      >
        {/* Pulsing Logo Icon Badge */}
        <div style={{ position: 'relative', marginBottom: '1.75rem' }}>
          <motion.div
            animate={{ 
              boxShadow: isDone 
                ? '0 0 50px rgba(16, 185, 129, 0.65)' 
                : [
                    '0 0 20px rgba(37, 99, 235, 0.4)', 
                    '0 0 45px rgba(6, 182, 212, 0.65)', 
                    '0 0 20px rgba(37, 99, 235, 0.4)'
                  ] 
            }}
            transition={{ duration: 2.2, repeat: Infinity, ease: 'easeInOut' }}
            style={{
              width: '4.75rem',
              height: '4.75rem',
              borderRadius: '1.25rem',
              background: 'linear-gradient(135deg, rgba(37, 99, 235, 0.35), rgba(6, 182, 212, 0.2))',
              border: isDone ? '1px solid rgba(16, 185, 129, 0.7)' : '1px solid rgba(59, 130, 246, 0.5)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              position: 'relative',
              transition: 'border-color 0.3s ease'
            }}
          >
            <img 
              src="/logo.png" 
              alt="VeriNexa" 
              style={{ width: '68%', height: '68%', objectFit: 'contain' }}
            />
          </motion.div>

          <span 
            className="beacon-green"
            style={{
              position: 'absolute',
              top: '-4px',
              right: '-4px',
              width: '13px',
              height: '13px',
              borderRadius: '50%',
              background: isDone ? '#10b981' : '#38bdf8',
              border: '2px solid #080c15'
            }}
          />
        </div>

        {/* Brand Name */}
        <h2 style={{
          fontSize: '1.95rem',
          fontWeight: 900,
          letterSpacing: '-0.025em',
          color: '#ffffff',
          marginBottom: '0.4rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.35rem'
        }}>
          Veri<span className="text-gradient-multi">Nexa</span>
        </h2>

        <p style={{
          fontSize: '0.82rem',
          color: '#94a3b8',
          letterSpacing: '0.08em',
          textTransform: 'uppercase',
          marginBottom: '2.25rem',
          fontWeight: 600
        }}>
          Real-Time Claim Verification Network
        </p>

        {/* Progress Bar Container */}
        <div style={{
          width: '100%',
          background: 'rgba(15, 23, 42, 0.85)',
          border: '1px solid rgba(148, 163, 184, 0.2)',
          borderRadius: '9999px',
          height: '11px',
          overflow: 'hidden',
          marginBottom: '1.15rem',
          position: 'relative',
          boxShadow: 'inset 0 1px 3px rgba(0, 0, 0, 0.6)'
        }}>
          <div
            style={{
              height: '100%',
              width: `${progress}%`,
              background: isDone
                ? 'linear-gradient(90deg, #10b981, #34d399)'
                : 'linear-gradient(90deg, #1d4ed8 0%, #2563eb 50%, #06b6d4 100%)',
              borderRadius: '9999px',
              boxShadow: isDone 
                ? '0 0 18px rgba(16, 185, 129, 0.8)' 
                : '0 0 18px rgba(6, 182, 212, 0.8)',
              transition: 'width 0.08s linear, background 0.3s ease'
            }}
          />
        </div>

        {/* Status Line & Percentage */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          width: '100%',
          fontSize: '0.82rem'
        }}>
          <div style={{
            color: isDone ? '#34d399' : '#cbd5e1',
            display: 'flex',
            alignItems: 'center',
            gap: '0.45rem',
            fontWeight: 500,
            transition: 'color 0.3s ease'
          }}>
            {isDone ? (
              <CheckCircle2 size={15} color="#10b981" />
            ) : (
              <Radio size={14} color="#06b6d4" className="animate-pulse" />
            )}
            <span>{statusText}</span>
          </div>

          <span style={{
            fontWeight: 800,
            color: isDone ? '#34d399' : '#38bdf8',
            fontFamily: 'monospace',
            letterSpacing: '0.05em',
            fontSize: '0.9rem',
            transition: 'color 0.3s ease'
          }}>
            {progress}%
          </span>
        </div>
      </motion.div>
    </motion.div>
  )
}
