"""
Truth LenX — Evidence Scorer

Calculates comprehensive engineering scores for evidence articles based on:
- Semantic similarity (from MPNet)
- NLI Entailment/Contradiction (from DeBERTa)
- Claim coverage (entity overlap)
- Source quality (from Source Credibility Service)
- Recency (time since publication)
- Source independence (handled via clusters in Fusion)
"""
from __future__ import annotations

import logging
from datetime import datetime, timezone
from typing import Any

from dateutil.parser import parse as parse_date

from config import SCORING_WEIGHTS, EVIDENCE_WINDOW_DAYS
from models.schemas import EvidenceRelation

logger = logging.getLogger("truthlenx.evidence_scorer")


class EvidenceScorer:
    """Calculates engineering scores for evidence items."""

    def __init__(self):
        self.weights = SCORING_WEIGHTS
        # Normalize weights to ensure they sum to 1.0 (excluding independence which is clustered)
        total = (
            self.weights["semantic_relevance"] +
            self.weights["nli_relation"] +
            self.weights["claim_coverage"] +
            self.weights["source_quality"] +
            self.weights["recency"]
        )
        self.w_sem = self.weights["semantic_relevance"] / total
        self.w_nli = self.weights["nli_relation"] / total
        self.w_cov = self.weights["claim_coverage"] / total
        self.w_src = self.weights["source_quality"] / total
        self.w_rec = self.weights["recency"] / total

    def score(
        self, claim: str, claim_entities: list[dict], articles: list[dict[str, Any]]
    ) -> list[dict[str, Any]]:
        """
        Calculate full engineering scores for a list of processed articles.
        Assumes articles already have semantic_similarity, NLI scores, and source_quality.
        """
        for art in articles:
            # 1. Semantic Score (0 to 1)
            # MPNet cosine similarity is roughly -1 to 1. Normalize to 0-1 range.
            raw_sim = art.get("semantic_similarity", 0.0)
            sem_score = max(0.0, (raw_sim + 0.1) / 1.1)  # Shift slightly to avoid negative scores for loosely related

            # 2. NLI Score (0 to 1) - strength of relation
            # We want to measure the *strength* of whatever relation it has (support or contradict)
            relation = art.get("relation")
            if relation == EvidenceRelation.SUPPORTING.value:
                nli_score = art.get("nli_entailment", 0.0)
            elif relation == EvidenceRelation.CONTRADICTING.value:
                nli_score = art.get("nli_contradiction", 0.0)
            else:
                # Neutral/Related has a lower NLI score contribution
                nli_score = art.get("nli_neutral", 0.0) * 0.5

            # 3. Claim Coverage (0 to 1)
            coverage_score = self._calculate_coverage(claim_entities, art)
            art["claim_coverage"] = coverage_score

            # 4. Source Quality (0 to 1)
            src_score = art.get("source_quality", 0.5)

            # 5. Recency Score (0 to 1)
            recency_score = self._calculate_recency(art.get("published_at", ""))
            art["recency_score"] = recency_score

            # 6. Overall Evidence Strength (Weighted Sum)
            strength = (
                (sem_score * self.w_sem) +
                (nli_score * self.w_nli) +
                (coverage_score * self.w_cov) +
                (src_score * self.w_src) +
                (recency_score * self.w_rec)
            )
            art["evidence_strength"] = float(min(1.0, max(0.0, strength)))

            # Add reason string
            art["reason"] = self._generate_reason(art)

        # Sort by evidence strength descending
        articles.sort(key=lambda x: x["evidence_strength"], reverse=True)
        return articles

    def _calculate_coverage(self, claim_entities: list[dict], article: dict) -> float:
        """Calculate proportion of claim entities found in the article."""
        if not claim_entities:
            return 1.0  # If no entities to check, assume full coverage

        text = (article.get("title", "") + " " + article.get("content", "")).lower()
        
        found = 0
        for entity in claim_entities:
            val = entity["value"].lower()
            if val in text:
                found += 1
                
        return float(found / len(claim_entities))

    def _calculate_recency(self, date_str: str) -> float:
        """Calculate recency score (1.0 for now, decaying to 0.5 at 30 days)."""
        if not date_str:
            return 0.5  # Default for unknown date

        try:
            pub_date = parse_date(date_str)
            # Ensure timezone aware
            if pub_date.tzinfo is None:
                pub_date = pub_date.replace(tzinfo=timezone.utc)
                
            now = datetime.now(timezone.utc)
            delta = now - pub_date
            
            days_old = delta.days
            if days_old < 0:
                return 1.0 # Future dates? Cap at 1.0
            if days_old > EVIDENCE_WINDOW_DAYS:
                return 0.1 # Outside window, very low score
                
            # Linear decay from 1.0 to 0.5 over the evidence window
            decay_factor = 0.5 / EVIDENCE_WINDOW_DAYS
            score = 1.0 - (days_old * decay_factor)
            return max(0.5, score)
            
        except Exception:
            return 0.5

    def _generate_reason(self, art: dict) -> str:
        """Generate a human-readable reason for why this evidence matters."""
        rel = art.get("relation")
        src = art.get("source", "This source")
        
        if rel == EvidenceRelation.SUPPORTING.value:
            if art["evidence_strength"] > 0.8:
                return f"Strong independent confirmation from {src}."
            return f"{src} provides reporting that supports the claim."
        elif rel == EvidenceRelation.CONTRADICTING.value:
            if art["evidence_strength"] > 0.8:
                return f"Strong contradictory evidence reported by {src}."
            return f"{src} provides reporting that contradicts the claim."
        elif rel == EvidenceRelation.RELATED.value:
            return f"{src} discusses related topics but does not directly prove or disprove the claim."
        else:
            return f"Information from {src} is insufficient to verify the claim."
