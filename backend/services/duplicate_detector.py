"""
Truth LenX — Duplicate Detector & Independence Clustering

Detects:
- Duplicate URLs (after normalization)
- Duplicate headlines
- Highly similar articles
- Syndicated/copied reports

Creates evidence clusters for independence analysis.
"""
from __future__ import annotations

import hashlib
import logging
import re
from collections import defaultdict
from typing import Any
from urllib.parse import urlparse, parse_qs, urlencode, urlunparse

logger = logging.getLogger("truthlenx.duplicate_detector")

# Tracking parameters to strip from URLs
TRACKING_PARAMS = {
    "utm_source", "utm_medium", "utm_campaign", "utm_term", "utm_content",
    "fbclid", "gclid", "ref", "source", "mc_cid", "mc_eid",
    "ncid", "sr_share", "amp",
}


class DuplicateDetector:
    """Detects duplicates and clusters independent evidence."""

    # Similarity threshold for considering articles as duplicates
    HEADLINE_SIMILARITY_THRESHOLD = 0.85

    def process(self, articles: list[dict[str, Any]]) -> dict[str, Any]:
        """
        Deduplicate articles and cluster independent sources.

        Returns:
            {
                "unique_articles": [...],
                "clusters": {cluster_id: [articles]},
                "stats": {
                    "total_retrieved": N,
                    "unique_count": N,
                    "independent_groups": N,
                    "duplicate_count": N,
                }
            }
        """
        if not articles:
            return {
                "unique_articles": [],
                "clusters": {},
                "stats": {
                    "total_retrieved": 0,
                    "unique_count": 0,
                    "independent_groups": 0,
                    "duplicate_count": 0,
                },
            }

        # Step 1: URL deduplication
        url_deduped = self._deduplicate_by_url(articles)

        # Step 2: Headline deduplication
        headline_deduped = self._deduplicate_by_headline(url_deduped)

        # Step 3: Syndication clustering
        clusters = self._cluster_by_independence(headline_deduped)

        # Assign cluster IDs to articles
        for cluster_id, cluster_articles in clusters.items():
            for art in cluster_articles:
                art["cluster"] = cluster_id

        # Flatten unique articles
        unique_articles = []
        for cluster_articles in clusters.values():
            unique_articles.extend(cluster_articles)

        stats = {
            "total_retrieved": len(articles),
            "unique_count": len(unique_articles),
            "independent_groups": len(clusters),
            "duplicate_count": len(articles) - len(unique_articles),
        }

        logger.info(
            f"Dedup: {stats['total_retrieved']} retrieved → "
            f"{stats['unique_count']} unique, "
            f"{stats['independent_groups']} independent groups"
        )

        return {
            "unique_articles": unique_articles,
            "clusters": clusters,
            "stats": stats,
        }

    # ── URL Deduplication ─────────────────────────────────────────

    def _deduplicate_by_url(self, articles: list[dict]) -> list[dict]:
        """Remove articles with duplicate normalized URLs."""
        seen_urls = set()
        unique = []

        for art in articles:
            normalized = self._normalize_url(art.get("url", ""))
            if normalized and normalized not in seen_urls:
                seen_urls.add(normalized)
                unique.append(art)

        return unique

    def _normalize_url(self, url: str) -> str:
        """Normalize URL by removing tracking params, fragments, etc."""
        try:
            parsed = urlparse(url)

            # Normalize hostname
            hostname = (parsed.hostname or "").lower()
            if hostname.startswith("www."):
                hostname = hostname[4:]

            # Normalize port (remove default ports)
            port = parsed.port
            if (parsed.scheme == "http" and port == 80) or \
               (parsed.scheme == "https" and port == 443):
                port = None

            netloc = hostname
            if port:
                netloc = f"{hostname}:{port}"

            # Remove tracking parameters
            query_params = parse_qs(parsed.query, keep_blank_values=False)
            filtered_params = {
                k: v for k, v in query_params.items()
                if k.lower() not in TRACKING_PARAMS
            }
            clean_query = urlencode(filtered_params, doseq=True)

            # Rebuild URL without fragment
            normalized = urlunparse((
                "https",  # Normalize to https
                netloc,
                parsed.path.rstrip("/") or "/",
                parsed.params,
                clean_query,
                "",  # Remove fragment
            ))

            return normalized
        except Exception:
            return url

    # ── Headline Deduplication ────────────────────────────────────

    def _deduplicate_by_headline(self, articles: list[dict]) -> list[dict]:
        """Remove articles with very similar headlines (syndicated copies)."""
        unique = []
        seen_headlines: list[str] = []

        for art in articles:
            headline = self._normalize_headline(art.get("title", ""))
            if not headline:
                unique.append(art)
                continue

            is_duplicate = False
            for seen in seen_headlines:
                if self._headline_similarity(headline, seen) > self.HEADLINE_SIMILARITY_THRESHOLD:
                    is_duplicate = True
                    break

            if not is_duplicate:
                seen_headlines.append(headline)
                unique.append(art)

        return unique

    @staticmethod
    def _normalize_headline(headline: str) -> str:
        """Normalize headline for comparison."""
        headline = headline.lower().strip()
        headline = re.sub(r'[^\w\s]', '', headline)
        headline = re.sub(r'\s+', ' ', headline)
        return headline

    @staticmethod
    def _headline_similarity(h1: str, h2: str) -> float:
        """Compute word-level Jaccard similarity between headlines."""
        words1 = set(h1.split())
        words2 = set(h2.split())
        if not words1 or not words2:
            return 0.0
        intersection = words1 & words2
        union = words1 | words2
        return len(intersection) / len(union)

    # ── Independence Clustering ───────────────────────────────────

    def _cluster_by_independence(
        self, articles: list[dict]
    ) -> dict[str, list[dict]]:
        """
        Cluster articles by source independence.
        Articles from the same domain or parent company are grouped together.
        """
        domain_groups: dict[str, list[dict]] = defaultdict(list)

        for art in articles:
            dom = art.get("domain", "")
            if not dom or dom == "google.com":
                src = art.get("source", "").lower().strip()
                if src and src != "google news":
                    domain = re.sub(r"[^a-z0-9]", "", src)
                else:
                    domain = "google"
            else:
                domain = self._get_root_domain(dom)
            domain_groups[domain].append(art)

        # Create numbered clusters
        clusters = {}
        for i, (domain, arts) in enumerate(domain_groups.items()):
            cluster_id = f"cluster_{i + 1}_{domain}"
            clusters[cluster_id] = arts

        return clusters

    @staticmethod
    def _get_root_domain(domain: str) -> str:
        """Extract root domain for grouping."""
        domain = domain.lower().strip()
        if domain.startswith("www."):
            domain = domain[4:]

        # Known parent company groupings
        PARENT_GROUPS = {
            "cnn.com": "cnn",
            "edition.cnn.com": "cnn",
            "foxnews.com": "foxnews",
            "foxbusiness.com": "foxnews",
            "nytimes.com": "nytimes",
            "washingtonpost.com": "wapo",
            "bbc.co.uk": "bbc",
            "bbc.com": "bbc",
        }

        return PARENT_GROUPS.get(domain, domain)
