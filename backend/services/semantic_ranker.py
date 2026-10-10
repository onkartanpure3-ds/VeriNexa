"""
Truth LenX — Semantic Ranker (MPNet)

Uses sentence-transformers/all-mpnet-base-v2 for:
- Claim embedding
- Article embedding
- Semantic similarity scoring
- Evidence ranking by relevance
"""
from __future__ import annotations

import logging
from typing import Any

import numpy as np
from sentence_transformers import SentenceTransformer

from config import MPNET_MODEL, TOP_K_EVIDENCE
from models.schemas import ModelState
from services.provider_health import health_tracker

logger = logging.getLogger("truthlenx.semantic_ranker")


class SemanticRanker:
    """MPNet-based semantic embedding and ranking engine."""

    def __init__(self):
        self._model: SentenceTransformer | None = None

    def load_model(self) -> None:
        """Load the MPNet model at startup."""
        try:
            logger.info(f"Loading MPNet model: {MPNET_MODEL}")
            health_tracker.set_model_state("mpnet", ModelState.LOADING)
            self._model = SentenceTransformer(MPNET_MODEL)
            health_tracker.set_model_state("mpnet", ModelState.READY)
            logger.info("MPNet READY")
        except Exception as e:
            health_tracker.set_model_state("mpnet", ModelState.ERROR)
            logger.error(f"Failed to load MPNet: {e}")
            raise

    def embed_claim(self, claim: str) -> np.ndarray:
        """Encode a claim into an embedding vector."""
        if self._model is None:
            raise RuntimeError("MPNet model not loaded")
        return self._model.encode(claim, convert_to_numpy=True, normalize_embeddings=True)

    def embed_texts(self, texts: list[str]) -> np.ndarray:
        """Encode a batch of texts into embedding vectors."""
        if self._model is None:
            raise RuntimeError("MPNet model not loaded")
        return self._model.encode(
            texts,
            convert_to_numpy=True,
            normalize_embeddings=True,
            batch_size=32,
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
            raise RuntimeError("MPNet model not loaded")

        # Build article texts for embedding
        article_texts = []
        for art in articles:
            text = self._build_article_text(art)
            article_texts.append(text)

        # Encode
        claim_embedding = self.embed_claim(claim)
        article_embeddings = self.embed_texts(article_texts)

        # Compute cosine similarities (embeddings are normalized)
        similarities = np.dot(article_embeddings, claim_embedding)

        # Attach scores and sort
        ranked = []
        for i, art in enumerate(articles):
            art_copy = dict(art)
            art_copy["semantic_similarity"] = float(similarities[i])
            ranked.append(art_copy)

        ranked.sort(key=lambda x: x["semantic_similarity"], reverse=True)

        logger.info(
            f"Ranked {len(ranked)} articles, "
            f"top similarity: {ranked[0]['semantic_similarity']:.3f}"
        )

        return ranked[:TOP_K_EVIDENCE]

    @staticmethod
    def _build_article_text(article: dict) -> str:
        """
        Build a concise, high-signal text from article headline and snippet for embedding.
        Focuses on the headline and leading snippet for 20x faster CPU inference.
        """
        title = (article.get("title") or "").strip()
        desc = (article.get("description") or "").strip()
        
        if title and desc and desc != title:
            return f"{title}. {desc[:160]}"
        return title or desc or "No content available"
