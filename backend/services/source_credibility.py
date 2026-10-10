"""
Truth LenX — Source Credibility Service

Provides contextual source quality signals based on a curated
source credibility database.

IMPORTANT: Source credibility is a contextual signal.
It must NOT automatically classify an article as REAL or FAKE.
"""
from __future__ import annotations

import json
import logging
from pathlib import Path
from typing import Any, Optional

from models.schemas import ModelState
from services.provider_health import health_tracker

logger = logging.getLogger("truthlenx.source_credibility")

# Path to the credibility database
DATA_DIR = Path(__file__).parent.parent / "data"
CREDIBILITY_DB_PATH = DATA_DIR / "source_credibility.json"


class SourceCredibilityService:
    """Lookup and scoring service for news source credibility."""

    def __init__(self):
        self._sources: dict[str, dict[str, Any]] = {}

    def load_database(self) -> None:
        """Load the source credibility database."""
        try:
            logger.info("Loading source credibility database...")
            if CREDIBILITY_DB_PATH.exists():
                with open(CREDIBILITY_DB_PATH, "r", encoding="utf-8") as f:
                    data = json.load(f)
                    if isinstance(data, list):
                        for entry in data:
                            domain = entry.get("domain", "").lower()
                            if domain:
                                self._sources[domain] = entry
                    elif isinstance(data, dict):
                        self._sources = {
                            k.lower(): v for k, v in data.items()
                        }
                logger.info(
                    f"Loaded {len(self._sources)} source credibility records"
                )
            else:
                logger.warning(
                    f"Source credibility database not found at "
                    f"{CREDIBILITY_DB_PATH}"
                )

            health_tracker.set_model_state("source_database", ModelState.READY)
        except Exception as e:
            logger.error(f"Failed to load source credibility database: {e}")
            health_tracker.set_model_state("source_database", ModelState.ERROR)

    def lookup(self, domain: str) -> dict[str, Any]:
        """
        Look up credibility information for a domain.

        Returns a credibility record with default values for unknown sources.
        """
        domain = domain.lower().strip()
        if domain.startswith("www."):
            domain = domain[4:]

        if domain in self._sources:
            return dict(self._sources[domain])

        # Return unknown source record
        return {
            "domain": domain,
            "source_type": "Unknown",
            "credibility_level": "Unknown",
            "category": "Unknown",
            "rationale": "This source is not in the credibility database.",
            "last_reviewed": "",
            "reference_url": "",
            "notes": "",
            "official_source": False,
            "source_quality_score": 0.5,  # Neutral default
        }

    def get_quality_score(self, domain: str) -> float:
        """Get the quality score for a domain (0.0 to 1.0)."""
        record = self.lookup(domain)
        return record.get("source_quality_score", 0.5)

    def enrich_articles(
        self, articles: list[dict[str, Any]]
    ) -> list[dict[str, Any]]:
        """Attach source credibility info to articles."""
        for art in articles:
            domain = art.get("domain", "")
            credibility = self.lookup(domain)
            art["source_credibility"] = credibility
            art["source_quality"] = credibility.get("source_quality_score", 0.5)

        return articles

    @property
    def source_count(self) -> int:
        return len(self._sources)
