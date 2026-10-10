import { useEffect, useState } from 'react'
import { Server, Database, BrainCircuit, CheckCircle, XCircle, Clock, ShieldCheck, Cpu } from 'lucide-react'
import { motion } from 'framer-motion'
import { apiFetch } from '../utils/api'

export default function SystemStatus() {
  const [status, setStatus] = useState(null)
  
  useEffect(() => {
    const fetchStatus = async () => {
      try {
        const res = await apiFetch('/api/system/status')
        if (res.ok) {
          const data = await res.json()
          setStatus(data)
        }
      } catch (err) {
        console.error('Failed to connect to backend engine:', err)
      }
    }
    
    fetchStatus()
    const interval = setInterval(fetchStatus, 5000)
    return () => clearInterval(interval)
  }, [])

  if (!status) {
    return (
      <div className="container" style={{ textAlign: 'center', padding: '3.5rem 0' }}>
        <div className="glass-panel" style={{ display: 'inline-block', padding: '2rem 3rem' }}>
          <div className="animate-pulse" style={{ color: 'var(--color-primary)', fontWeight: 600 }}>Connecting to VeriNexa backend engine...</div>
        </div>
      </div>
    )
  }

  const getStatusIcon = (state) => {
    if (state === 'AVAILABLE' || state === 'READY') {
      return <CheckCircle size={20} color="var(--color-success)" />
    }
    if (state === 'RATE_LIMITED' || state === 'LOADING') {
      return <Clock size={20} color="var(--color-warning)" />
    }
    return <XCircle size={20} color="var(--color-danger)" />
  }

  return (
    <div className="container" style={{ maxWidth: '850px' }}>
      <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
        <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
          <h1 style={{ fontSize: '2.75rem', marginBottom: '0.5rem', letterSpacing: '-0.03em' }}>
            VeriNexa <span className="text-gradient">Engine Status</span>
          </h1>
          <p style={{ color: 'var(--color-text-muted)' }}>
            Real-time telemetry for neural models, API news providers, and credibility knowledge bases.
          </p>
        </div>
        
        <div style={{ display: 'grid', gap: '2rem', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))' }}>
          
          {/* Models */}
          <div className="glass-panel card-hover-lift shimmer-hover" style={{ padding: '1.75rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', color: 'var(--color-primary)' }}>
                <BrainCircuit size={24} />
                <h2 style={{ fontSize: '1.25rem', margin: 0, fontWeight: 700 }}>Neural Models</h2>
              </div>
              <span className="beacon-green" style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#10b981', display: 'inline-block' }} />
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              {Object.entries(status.models).map(([name, state]) => {
                const isMpnet = name.toLowerCase().includes('mpnet')
                const isDeberta = name.toLowerCase().includes('deberta')
                
                return (
                  <div key={name} style={{ 
                    padding: '1rem',
                    background: 'var(--color-bg-secondary)',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--color-border)',
                    borderLeft: `3px solid ${isMpnet ? 'var(--color-cyan)' : isDeberta ? 'var(--color-purple)' : 'var(--color-primary)'}`
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
                      <span style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--color-text)' }}>
                        {isMpnet ? 'MPNet Semantic Ranker' : isDeberta ? 'DeBERTa NLI Stance' : name.replace('_', ' ')}
                      </span>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                        <span style={{ fontSize: '0.78rem', fontWeight: 600, color: state === 'READY' ? 'var(--color-success)' : 'var(--color-warning)' }}>
                          {state}
                        </span>
                        {getStatusIcon(state)}
                      </div>
                    </div>
                    
                    <div style={{ fontSize: '0.75rem', color: 'var(--color-text-dim)', fontFamily: 'monospace', marginBottom: '0.3rem' }}>
                      {isMpnet ? 'sentence-transformers/all-mpnet-base-v2' : isDeberta ? 'cross-encoder/nli-deberta-v3-small' : 'custom-model'}
                    </div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)' }}>
                      {isMpnet ? '768-dim dense embedding vector similarity ranking' : isDeberta ? 'Cross-encoder 3-way stance entailment classification' : 'Inference pipeline'}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
          
          {/* Providers */}
          <div className="glass-panel" style={{ padding: '1.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem', color: 'var(--color-primary)' }}>
              <Server size={24} />
              <h2 style={{ fontSize: '1.25rem', margin: 0 }}>Live Providers</h2>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {Object.entries(status.providers).map(([name, state]) => (
                <div key={name} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontWeight: 500, textTransform: 'capitalize' }}>{name}</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)' }}>{state}</span>
                    {getStatusIcon(state)}
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          {/* Services */}
          <div className="glass-panel" style={{ padding: '1.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem', color: 'var(--color-primary)' }}>
              <Database size={24} />
              <h2 style={{ fontSize: '1.25rem', margin: 0 }}>Core Services</h2>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontWeight: 500 }}>Source Database</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)' }}>{status.source_database}</span>
                  {getStatusIcon(status.source_database)}
                </div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontWeight: 500 }}>Evidence Fusion</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)' }}>{status.evidence_fusion}</span>
                  {getStatusIcon(status.evidence_fusion)}
                </div>
              </div>
            </div>
          </div>
          
        </div>
      </motion.div>
    </div>
  )
}
