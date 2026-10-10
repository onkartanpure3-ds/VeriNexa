const STORAGE_KEY = 'verinexa_verified_history'

const INITIAL_SAMPLES = [
  {
    id: 'hist-sample-1',
    timestamp: new Date(Date.now() - 1000 * 60 * 35).toISOString(),
    claim: 'NASA and SpaceX launch Crew-8 mission to International Space Station',
    status: 'REAL',
    confidence: 94.2,
    trust_score: 0.94,
    evidence_count: 8,
    supporting_count: 7,
    contradicting_count: 0,
    source_diversity: 6,
    input_type: 'claim',
    reason: 'Corroborated by NASA press releases, Reuters, and AP News wire coverage.'
  },
  {
    id: 'hist-sample-2',
    timestamp: new Date(Date.now() - 1000 * 60 * 180).toISOString(),
    claim: 'Government announces complete immediate ban on cash transactions starting next month',
    status: 'FAKE',
    confidence: 12.5,
    trust_score: 0.13,
    evidence_count: 7,
    supporting_count: 0,
    contradicting_count: 6,
    source_diversity: 5,
    input_type: 'claim',
    reason: 'Explicitly debunked by central financial authorities and fact-checking desks.'
  },
  {
    id: 'hist-sample-3',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
    claim: 'Reserve Bank of India keeps repo rate unchanged at 6.5 percent in monetary policy review',
    status: 'REAL',
    confidence: 96.0,
    trust_score: 0.96,
    evidence_count: 9,
    supporting_count: 8,
    contradicting_count: 0,
    source_diversity: 7,
    input_type: 'claim',
    reason: 'Multiple official press announcements and business wire reports confirm monetary policy hold.'
  }
]

export function getVerifiedHistory() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_SAMPLES))
      return INITIAL_SAMPLES
    }
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed : INITIAL_SAMPLES
  } catch (err) {
    console.error('Failed to read history from localStorage:', err)
    return INITIAL_SAMPLES
  }
}

export function saveToHistory(entry) {
  try {
    const history = getVerifiedHistory()
    const newEntry = {
      id: entry.id || `hist-${Date.now()}`,
      timestamp: entry.timestamp || new Date().toISOString(),
      claim: entry.claim,
      status: entry.status || (entry.trust_score >= 0.5 ? 'REAL' : 'FAKE'),
      confidence: entry.confidence || Math.round((entry.trust_score || 0.5) * 100),
      trust_score: entry.trust_score !== undefined ? entry.trust_score : 0.5,
      evidence_count: entry.evidence_count || 0,
      supporting_count: entry.supporting_count || 0,
      contradicting_count: entry.contradicting_count || 0,
      source_diversity: entry.source_diversity || 1,
      input_type: entry.input_type || 'claim',
      reason: entry.reason || '',
      result_data: entry
    }
    const updated = [newEntry, ...history.filter(h => h.id !== newEntry.id)].slice(0, 50)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
    return updated
  } catch (err) {
    console.error('Failed to save history item:', err)
    return []
  }
}

export function clearVerifiedHistory() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify([]))
  } catch (err) {
    console.error('Failed to clear history:', err)
  }
}

export function deleteHistoryItem(id) {
  try {
    const history = getVerifiedHistory()
    const filtered = history.filter(item => item.id !== id)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered))
    return filtered
  } catch (err) {
    console.error('Failed to delete history item:', err)
    return []
  }
}
