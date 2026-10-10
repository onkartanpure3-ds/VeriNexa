import { saveToHistory } from '../utils/history'
import { apiFetch } from '../utils/api'
import { useState, useEffect } from 'react'
import { useNavigate, useLocation, useSearchParams } from 'react-router-dom'
import { FileText, Link as LinkIcon, MessageSquare, Sparkles, AlertCircle, ArrowUpRight } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

export default function Verify() {
  const [tab, setTab] = useState('claim')
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()
  const location = useLocation()
  const [searchParams] = useSearchParams()

  useEffect(() => {
    const claimFromState = location.state?.claim
    const claimFromQuery = searchParams.get('claim')
    const initialClaim = claimFromState || claimFromQuery
    if (initialClaim) {
      setTab('claim')
      setInput(initialClaim)
    }
  }, [location, searchParams])
  
  const sampleClaims = [
    { title: "Real Indian Headline", text: "Reserve Bank of India keeps repo rate unchanged at 6.5 percent", color: "var(--color-success)", bg: "var(--color-success-bg)", border: "var(--color-success-border)" },
    { title: "Real Tech Headline", text: "NASA and SpaceX launch Crew-8 mission to International Space Station", color: "var(--color-cyan)", bg: "var(--color-cyan-bg)", border: "var(--color-cyan-border)" },
    { title: "Fake Rumor Claim", text: "Government announces complete ban on cash transactions starting next month", color: "var(--color-orange)", bg: "var(--color-orange-bg)", border: "var(--color-orange-border)" }
  ]

  const handleVerify = async () => {
    if (!input.trim()) return
    
    setLoading(true)
    try {
      const endpoint = `/api/verify/${tab}`
      const payload = {}
      if (tab === 'claim') payload.claim = input
      if (tab === 'text') payload.text = input
      if (tab === 'url') payload.url = input
      
      const res = await apiFetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })
      
      const data = await res.json()
      sessionStorage.setItem('verification_result', JSON.stringify(data))
      saveToHistory(data)
      navigate('/results')
      
    } catch (err) {
      console.error(err)
      alert("Failed to connect to VeriNexa backend server. Ensure backend is running.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container" style={{ maxWidth: '850px' }}>
      <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
        
        <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
          <h1 style={{ fontSize: '2.75rem', marginBottom: '0.75rem', letterSpacing: '-0.03em' }}>
            Claim & Evidence <span className="text-gradient-multi">Verification</span>
          </h1>
          <p style={{ color: 'var(--color-text-muted)', fontSize: '1.1rem', maxWidth: '600px', margin: '0 auto' }}>
            Inspect claims against real-time global news feeds using VeriNexa's dual MPNet and DeBERTa NLI neural pipeline.
          </p>
        </div>
        
        <div className="glass-panel glass-panel-elevated" style={{ overflow: 'hidden' }}>
          {/* Mode Switch Tabs */}
          <div style={{ display: 'flex', borderBottom: '1px solid var(--color-border)', background: 'var(--color-bg-secondary)', position: 'relative' }}>
            {[
              { id: 'claim', icon: <MessageSquare size={18}/>, label: 'Claim / Headline' },
              { id: 'text', icon: <FileText size={18}/>, label: 'Full Article Text' },
              { id: 'url', icon: <LinkIcon size={18}/>, label: 'Article URL' },
            ].map(t => {
              const isActive = tab === t.id
              return (
                <button 
                  key={t.id}
                  className="verify-mode-tab"
                  onClick={() => setTab(t.id)}
                  style={{ 
                    flex: 1, 
                    padding: '1.15rem 1rem', 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center', 
                    gap: '0.6rem',
                    background: isActive ? 'var(--color-bg-elevated)' : 'transparent',
                    color: isActive ? 'var(--color-primary)' : 'var(--color-text-muted)',
                    position: 'relative',
                    fontWeight: isActive ? 700 : 500,
                    fontSize: '0.95rem',
                    cursor: 'pointer',
                    transition: 'color 0.2s ease'
                  }}
                >
                  {t.icon} {t.label}
                  {isActive && (
                    <motion.div
                      layoutId="verify-tab-indicator"
                      style={{
                        position: 'absolute',
                        bottom: 0,
                        left: 0,
                        right: 0,
                        height: '2px',
                        background: 'linear-gradient(90deg, #1d4ed8, #3b82f6, #06b6d4)',
                        boxShadow: '0 0 12px rgba(59, 130, 246, 0.6)'
                      }}
                      transition={{ type: 'spring', stiffness: 450, damping: 35 }}
                    />
                  )}
                </button>
              )
            })}
          </div>
          
          <div className="verify-card-body" style={{ padding: '2rem' }}>
            <AnimatePresence mode="wait">
              {tab === 'claim' && (
                <motion.div key="claim" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--color-text-dim)', marginBottom: '0.6rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Enter News Headline or Stated Fact
                  </label>
                  <input 
                    type="text"
                    className="input"
                    placeholder="e.g. 'Reserve Bank of India keeps repo rate unchanged at 6.5 percent'"
                    value={input}
                    onChange={e => setInput(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleVerify()}
                    style={{ fontSize: '1rem', padding: '1rem 1.25rem' }}
                  />
                </motion.div>
              )}

              {tab === 'url' && (
                <motion.div key="url" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--color-text-dim)', marginBottom: '0.6rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Paste Web Link to Verify
                  </label>
                  <input 
                    type="url"
                    className="input"
                    placeholder="https://reuters.com/world/news-article-example"
                    value={input}
                    onChange={e => setInput(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleVerify()}
                    style={{ fontSize: '1rem', padding: '1rem 1.25rem' }}
                  />
                </motion.div>
              )}

              {tab === 'text' && (
                <motion.div key="text" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--color-text-dim)', marginBottom: '0.6rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Paste Full Body of Article or Post
                  </label>
                  <textarea 
                    className="input textarea"
                    placeholder="Paste the full news article or press release here to analyze key claims..."
                    value={input}
                    onChange={e => setInput(e.target.value)}
                    style={{ minHeight: '160px', fontSize: '0.95rem' }}
                  />
                </motion.div>
              )}
            </AnimatePresence>
            
            {/* Quick Sample Selector */}
            <div style={{ marginTop: '1.75rem', paddingTop: '1.5rem', borderTop: '1px solid var(--color-border)' }}>
              <div style={{ fontSize: '0.8rem', color: 'var(--color-text-dim)', marginBottom: '0.75rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Quick Test Samples:
              </div>
              <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap' }}>
                {sampleClaims.map((sample, sIdx) => (
                  <button
                    key={sIdx}
                    onClick={() => {
                      setTab('claim')
                      setInput(sample.text)
                    }}
                    style={{
                      background: sample.bg,
                      border: `1px solid ${sample.border}`,
                      borderRadius: 'var(--radius-md)',
                      padding: '0.5rem 0.95rem',
                      fontSize: '0.82rem',
                      color: sample.color,
                      fontWeight: 600,
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.4rem',
                      cursor: 'pointer'
                    }}
                    className="hover-card"
                  >
                    <span>{sample.title}</span>
                    <ArrowUpRight size={14} color={sample.color} />
                  </button>
                ))}
              </div>
            </div>

            {/* Action Bar */}
            <div className="verify-actions-row" style={{ marginTop: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
              <div style={{ fontSize: '0.8rem', color: 'var(--color-text-dim)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <AlertCircle size={15} />
                <span>Binary Decision: Score ≥ 0.50 (Real) vs &lt; 0.50 (Fake)</span>
              </div>

              <div className="verify-actions-btns" style={{ display: 'flex', gap: '0.75rem' }}>
                {input && (
                  <button 
                    className="btn btn-secondary"
                    onClick={() => setInput('')}
                    disabled={loading}
                  >
                    Clear
                  </button>
                )}
                <button 
                  className="btn btn-primary"
                  onClick={handleVerify}
                  disabled={loading || !input.trim()}
                  style={{ minWidth: '160px' }}
                >
                  {loading ? (
                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <span style={{ width: '14px', height: '14px', border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%', display: 'inline-block', animation: 'spin 0.8s linear infinite' }} />
                      Analyzing...
                    </span>
                  ) : (
                    <>
                      <Sparkles size={18} />
                      Verify Claim
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
        
        {loading && (
          <motion.div 
            initial={{ opacity: 0, y: 15, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10 }}
            className="glass-panel"
            style={{ 
              marginTop: '2rem', 
              padding: '1.75rem 2rem',
              borderRadius: 'var(--radius-xl)',
              background: 'var(--color-bg-elevated)',
              border: '1px solid rgba(59, 130, 246, 0.35)',
              boxShadow: '0 12px 35px -5px rgba(59, 130, 246, 0.25)'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.75rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <span className="beacon-blue" style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#3b82f6', display: 'inline-block' }} />
                <span style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--color-text)' }}>
                  VeriNexa Neural Pipeline In Progress
                </span>
              </div>
              <span style={{ fontSize: '0.8rem', color: '#93c5fd', background: 'rgba(59, 130, 246, 0.15)', padding: '0.2rem 0.75rem', borderRadius: '9999px', border: '1px solid rgba(59, 130, 246, 0.3)', fontWeight: 600 }}>
                Live Execution
              </span>
            </div>

            {/* Neural Pipeline Execution Steps */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.85rem' }}>
              {[
                { title: 'Global News Feed', sub: 'NewsAPI & GDELT', color: 'var(--color-orange)', step: '1' },
                { title: 'MPNet Embeddings', sub: '768-dim Vectors', color: 'var(--color-cyan)', step: '2' },
                { title: 'DeBERTa NLI Stance', sub: 'Cross-Encoder', color: 'var(--color-purple)', step: '3' },
                { title: 'Calibrated Fusion', sub: 'Binary 0–1 Verdict', color: 'var(--color-success)', step: '4' },
              ].map((pipe, pIdx) => (
                <div 
                  key={pIdx}
                  style={{
                    padding: '0.85rem 1rem',
                    background: 'var(--color-bg-secondary)',
                    borderRadius: 'var(--radius-md)',
                    border: `1px solid var(--color-border)`,
                    borderLeft: `3px solid ${pipe.color}`,
                    position: 'relative',
                    overflow: 'hidden'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.25rem' }}>
                    <span style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--color-text)' }}>{pipe.title}</span>
                    <span style={{ fontSize: '0.7rem', color: pipe.color, fontWeight: 800 }}>#{pipe.step}</span>
                  </div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--color-text-dim)' }}>{pipe.sub}</div>
                </div>
              ))}
            </div>

            <div style={{ marginTop: '1.25rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.75rem' }}>
              <div style={{ width: '16px', height: '16px', border: '2px solid rgba(59, 130, 246, 0.3)', borderTopColor: '#3b82f6', borderRadius: '50%', animation: 'spin 0.75s linear infinite' }} />
              <div style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>
                Synthesizing multi-source global evidence and calibrating trust score...
              </div>
            </div>
          </motion.div>
        )}
      </motion.div>

      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        .hover-card:hover {
          border-color: rgba(59, 130, 246, 0.4) !important;
          background: rgba(59, 130, 246, 0.08) !important;
          color: var(--color-text) !important;
        }
        @media (max-width: 640px) {
          .verify-card-body {
            padding: 1.25rem !important;
          }
          .verify-mode-tab {
            padding: 0.85rem 0.5rem !important;
            font-size: 0.82rem !important;
            gap: 0.35rem !important;
          }
          .verify-actions-row {
            flex-direction: column !important;
            align-items: stretch !important;
          }
          .verify-actions-btns {
            width: 100% !important;
          }
          .verify-actions-btns button {
            flex: 1 !important;
          }
        }
      `}</style>
    </div>
  )
}
