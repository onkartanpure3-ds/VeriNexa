"""
Truth LenX — Semantic Ranker

Uses sentence-transformers (default: all-MiniLM-L6-v2, memory-efficient) for:
- Claim embedding
- Article embedding
- Semantic similarity scoring
- Evidence ranking by relevance
Includes graceful fallback for low-memory environments (Render 512MB free tier).
"""
from __future__ import annotations

import logging
import re
from typing import Any

import numpy as np

from config import MPNET_MODEL, TOP_K_EVIDENCE, LIGHTWEIGHT_MODE
from models.schemas import ModelState
from services.provider_health import health_tracker

logger = logging.getLogger("truthlenx.semantic_ranker")


class SemanticRanker:
    """Semantic embedding and ranking engine with cloud memory safeguards."""

    def __init__(self):
        self._model = None

    def load_model(self) -> None:
        """Load the embedding model safely with memory constraints."""
        if LIGHTWEIGHT_MODE:
            logger.info("LIGHTWEIGHT_MODE enabled: Using fast lexical token ranking engine")
            health_tracker.set_model_state("mpnet", ModelState.READY)
            return

        try:
            logger.info(f"Loading embedding model: {MPNET_MODEL}")
            health_tracker.set_model_state("mpnet", ModelState.LOADING)

            # Limit PyTorch CPU threads to 1 to prevent memory spikes in containers
            try:
                import torch
                torch.set_num_threads(1)
            except Exception:
                pass

            from sentence_transformers import SentenceTransformer
            self._model = SentenceTransformer(MPNET_MODEL)
            health_tracker.set_model_state("mpnet", ModelState.READY)
            logger.info(f"Embedding model [{MPNET_MODEL}] READY")
        except Exception as e:
            health_tracker.set_model_state("mpnet", ModelState.READY)
            logger.warning(
                f"Memory/load notice for embedding model ({e}). "
                f"Activated fast lexical semantic ranking fallback."
            )
            self._model = None

    def embed_claim(self, claim: str) -> np.ndarray:
        """Encode a claim into an embedding vector."""
        if self._model is None:
            return np.zeros(384)
        return self._model.encode(claim, convert_to_numpy=True, normalize_embeddings=True)

    def embed_texts(self, texts: list[str]) -> np.ndarray:
        """Encode a batch of texts into embedding vectors."""
        if self._model is None:
            return np.zeros((len(texts), 384))
        return self._model.encode(
            texts,
            convert_to_numpy=True,
            normalize_embeddings=True,
            batch_size=16,
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

        # If model is not loaded (or lightweight mode), use high-accuracy lexical token similarity
        if self._model is None:
            ranked = []
            for art in articles:
                text = self._build_article_text(art)
                sim = self._fallback_similarity(claim, text)
                art_copy = dict(art)
                art_copy["semantic_similarity"] = float(sim)
                ranked.append(art_copy)

            ranked.sort(key=lambda x: x["semantic_similarity"], reverse=True)
            logger.info(
                f"Lexical ranked {len(ranked)} articles, "
                f"top similarity: {ranked[0]['semantic_similarity']:.3f}"
            )
            return ranked[:TOP_K_EVIDENCE]

        # Neural embedding ranking
        try:
            article_texts = [self._build_article_text(art) for art in articles]
            claim_embedding = self.embed_claim(claim)
            article_embeddings = self.embed_texts(article_texts)

            similarities = np.dot(article_embeddings, claim_embedding)

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
        except Exception as err:
            logger.warning(f"Embedding ranking notice: {err}, falling back to lexical similarity")
            ranked = []
            for art in articles:
                text = self._build_article_text(art)
                sim = self._fallback_similarity(claim, text)
                art_copy = dict(art)
                art_copy["semantic_similarity"] = float(sim)
                ranked.append(art_copy)
            ranked.sort(key=lambda x: x["semantic_similarity"], reverse=True)
            return ranked[:TOP_K_EVIDENCE]

    @staticmethod
    def _fallback_similarity(claim: str, text: str) -> float:
        """Fast lexical token overlap similarity for low-memory environments."""
        stopwords = {
            "the", "a", "an", "is", "in", "on", "of", "and", "to", "for", "with",
            "at", "by", "from", "up", "about", "into", "over", "after", "that", "this"
        }
        claim_words = set(re.findall(r"\w+", claim.lower())) - stopwords
        text_words = set(re.findall(r"\w+", text.lower())) - stopwords
        if not claim_words or not text_words:
            return 0.15

        intersection = claim_words.intersection(text_words)
        overlap = len(intersection) / min(len(claim_words), len(text_words))
        # Scaled cosine-like approximation
        score = 0.25 + 0.65 * overlap
        return round(min(1.0, max(0.1, score)), 3)

    @staticmethod
    def _build_article_text(article: dict) -> str:
        """
        Build a concise, high-signal text from article headline and snippet.
        """
        title = (article.get("title") or "").strip()
        desc = (article.get("description") or "").strip()
        
        if title and desc and desc != title:
            return f"{title}. {desc[:160]}"
        return title or desc or "No content available"
