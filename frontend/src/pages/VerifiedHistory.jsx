import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { 
  History, ShieldCheck, ShieldAlert, Search, Trash2, ArrowRight, 
  ExternalLink, Sparkles, Filter, CheckCircle2, XCircle, Clock, BarChart3, AlertCircle 
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { getVerifiedHistory, clearVerifiedHistory, deleteHistoryItem } from '../utils/history'

export default function VerifiedHistory() {
  const navigate = useNavigate()
  const [history, setHistory] = useState([])
  const [filter, setFilter] = useState('all') // 'all' | 'real' | 'fake'
  const [search, setSearch] = useState('')

  useEffect(() => {
    setHistory(getVerifiedHistory())
  }, [])

  const handleClear = () => {
    if (window.confirm('Are you sure you want to clear your local verification history?')) {
      clearVerifiedHistory()
      setHistory([])
    }
  }

  const handleDelete = (id, e) => {
    e.stopPropagation()
    const updated = deleteHistoryItem(id)
    setHistory(updated)
  }

  const handleInspect = (item) => {
    if (item.result_data) {
      sessionStorage.setItem('verification_result', JSON.stringify(item.result_data))
      navigate('/results')
    } else {
      // Navigate to verify with pre-filled claim
      navigate(`/verify?claim=${encodeURIComponent(item.claim)}`)
    }
  }

  // Filter & Search
  const filteredItems = history.filter(item => {
    const matchesFilter = 
      filter === 'all' ? true :
      filter === 'real' ? (item.status === 'REAL' || item.trust_score >= 0.5) :
      (item.status === 'FAKE' || item.trust_score < 0.5)

    const matchesSearch = 
      item.claim.toLowerCase().includes(search.toLowerCase()) ||
      (item.reason && item.reason.toLowerCase().includes(search.toLowerCase()))

    return matchesFilter && matchesSearch
  })

  // Stats
  const totalCount = history.length
  const realCount = history.filter(h => h.status === 'REAL' || h.trust_score >= 0.5).length
  const fakeCount = history.filter(h => h.status === 'FAKE' || h.trust_score < 0.5).length
  const avgTrustScore = totalCount > 0 
    ? (history.reduce((acc, h) => acc + (h.trust_score !== undefined ? h.trust_score : (h.confidence ? h.confidence / 100 : 0.5)), 0) / totalCount).toFixed(2)
    : '0.00'

  return (
    <div className="container" style={{ paddingTop: '1.5rem', paddingBottom: '5rem', maxWidth: '1100px' }}>
      
      {/* Page Header */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        style={{ marginBottom: '2.5rem', textAlign: 'left' }}
      >
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', fontWeight: 600, color: 'var(--color-primary)', marginBottom: '0.5rem' }}>
          <History size={16} /> Audit Ledger & Provenance
        </div>
        <h1 style={{ fontSize: 'clamp(2rem, 4vw, 2.75rem)', fontWeight: 800, color: 'var(--color-text)', marginBottom: '0.75rem' }}>
          Verified <span className="text-gradient-multi">Claims History</span>
        </h1>
        <p style={{ color: 'var(--color-text-muted)', fontSize: '1.05rem', maxWidth: '700px', lineHeight: 1.6 }}>
          Chronological record of multi-source claim verifications, MPNet semantic inferences, and calibrated trust score decisions.
        </p>
      </motion.div>

      {/* Stats Summary Strip */}
      <motion.div 
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1 }}
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '1rem',
          marginBottom: '2rem'
        }}
      >
        <div className="glass-panel" style={{ padding: '1.25rem 1.5rem', background: 'var(--color-bg-elevated)', borderTop: '2px solid var(--color-cyan)' }}>
          <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-cyan)', textTransform: 'uppercase' }}>Total Ingested Claims</div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--color-cyan)', marginTop: '0.2rem' }}>{totalCount}</div>
          <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: '0.1rem' }}>Stored in local ledger</div>
        </div>

        <div className="glass-panel" style={{ padding: '1.25rem 1.5rem', background: 'var(--color-bg-elevated)', borderTop: '2px solid var(--color-success)' }}>
          <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#34d399', textTransform: 'uppercase' }}>Corroborated (Real)</div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#34d399', marginTop: '0.2rem' }}>{realCount}</div>
          <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: '0.1rem' }}>Score ≥ 0.50 Threshold</div>
        </div>

        <div className="glass-panel" style={{ padding: '1.25rem 1.5rem', background: 'var(--color-bg-elevated)', borderTop: '2px solid var(--color-danger)' }}>
          <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#ef4444', textTransform: 'uppercase' }}>Debunked (Fake)</div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#ef4444', marginTop: '0.2rem' }}>{fakeCount}</div>
          <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: '0.1rem' }}>Score &lt; 0.50 Threshold</div>
        </div>

        <div className="glass-panel" style={{ padding: '1.25rem 1.5rem', background: 'var(--color-bg-elevated)', borderTop: '2px solid var(--color-orange)' }}>
          <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-orange)', textTransform: 'uppercase' }}>Mean Trust Score</div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--color-orange)', marginTop: '0.2rem' }}>{avgTrustScore}</div>
          <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: '0.1rem' }}>On 0.00 – 1.00 Calibrated Scale</div>
        </div>
      </motion.div>

      {/* Controls: Search, Filter Tabs & Clear */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '1rem',
        marginBottom: '2rem',
        padding: '0.75rem 1rem',
        background: 'var(--color-bg-elevated)',
        borderRadius: 'var(--radius-xl)',
        border: '1px solid var(--color-border)'
      }}>
        {/* Filter Tabs */}
        <div style={{ display: 'flex', gap: '0.4rem' }}>
          {[
            { id: 'all', label: `All (${totalCount})` },
            { id: 'real', label: `Real (${realCount})` },
            { id: 'fake', label: `Fake (${fakeCount})` }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setFilter(tab.id)}
              style={{
                padding: '0.45rem 0.9rem',
                borderRadius: 'var(--radius-md)',
                fontSize: '0.85rem',
                fontWeight: filter === tab.id ? 700 : 500,
                background: filter === tab.id ? 'var(--badge-bg)' : 'transparent',
                color: filter === tab.id ? 'var(--color-primary)' : 'var(--color-text-muted)',
                border: filter === tab.id ? '1px solid var(--badge-border)' : '1px solid transparent',
                cursor: 'pointer'
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Search & Clear */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flex: '1 1 240px', justifyContent: 'flex-end' }}>
          <div style={{ position: 'relative', flex: '1 1 200px', maxWidth: '300px' }}>
            <Search size={15} color="var(--color-text-dim)" style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)' }} />
            <input
              type="text"
              className="input"
              placeholder="Search verified claims..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{ paddingLeft: '2.4rem', paddingTop: '0.45rem', paddingBottom: '0.45rem', fontSize: '0.88rem' }}
            />
          </div>

          {history.length > 0 && (
            <button
              onClick={handleClear}
              className="btn btn-secondary"
              title="Clear all local history"
              style={{ padding: '0.5rem 0.75rem', fontSize: '0.82rem', color: '#f87171' }}
            >
              <Trash2 size={15} />
              Clear
            </button>
          )}
        </div>
      </div>

      {/* History Items List */}
      {filteredItems.length === 0 ? (
        <div className="glass-panel" style={{ padding: '4rem 2rem', textAlign: 'center', color: 'var(--color-text-muted)' }}>
          <History size={48} color="var(--color-text-dim)" style={{ marginBottom: '1rem' }} />
          <h3 style={{ fontSize: '1.25rem', color: 'var(--color-text)', marginBottom: '0.5rem' }}>
            {history.length === 0 ? 'No verification records found' : 'No claims match your search'}
          </h3>
          <p style={{ maxWidth: '450px', margin: '0 auto 1.5rem', fontSize: '0.92rem' }}>
            {history.length === 0 
              ? 'Run your first fact-check verification on a headline or article URL to start building your evidence ledger.'
              : 'Try clearing your search query or selecting a different filter.'}
          </p>
          <button 
            className="btn btn-primary"
            onClick={() => navigate('/verify')}
          >
            <Sparkles size={16} /> Verify a Claim Now
          </button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <AnimatePresence>
            {filteredItems.map((item, idx) => {
              const isReal = item.status === 'REAL' || item.trust_score >= 0.5
              const score = item.trust_score !== undefined ? item.trust_score : (item.confidence ? (item.confidence / 100).toFixed(2) : 0.5)

              return (
                <motion.div
                  key={item.id || idx}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.3, delay: idx * 0.04 }}
                  className="glass-panel"
                  onClick={() => handleInspect(item)}
                  style={{
                    padding: '1.5rem 1.75rem',
                    cursor: 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '1rem',
                    background: 'var(--color-bg-elevated)',
                    transition: 'all 0.2s ease',
                    position: 'relative'
                  }}
                  whileHover={{ y: -3, borderColor: 'rgba(59, 130, 246, 0.45)' }}
                >
                  {/* Top Bar: Timestamp & Badges */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <span className={`badge ${isReal ? 'badge-real' : 'badge-fake'}`} style={{ fontSize: '0.82rem', padding: '0.3rem 0.8rem' }}>
                        {isReal ? <ShieldCheck size={14} /> : <ShieldAlert size={14} />}
                        {isReal ? 'REAL' : 'FAKE'}
                      </span>

                      <span style={{ 
                        fontSize: '0.82rem', 
                        fontWeight: 700, 
                        color: isReal ? '#34d399' : '#f87171',
                        background: isReal ? 'rgba(52, 211, 153, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                        padding: '0.2rem 0.6rem',
                        borderRadius: 'var(--radius-sm)'
                      }}>
                        Trust Score: {score}
                      </span>

                      <span style={{ fontSize: '0.78rem', color: 'var(--color-text-dim)', textTransform: 'capitalize' }}>
                        Input: {item.input_type || 'claim'}
                      </span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                      <span style={{ fontSize: '0.78rem', color: 'var(--color-text-dim)', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                        <Clock size={13} /> {new Date(item.timestamp).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      </span>

                      <button
                        onClick={(e) => handleDelete(item.id, e)}
                        title="Delete record"
                        style={{ color: 'var(--color-text-dim)', padding: '0.3rem', borderRadius: '4px' }}
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </div>

                  {/* Claim Text */}
                  <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--color-text)', lineHeight: 1.45 }}>
                    "{item.claim}"
                  </h3>

                  {/* Rationale or breakdown */}
                  {item.reason && (
                    <p style={{ fontSize: '0.88rem', color: 'var(--color-text-muted)', lineHeight: 1.55 }}>
                      {item.reason}
                    </p>
                  )}

                  {/* Bottom Stats & CTA */}
                  <div style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center', 
                    flexWrap: 'wrap', 
                    gap: '0.75rem',
                    paddingTop: '0.75rem',
                    borderTop: '1px solid var(--color-border)'
                  }}>
                    <div style={{ display: 'flex', gap: '1.25rem', fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
                      <span>
                        <strong style={{ color: '#34d399' }}>{item.supporting_count || 0}</strong> Supporting
                      </span>
                      <span>
                        <strong style={{ color: '#f87171' }}>{item.contradicting_count || 0}</strong> Contradicting
                      </span>
                      <span>
                        <strong style={{ color: 'var(--color-primary)' }}>{item.evidence_count || 0}</strong> Total Evidence
                      </span>
                    </div>

                    <button
                      className="btn btn-secondary"
                      onClick={() => handleInspect(item)}
                      style={{ padding: '0.45rem 0.95rem', fontSize: '0.82rem', gap: '0.4rem', color: 'var(--color-primary)' }}
                    >
                      <span>View Full Breakdown</span>
                      <ArrowRight size={14} />
                    </button>
                  </div>
                </motion.div>
              )
            })}
          </AnimatePresence>
        </div>
      )}

    </div>
  )
}
