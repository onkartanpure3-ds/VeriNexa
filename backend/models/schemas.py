"""
Truth LenX — Pydantic Response Schemas

Defines the complete response schema for verification results,
evidence items, source credibility, and system status.
"""
from __future__ import annotations

from enum import Enum
from typing import Any, Optional

from pydantic import BaseModel, Field


# ─── Enumerations ─────────────────────────────────────────────────────

class VerificationStatus(str, Enum):
    REAL = "REAL"
    FAKE = "FAKE"
    UNCERTAIN = "UNCERTAIN"
    VERIFICATION_UNAVAILABLE = "VERIFICATION_UNAVAILABLE"


class EvidenceRelation(str, Enum):
    SUPPORTING = "SUPPORTING"
    CONTRADICTING = "CONTRADICTING"
    RELATED = "RELATED"
    INSUFFICIENT = "INSUFFICIENT"


class ProviderState(str, Enum):
    UNKNOWN = "UNKNOWN"
    AVAILABLE = "AVAILABLE"
    RATE_LIMITED = "RATE_LIMITED"
    NOT_CONFIGURED = "NOT_CONFIGURED"
    ERROR = "ERROR"


class ModelState(str, Enum):
    READY = "READY"
    LOADING = "LOADING"
    ERROR = "ERROR"


class InputType(str, Enum):
    TEXT = "text"
    URL = "url"
    CLAIM = "claim"


# ─── Sub-models ───────────────────────────────────────────────────────

class EvidenceWindow(BaseModel):
    days: int = 30
    from_date: str = Field(..., alias="from")
    to_date: str = Field(..., alias="to")

    model_config = {"populate_by_name": True}


class SourceCredibilityInfo(BaseModel):
    domain: str = ""
    source_type: str = ""
    credibility_level: str = ""
    category: str = ""
    rationale: str = ""
    last_reviewed: str = ""
    reference_url: str = ""
    notes: str = ""
    official_source: bool = False
    source_quality_score: float = 0.0


class EvidenceItem(BaseModel):
    title: str = ""
    source: str = ""
    domain: str = ""
    url: str = ""
    published_at: str = ""
    relation: EvidenceRelation = EvidenceRelation.INSUFFICIENT
    semantic_similarity: float = 0.0
    nli_entailment: float = 0.0
    nli_contradiction: float = 0.0
    nli_neutral: float = 0.0
    claim_coverage: float = 0.0
    source_quality: float = 0.0
    recency_score: float = 0.0
    evidence_strength: float = 0.0
    cluster: str = ""
    reason: str = ""
    source_credibility: SourceCredibilityInfo = Field(
        default_factory=SourceCredibilityInfo
    )


class SourceSummary(BaseModel):
    domain: str = ""
    source_type: str = ""
    credibility_level: str = ""
    category: str = ""
    articles_count: int = 0
    avg_quality: float = 0.0


class ArticleAnalysis(BaseModel):
    headline: str = ""
    entities: list[dict[str, str]] = Field(default_factory=list)
    claim_type: str = ""
    input_type: str = ""
    source_domain: str = ""
    publication_date: str = ""
    evidence_window: Optional[EvidenceWindow] = None


class ExtractionMetadata(BaseModel):
    original_url: str = ""
    resolved_url: str = ""
    title: str = ""
    extraction_status: str = ""
    publication_date: str = ""
    source_domain: str = ""


# ─── Main Response ────────────────────────────────────────────────────

class VerificationResponse(BaseModel):
    status: VerificationStatus
    confidence: Optional[float] = None
    trust_score: Optional[float] = None
    claim: str = ""
    input_type: InputType = InputType.CLAIM
    evidence_window: EvidenceWindow
    candidate_count: int = 0
    evidence_count: int = 0
    supporting_count: int = 0
    contradicting_count: int = 0
    related_count: int = 0
    insufficient_count: int = 0
    source_diversity: int = 0
    independent_clusters: int = 0
    evidence: list[EvidenceItem] = Field(default_factory=list)
    source_summary: list[SourceSummary] = Field(default_factory=list)
    reason: str = ""
    methodology: str = ""
    provider_status: dict[str, str] = Field(default_factory=dict)
    model_status: dict[str, str] = Field(default_factory=dict)
    article_analysis: Optional[ArticleAnalysis] = None
    extraction_metadata: Optional[ExtractionMetadata] = None


# ─── Request Models ──────────────────────────────────────────────────

class VerifyTextRequest(BaseModel):
    text: str = Field(..., min_length=10, max_length=10000)


class VerifyUrlRequest(BaseModel):
    url: str = Field(..., min_length=10)


class VerifyClaimRequest(BaseModel):
    claim: str = Field(..., min_length=5, max_length=500)


# ─── System Status ───────────────────────────────────────────────────

class SystemStatus(BaseModel):
    providers: dict[str, str] = Field(default_factory=dict)
    models: dict[str, str] = Field(default_factory=dict)
    source_database: str = "UNKNOWN"
    evidence_fusion: str = "UNKNOWN"
    uptime_seconds: float = 0.0
