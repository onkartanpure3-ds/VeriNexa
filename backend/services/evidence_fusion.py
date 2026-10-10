"""
Truth LenX — Evidence Fusion Engine

Aggregates individual evidence scores and independence clusters to determine
the final verification status (REAL, FAKE, UNCERTAIN, VERIFICATION_UNAVAILABLE).
"""
from __future__ import annotations

import logging
from typing import Any

from config import FUSION_THRESHOLDS
from models.schemas import VerificationStatus, EvidenceRelation

logger = logging.getLogger("truthlenx.evidence_fusion")


class EvidenceFusion:
    """Fuses evidence signals into a final verdict."""

    def __init__(self):
        self.thresholds = FUSION_THRESHOLDS

    def evaluate(self, articles: list[dict[str, Any]], provider_status: dict[str, str]) -> dict[str, Any]:
        """
        Evaluate all evidence to reach a final verdict.
        """
        # 1. Check Provider Status (VERIFICATION_UNAVAILABLE logic)
        # If no articles were found and all providers are dead/rate-limited
        if not articles:
            usable_providers = [
                k for k, v in provider_status.items() 
                if v in ("AVAILABLE", "UNKNOWN")
            ]
            if not usable_providers:
                return self._unavailable_result()
            else:
                # Providers are up, but no evidence found for this specific query
                return self._uncertain_no_evidence_result()

        # 2. Tally evidence
        support_clusters = set()
        contradict_clusters = set()
        
        strong_support_count = 0
        strong_contradict_count = 0
        
        total_support_strength = 0.0
        total_contradict_strength = 0.0

        for art in articles:
            cluster_id = art.get("cluster", "unknown")
            strength = art.get("evidence_strength", 0.0)
            rel = art.get("relation")

            # Only consider evidence meeting minimum strength and semantic relevance thresholds
            if strength < self.thresholds["min_evidence_strength"] or \
               art.get("semantic_similarity", 0.0) < self.thresholds["min_semantic_relevance"]:
                continue

            if rel == EvidenceRelation.SUPPORTING.value:
                support_clusters.add(cluster_id)
                total_support_strength += strength
                if strength >= self.thresholds["support_threshold"]:
                    strong_support_count += 1
            elif rel == EvidenceRelation.CONTRADICTING.value:
                contradict_clusters.add(cluster_id)
                total_contradict_strength += strength
                if strength >= self.thresholds["contradiction_threshold"]:
                    strong_contradict_count += 1

        num_support_clusters = len(support_clusters)
        num_contradict_clusters = len(contradict_clusters)

        # 3. Compute Final Fused Trust Score on a 0-1 scale
        # Incorporate:
        # - Net support balance: total_support_strength vs total_contradict_strength
        # - Independent supporting vs contradicting clusters
        # - Ratio of strong supporting evidence
        
        total_signal = total_support_strength + total_contradict_strength
        
        if total_signal > 0:
            # Base probability derived from support ratio
            support_ratio = total_support_strength / total_signal
            
            # Cluster boost/penalty based on independence
            cluster_diff = num_support_clusters - num_contradict_clusters
            cluster_factor = max(-0.25, min(0.25, cluster_diff * 0.10))
            
            # Count factor
            count_total = strong_support_count + strong_contradict_count
            count_factor = 0.0
            if count_total > 0:
                count_factor = ((strong_support_count - strong_contradict_count) / count_total) * 0.15

            # Calculate raw trust score (0 to 1 scale)
            raw_trust_score = support_ratio + cluster_factor + count_factor
            
            # If there is exclusively strong support, ensure it's firmly in the Real zone (>= 0.70)
            if strong_support_count > 0 and strong_contradict_count == 0:
                raw_trust_score = max(raw_trust_score, 0.75 + min(0.20, total_support_strength * 0.05))
            # If there is exclusively contradiction, ensure it's firmly in the Fake zone (< 0.35)
            elif strong_contradict_count > 0 and strong_support_count == 0:
                raw_trust_score = min(raw_trust_score, 0.25 - min(0.15, total_contradict_strength * 0.05))
        else:
            # When articles exist but none meet strict thresholds, estimate from general article relevance
            max_sim = max((art.get("semantic_similarity", 0.0) for art in articles), default=0.0)
            if max_sim >= 0.50:
                raw_trust_score = 0.55
            else:
                raw_trust_score = 0.35

        # Clamp final trust score strictly between 0.0 and 1.0
        final_trust_score = round(max(0.05, min(0.99, raw_trust_score)), 2)

        # 4. Strict Binary Classification (>= 0.50 is REAL, < 0.50 is FAKE)
        threshold = self.thresholds.get("classification_threshold", 0.50)
        if final_trust_score >= threshold:
            status = VerificationStatus.REAL
            reason = f"Current evidence supports the claim (Trust Score: {final_trust_score:.2f} >= 0.50)."
        else:
            status = VerificationStatus.FAKE
            reason = f"Current evidence contradicts or lacks credible verification (Trust Score: {final_trust_score:.2f} < 0.50)."

        # Scale percentage (0 to 100) for UI display alongside 0-1 scale
        percentage_score = round(final_trust_score * 100, 1)

        logger.info(f"Binary Fusion Verdict: {status.value} (Trust Score: {final_trust_score:.2f}, {percentage_score}%)")

        return {
            "status": status,
            "confidence": percentage_score,
            "trust_score": final_trust_score,
            "reason": reason,
            "methodology": self._generate_methodology_string(status, final_trust_score),
        }

    def _unavailable_result(self) -> dict:
        return {
            "status": VerificationStatus.FAKE,
            "confidence": 20.0,
            "trust_score": 0.20,
            "reason": "Live evidence could not be retrieved from news providers.",
            "methodology": "System failed to connect to live news providers or hit rate limits.",
        }

    def _uncertain_no_evidence_result(self) -> dict:
        return {
             "status": VerificationStatus.FAKE,
             "confidence": 30.0,
             "trust_score": 0.30,
             "reason": "No confirming evidence found in trusted sources within the evidence window (Trust Score < 0.50).",
             "methodology": "Searched live news providers but found zero corroborating reports for this claim.",
        }

    def _generate_methodology_string(self, status: VerificationStatus, score: float) -> str:
        if status == VerificationStatus.REAL:
            return f"Classified as REAL with fused trust score {score:.2f} (>= 0.50 threshold) based on semantic corroboration, independent sources, and NLI entailment."
        else:
            return f"Classified as FAKE with fused trust score {score:.2f} (< 0.50 threshold) based on lack of corroboration, contradictory reporting, or low source verification."
