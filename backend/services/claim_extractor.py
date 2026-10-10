"""
Truth LenX — Claim Extraction Service

Extracts the core verifiable claim from:
- Article text (long-form)
- News URL (after article extraction)
- Short claim/headline
"""
from __future__ import annotations

import logging
import re
from typing import Optional

from models.schemas import InputType

logger = logging.getLogger("truthlenx.claim_extractor")


class ClaimExtractor:
    """Extracts a verifiable claim from various input types."""

    def extract_from_text(self, text: str) -> dict:
        """
        Extract claim from article text.
        Uses headline + first substantive sentences as the claim.
        """
        text = text.strip()
        input_type = InputType.TEXT

        # Split into sentences
        sentences = self._split_sentences(text)

        if not sentences:
            return {
                "claim": text[:300],
                "input_type": input_type,
                "headline": "",
                "entities": [],
            }

        # First sentence is likely headline or lead
        headline = sentences[0]

        # Build claim from first 2-3 substantive sentences
        claim_sentences = []
        for sent in sentences[:5]:
            if len(sent.split()) >= 5:  # Skip very short fragments
                claim_sentences.append(sent)
            if len(" ".join(claim_sentences)) > 300:
                break

        claim = " ".join(claim_sentences[:3]) if claim_sentences else headline
        entities = self._extract_entities(claim)

        return {
            "claim": claim[:500],
            "input_type": input_type,
            "headline": headline[:200],
            "entities": entities,
        }

    def extract_from_url_content(self, title: str, content: str) -> dict:
        """Extract claim from extracted article content."""
        input_type = InputType.URL

        clean_title = title.strip() if title else ""
        words = clean_title.split()

        # If title is substantive (>= 4 words), it is the cleanest factual headline/claim
        if len(words) >= 4:
            claim = clean_title
        elif content:
            sentences = self._split_sentences(content)
            # Find the first meaningful sentence (>= 5 words)
            meaningful = [s for s in sentences if len(s.split()) >= 5]
            if meaningful:
                claim = (clean_title + ": " + meaningful[0]) if clean_title else meaningful[0]
            else:
                claim = clean_title or (sentences[0] if sentences else content[:200])
        else:
            claim = clean_title

        entities = self._extract_entities(claim)

        return {
            "claim": claim[:500],
            "input_type": input_type,
            "headline": (clean_title or claim)[:200],
            "entities": entities,
        }

    def extract_from_claim(self, claim_text: str) -> dict:
        """Direct claim input — minimal processing."""
        claim_text = claim_text.strip()
        entities = self._extract_entities(claim_text)

        return {
            "claim": claim_text[:500],
            "input_type": InputType.CLAIM,
            "headline": claim_text[:200],
            "entities": entities,
        }

    # ── Internal Helpers ──────────────────────────────────────────

    @staticmethod
    def _split_sentences(text: str) -> list[str]:
        """Split text into sentences."""
        # Simple sentence splitter
        sentences = re.split(r'(?<=[.!?])\s+', text)
        return [s.strip() for s in sentences if s.strip()]

    @staticmethod
    def _extract_entities(text: str) -> list[dict[str, str]]:
        """
        Extract named entities using regex patterns.
        Returns list of {type, value} dicts.
        """
        entities = []

        # Capitalized multi-word names (persons, orgs)
        name_pattern = re.compile(
            r'\b([A-Z][a-z]+(?:\s+[A-Z][a-z]+)+)\b'
        )
        for match in name_pattern.finditer(text):
            name = match.group(1)
            # Skip common non-entity phrases
            if name.lower() not in {"the united", "this is", "it was"}:
                entities.append({"type": "entity", "value": name})

        # Dates
        date_pattern = re.compile(
            r'\b(\d{1,2}[/-]\d{1,2}[/-]\d{2,4}|'
            r'(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\w*\s+\d{1,2},?\s+\d{4})\b',
            re.I,
        )
        for match in date_pattern.finditer(text):
            entities.append({"type": "date", "value": match.group(0)})

        # Monetary values
        money_pattern = re.compile(r'\$[\d,.]+[BMKbmk]?\b|\d+\s*(?:billion|million|trillion)', re.I)
        for match in money_pattern.finditer(text):
            entities.append({"type": "monetary", "value": match.group(0)})

        # Remove duplicates
        seen = set()
        unique = []
        for e in entities:
            key = (e["type"], e["value"])
            if key not in seen:
                seen.add(key)
                unique.append(e)

        return unique[:15]  # Cap at 15 entities
