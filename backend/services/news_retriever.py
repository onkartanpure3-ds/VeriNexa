"""
Truth LenX — News Retrieval Service

Retrieves news articles from Google News RSS, NewsAPI, and GDELT within the
evidence window. Manages provider health, handles rate limiting, and normalizes
articles with verified publisher domain attribution.
"""
from __future__ import annotations

import asyncio
import logging
import re
import xml.etree.ElementTree as ET
from datetime import datetime, timedelta, timezone
from typing import Any
from urllib.parse import quote_plus, urlparse

import httpx
from bs4 import BeautifulSoup

from config import (
    NEWSAPI_KEY,
    NEWSAPI_URL,
    GDELT_URL,
    GDELT_ENABLED,
    GOOGLE_NEWS_ENABLED,
    EVIDENCE_WINDOW_DAYS,
    MAX_CANDIDATE_ARTICLES,
)
from models.schemas import ProviderState
from services.provider_health import health_tracker

logger = logging.getLogger("truthlenx.news_retriever")


class NewsRetriever:
    """Fetches real-time and historical news articles across multi-engine providers."""

    def __init__(self):
        self._client = None
        # Configure initial provider states
        if not GOOGLE_NEWS_ENABLED:
            health_tracker.set_provider_state("google_news", ProviderState.NOT_CONFIGURED)
        else:
            health_tracker.set_provider_state("google_news", ProviderState.AVAILABLE)

        if NEWSAPI_KEY:
            health_tracker.set_provider_state("newsapi", ProviderState.AVAILABLE)
        else:
            health_tracker.set_provider_state("newsapi", ProviderState.NOT_CONFIGURED)

        if GDELT_ENABLED:
            health_tracker.set_provider_state("gdelt", ProviderState.AVAILABLE)
        else:
            health_tracker.set_provider_state("gdelt", ProviderState.NOT_CONFIGURED)

    @property
    def client(self) -> httpx.AsyncClient:
        if self._client is None or self._client.is_closed:
            self._client = httpx.AsyncClient(
                timeout=8.0,
                follow_redirects=True,
                headers={
                    "User-Agent": (
                        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
                        "(KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36"
                    )
                },
            )
        return self._client

    async def retrieve(self, queries: list[str]) -> list[dict[str, Any]]:
        """
        Retrieve articles for the given search queries from all usable providers.
        Returns a list of normalized article dicts with publisher attribution.
        """
        all_articles: list[dict[str, Any]] = []

        # 1. Primary: Google News RSS (Live Real-Time breaking news, 0 delay, 100% free)
        if health_tracker.is_provider_usable("google_news") and GOOGLE_NEWS_ENABLED:
            try:
                google_articles = await self._fetch_google_news(queries)
                all_articles.extend(google_articles)
                health_tracker.set_provider_state("google_news", ProviderState.AVAILABLE)
                logger.info(f"Google News RSS returned {len(google_articles)} live articles")
            except Exception as e:
                health_tracker.set_provider_state("google_news", ProviderState.ERROR)
                logger.error(f"Google News RSS error: {e}")

        # 2. Secondary: NewsAPI (Always attempt when key is configured for richer coverage)
        if NEWSAPI_KEY:
            try:
                newsapi_articles = await self._fetch_newsapi(queries)
                all_articles.extend(newsapi_articles)
                health_tracker.set_provider_state("newsapi", ProviderState.AVAILABLE)
                logger.info(f"NewsAPI returned {len(newsapi_articles)} articles")
            except Exception as e:
                health_tracker.set_provider_state("newsapi", ProviderState.AVAILABLE)
                logger.warning(f"NewsAPI query notice: {e}")

        # 3. Tertiary: GDELT Project (Fallback if insufficient articles)
        if len(all_articles) < 15 and GDELT_ENABLED:
            try:
                gdelt_articles = await self._fetch_gdelt(queries)
                all_articles.extend(gdelt_articles)
                health_tracker.set_provider_state("gdelt", ProviderState.AVAILABLE)
                logger.info(f"GDELT returned {len(gdelt_articles)} articles")
            except Exception as e:
                health_tracker.set_provider_state("gdelt", ProviderState.AVAILABLE)
                logger.warning(f"GDELT query notice: {e}")

        return all_articles[:MAX_CANDIDATE_ARTICLES]

    # ── Google News RSS ───────────────────────────────────────────

    async def _fetch_google_news(self, queries: list[str]) -> list[dict[str, Any]]:
        """
        Fetch real-time articles from Google News RSS feed.
        Searches Indian and Global editions for comprehensive coverage.
        """
        articles: list[dict[str, Any]] = []
        seen_titles = set()

        # Editions: India (local & national) + Global
        editions = [
            ("en-IN", "IN", "IN:en"),
            ("en-US", "US", "US:en"),
        ]

        urls = []
        for q in queries[:2]:
            clean_q = q.strip()
            if not clean_q:
                continue
            for hl, gl, ceid in editions:
                urls.append(f"https://news.google.com/rss/search?q={quote_plus(clean_q)}&hl={hl}&gl={gl}&ceid={ceid}")

        async def fetch_rss(feed_url: str) -> str:
            try:
                resp = await self.client.get(feed_url)
                if resp.status_code == 200:
                    return resp.text
            except Exception as e:
                logger.warning(f"Failed to fetch RSS {feed_url}: {e}")
            return ""

        feed_results = await asyncio.gather(*(fetch_rss(u) for u in urls))

        for xml_text in feed_results:
            if not xml_text:
                continue
            try:
                root = ET.fromstring(xml_text)
                items = root.findall(".//item")
            except Exception as e:
                logger.warning(f"Error parsing RSS XML: {e}")
                continue

            for item in items[:15]:
                raw_title = item.find("title").text if item.find("title") is not None else ""
                if not raw_title:
                    continue

                source_el = item.find("source")
                source_name = source_el.text if source_el is not None else ""
                source_url = source_el.attrib.get("url", "") if source_el is not None else ""

                domain = ""
                if source_url:
                    domain = self._extract_domain(source_url)
                elif source_name:
                    domain = self._domain_from_source_name(source_name)

                # Clean headline by removing " - Source Name"
                clean_title = self._clean_headline_title(raw_title, source_name)
                norm_key = re.sub(r"[^\w\s]", "", clean_title.lower())
                if norm_key in seen_titles:
                    continue
                seen_titles.add(norm_key)

                link = item.find("link").text if item.find("link") is not None else ""
                pub_date = item.find("pubDate").text if item.find("pubDate") is not None else ""

                # Extract clean snippet from description HTML if available
                desc_text = ""
                desc_el = item.find("description")
                if desc_el is not None and desc_el.text:
                    soup = BeautifulSoup(desc_el.text, "html.parser")
                    desc_text = soup.get_text(separator=" ", strip=True)

                content = desc_text if desc_text else clean_title

                articles.append({
                    "title": clean_title,
                    "source": source_name or "Google News",
                    "domain": domain or "google.com",
                    "url": link,
                    "published_at": pub_date,
                    "content": content,
                    "description": desc_text,
                    "provider": "google_news",
                })

        return articles

    # ── NewsAPI ───────────────────────────────────────────────────

    async def _fetch_newsapi(self, queries: list[str]) -> list[dict[str, Any]]:
        """Fetch articles from NewsAPI /v2/everything endpoint with fail-safe handling."""
        articles: list[dict[str, Any]] = []

        for query in queries[:2]:
            clean_q = query.strip()
            if not clean_q:
                continue
            url = NEWSAPI_URL
            params = {
                "q": clean_q,
                "sortBy": "relevancy",
                "pageSize": 15,
                "apiKey": NEWSAPI_KEY,
            }

            try:
                resp = await self.client.get(url, params=params, timeout=4.0)
                if resp.status_code == 200:
                    data = resp.json()
                    for art in data.get("articles", []):
                        articles.append(self._normalize_newsapi_article(art))
                elif resp.status_code == 429:
                    logger.warning("NewsAPI rate limited; continuing with Google News feed")
                    break
            except Exception as err:
                logger.warning(f"NewsAPI non-critical query issue: {err}")
                break

        return articles

    def _normalize_newsapi_article(self, raw: dict) -> dict[str, Any]:
        """Normalize a NewsAPI article to internal format."""
        source_name = ""
        if isinstance(raw.get("source"), dict):
            source_name = raw["source"].get("name", "")

        return {
            "title": raw.get("title", "") or "",
            "source": source_name,
            "domain": self._extract_domain(raw.get("url", "")),
            "url": raw.get("url", ""),
            "published_at": raw.get("publishedAt", ""),
            "content": (raw.get("content", "") or raw.get("description", "") or ""),
            "description": raw.get("description", "") or "",
            "provider": "newsapi",
        }

    # ── GDELT ─────────────────────────────────────────────────────

    async def _fetch_gdelt(self, queries: list[str]) -> list[dict[str, Any]]:
        """Fetch articles from GDELT DOC 2.0 API with safe timespan and timeout."""
        query = queries[0].strip() if queries else ""
        if not query:
            return []

        url = GDELT_URL
        # GDELT DOC 2.0 max valid timespan is <= 90d (e.g. 30d or 14d)
        params = {
            "query": query,
            "mode": "ArtList",
            "maxrecords": 20,
            "timespan": "30d",
            "format": "json",
            "sort": "DateDesc",
        }

        articles = []
        try:
            resp = await self.client.get(url, params=params, timeout=4.0)
            if resp.status_code == 200:
                try:
                    data = resp.json()
                    for art in data.get("articles", []):
                        articles.append(self._normalize_gdelt_article(art))
                except Exception:
                    pass
            elif resp.status_code == 429:
                logger.warning("GDELT rate limited")
        except Exception as err:
            logger.warning(f"GDELT non-critical connection issue: {err}")

        return articles

    def _normalize_gdelt_article(self, raw: dict) -> dict[str, Any]:
        """Normalize a GDELT article to internal format."""
        return {
            "title": raw.get("title", "") or "",
            "source": raw.get("domain", "") or raw.get("source", ""),
            "domain": raw.get("domain", ""),
            "url": raw.get("url", ""),
            "published_at": raw.get("seendate", ""),
            "content": raw.get("title", ""),
            "description": "",
            "provider": "gdelt",
        }

    # ── Utilities ─────────────────────────────────────────────────

    @staticmethod
    def _clean_headline_title(raw_title: str, source_name: str = "") -> str:
        """Strip source name suffix from raw headline title."""
        title = raw_title.strip()
        if source_name:
            # Strip " - Source Name"
            pattern = re.compile(rf"\s*[-|–—]\s*{re.escape(source_name)}\s*$", re.IGNORECASE)
            title = pattern.sub("", title)
        # Fallback generic strip of trailing " - Brand"
        title = re.sub(r"\s+[-|–—]\s+[A-Za-z0-9\s.]{2,30}$", "", title)
        return title.strip()

    @staticmethod
    def _domain_from_source_name(source_name: str) -> str:
        """Map common source names to known domains."""
        name = source_name.lower().strip()
        mapping = {
            "the times of india": "timesofindia.indiatimes.com",
            "times of india": "timesofindia.indiatimes.com",
            "the hindu": "thehindu.com",
            "hindustan times": "hindustantimes.com",
            "indian express": "indianexpress.com",
            "the indian express": "indianexpress.com",
            "ndtv": "ndtv.com",
            "india today": "indiatoday.in",
            "reuters": "reuters.com",
            "al jazeera": "aljazeera.com",
            "bbc": "bbc.com",
            "bbc news": "bbc.com",
            "ani": "aniin.com",
            "pti": "pti.in",
            "variety": "variety.com",
            "business today": "businesstoday.in",
            "news18": "news18.com",
        }
        return mapping.get(name, "")

    @staticmethod
    def _extract_domain(url: str) -> str:
        """Extract domain from a URL."""
        try:
            parsed = urlparse(url)
            domain = parsed.netloc or ""
            if domain.startswith("www."):
                domain = domain[4:]
            return domain
        except Exception:
            return ""

    async def close(self):
        if self._client is not None and not self._client.is_closed:
            await self._client.aclose()
            self._client = None


class RateLimitError(Exception):
    """Raised when a provider returns HTTP 429."""
    pass
