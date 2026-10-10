"""
Truth LenX — Query Generator

Generates search queries from extracted claims for news retrieval.
Creates focused query variants to maximize relevant evidence retrieval.
"""
from __future__ import annotations

import logging
import re

logger = logging.getLogger("truthlenx.query_generator")


class QueryGenerator:
    """Generates search queries from claims for news retrieval."""

    # Common stop words to strip for keyword extraction
    STOP_WORDS = {
        "a", "an", "the", "is", "are", "was", "were", "be", "been",
        "being", "have", "has", "had", "do", "does", "did", "will",
        "would", "could", "should", "may", "might", "shall", "can",
        "to", "of", "in", "for", "on", "with", "at", "by", "from",
        "as", "into", "through", "during", "before", "after", "above",
        "below", "between", "under", "again", "further", "then", "once",
        "here", "there", "when", "where", "why", "how", "all", "both",
        "each", "few", "more", "most", "other", "some", "such", "no",
        "nor", "not", "only", "own", "same", "so", "than", "too",
        "very", "just", "and", "but", "or", "if", "while", "that",
        "this", "it", "its", "he", "she", "they", "them", "we", "you",
        "his", "her", "their", "our", "my", "your", "what", "which",
        "who", "whom", "whose", "about", "up", "out", "off", "over",
        "down", "also", "said", "says", "according",
    }

    def generate(self, claim: str, entities: list[dict] | None = None) -> list[str]:
        """
        Generate search queries from a claim.

        Returns up to 3 query variants:
        1. Full claim (truncated)
        2. Key entities/phrases
        3. Core keywords
        """
        queries = []

        claim = claim.strip()
        if not claim:
            return queries

        # Query 1: Full claim (truncated for API limits)
        full_query = self._clean_query(claim[:200])
        if full_query:
            queries.append(full_query)

        # Query 2: Entity-based query
        if entities:
            entity_values = [e["value"] for e in entities[:3]]
            entity_query = " ".join(entity_values)
            if entity_query and entity_query != full_query:
                queries.append(entity_query)

        # Query 3: Entity + Key Action / Core Keywords
        action_words = [w for w in re.findall(r'\b[A-Za-z]{3,}\b', claim) if w.lower() in {
            "dies", "death", "dead", "killed", "arrested", "resigns", "resigned",
            "passed", "hospitalized", "wins", "won", "bans", "banned", "launches",
            "launched", "announces", "announced", "elected", "approves", "approved"
        }]
        if entities and action_words:
            entity_action = f"{entities[0]['value']} {action_words[0]}"
            if entity_action not in queries:
                queries.append(entity_action)

        # Query 4: Broader keywords
        keywords = self._extract_keywords(claim)
        if keywords and len(queries) < 3:
            kw_query = " ".join(keywords[:4])
            if kw_query not in queries:
                queries.append(kw_query)

        logger.info(f"Generated {len(queries)} queries from claim: {queries[:3]}")
        return queries[:3]

    def _extract_keywords(self, text: str) -> list[str]:
        """Extract non-stopword keywords from text."""
        words = re.findall(r'\b[A-Za-z]{3,}\b', text)
        keywords = [
            w for w in words
            if w.lower() not in self.STOP_WORDS
        ]
        # Prioritize capitalized words (likely names)
        capitalized = [w for w in keywords if w[0].isupper()]
        others = [w for w in keywords if not w[0].isupper()]

        # De-duplicate while preserving order
        seen = set()
        result = []
        for w in capitalized + others:
            if w.lower() not in seen:
                seen.add(w.lower())
                result.append(w)

        return result

    @staticmethod
    def _clean_query(text: str) -> str:
        """Clean text for use as a search query."""
        # Strip aggregator noise
        text = re.sub(r'^(More headlines and perspectives|Google News)\s*[-|–—:]\s*', '', text, flags=re.I)
        text = re.sub(r'\s*[-|–—]\s*(Google News|Overview)$', '', text, flags=re.I)
        # Remove special characters but keep basic punctuation
        text = re.sub(r'[^\w\s\-\'"]', ' ', text)
        text = re.sub(r'\s+', ' ', text).strip()
        return text
