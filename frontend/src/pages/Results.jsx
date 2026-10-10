import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { AlertTriangle, CheckCircle, XCircle, Info, ExternalLink } from 'lucide-react'

export default function Results() {
  const [data, setData] = useState(null)
  const navigate = useNavigate()

  useEffect(() => {
    const stored = sessionStorage.getItem('verification_result')
    if (stored) {
      setData(JSON.parse(stored))
    } else {
      navigate('/verify')
    }
  }, [navigate])

  if (!data) return null

  const getStatusConfig = (status, score) => {
    const isReal = status === 'REAL' || (score !== undefined && score !== null && score >= 0.50)
    if (isReal) {
      return { 
        color: '#10b981', 
        bg: 'rgba(16, 185, 129, 0.12)', 
        border: 'rgba(16, 185, 129, 0.35)',
        glow: 'rgba(16, 185, 129, 0.35)',
        icon: <CheckCircle size={48}/>, 
        label: 'REAL',
        badge: '● VERIFIED REAL (Score ≥ 0.50)',
        headline: 'Authentic / Corroborated Reporting'
      }
    } else {
      return { 
        color: '#ef4444', 
        bg: 'rgba(239, 68, 68, 0.12)', 
        border: 'rgba(239, 68, 68, 0.35)',
        glow: 'rgba(239, 68, 68, 0.35)',
        icon: <XCircle size={48}/>, 
        label: 'FAKE',
        badge: '● FLAGGED FAKE (Score < 0.50)',
        headline: 'Unsubstantiated or Contradicted Claim'
      }
    }
  }

  // Determine normalized 0-1 score
  const rawTrust = data.trust_score !== undefined && data.trust_score !== null 
    ? (data.trust_score > 1 ? data.trust_score / 100 : data.trust_score)
    : (data.confidence !== null ? data.confidence / 100 : 0)
  const normalizedScore = Number(rawTrust.toFixed(2))

  const config = getStatusConfig(data.status, normalizedScore)

  return (
    <div className="container" style={{ maxWidth: '1050px' }}>
      <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
        
        {/* Top Verdict Hero Card */}
        <div className="glass-panel glass-panel-elevated" style={{ 
          padding: '2.5rem', 
          marginBottom: '2.5rem', 
          textAlign: 'center', 
          borderTop: `5px solid ${config.color}`,
          boxShadow: `0 15px 40px -10px ${config.glow}`
        }}>
          <div style={{ color: config.color, marginBottom: '1rem', display: 'flex', justifyContent: 'center', filter: `drop-shadow(0 0 12px ${config.glow})` }}>
            {config.icon}
          </div>

          <div style={{
            display: 'inline-block',
            fontSize: '0.85rem',
            fontWeight: 700,
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            color: config.color,
            marginBottom: '0.4rem'
          }}>
            VeriNexa Classification Verdict
          </div>

          <h1 style={{ 
            fontSize: 'clamp(2.4rem, 6vw, 3.5rem)', 
            fontWeight: 800,
            marginBottom: '0.5rem', 
            color: config.color, 
            letterSpacing: '-0.02em',
            textShadow: `0 0 25px ${config.glow}`
          }}>
            {config.label}
          </h1>

          <p style={{ fontSize: '1.25rem', color: '#f1f5f9', maxWidth: '750px', margin: '0 auto 2rem auto', lineHeight: 1.6 }}>
            {data.reason}
          </p>
          
          {/* Dedicated Trust Score Component (0 - 1 Scale) */}
          <div style={{ 
            maxWidth: '700px', 
            margin: '0 auto', 
            background: 'var(--color-bg-elevated)', 
            padding: '1.75rem', 
            borderRadius: 'var(--radius-xl)', 
            border: `1px solid ${config.border}`,
            textAlign: 'left',
            boxShadow: '0 8px 30px rgba(0, 0, 0, 0.4)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.75rem' }}>
              <div>
                <span style={{ fontSize: '0.8rem', color: 'var(--color-text-dim)', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 700 }}>
                  VeriNexa Fused Trust Score (0 – 1 Scale)
                </span>
                <div style={{ fontSize: '2.5rem', fontWeight: 800, color: config.color, display: 'flex', alignItems: 'baseline', gap: '0.4rem', lineHeight: 1.1, marginTop: '0.2rem' }}>
                  <span>{normalizedScore.toFixed(2)}</span>
                  <span style={{ fontSize: '1.2rem', color: 'var(--color-text-dim)', fontWeight: 500 }}>/ 1.00</span>
                </div>
              </div>

              <div style={{
                background: config.bg,
                color: config.color,
                padding: '0.5rem 1.25rem',
                borderRadius: '9999px',
                fontSize: '0.875rem',
                fontWeight: 700,
                border: `1px solid ${config.color}`,
                boxShadow: `0 0 15px -3px ${config.glow}`,
                letterSpacing: '0.03em'
              }}>
                {config.badge}
              </div>
            </div>

            {/* Score Progress Bar */}
            <div style={{ width: '100%', height: '14px', background: 'var(--color-bg-secondary)', border: '1px solid var(--color-border)', borderRadius: '7px', overflow: 'hidden', marginBottom: '0.6rem', position: 'relative' }}>
              <div style={{
                width: `${Math.round(normalizedScore * 100)}%`,
                height: '100%',
                background: `linear-gradient(90deg, ${config.color}, ${normalizedScore >= 0.5 ? '#10b981' : '#ef4444'})`,
                boxShadow: `0 0 15px ${config.glow}`,
                transition: 'width 0.8s cubic-bezier(0.4, 0, 0.2, 1)'
              }} />
            </div>

            {/* Threshold Guide */}
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', color: 'var(--color-text-dim)', marginBottom: '1.25rem' }}>
              <span>0.00 (Fake)</span>
              <span style={{ color: 'var(--color-primary)', fontWeight: 600 }}>Threshold: 0.50 (≥ 0.50 Real)</span>
              <span>1.00 (Real)</span>
            </div>

            {/* Metric Tiles */}
            <div className="responsive-metrics-tiles" style={{ paddingTop: '1rem', borderTop: '1px solid var(--color-border)' }}>
              <div>
                <div style={{ color: 'var(--color-text-dim)', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Decision</div>
                <div style={{ fontSize: '1.25rem', fontWeight: 700, color: config.color, marginTop: '0.2rem' }}>{config.label}</div>
              </div>
              <div>
                <div style={{ color: 'var(--color-text-dim)', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Independent Sources</div>
                <div style={{ fontSize: '1.25rem', fontWeight: 700, marginTop: '0.2rem' }}>{data.independent_clusters}</div>
              </div>
              <div>
                <div style={{ color: 'var(--color-text-dim)', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Supporting Reports</div>
                <div style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--color-success)', marginTop: '0.2rem' }}>{data.supporting_count}</div>
              </div>
              <div>
                <div style={{ color: 'var(--color-text-dim)', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Contradicting Reports</div>
                <div style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--color-danger)', marginTop: '0.2rem' }}>{data.contradicting_count}</div>
              </div>
            </div>
          </div>

          <div style={{ marginTop: '1.75rem', display: 'flex', justifyContent: 'center', gap: '1rem' }}>
            <button 
              className="btn btn-secondary"
              onClick={() => navigate('/verify')}
              style={{ borderRadius: 'var(--radius-lg)' }}
            >
              Verify Another Headline
            </button>
          </div>
        </div>
        
        <div className="responsive-results-grid">
          
          {/* Main Evidence Feed */}
          <div>
            <h2 style={{ marginBottom: '1.5rem' }}>Relevant Evidence ({data.evidence_count})</h2>
            
            {data.evidence.length === 0 && (
              <div className="glass-panel" style={{ padding: '2rem', textAlign: 'center', color: 'var(--color-text-muted)' }}>
                No relevant evidence found within the 30-day window.
              </div>
            )}
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {data.evidence.map((item, idx) => (
                <motion.div 
                  key={idx} 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: idx * 0.08, ease: [0.16, 1, 0.3, 1] }}
                  className="glass-panel card-hover-lift shimmer-hover" 
                  style={{ 
                    padding: '1.5rem', 
                    borderLeft: `4px solid ${
                      item.relation === 'SUPPORTING' ? 'var(--color-success)' :
                      item.relation === 'CONTRADICTING' ? 'var(--color-danger)' : 'var(--color-warning)'
                    }`
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.65rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                    <div style={{ fontWeight: 700, color: 'var(--color-primary)', fontSize: '0.95rem' }}>{item.source}</div>
                    
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <span style={{ 
                        fontSize: '0.75rem', 
                        padding: '0.25rem 0.65rem', 
                        background: item.relation === 'SUPPORTING' ? 'var(--color-success-bg)' : item.relation === 'CONTRADICTING' ? 'var(--color-danger-bg)' : 'var(--color-warning-bg)', 
                        border: `1px solid ${item.relation === 'SUPPORTING' ? 'var(--color-success-border)' : item.relation === 'CONTRADICTING' ? 'var(--color-danger-border)' : 'var(--color-warning-border)'}`, 
                        borderRadius: '1rem', 
                        color: item.relation === 'SUPPORTING' ? 'var(--color-success)' : item.relation === 'CONTRADICTING' ? 'var(--color-danger)' : 'var(--color-warning)', 
                        fontWeight: 700 
                      }}>
                        DeBERTa: {item.relation}
                      </span>
                    </div>
                  </div>

                  <h3 style={{ fontSize: '1.15rem', marginBottom: '0.5rem', lineHeight: 1.4, color: 'var(--color-text)' }}>{item.title}</h3>
                  <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem', marginBottom: '1rem', lineHeight: 1.6 }}>
                    {item.reason}
                  </p>
                  
                  <div style={{ display: 'flex', gap: '1.25rem', fontSize: '0.82rem', flexWrap: 'wrap', borderTop: '1px solid var(--color-border)', paddingTop: '1rem', alignItems: 'center' }}>
                    <div style={{ color: 'var(--color-text-dim)' }}>
                      <strong style={{ color: 'var(--color-cyan)' }}>MPNet Match:</strong> {(item.semantic_similarity * 100).toFixed(0)}%
                    </div>
                    <div style={{ color: 'var(--color-text-dim)' }}>
                      <strong style={{ color: 'var(--color-text)' }}>Source Quality:</strong> {item.source_credibility?.credibility_level || 'VERIFIED'}
                    </div>
                    <a href={item.url} target="_blank" rel="noreferrer" style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', marginLeft: 'auto', color: 'var(--color-primary)', fontWeight: 600 }}>
                      Original Source <ExternalLink size={14} />
                    </a>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
          
          {/* Sidebar */}
          <div>
            <div className="glass-panel" style={{ padding: '1.5rem', marginBottom: '1.5rem' }}>
              <h3 style={{ marginBottom: '1rem' }}>Analysis Details</h3>
              <div style={{ fontSize: '0.875rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <div>
                  <div style={{ color: 'var(--color-text-muted)' }}>Analyzed Claim</div>
                  <div style={{ fontWeight: 500 }}>"{data.claim}"</div>
                </div>
                <div>
                  <div style={{ color: 'var(--color-text-muted)' }}>Supporting Articles</div>
                  <div style={{ fontWeight: 500 }}>{data.supporting_count}</div>
                </div>
                <div>
                  <div style={{ color: 'var(--color-text-muted)' }}>Contradicting Articles</div>
                  <div style={{ fontWeight: 500 }}>{data.contradicting_count}</div>
                </div>
                <div>
                  <div style={{ color: 'var(--color-text-muted)' }}>Methodology</div>
                  <div style={{ color: 'var(--color-text-muted)' }}>{data.methodology}</div>
                </div>
              </div>
            </div>
            
            <div className="glass-panel" style={{ padding: '1.5rem' }}>
              <h3 style={{ marginBottom: '1rem' }}>Source Credibility</h3>
              <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginBottom: '1rem' }}>
                Source quality is contextual evidence and does not by itself establish truth.
              </p>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {data.source_summary.slice(0, 5).map((s, i) => (
                  <div key={i} style={{ fontSize: '0.875rem' }}>
                    <div style={{ fontWeight: 600 }}>{s.domain}</div>
                    <div style={{ color: 'var(--color-text-muted)', display: 'flex', justifyContent: 'space-between' }}>
                      <span>{s.credibility_level}</span>
                      <span>({s.articles_count} articles)</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
          
        </div>
      </motion.div>
    </div>
  )
}
