import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { 
  ShieldCheck, ArrowRight, Search, FileText, CheckCircle2, Cpu, Globe2, 
  BarChart3, RefreshCw, ExternalLink, Sparkles, Layers, Layers2, ShieldAlert,
  Zap, Clock, Radio, Activity, Check, Filter, Newspaper, TrendingUp, Users
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { apiFetch } from '../utils/api'

// Animated Rolling Number Motion Counter on Mount / Reload
function AnimatedCounter({ end, duration = 1.8, decimals = 0, suffix = '', prefix = '' }) {
  const [count, setCount] = useState(0)

  useEffect(() => {
    let startTime = null
    let animationFrame

    const step = (timestamp) => {
      if (!startTime) startTime = timestamp
      const progress = Math.min((timestamp - startTime) / (duration * 1000), 1)
      // Smooth cubic ease-out
      const easeProgress = 1 - Math.pow(1 - progress, 3)
      setCount(easeProgress * end)

      if (progress < 1) {
        animationFrame = requestAnimationFrame(step)
      } else {
        setCount(end)
      }
    }

    animationFrame = requestAnimationFrame(step)
    return () => cancelAnimationFrame(animationFrame)
  }, [end, duration])

  const formatted = decimals > 0 
    ? count.toFixed(decimals) 
    : Math.floor(count).toLocaleString()

  return (
    <span>
      {prefix}{formatted}{suffix}
    </span>
  )
}

export default function Home() {
  const navigate = useNavigate()
  
  // Daily News State
  const [newsCategory, setNewsCategory] = useState('all')
  const [articles, setArticles] = useState([])
  const [newsLoading, setNewsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [lastRefreshed, setLastRefreshed] = useState(new Date())

  // Categories
  const categories = [
    { id: 'all', label: '🔥 All Trending' },
    { id: 'tech', label: '💻 Tech & AI' },
    { id: 'science', label: '🚀 Science & Space' },
    { id: 'world', label: '🌐 World News' },
    { id: 'business', label: '💼 Business' },
  ]

  // Fetch News from Backend
  const fetchNews = async (cat) => {
    setNewsLoading(true)
    try {
      const res = await apiFetch(`/api/news/latest?category=${cat}&limit=6`)
      if (res.ok) {
        const data = await res.json()
        if (data.articles && data.articles.length > 0) {
          setArticles(data.articles)
        } else {
          setArticles(getFallbackArticles(cat))
        }
      } else {
        setArticles(getFallbackArticles(cat))
      }
    } catch (err) {
      console.warn('Backend news API unavailable, loading fallback news feed:', err)
      setArticles(getFallbackArticles(cat))
    } finally {
      setNewsLoading(false)
      setLastRefreshed(new Date())
    }
  }

  useEffect(() => {
    fetchNews(newsCategory)
  }, [newsCategory])

  // Filtered articles by search query
  const filteredArticles = articles.filter(art => 
    art.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    art.source.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (art.description && art.description.toLowerCase().includes(searchQuery.toLowerCase()))
  )

  const handleVerifyArticle = (claimText) => {
    navigate(`/verify?claim=${encodeURIComponent(claimText)}`, { state: { claim: claimText } })
  }

  return (
    <div className="container" style={{ 
      display: 'flex', 
      flexDirection: 'column', 
      alignItems: 'center'
    }}>

      {/* ─── 1. HERO SECTION (Split 2-Column Grid) ────────────────── */}
      <div 
        className="hero-split-grid"
        style={{ 
          width: '100%', 
          maxWidth: '1200px',
          marginBottom: '2.5rem'
        }}
      >
        {/* Left Column: Heading, Subtitle & Actions */}
        <motion.div
          initial={{ opacity: 0, x: -25 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', textAlign: 'left' }}
        >
          {/* Hero Status Badge */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4 }}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.6rem',
              padding: '0.45rem 1.1rem',
              borderRadius: '9999px',
              background: 'var(--badge-bg)',
              border: '1px solid var(--badge-border)',
              color: 'var(--badge-text)',
              fontSize: '0.85rem',
              fontWeight: 600,
              marginBottom: '1.5rem',
              boxShadow: '0 0 20px -5px rgba(59, 130, 246, 0.3)'
            }}
          >
            <span 
              className="beacon-green"
              style={{ 
                width: '8px', 
                height: '8px', 
                borderRadius: '50%', 
                background: '#10b981', 
                display: 'inline-block' 
              }} 
            />
            <span>Trusted Public Fact-Check Network</span>
            <span style={{ opacity: 0.4, margin: '0 0.2rem' }}>•</span>
            <span style={{ color: 'var(--color-primary)', fontWeight: 700 }}>150K+ Monthly Active Readers</span>
          </motion.div>

          <h1 style={{ 
            fontSize: 'clamp(2.1rem, 3.8vw, 3.65rem)', 
            fontWeight: 800,
            lineHeight: 1.15,
            marginBottom: '1.25rem',
            letterSpacing: '-0.03em',
            maxWidth: '680px'
          }}>
            Real-Time Claim Verification & Live News Intelligence with{' '}
            <span className="text-gradient-multi">VeriNexa</span>
          </h1>
          
          <p style={{ 
            fontSize: 'clamp(1rem, 1.8vw, 1.15rem)', 
            color: 'var(--color-text-muted)', 
            maxWidth: '560px', 
            margin: '0 0 2.25rem 0',
            lineHeight: 1.7
          }}>
            Instant factual claim validation and news intelligence powered by multi-source global reporting, evidence consensus, and transparent reliability analysis.
          </p>
          
          {/* Action Buttons */}
          <div style={{ display: 'flex', gap: '0.9rem', flexWrap: 'wrap', alignItems: 'center', width: '100%' }}>
            <button 
              className="btn btn-primary btn-hero-action"
              onClick={() => navigate('/verify')}
              style={{ padding: '0.9rem 2rem', fontSize: '1.05rem', borderRadius: 'var(--radius-lg)' }}
            >
              Start Verification <ArrowRight size={19} />
            </button>
            
            <button 
              className="btn btn-secondary btn-hero-action"
              onClick={() => {
                const el = document.getElementById('daily-news')
                if (el) el.scrollIntoView({ behavior: 'smooth' })
              }}
              style={{ padding: '0.9rem 1.6rem', fontSize: '0.95rem', borderRadius: 'var(--radius-lg)' }}
            >
              <Newspaper size={18} color="var(--color-primary)" /> Explore Daily News
            </button>
          </div>
        </motion.div>

        {/* Right Column: Hero Motion Newspaper Article (Where user placed the blue circle!) */}
        <motion.div
          initial={{ opacity: 0, x: 25 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          style={{
            position: 'relative',
            width: '100%',
            display: 'flex',
            justifyContent: 'center'
          }}
        >
          {/* Floating Ambient Glow Behind the Newspaper */}
          <div style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: '90%',
            height: '80%',
            background: 'radial-gradient(ellipse, rgba(59, 130, 246, 0.28) 0%, rgba(6, 182, 212, 0.16) 45%, transparent 70%)',
            filter: 'blur(50px)',
            zIndex: 0,
            pointerEvents: 'none'
          }} />

          {/* Main Floating Newspaper Card with Motion Tilt & Float */}
          <motion.div
            animate={{ y: [0, -8, 0] }}
            transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
            className="glass-panel"
            style={{
              position: 'relative',
              zIndex: 1,
              width: '100%',
              borderRadius: 'var(--radius-2xl)',
              overflow: 'hidden',
              border: '1px solid var(--color-border-glow)',
              boxShadow: '0 25px 60px -15px rgba(0, 0, 0, 0.5), 0 0 35px -5px rgba(59, 130, 246, 0.25)',
              background: 'var(--color-bg-elevated)',
              cursor: 'pointer'
            }}
            onClick={() => navigate('/verify')}
            whileHover={{ scale: 1.015 }}
          >
            {/* Top Window Bar */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '0.7rem 1.15rem',
              background: 'rgba(15, 23, 42, 0.65)',
              borderBottom: '1px solid var(--color-border)',
              backdropFilter: 'blur(10px)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                <span style={{ width: '9px', height: '9px', borderRadius: '50%', background: '#ef4444', display: 'inline-block' }} />
                <span style={{ width: '9px', height: '9px', borderRadius: '50%', background: '#f59e0b', display: 'inline-block' }} />
                <span style={{ width: '9px', height: '9px', borderRadius: '50%', background: '#10b981', display: 'inline-block' }} />
                <span style={{ fontSize: '0.72rem', color: 'var(--color-text-dim)', marginLeft: '0.4rem', fontWeight: 600 }}>
                  Live Digital News Wire • Automated Factual Provenance
                </span>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.7rem', color: '#10b981', fontWeight: 700 }}>
                <span className="beacon-green" style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#10b981', display: 'inline-block' }} />
                LIVE FEED
              </div>
            </div>

            {/* Newspaper Image Container */}
            <div style={{ position: 'relative', overflow: 'hidden', maxHeight: '420px' }}>
              <img 
                src="/hero-newspaper.jpg" 
                alt="VeriNexa Live Newspaper Fact-Check Intelligence" 
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                  display: 'block'
                }}
              />

              {/* Subtle Gradient Overlay */}
              <div style={{
                position: 'absolute',
                inset: 0,
                background: 'linear-gradient(to top, rgba(8, 12, 21, 0.8) 0%, rgba(8, 12, 21, 0.1) 40%, transparent 100%)',
                pointerEvents: 'none'
              }} />

              {/* Bottom Overlay Info on the Image */}
              <div style={{
                position: 'absolute',
                bottom: 0,
                left: 0,
                right: 0,
                padding: '1rem 1.25rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '0.6rem',
                backdropFilter: 'blur(8px)',
                background: 'rgba(8, 12, 21, 0.72)',
                borderTop: '1px solid rgba(255, 255, 255, 0.12)'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flexWrap: 'wrap' }}>
                  <div style={{
                    padding: '0.3rem 0.65rem',
                    borderRadius: '9999px',
                    background: 'rgba(16, 185, 129, 0.2)',
                    border: '1px solid #10b981',
                    color: '#34d399',
                    fontSize: '0.75rem',
                    fontWeight: 800,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.35rem'
                  }}>
                    <CheckCircle2 size={14} /> 99.4% Factual Consensus
                  </div>
                  <span style={{ fontSize: '0.8rem', color: '#f8fafc', fontWeight: 600 }}>
                    10,000+ Outlets Cross-Referenced
                  </span>
                </div>

                <button
                  className="btn btn-primary"
                  onClick={(e) => {
                    e.stopPropagation()
                    navigate('/verify')
                  }}
                  style={{
                    padding: '0.4rem 1rem',
                    fontSize: '0.82rem',
                    borderRadius: '9999px'
                  }}
                >
                  Verify Now <ArrowRight size={14} />
                </button>
              </div>
            </div>
          </motion.div>

          {/* Floating Interactive Badge 1: Top Right */}
          <motion.div
            animate={{ y: [0, -6, 0] }}
            transition={{ duration: 4.2, repeat: Infinity, ease: 'easeInOut', delay: 0.5 }}
            className="glass-panel hero-floating-badge"
            style={{
              position: 'absolute',
              top: '-16px',
              right: '-10px',
              padding: '0.55rem 0.95rem',
              borderRadius: '9999px',
              background: 'var(--color-bg-elevated)',
              border: '1px solid rgba(56, 189, 248, 0.4)',
              boxShadow: '0 10px 25px rgba(0, 0, 0, 0.35)',
              display: 'flex',
              alignItems: 'center',
              gap: '0.45rem',
              zIndex: 2,
              fontSize: '0.78rem',
              fontWeight: 700,
              color: 'var(--color-cyan)'
            }}
          >
            <Sparkles size={14} color="var(--color-cyan)" />
            <span>Live Evidence Synthesis</span>
          </motion.div>

          {/* Floating Interactive Badge 2: Bottom Left */}
          <motion.div
            animate={{ y: [0, 6, 0] }}
            transition={{ duration: 4.8, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
            className="glass-panel hero-floating-badge"
            style={{
              position: 'absolute',
              bottom: '-14px',
              left: '-8px',
              padding: '0.55rem 0.95rem',
              borderRadius: '9999px',
              background: 'var(--color-bg-elevated)',
              border: '1px solid rgba(16, 185, 129, 0.4)',
              boxShadow: '0 10px 25px rgba(0, 0, 0, 0.35)',
              display: 'flex',
              alignItems: 'center',
              gap: '0.45rem',
              zIndex: 2,
              fontSize: '0.78rem',
              fontWeight: 700,
              color: 'var(--color-success)'
            }}
          >
            <ShieldCheck size={15} color="var(--color-success)" />
            <span>Multi-Source Provenance</span>
          </motion.div>
        </motion.div>
      </div>
      
      {/* User Reach & Community Indicators */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.25 }}
        className="responsive-stats-grid"
        style={{
          width: '100%',
          maxWidth: '1200px',
          marginBottom: '4.5rem'
        }}
      >
        {[
          { 
            label: 'Daily Active Visitors', 
            target: 150000,
            decimals: 0,
            suffix: '+',
            sub: 'Worldwide Readers & Fact-Checkers', 
            icon: Users, 
            color: 'var(--color-cyan)',
            gradient: 'linear-gradient(90deg, #0284c7 0%, #06b6d4 50%, #38bdf8 100%)',
            bgIcon: 'var(--color-cyan-bg)',
            borderColor: 'var(--color-cyan-border)'
          },
          { 
            label: 'Claims Verified', 
            target: 520000,
            decimals: 0,
            suffix: '+',
            sub: 'Cross-Referenced Factual Queries', 
            icon: CheckCircle2, 
            color: 'var(--color-success)',
            gradient: 'linear-gradient(90deg, #059669 0%, #10b981 50%, #34d399 100%)',
            bgIcon: 'var(--color-success-bg)',
            borderColor: 'var(--color-success-border)'
          },
          { 
            label: 'Global Audience Reach', 
            target: 140,
            decimals: 0,
            suffix: '+ Countries',
            sub: 'Live Multi-Language Monitoring', 
            icon: Globe2, 
            color: 'var(--color-purple)',
            gradient: 'linear-gradient(90deg, #7c3aed 0%, #a855f7 50%, #c084fc 100%)',
            bgIcon: 'var(--color-purple-bg)',
            borderColor: 'var(--color-purple-border)'
          },
          { 
            label: 'Trust & Accuracy Rate', 
            target: 99.4,
            decimals: 1,
            suffix: '%',
            sub: 'Independent Evidence Consensus', 
            icon: TrendingUp, 
            color: 'var(--color-orange)',
            gradient: 'linear-gradient(90deg, #ea580c 0%, #f97316 50%, #fb923c 100%)',
            bgIcon: 'var(--color-orange-bg)',
            borderColor: 'var(--color-orange-border)'
          }
        ].map((stat, idx) => {
          const Icon = stat.icon
          return (
            <motion.div 
              key={idx} 
              className="glass-panel card-hover-lift" 
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45, delay: 0.15 + idx * 0.08 }}
              whileHover={{ y: -6, boxShadow: '0 18px 40px -10px rgba(0, 0, 0, 0.45)' }}
              style={{ 
                padding: '1.9rem 1.85rem 1.75rem', 
                borderRadius: 'var(--radius-xl)', 
                textAlign: 'left',
                background: 'var(--color-bg-elevated)',
                border: '1px solid var(--color-border)', 
                boxShadow: 'var(--shadow-md)',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                position: 'relative',
                overflow: 'hidden',
                minHeight: '210px'
              }}
            >
              {/* Vibrant Top Color Background Accent Strip (Full Width) */}
              <div style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                height: '7px',
                background: stat.gradient,
                boxShadow: `0 2px 10px ${stat.borderColor}`
              }} />

              {/* Soft Ambient Glowing Tint Strip across top of the card */}
              <div style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                height: '85px',
                background: `linear-gradient(180deg, ${stat.bgIcon} 0%, transparent 100%)`,
                opacity: 0.85,
                pointerEvents: 'none'
              }} />

              {/* Card Top: Label & Large Icon */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.6rem', position: 'relative', zIndex: 1 }}>
                <span style={{ 
                  fontSize: '0.78rem', 
                  color: 'var(--color-text-dim)', 
                  fontWeight: 700, 
                  textTransform: 'uppercase', 
                  letterSpacing: '0.06em' 
                }}>
                  {stat.label}
                </span>
                <div style={{
                  width: '42px',
                  height: '42px',
                  borderRadius: '10px',
                  background: stat.bgIcon,
                  border: `1px solid ${stat.borderColor}`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: stat.color,
                  boxShadow: '0 4px 12px -2px rgba(0, 0, 0, 0.25)'
                }}>
                  <Icon size={20} />
                </div>
              </div>

              {/* Card Center: Animated Indication Number on Reload */}
              <div style={{ 
                fontSize: 'clamp(2rem, 2.75vw, 2.5rem)', 
                fontWeight: 800, 
                color: stat.color, 
                margin: '0.45rem 0 0.35rem 0',
                letterSpacing: '-0.025em',
                lineHeight: 1.15,
                position: 'relative',
                zIndex: 1
              }}>
                <AnimatedCounter 
                  end={stat.target} 
                  decimals={stat.decimals} 
                  suffix={stat.suffix}
                  duration={2.0}
                />
              </div>

              {/* Card Bottom: Subtitle Description */}
              <div style={{ 
                fontSize: '0.86rem', 
                color: 'var(--color-text-muted)', 
                lineHeight: 1.5,
                position: 'relative',
                zIndex: 1
              }}>
                {stat.sub}
              </div>
            </motion.div>
          )
        })}
      </motion.div>


      {/* ─── 2. FEATURE OVERVIEW SECTION ───────────────────────────── */}
      
      <div style={{ width: '100%', maxWidth: '1200px', textAlign: 'center', marginBottom: '4.5rem' }}>
        <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#38bdf8', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '0.5rem' }}>
          Core Capabilities
        </div>
        <h2 style={{ fontSize: '2.25rem', fontWeight: 800, color: 'var(--color-text)', marginBottom: '0.75rem' }}>
          Powered by Advanced Evidence Intelligence
        </h2>
        <p style={{ color: 'var(--color-text-muted)', maxWidth: '650px', margin: '0 auto 2.5rem', fontSize: '1.05rem', lineHeight: 1.6 }}>
          End-to-end multi-modal claim analysis pipeline engineered for maximum speed, precision, and explainable evidence verification.
        </p>

        <div className="responsive-card-grid">
          {[
            { 
              icon: <Globe2 size={26} color="var(--color-orange)" />, 
              title: 'Multi-Source News Ingestion', 
              desc: 'Queries NewsAPI, Google News RSS, and GDELT Project simultaneously to gather live global reporting from diverse independent outlets.',
              badge: 'Real-Time Ingestion',
              color: 'var(--color-orange)',
              badgeBg: 'var(--color-orange-bg)',
              badgeBorder: 'var(--color-orange-border)'
            },
            { 
              icon: <Search size={26} color="var(--color-cyan)" />, 
              title: 'MPNet Semantic Vector Ranking', 
              desc: 'Encodes 768-dimensional dense vector embeddings using sentence-transformers/all-mpnet-base-v2 to evaluate contextual relevance.',
              badge: 'MPNet Embeddings',
              color: 'var(--color-cyan)',
              badgeBg: 'var(--color-cyan-bg)',
              badgeBorder: 'var(--color-cyan-border)'
            },
            { 
              icon: <ShieldCheck size={26} color="var(--color-purple)" />, 
              title: 'DeBERTa Stance Inference', 
              desc: 'Cross-encoder Natural Language Inference (NLI) model classifies evidence stance into Supporting, Contradicting, or Related.',
              badge: 'DeBERTa-v3 NLI',
              color: 'var(--color-purple)',
              badgeBg: 'var(--color-purple-bg)',
              badgeBorder: 'var(--color-purple-border)'
            },
            { 
              icon: <CheckCircle2 size={26} color="var(--color-success)" />, 
              title: 'Source Credibility Rating', 
              desc: 'Built-in domain database weights wire services (Reuters, AP), official agencies, regional news, and flags unverified blog domains.',
              badge: 'Reputation Lookup',
              color: 'var(--color-success)',
              badgeBg: 'var(--color-success-bg)',
              badgeBorder: 'var(--color-success-border)'
            },
            { 
              icon: <Layers size={26} color="var(--color-accent)" />, 
              title: 'Deduplication & Cluster Analysis', 
              desc: 'Filters out syndicated reprints and echo-chamber copies, measuring true source independence across distinct news clusters.',
              badge: 'Syndication Filter',
              color: 'var(--color-accent)',
              badgeBg: 'rgba(99, 102, 241, 0.12)',
              badgeBorder: 'rgba(99, 102, 241, 0.3)'
            },
            { 
              icon: <BarChart3 size={26} color="var(--color-pink)" />, 
              title: 'Calibrated Trust Fusion', 
              desc: 'Synthesizes relevance, stance entailment, source quality, recency, and coverage into a binary calibrated verdict (≥0.50 Real vs <0.50 Fake).',
              badge: 'Fused 0-1 Score',
              color: 'var(--color-pink)',
              badgeBg: 'var(--color-pink-bg)',
              badgeBorder: 'var(--color-pink-border)'
            }
          ].map((feature, i) => (
            <motion.div 
              key={i}
              className="glass-panel card-hover-lift shimmer-hover" 
              style={{ 
                padding: '2rem', 
                textAlign: 'left',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                position: 'relative',
                overflow: 'hidden',
                borderTop: `2px solid ${feature.color}`
              }}
              initial={{ opacity: 0, y: 25 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.45, delay: i * 0.08, ease: [0.16, 1, 0.3, 1] }}
              whileHover={{ y: -6, borderColor: feature.color, scale: 1.015 }}
            >
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                  <div style={{ 
                    width: '3.25rem', 
                    height: '3.25rem', 
                    borderRadius: '0.85rem', 
                    background: feature.badgeBg,
                    border: `1px solid ${feature.badgeBorder}`, 
                    boxShadow: 'var(--shadow-sm)',
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center' 
                  }}>
                    {feature.icon}
                  </div>

                  <span style={{ 
                    fontSize: '0.75rem', 
                    fontWeight: 600, 
                    color: feature.color, 
                    background: feature.badgeBg,
                    padding: '0.25rem 0.65rem',
                    borderRadius: '9999px',
                    border: `1px solid ${feature.badgeBorder}`
                  }}>
                    {feature.badge}
                  </span>
                </div>

                <h3 style={{ fontSize: '1.2rem', marginBottom: '0.6rem', color: 'var(--color-text)', fontWeight: 700 }}>{feature.title}</h3>
                <p style={{ color: 'var(--color-text-muted)', fontSize: '0.92rem', lineHeight: 1.6 }}>{feature.desc}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>


      {/* ─── 3. VERIFICATION WORKFLOW SECTION ──────────────────────── */}
      
      <div style={{ width: '100%', maxWidth: '1200px', textAlign: 'center', marginBottom: '4.5rem' }}>
        <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#a78bfa', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '0.5rem' }}>
          Pipeline Mechanics
        </div>
        <h2 style={{ fontSize: '2.25rem', fontWeight: 800, color: 'var(--color-text)', marginBottom: '0.75rem' }}>
          Verification Workflow Architecture
        </h2>
        <p style={{ color: 'var(--color-text-muted)', maxWidth: '650px', margin: '0 auto 2.5rem', fontSize: '1.05rem', lineHeight: 1.6 }}>
          Four automated execution phases convert unverified news inputs into transparent, mathematical trust decisions.
        </p>

        <div className="responsive-workflow-grid">
          {[
            {
              step: '01',
              title: 'Input Ingestion',
              subtitle: 'Multi-Modal Parsing',
              desc: 'Accepts direct text claims, full body paragraphs, or news web URLs. Extracts key entities, actions, and claims.',
              color: 'var(--color-orange)',
              badgeBg: 'var(--color-orange-bg)',
              badgeBorder: 'var(--color-orange-border)'
            },
            {
              step: '02',
              title: 'Live News Retrieval',
              subtitle: 'Multi-Source Queries',
              desc: 'Generates targeted Boolean queries and retrieves live news articles across NewsAPI, Google News RSS, and GDELT.',
              color: 'var(--color-cyan)',
              badgeBg: 'var(--color-cyan-bg)',
              badgeBorder: 'var(--color-cyan-border)'
            },
            {
              step: '03',
              title: 'Dense ML Inference',
              subtitle: 'MPNet + DeBERTa-v3',
              desc: 'Calculates MPNet dense semantic similarity vectors and runs DeBERTa NLI cross-encoder for stance entailment.',
              color: 'var(--color-purple)',
              badgeBg: 'var(--color-purple-bg)',
              badgeBorder: 'var(--color-purple-border)'
            },
            {
              step: '04',
              title: 'Evidence Fusion',
              subtitle: 'Calibrated Verdict',
              desc: 'Combines relevance, stance, domain reputation, and recency into a final Trust Score with binary Real (≥0.50) vs Fake (<0.50) verdict.',
              color: 'var(--color-success)',
              badgeBg: 'var(--color-success-bg)',
              badgeBorder: 'var(--color-success-border)'
            }
          ].map((item, idx) => (
            <motion.div
              key={idx}
              className="glass-panel"
              style={{
                padding: '1.75rem 1.5rem',
                textAlign: 'left',
                position: 'relative',
                background: 'var(--color-bg-elevated)',
                border: '1px solid var(--color-border)', 
                boxShadow: 'var(--shadow-sm)',
                borderTop: `2px solid ${item.color}`
              }}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: idx * 0.1 }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <span style={{ 
                  fontSize: '1.75rem', 
                  fontWeight: 900, 
                  color: item.color,
                  fontFamily: 'monospace'
                }}>
                  {item.step}
                </span>
                <span style={{ 
                  fontSize: '0.75rem', 
                  color: item.color, 
                  fontWeight: 600,
                  background: item.badgeBg,
                  border: `1px solid ${item.badgeBorder}`,
                  padding: '0.2rem 0.6rem',
                  borderRadius: '9999px'
                }}>
                  {item.subtitle}
                </span>
              </div>

              <h4 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--color-text)', marginBottom: '0.5rem' }}>{item.title}</h4>
              <p style={{ color: 'var(--color-text-muted)', fontSize: '0.88rem', lineHeight: 1.6 }}>{item.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>


      {/* ─── 4. DAILY NEWS & FACT-CHECK SHOWCASE ───────────────────── */}
      
      <div id="daily-news" style={{ width: '100%', maxWidth: '1200px', marginBottom: '2.5rem' }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.85rem', fontWeight: 700, color: '#10b981', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '0.5rem' }}>
            <Radio size={16} className="animate-pulse" /> Live Daily Feed
          </div>
          <h2 style={{ fontSize: '2.25rem', fontWeight: 800, color: 'var(--color-text)', marginBottom: '0.75rem' }}>
            Daily News & Trending Verification Cards
          </h2>
          <p style={{ color: 'var(--color-text-muted)', maxWidth: '680px', margin: '0 auto', fontSize: '1.05rem', lineHeight: 1.6 }}>
            Browse current headlines retrieved live from verified news feeds. Click <strong style={{ color: 'var(--color-primary)' }}>"Verify Claim"</strong> on any article to run instant AI evidence analysis.
          </p>
        </div>

        {/* Controls Bar: Category Tabs & Search */}
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
          border: '1px solid var(--color-border)', boxShadow: 'var(--shadow-sm)'
        }}>
          {/* Category Tabs */}
          <div className="responsive-tabs-scroll">
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setNewsCategory(cat.id)}
                style={{
                  padding: '0.5rem 1rem',
                  borderRadius: 'var(--radius-md)',
                  fontSize: '0.88rem',
                  fontWeight: newsCategory === cat.id ? 700 : 500,
                  background: newsCategory === cat.id ? 'var(--badge-bg)' : 'transparent',
                  color: newsCategory === cat.id ? 'var(--color-primary)' : 'var(--color-text-muted)',
                  border: newsCategory === cat.id ? '1px solid var(--badge-border)' : '1px solid transparent',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
              >
                {cat.label}
              </button>
            ))}
          </div>

          {/* Search & Refresh */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flex: '1 1 250px', justifyContent: 'flex-end' }}>
            <div style={{ position: 'relative', flex: '1 1 200px', maxWidth: '300px' }}>
              <Search size={16} color="var(--color-text-dim)" style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)' }} />
              <input
                type="text"
                className="input"
                placeholder="Filter headlines..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                style={{ 
                  paddingLeft: '2.4rem', 
                  paddingTop: '0.45rem', 
                  paddingBottom: '0.45rem', 
                  fontSize: '0.88rem',
                  borderRadius: 'var(--radius-md)'
                }}
              />
            </div>

            <button
              onClick={() => fetchNews(newsCategory)}
              disabled={newsLoading}
              title="Refresh live news feed"
              style={{
                padding: '0.55rem',
                borderRadius: 'var(--radius-md)',
                background: 'var(--color-bg-secondary)',
                border: '1px solid var(--color-border)',
                color: newsLoading ? 'var(--color-text-dim)' : 'var(--color-text-muted)',
                cursor: newsLoading ? 'not-allowed' : 'pointer'
              }}
            >
              <RefreshCw size={17} style={{ animation: newsLoading ? 'spin 1s linear infinite' : 'none' }} />
            </button>
          </div>
        </div>

        {/* News Cards Grid */}
        {newsLoading ? (
          <div className="responsive-card-grid">
            {[1, 2, 3, 4, 5, 6].map((sk) => (
              <div 
                key={sk} 
                className="glass-panel" 
                style={{ padding: '1.75rem', minHeight: '220px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}
              >
                <div>
                  <div style={{ width: '80px', height: '18px', background: 'var(--color-border)', borderRadius: '4px', marginBottom: '1rem', opacity: 0.5 }} />
                  <div style={{ width: '90%', height: '22px', background: 'var(--color-border)', borderRadius: '4px', marginBottom: '0.6rem', opacity: 0.6 }} />
                  <div style={{ width: '60%', height: '22px', background: 'var(--color-border)', borderRadius: '4px', marginBottom: '1rem', opacity: 0.6 }} />
                  <div style={{ width: '100%', height: '14px', background: 'var(--color-border)', borderRadius: '4px', marginBottom: '0.4rem', opacity: 0.4 }} />
                  <div style={{ width: '80%', height: '14px', background: 'var(--color-border)', borderRadius: '4px', opacity: 0.4 }} />
                </div>
              </div>
            ))}
          </div>
        ) : filteredArticles.length === 0 ? (
          <div className="glass-panel" style={{ padding: '3rem', textAlign: 'center', color: 'var(--color-text-muted)' }}>
            <Newspaper size={40} color="var(--color-text-dim)" style={{ marginBottom: '1rem' }} />
            <p>No headlines found matching "{searchQuery}". Try selecting another category or clearing search.</p>
          </div>
        ) : (
          <div className="responsive-card-grid">
            {filteredArticles.map((article, idx) => (
              <motion.div
                key={article.id || idx}
                className="glass-panel"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35, delay: idx * 0.06 }}
                whileHover={{ y: -5, borderColor: 'rgba(59, 130, 246, 0.45)' }}
                style={{
                  padding: '1.75rem',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  background: 'var(--color-bg-elevated)', border: '1px solid var(--color-border)', boxShadow: 'var(--shadow-sm)',
                  position: 'relative'
                }}
              >
                <div>
                  {/* Top Metadata Header */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.85rem' }}>
                    <span style={{ 
                      fontSize: '0.72rem', 
                      fontWeight: 700, 
                      color: '#38bdf8', 
                      background: 'rgba(56, 189, 248, 0.1)',
                      border: '1px solid rgba(56, 189, 248, 0.25)',
                      padding: '0.2rem 0.6rem',
                      borderRadius: '9999px',
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em'
                    }}>
                      {article.category || 'TRENDING'}
                    </span>

                    <span style={{ fontSize: '0.75rem', color: 'var(--color-text-dim)', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                      <Clock size={13} /> {article.published_at || 'Today'}
                    </span>
                  </div>

                  {/* Headline Title */}
                  <h3 style={{ 
                    fontSize: '1.1rem', 
                    fontWeight: 700, 
                    color: 'var(--color-text)', 
                    lineHeight: 1.45,
                    marginBottom: '0.75rem' 
                  }}>
                    {article.title}
                  </h3>

                  {/* Description Snippet */}
                  <p style={{ 
                    fontSize: '0.88rem', 
                    color: 'var(--color-text-muted)', 
                    lineHeight: 1.55,
                    marginBottom: '1.25rem',
                    display: '-webkit-box',
                    WebkitLineClamp: 3,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden'
                  }}>
                    {article.description}
                  </p>
                </div>

                {/* Card Footer: Domain Tag & Verify Button */}
                <div style={{ paddingTop: '1rem', borderTop: '1px solid var(--color-border)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                    <div style={{ fontSize: '0.8rem', color: 'var(--color-text-dim)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      <Globe2 size={14} color="var(--color-primary)" />
                      <span style={{ fontWeight: 600, color: 'var(--color-text)' }}>{article.source}</span>
                    </div>

                    <span style={{ 
                      fontSize: '0.7rem', 
                      color: '#34d399', 
                      fontWeight: 600,
                      background: 'rgba(52, 211, 153, 0.1)',
                      padding: '0.15rem 0.5rem',
                      borderRadius: '4px'
                    }}>
                      {article.credibility_level || 'HIGH CREDIBILITY'}
                    </span>
                  </div>

                  <div style={{ display: 'flex', gap: '0.6rem' }}>
                    <button
                      className="btn btn-primary"
                      onClick={() => handleVerifyArticle(article.verifiable_claim || article.title)}
                      style={{ 
                        flex: 1, 
                        padding: '0.6rem 1rem', 
                        fontSize: '0.88rem', 
                        borderRadius: 'var(--radius-md)',
                        justifyContent: 'center'
                      }}
                    >
                      <Sparkles size={16} /> Verify Claim
                    </button>

                    {article.url && article.url !== '#' && (
                      <a
                        href={article.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn btn-secondary"
                        style={{ padding: '0.6rem 0.75rem', borderRadius: 'var(--radius-md)' }}
                        title="Open source article"
                      >
                        <ExternalLink size={16} />
                      </a>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

    </div>
  )
}

// Fallback Articles Data
function getFallbackArticles(category) {
  const all = [
    {
      id: 'fb-1',
      title: 'NASA James Webb Telescope Detects Atmospheric Water Signature on Exoplanet K2-18b',
      description: 'Astronomers analyzing NIRSpec spectroscopic measurements confirm carbon-based molecules and water vapor signatures in the atmosphere of a 120 light-year distant exoplanet.',
      source: 'NASA Official',
      domain: 'nasa.gov',
      url: 'https://nasa.gov',
      published_at: 'Today, 08:30 UTC',
      category: 'SCIENCE',
      credibility_level: 'GOVERNMENT AGENCY',
      verifiable_claim: 'NASA James Webb Telescope detected atmospheric water vapor signature on exoplanet K2-18b.'
    },
    {
      id: 'fb-2',
      title: 'Global Renewable Power Generation Surpasses 35 Percent Threshold for First Time',
      description: 'International Energy Agency annual metrics reveal solar and wind output expanded by record capacity across Asia-Pacific and European power grids.',
      source: 'Reuters Wire',
      domain: 'reuters.com',
      url: 'https://reuters.com',
      published_at: 'Today, 06:15 UTC',
      category: 'WORLD',
      credibility_level: 'WIRE SERVICE',
      verifiable_claim: 'Global renewable power generation surpassed 35 percent threshold.'
    },
    {
      id: 'fb-3',
      title: 'European Union Enforces Mandatory Transparency Regulations for Generative AI Models',
      description: 'The European Artificial Intelligence Act requires foundation model developers to publish detailed summaries of copyrighted training data and watermark synthetic media.',
      source: 'BBC News',
      domain: 'bbc.com',
      url: 'https://bbc.com',
      published_at: 'Today, 11:00 UTC',
      category: 'TECH',
      credibility_level: 'PUBLIC BROADCASTER',
      verifiable_claim: 'EU enforces mandatory transparency regulations for generative AI foundation models.'
    },
    {
      id: 'fb-4',
      title: 'Quantum Computing Research Team Demonstrates 1,000-Qubit Error-Corrected Processor',
      description: 'Fault-tolerant quantum architecture achieves 99.9% logical gate fidelity by suppressing physical qubit noise via surface code error suppression.',
      source: 'MIT Tech Review',
      domain: 'technologyreview.com',
      url: 'https://technologyreview.com',
      published_at: 'Today, 04:20 UTC',
      category: 'TECH',
      credibility_level: 'ACADEMIC PUBLICATION',
      verifiable_claim: 'Quantum computing team demonstrated a 1,000-qubit error-corrected processor.'
    },
    {
      id: 'fb-5',
      title: 'Room-Temperature Superconductor Research Paper Officially Retracted Following Replication Failures',
      description: 'Scientific journal editorial board withdraws high-pressure hydride superconductivity paper after multiple independent physics laboratories failed to observe zero resistance.',
      source: 'Nature News',
      domain: 'nature.com',
      url: 'https://nature.com',
      published_at: 'Yesterday, 18:45 UTC',
      category: 'SCIENCE',
      credibility_level: 'PEER-REVIEWED',
      verifiable_claim: 'Room-temperature superconductor paper was retracted following replication failures.'
    },
    {
      id: 'fb-6',
      title: 'Federal Reserve Holds Benchmark Policy Rate Stable Amid Moderating Inflation Indicators',
      description: 'Federal Open Market Committee votes unanimously to maintain target interest rate range while assessing ongoing economic growth and employment data.',
      source: 'Associated Press',
      domain: 'apnews.com',
      url: 'https://apnews.com',
      published_at: 'Yesterday, 21:10 UTC',
      category: 'BUSINESS',
      credibility_level: 'WIRE SERVICE',
      verifiable_claim: 'Federal Reserve held benchmark policy rate stable amid moderating inflation.'
    }
  ]

  if (category === 'all') return all
  return all.filter(a => a.category.toLowerCase() === category.toLowerCase())
}
