"""
Truth LenX — Configuration & Environment
"""
import os
from pathlib import Path
from datetime import datetime, timedelta, timezone
from dotenv import load_dotenv

env_path = Path(__file__).parent / ".env"
load_dotenv(dotenv_path=env_path, override=True)

# ─── Evidence Window ───────────────────────────────────────────────────
EVIDENCE_WINDOW_DAYS = int(os.getenv("EVIDENCE_WINDOW_DAYS", "30"))

def get_evidence_window():
    """Return the 30-day evidence window boundaries."""
    now = datetime.now(timezone.utc)
    return {
        "days": EVIDENCE_WINDOW_DAYS,
        "from": (now - timedelta(days=EVIDENCE_WINDOW_DAYS)).isoformat(),
        "to": now.isoformat(),
    }

# ─── API Keys & Provider Endpoints ─────────────────────────────────────
NEWSAPI_KEY = os.getenv("NEWSAPI_KEY", "")
NEWSAPI_URL = os.getenv("NEWSAPI_URL", os.getenv("NEWAPI_URL", "https://newsapi.org/v2/everything"))
GDELT_URL = os.getenv("GDELT_URL", os.getenv("GDLET_URL", "https://api.gdeltproject.org/api/v2/doc/doc"))
GDELT_ENABLED = os.getenv("GDELT_ENABLED", "true").lower() == "true"
GOOGLE_NEWS_ENABLED = os.getenv("GOOGLE_NEWS_ENABLED", "true").lower() == "true"

# ─── Model Paths (Option B: Memory-Optimized for 512MB Free Tier) ──────
MPNET_MODEL = os.getenv("MPNET_MODEL", "sentence-transformers/all-MiniLM-L6-v2")
NLI_MODEL = os.getenv("NLI_MODEL", "cross-encoder/nli-deberta-v3-xsmall")

# ─── Concurrency & Memory Controls ────────────────────────────────────
TORCH_THREADS = int(os.getenv("TORCH_THREADS", "1"))
MAX_CONCURRENT_VERIFICATIONS = int(os.getenv("MAX_CONCURRENT_VERIFICATIONS", "1"))
RANKER_BATCH_SIZE = int(os.getenv("RANKER_BATCH_SIZE", "8"))
NLI_BATCH_SIZE = int(os.getenv("NLI_BATCH_SIZE", "4"))
MAX_CANDIDATE_ARTICLES = int(os.getenv("MAX_CANDIDATES", "15"))
TOP_K_EVIDENCE = int(os.getenv("TOP_K_EVIDENCE", "8"))

# ─── Evidence Scoring Weights (configurable) ──────────────────────────
SCORING_WEIGHTS = {
    "semantic_relevance": float(os.getenv("WEIGHT_SEMANTIC", "0.30")),
    "nli_relation": float(os.getenv("WEIGHT_NLI", "0.30")),
    "claim_coverage": float(os.getenv("WEIGHT_COVERAGE", "0.15")),
    "source_quality": float(os.getenv("WEIGHT_SOURCE", "0.10")),
    "recency": float(os.getenv("WEIGHT_RECENCY", "0.10")),
    "independence": float(os.getenv("WEIGHT_INDEPENDENCE", "0.05")),
}

# ─── Evidence Fusion Thresholds ───────────────────────────────────────
FUSION_THRESHOLDS = {
    "support_threshold": 0.40,
    "contradiction_threshold": 0.40,
    "min_independent_clusters": 1,
    "min_semantic_relevance": 0.20,
    "min_evidence_strength": 0.40,
    "classification_threshold": 0.50, # >= 0.50 is REAL, < 0.50 is FAKE
}

# ─── Server Settings ─────────────────────────────────────────────────
CORS_ORIGINS = os.getenv("CORS_ORIGINS", "http://localhost:5173,http://localhost:3000").split(",")
HOST = os.getenv("HOST", "0.0.0.0")
PORT = int(os.getenv("PORT", "8001"))

# ─── Logging ──────────────────────────────────────────────────────────
LOG_LEVEL = os.getenv("LOG_LEVEL", "INFO")
