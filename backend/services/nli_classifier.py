"""
Truth LenX — NLI Classifier (DeBERTa)

Uses cross-encoder/nli-deberta-v3-small (or configured NLI_MODEL) for Natural Language Inference:
- Determines relationship between claim and evidence
- Maps NLI labels to verification relations (SUPPORTING, CONTRADICTING, RELATED, INSUFFICIENT)

Optimized for CPU inference, single-threaded execution, bounded mini-batching,
and strict memory logging.
"""
from __future__ import annotations

import logging
from typing import Any

import numpy as np
import torch
from transformers import AutoModelForSequenceClassification, AutoTokenizer

from config import NLI_MODEL, NLI_BATCH_SIZE, TORCH_THREADS
from models.schemas import EvidenceRelation, ModelState
from services.provider_health import health_tracker
from services.memory_tracker import log_memory, cleanup_memory

logger = logging.getLogger("truthlenx.nli_classifier")


class NLIClassifier:
    """DeBERTa-based NLI classifier for claim-evidence relations."""

    # DeBERTa NLI label mapping (model-specific order: 0: contradiction, 1: entailment, 2: neutral)
    LABEL_MAP = {0: "contradiction", 1: "entailment", 2: "neutral"}

    def __init__(self):
        self._model = None
        self._tokenizer = None
        self._device = "cpu"

    def load_model(self) -> None:
        """Load the DeBERTa NLI model sequentially on CPU."""
        if self._model is not None and self._tokenizer is not None:
            logger.info("DeBERTa NLI model already loaded; reusing existing instance.")
            return

        log_memory(f"Starting DeBERTa NLI model load: {NLI_MODEL}")
        health_tracker.set_model_state("deberta_nli", ModelState.LOADING)

        try:
            torch.set_num_threads(TORCH_THREADS)

            self._tokenizer = AutoTokenizer.from_pretrained(NLI_MODEL)
            self._model = AutoModelForSequenceClassification.from_pretrained(NLI_MODEL)
            self._device = "cpu"
            self._model.to(self._device)
            self._model.eval()

            cleanup_memory()
            health_tracker.set_model_state("deberta_nli", ModelState.READY)
            log_memory(f"DeBERTa NLI model [{NLI_MODEL}] loaded successfully (READY)")
        except Exception as e:
            self._model = None
            self._tokenizer = None
            health_tracker.set_model_state("deberta_nli", ModelState.ERROR)
            mem = log_memory("DeBERTa NLI model load failed (ERROR)")
            logger.error(f"Failed to load DeBERTa NLI model [{NLI_MODEL}] at RSS {mem:.1f} MiB: {e}", exc_info=True)
            raise

    def classify(self, claim: str, evidence_text: str) -> dict[str, float]:
        """Classify the NLI relationship between claim and single evidence snippet."""
        if self._model is None or self._tokenizer is None:
            raise RuntimeError("DeBERTa NLI model is not loaded or failed to initialize.")

        inputs = self._tokenizer(
            evidence_text[:512],
            claim[:256],
            return_tensors="pt",
            truncation=True,
            max_length=512,
            padding=True,
        )

        with torch.inference_mode():
            outputs = self._model(**inputs)
            probs = torch.softmax(outputs.logits, dim=-1).cpu().numpy()[0]

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
        Uses chunked mini-batching to keep CPU memory overhead strictly bounded.
        """
        if not articles:
            return []

        if self._model is None or self._tokenizer is None:
            raise RuntimeError("DeBERTa NLI model is not ready for inference.")

        log_memory(f"Before DeBERTa NLI inference (articles: {len(articles)})")

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

        if valid_indices:
            # Process in small chunks (NLI_BATCH_SIZE) to bound peak tensor RAM
            all_probs: list[np.ndarray] = []
            chunk_size = max(1, NLI_BATCH_SIZE)

            with torch.inference_mode():
                for start_idx in range(0, len(valid_indices), chunk_size):
                    end_idx = min(start_idx + chunk_size, len(valid_indices))
                    chunk_premise = premise_texts[start_idx:end_idx]
                    chunk_hypo = hypothesis_texts[start_idx:end_idx]

                    inputs = self._tokenizer(
                        chunk_premise,
                        chunk_hypo,
                        return_tensors="pt",
                        truncation=True,
                        max_length=256,
                        padding=True,
                    )

                    outputs = self._model(**inputs)
                    probs = torch.softmax(outputs.logits, dim=-1).cpu().numpy()
                    all_probs.extend(list(probs))

            for idx, p in zip(valid_indices, all_probs):
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

        cleanup_memory()
        log_memory("After DeBERTa NLI inference")

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
        """Map NLI scores to evidence relation with semantic context."""
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

        # 3. Supporting evidence
        if entail >= 0.50 and entail > contra:
            return EvidenceRelation.SUPPORTING.value

        if semantic_similarity >= 0.60 and entail >= 0.20 and contra < 0.25:
            return EvidenceRelation.SUPPORTING.value

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
