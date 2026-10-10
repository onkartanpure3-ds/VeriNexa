import { useNavigate } from 'react-router-dom'
import { 
  Cpu, Shield, Globe2, Search, BarChart3, Layers, CheckCircle2, 
  ArrowRight, Sparkles, Scale, BookOpen, Terminal, Check
} from 'lucide-react'
import { motion } from 'framer-motion'

export default function HowItWorks() {
  const navigate = useNavigate()

  return (
    <div className="container" style={{ maxWidth: '1080px' }}>
      
      {/* Hero Header */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        style={{ textAlign: 'center', marginBottom: '4rem' }}
      >
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '0.5rem',
          padding: '0.4rem 1rem',
          borderRadius: '9999px',
          background: 'var(--badge-bg)',
          border: '1px solid var(--badge-border)',
          color: 'var(--color-primary)',
          fontSize: '0.85rem',
          fontWeight: 600,
          marginBottom: '1.25rem'
        }}>
          <Cpu size={16} /> VeriNexa Technical Architecture
        </div>

        <h1 style={{ fontSize: 'clamp(2.4rem, 5vw, 3.5rem)', fontWeight: 800, color: 'var(--color-text)', marginBottom: '1.25rem' }}>
          How <span className="text-gradient-multi">VeriNexa</span> Verifies Online Claims
        </h1>

        <p style={{ color: 'var(--color-text-muted)', fontSize: '1.2rem', maxWidth: '720px', margin: '0 auto', lineHeight: 1.6 }}>
          A multi-stage intelligence pipeline combining live global retrieval, dense transformer embeddings, cross-encoder natural language inference, and calibrated mathematical fusion.
        </p>

        <div style={{ marginTop: '2rem', display: 'flex', justifyContent: 'center', gap: '1rem' }}>
          <button 
            className="btn btn-primary"
            onClick={() => navigate('/verify')}
            style={{ padding: '0.85rem 2rem', fontSize: '1.05rem' }}
          >
            Test Live Verification <ArrowRight size={18} />
          </button>
        </div>
      </motion.div>

      {/* 4 Core Pillars */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.5rem', marginBottom: '3.5rem' }}>
        {[
          {
            icon: <Globe2 size={24} color="var(--color-orange)" />,
            title: 'Multi-Source Retrieval',
            desc: 'Queries NewsAPI, Google News RSS, and GDELT Project concurrently to gather comprehensive reporting.',
            color: 'var(--color-orange)',
            bg: 'var(--color-orange-bg)',
            border: 'var(--color-orange-border)'
          },
          {
            icon: <Search size={24} color="var(--color-cyan)" />,
            title: 'MPNet Semantic Match',
            desc: 'Encodes 768-dim dense vector embeddings to measure deep semantic similarity beyond keyword overlap.',
            color: 'var(--color-cyan)',
            bg: 'var(--color-cyan-bg)',
            border: 'var(--color-cyan-border)'
          },
          {
            icon: <Shield size={24} color="var(--color-purple)" />,
            title: 'DeBERTa Stance NLI',
            desc: 'Evaluates entailment vs contradiction using cross-encoder natural language inference.',
            color: 'var(--color-purple)',
            bg: 'var(--color-purple-bg)',
            border: 'var(--color-purple-border)'
          },
          {
            icon: <Scale size={24} color="var(--color-success)" />,
            title: 'Calibrated Fusion',
            desc: 'Synthesizes multi-factor scores into a single binary verdict (≥0.50 Real vs <0.50 Fake).',
            color: 'var(--color-success)',
            bg: 'var(--color-success-bg)',
            border: 'var(--color-success-border)'
          }
        ].map((pillar, i) => (
          <motion.div
            key={i}
            className="glass-panel card-hover-lift shimmer-hover"
            style={{ 
              padding: '1.75rem', 
              background: 'var(--color-bg-elevated)',
              borderTop: `2px solid ${pillar.color}`
            }}
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.35, delay: i * 0.08, ease: [0.16, 1, 0.3, 1] }}
            whileHover={{ y: -5, scale: 1.01 }}
          >
            <div style={{ 
              width: '3rem', 
              height: '3rem', 
              borderRadius: '0.75rem', 
              background: 'var(--color-bg-secondary)',
              border: '1px solid var(--color-border)',
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center', 
              marginBottom: '1rem',
              boxShadow: 'var(--shadow-sm)'
            }}>
              {pillar.icon}
            </div>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--color-text)', marginBottom: '0.5rem' }}>{pillar.title}</h3>
            <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem', lineHeight: 1.6 }}>{pillar.desc}</p>
          </motion.div>
        ))}
      </div>

      {/* Detailed Pipeline Breakdown */}
      <div style={{ marginBottom: '3.5rem' }}>
        <h2 style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--color-text)', marginBottom: '1rem', textAlign: 'center' }}>
          7-Stage Verification Pipeline Execution
        </h2>
        <p style={{ color: 'var(--color-text-muted)', textAlign: 'center', maxWidth: '650px', margin: '0 auto 3rem', fontSize: '1.05rem' }}>
          Every claim undergoes systematic processing through seven specialized backend services.
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {[
            {
              num: '01',
              name: 'Ingestion & Salient Claim Extraction',
              service: 'ClaimExtractor',
              desc: 'Parses input statements, headlines, or scraped web URLs. Isolates named entities (PER, ORG, LOC, DATE) and core predicate actions.'
            },
            {
              num: '02',
              name: 'Contextual Query Synthesis',
              service: 'QueryGenerator',
              desc: 'Synthesizes targeted multi-provider Boolean query formulations combining exact phrases, entity filters, and related topic anchors.'
            },
            {
              num: '03',
              name: 'Parallel News & Web Retrieval',
              service: 'NewsRetriever',
              desc: 'Queries NewsAPI, GDELT Project, and Google News RSS in parallel with provider health tracking and rate-limit fallbacks.'
            },
            {
              num: '04',
              name: 'Near-Duplicate Clustering & Independence',
              service: 'DuplicateDetector',
              desc: 'Calculates fuzzy title similarity and embedding distances to cluster syndicated wire re-prints, measuring genuine source independence.'
            },
            {
              num: '05',
              name: 'Dense Vector Semantic Ranking',
              service: 'SemanticRanker (all-mpnet-base-v2)',
              desc: 'Generates 768-dimensional contextual vector representations of candidate evidence snippets and ranks top candidate articles by cosine relevance.'
            },
            {
              num: '06',
              name: 'Natural Language Inference Stance Classification',
              service: 'NLIClassifier (nli-deberta-v3-small)',
              desc: 'Passes top candidate evidence pairs through DeBERTa cross-encoder to assign stances: SUPPORTING, CONTRADICTING, RELATED, or INSUFFICIENT.'
            },
            {
              num: '07',
              name: 'Multi-Factor Evidence Fusion & Verdict Calibration',
              service: 'EvidenceFusion',
              desc: 'Synthesizes all evidence signals into a final Trust Score on a 0.00–1.00 scale and applies a strict 0.50 decision threshold (≥0.50 Real vs <0.50 Fake).'
            }
          ].map((stage, idx) => (
            <motion.div 
              key={idx}
              className="glass-panel card-hover-lift shimmer-hover"
              initial={{ opacity: 0, x: -15 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.35, delay: idx * 0.05, ease: [0.16, 1, 0.3, 1] }}
              whileHover={{ x: 4, borderColor: 'rgba(59, 130, 246, 0.4)' }}
              style={{ 
                padding: '1.5rem 2rem', 
                display: 'flex', 
                gap: '1.75rem', 
                alignItems: 'flex-start',
                background: 'var(--color-bg-elevated)'
              }}
            >
              <span style={{ 
                fontSize: '1.5rem', 
                fontWeight: 900, 
                color: '#3b82f6', 
                fontFamily: 'monospace',
                minWidth: '40px' 
              }}>
                {stage.num}
              </span>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '0.4rem' }}>
                  <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--color-text)' }}>{stage.name}</h3>
                  <span style={{ 
                    fontSize: '0.75rem', 
                    fontWeight: 600, 
                    color: '#93c5fd', 
                    background: 'rgba(59, 130, 246, 0.1)',
                    border: '1px solid rgba(59, 130, 246, 0.25)',
                    padding: '0.2rem 0.6rem',
                    borderRadius: '9999px'
                  }}>
                    {stage.service}
                  </span>
                </div>
                <p style={{ color: 'var(--color-text-muted)', fontSize: '0.92rem', lineHeight: 1.6 }}>{stage.desc}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Mathematical Scoring Weights Table */}
      <div className="glass-panel" style={{ padding: '2.5rem', background: 'var(--color-bg-elevated)', marginBottom: '1.5rem' }}>
        <h2 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--color-text)', marginBottom: '0.75rem' }}>
          Mathematical Evidence Fusion Formula
        </h2>
        <p style={{ color: 'var(--color-text-muted)', fontSize: '0.95rem', marginBottom: '2rem', lineHeight: 1.6 }}>
          The final Trust Score is a convex combination of six independent validation factors, calibrated to prevent bias from individual outlets:
        </p>

        <div style={{ 
          background: 'rgba(0, 0, 0, 0.3)', 
          padding: '1.25rem 1.5rem', 
          borderRadius: 'var(--radius-lg)', 
          border: '1px solid var(--color-border)',
          fontFamily: 'monospace',
          fontSize: '0.95rem',
          color: '#93c5fd',
          marginBottom: '2rem',
          overflowX: 'auto'
        }}>
          Score = (0.30 × S_sem) + (0.30 × S_nli) + (0.15 × S_cov) + (0.10 × S_src) + (0.10 × S_rec) + (0.05 × S_ind)
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.9rem' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--color-border)', color: 'var(--color-text-dim)' }}>
                <th style={{ padding: '0.75rem' }}>Factor</th>
                <th style={{ padding: '0.75rem' }}>Weight</th>
                <th style={{ padding: '0.75rem' }}>Source / Model</th>
                <th style={{ padding: '0.75rem' }}>Description</th>
              </tr>
            </thead>
            <tbody>
              {[
                { factor: 'Semantic Relevance', weight: '30%', model: 'MPNet (768-dim)', desc: 'Measures contextual similarity between claim and article text.' },
                { factor: 'NLI Stance Relation', weight: '30%', model: 'DeBERTa-v3 Cross-Encoder', desc: 'Evaluates entailment vs contradiction vs neutrality.' },
                { factor: 'Claim Entity Coverage', weight: '15%', model: 'NER Tokenizer', desc: 'Verifies whether evidence addresses all essential named entities.' },
                { factor: 'Source Credibility', weight: '10%', model: 'Domain Database', desc: 'Weights wire agencies, official government, and news tier ratings.' },
                { factor: 'Publication Recency', weight: '10%', model: 'Exponential Decay', desc: 'Freshness penalty relative to the 30-day/annual news cycle.' },
                { factor: 'Source Independence', weight: '5%', model: 'Cluster Analysis', desc: 'Bonus for evidence originating from distinct corporate networks.' },
              ].map((row, idx) => (
                <tr key={idx} style={{ borderBottom: '1px solid var(--color-border)' }}>
                  <td style={{ padding: '0.75rem', fontWeight: 600, color: 'var(--color-text)' }}>{row.factor}</td>
                  <td style={{ padding: '0.75rem', fontWeight: 700, color: 'var(--color-primary)' }}>{row.weight}</td>
                  <td style={{ padding: '0.75rem', color: 'var(--badge-text)', fontWeight: 500 }}>{row.model}</td>
                  <td style={{ padding: '0.75rem', color: 'var(--color-text-muted)' }}>{row.desc}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  )
}
