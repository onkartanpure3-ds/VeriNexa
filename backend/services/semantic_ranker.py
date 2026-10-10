"""
Truth LenX — Semantic Ranker (MPNet)

Uses sentence-transformers/all-mpnet-base-v2 (or configured MPNET_MODEL) for:
- Claim embedding
- Article embedding
- Semantic similarity scoring
- Evidence ranking by relevance

Optimized for single-model CPU inference, single-threaded execution,
configurable batch sizes, and strict memory logging.
"""
from __future__ import annotations

import logging
from typing import Any

import numpy as np
import torch

from config import MPNET_MODEL, TOP_K_EVIDENCE, RANKER_BATCH_SIZE, TORCH_THREADS
from models.schemas import ModelState
from services.provider_health import health_tracker
from services.memory_tracker import log_memory, cleanup_memory

logger = logging.getLogger("truthlenx.semantic_ranker")


class SemanticRanker:
    """MPNet-based semantic embedding and ranking engine."""

    def __init__(self):
        self._model = None

    def load_model(self) -> None:
        """Load the MPNet embedding model sequentially on CPU."""
        if self._model is not None:
            logger.info("MPNet model already loaded; reusing existing instance.")
            return

        log_memory(f"Starting MPNet model load: {MPNET_MODEL}")
        health_tracker.set_model_state("mpnet", ModelState.LOADING)

        try:
            # Enforce single-threaded CPU execution to reduce thread stack allocations
            torch.set_num_threads(TORCH_THREADS)

            from sentence_transformers import SentenceTransformer

            self._model = SentenceTransformer(MPNET_MODEL, device="cpu")
            self._model.eval()

            cleanup_memory()
            health_tracker.set_model_state("mpnet", ModelState.READY)
            log_memory(f"MPNet model [{MPNET_MODEL}] loaded successfully (READY)")
        except Exception as e:
            self._model = None
            health_tracker.set_model_state("mpnet", ModelState.ERROR)
            mem = log_memory("MPNet model load failed (ERROR)")
            logger.error(f"Failed to load MPNet model [{MPNET_MODEL}] at RSS {mem:.1f} MiB: {e}", exc_info=True)
            raise

    def embed_claim(self, claim: str) -> np.ndarray:
        """Encode a claim into an embedding vector."""
        if self._model is None:
            raise RuntimeError("MPNet model is not loaded or failed to initialize.")

        with torch.inference_mode():
            return self._model.encode(
                claim,
                convert_to_numpy=True,
                normalize_embeddings=True,
                show_progress_bar=False,
            )

    def embed_texts(self, texts: list[str]) -> np.ndarray:
        """Encode a batch of texts into embedding vectors with bounded batch size."""
        if self._model is None:
            raise RuntimeError("MPNet model is not loaded or failed to initialize.")

        with torch.inference_mode():
            return self._model.encode(
                texts,
                convert_to_numpy=True,
                normalize_embeddings=True,
                batch_size=RANKER_BATCH_SIZE,
                show_progress_bar=False,
            )

    def rank_articles(
        self, claim: str, articles: list[dict[str, Any]]
    ) -> list[dict[str, Any]]:
        """
        Rank articles by semantic similarity to the claim.
        Returns top-K articles with similarity scores attached.
        """
        if not articles:
            return []

        if self._model is None:
            raise RuntimeError("MPNet model is not ready for ranking.")

        log_memory(f"Before MPNet ranking inference (articles: {len(articles)})")

        article_texts = [self._build_article_text(art) for art in articles]
        claim_embedding = self.embed_claim(claim)
        article_embeddings = self.embed_texts(article_texts)

        # Compute cosine similarities (embeddings are L2-normalized)
        similarities = np.dot(article_embeddings, claim_embedding)

        ranked = []
        for i, art in enumerate(articles):
            art_copy = dict(art)
            art_copy["semantic_similarity"] = float(similarities[i])
            ranked.append(art_copy)

        ranked.sort(key=lambda x: x["semantic_similarity"], reverse=True)

        cleanup_memory()
        log_memory(f"After MPNet ranking inference (retained top: {min(len(ranked), TOP_K_EVIDENCE)})")

        logger.info(
            f"Ranked {len(ranked)} articles with MPNet, "
            f"top similarity: {ranked[0]['semantic_similarity']:.3f}"
        )

        return ranked[:TOP_K_EVIDENCE]

    @staticmethod
    def _build_article_text(article: dict) -> str:
        """
        Build a concise, high-signal text from article headline and snippet.
        """
        title = (article.get("title") or "").strip()
        desc = (article.get("description") or "").strip()

        if title and desc and desc != title:
            return f"{title}. {desc[:200]}"
        return title or desc or "No content available"
