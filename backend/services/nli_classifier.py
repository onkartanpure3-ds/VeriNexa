"""
Truth LenX — NLI Classifier (DeBERTa)

Uses cross-encoder/nli-deberta-v3-small for Natural Language Inference:
- Determines relationship between claim and evidence
- Maps NLI labels to verification relations

NLI labels → Mapping:
  entailment   → SUPPORTING
  contradiction → CONTRADICTING
  neutral      → RELATED / INSUFFICIENT
"""
from __future__ import annotations

import logging
from typing import Any

import numpy as np
from transformers import AutoModelForSequenceClassification, AutoTokenizer
import torch

from config import NLI_MODEL
from models.schemas import EvidenceRelation, ModelState
from services.provider_health import health_tracker

logger = logging.getLogger("truthlenx.nli_classifier")


class NLIClassifier:
    """DeBERTa-based NLI classifier for claim-evidence relations."""

    # DeBERTa NLI label mapping (model-specific order)
    LABEL_MAP = {0: "contradiction", 1: "entailment", 2: "neutral"}

    def __init__(self):
        self._model = None
        self._tokenizer = None
        self._device = "cpu"

    def load_model(self) -> None:
        """Load the DeBERTa NLI model at startup."""
        try:
            logger.info(f"Loading DeBERTa NLI model: {NLI_MODEL}")
            health_tracker.set_model_state("deberta_nli", ModelState.LOADING)

            self._tokenizer = AutoTokenizer.from_pretrained(NLI_MODEL)
            self._model = AutoModelForSequenceClassification.from_pretrained(NLI_MODEL)

            # Use GPU if available
            if torch.cuda.is_available():
                self._device = "cuda"
                self._model = self._model.to(self._device)
                logger.info("DeBERTa NLI loaded on GPU")
            else:
                logger.info("DeBERTa NLI loaded on CPU")

            self._model.eval()
            health_tracker.set_model_state("deberta_nli", ModelState.READY)
            logger.info("NLI READY")
        except Exception as e:
            health_tracker.set_model_state("deberta_nli", ModelState.ERROR)
            logger.error(f"Failed to load DeBERTa NLI: {e}")
            raise

    def classify(self, claim: str, evidence_text: str) -> dict[str, float]:
        """
        Classify the NLI relationship between claim and evidence.

        Returns:
            Dict with keys: entailment, contradiction, neutral (probabilities)
        """
        if self._model is None or self._tokenizer is None:
            raise RuntimeError("DeBERTa NLI model not loaded")

        # Tokenize the premise-hypothesis pair (Evidence is Premise, Claim is Hypothesis)
        inputs = self._tokenizer(
            evidence_text[:512],
            claim[:256],
            return_tensors="pt",
            truncation=True,
            max_length=512,
            padding=True,
        )

        if self._device != "cpu":
            inputs = {k: v.to(self._device) for k, v in inputs.items()}

        with torch.no_grad():
            outputs = self._model(**inputs)
            logits = outputs.logits
            probs = torch.softmax(logits, dim=-1).cpu().numpy()[0]

        return {
            "contradiction": float(probs[0]),
            "entailment": float(probs[1]),
            "neutral": float(probs[2]),
        }

    def classify_batch(
        self, claim: str, articles: list[dict[str, Any]]
    ) -> list[dict[str, Any]]:
        """
        Classify NLI relations for a batch of articles against a claim.
        Uses batched tokenization and a single vectorized forward pass for speed.
        """
        if not articles:
            return []

        results = []
        valid_indices = []
        premise_texts = []
        hypothesis_texts = []

        for i, art in enumerate(articles):
            art_copy = dict(art)
            evidence_text = self._build_evidence_text(art)

            art_copy.update({
                "nli_entailment": 0.0,
                "nli_contradiction": 0.0,
                "nli_neutral": 1.0,
                "relation": EvidenceRelation.INSUFFICIENT.value,
            })
            results.append(art_copy)

            if evidence_text and len(evidence_text.strip()) >= 10:
                valid_indices.append(i)
                premise_texts.append(evidence_text[:384])
                hypothesis_texts.append(claim[:256])

        if valid_indices and self._model is not None and self._tokenizer is not None:
            try:
                inputs = self._tokenizer(
                    premise_texts,
                    hypothesis_texts,
                    return_tensors="pt",
                    truncation=True,
                    max_length=256,
                    padding=True,
                )

                if self._device != "cpu":
                    inputs = {k: v.to(self._device) for k, v in inputs.items()}

                with torch.no_grad():
                    outputs = self._model(**inputs)
                    probs = torch.softmax(outputs.logits, dim=-1).cpu().numpy()

                for idx, p in zip(valid_indices, probs):
                    scores = {
                        "contradiction": float(p[0]),
                        "entailment": float(p[1]),
                        "neutral": float(p[2]),
                    }
                    results[idx]["nli_entailment"] = scores["entailment"]
                    results[idx]["nli_contradiction"] = scores["contradiction"]
                    results[idx]["nli_neutral"] = scores["neutral"]
                    results[idx]["relation"] = self._determine_relation(
                        scores, results[idx].get("semantic_similarity", 0.0)
                    )
            except Exception as e:
                logger.error(f"Batched NLI classification error: {e}")

        # Log summary
        relations = [r.get("relation", "") for r in results]
        logger.info(
            f"NLI classified {len(results)} articles: "
            f"SUPPORTING={relations.count('SUPPORTING')}, "
            f"CONTRADICTING={relations.count('CONTRADICTING')}, "
            f"RELATED={relations.count('RELATED')}, "
            f"INSUFFICIENT={relations.count('INSUFFICIENT')}"
        )

        return results

    @staticmethod
    def _determine_relation(scores: dict[str, float], semantic_similarity: float = 0.0) -> str:
        """
        Map NLI scores to evidence relation with semantic context.

        entailment    → SUPPORTING
        high-overlap  → SUPPORTING (when news reporting covers the exact same event)
        contradiction → CONTRADICTING (only when topical relevance is established)
        neutral       → RELATED or INSUFFICIENT
        """
        entail = scores.get("entailment", 0.0)
        contra = scores.get("contradiction", 0.0)
        neut = scores.get("neutral", 0.0)

        # 1. Low semantic relevance: cannot contradict or support unless entailment is overwhelmingly high
        if semantic_similarity < 0.35:
            if entail >= 0.70 and entail > contra:
                return EvidenceRelation.SUPPORTING.value
            elif neut >= 0.50 or semantic_similarity >= 0.20:
                return EvidenceRelation.RELATED.value
            return EvidenceRelation.INSUFFICIENT.value

        # 2. Contradiction: requires clear contradiction signal and topical relevance
        if contra >= 0.45 and contra > entail and semantic_similarity >= 0.35:
            return EvidenceRelation.CONTRADICTING.value

        # 3. Supporting evidence:
        # High entailment
        if entail >= 0.50 and entail > contra:
            return EvidenceRelation.SUPPORTING.value

        # Strong semantic relevance (>= 0.60) with affirmative entailment (>= 0.20) and low contradiction
        if semantic_similarity >= 0.60 and entail >= 0.20 and contra < 0.25:
            return EvidenceRelation.SUPPORTING.value

        # Moderate semantic match (>= 0.45) with solid entailment (>= 0.30) and low contradiction
        if semantic_similarity >= 0.45 and entail >= 0.30 and contra < 0.20:
            return EvidenceRelation.SUPPORTING.value

        # 4. Related / Insufficient
        if neut >= 0.35 or semantic_similarity >= 0.30:
            return EvidenceRelation.RELATED.value

        return EvidenceRelation.INSUFFICIENT.value

    @staticmethod
    def _build_evidence_text(article: dict) -> str:
        """Build evidence text from article for NLI input."""
        parts = []
        if article.get("title"):
            parts.append(article["title"])
        if article.get("content"):
            parts.append(article["content"][:400])
        elif article.get("description"):
            parts.append(article["description"][:400])
        return " ".join(parts)
