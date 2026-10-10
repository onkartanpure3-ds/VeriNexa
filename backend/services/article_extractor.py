"""
Truth LenX — Article Extraction Service

Extracts article content from URLs with safety checks:
- URL validation (http/https only)
- Block localhost / private IPs
- Follow redirects safely
- Extract title, content, publication date
- Return extraction metadata
"""
from __future__ import annotations

import ipaddress
import logging
import re
import socket
from typing import Optional
from urllib.parse import urlparse

import httpx
from bs4 import BeautifulSoup

logger = logging.getLogger("truthlenx.article_extractor")

# Private/reserved IP ranges to block
BLOCKED_HOSTNAMES = {"localhost", "127.0.0.1", "0.0.0.0", "::1"}


class ArticleExtractor:
    """Extracts article content from URLs."""

    def __init__(self):
        self._client = None

    @property
    def client(self) -> httpx.AsyncClient:
        if self._client is None or self._client.is_closed:
            self._client = httpx.AsyncClient(
                timeout=12.0,
                follow_redirects=True,
                max_redirects=5,
                headers={
                    "User-Agent": (
                        "Mozilla/5.0 (compatible; TruthLenX/1.0; "
                        "+https://truthlenx.app)"
                    )
                },
            )
        return self._client

    async def extract(self, url: str) -> dict:
        """
        Extract article content from a URL.

        Returns:
            dict with keys: title, content, published_at, domain,
            original_url, resolved_url, extraction_status
        """
        result = {
            "title": "",
            "content": "",
            "published_at": "",
            "domain": "",
            "original_url": url,
            "resolved_url": url,
            "extraction_status": "pending",
        }

        # Validate URL
        if not self._is_valid_url(url):
            result["extraction_status"] = "invalid_url"
            logger.warning(f"Invalid URL rejected: {url}")
            return result

        # Check for blocked hosts
        if self._is_blocked_host(url):
            result["extraction_status"] = "blocked_host"
            logger.warning(f"Blocked host rejected: {url}")
            return result

        try:
            resp = await self.client.get(url)
            resp.raise_for_status()

            result["resolved_url"] = str(resp.url)
            result["domain"] = self._extract_domain(str(resp.url))

            html = resp.text
            soup = BeautifulSoup(html, "html.parser")

            # Extract title
            raw_title = self._extract_title(soup)
            result["title"] = self._clean_title(raw_title)

            # Extract content
            result["content"] = self._extract_content(soup, str(resp.url))

            # Extract publication date
            result["published_at"] = self._extract_date(soup)

            result["extraction_status"] = (
                "success" if (result["content"] or result["title"]) else "no_content"
            )
            logger.info(
                f"Extracted article: {result['title'][:60]}... "
                f"({len(result['content'])} chars)"
            )

        except httpx.HTTPStatusError as e:
            result["extraction_status"] = f"http_{e.response.status_code}"
            logger.error(f"HTTP error extracting {url}: {e}")
        except httpx.TimeoutException:
            result["extraction_status"] = "timeout"
            logger.error(f"Timeout extracting {url}")
        except Exception as e:
            result["extraction_status"] = "error"
            logger.error(f"Error extracting {url}: {e}")

        return result

    # ── Title Extraction ──────────────────────────────────────────

    @staticmethod
    def _extract_title(soup: BeautifulSoup) -> str:
        """Extract article title from HTML."""
        # Try og:title meta
        og_title = soup.find("meta", property="og:title")
        if og_title and og_title.get("content"):
            return og_title["content"].strip()

        # Try <title> tag
        title_tag = soup.find("title")
        if title_tag and title_tag.string:
            return title_tag.string.strip()

        # Try first h1
        h1 = soup.find("h1")
        if h1 and h1.get_text(strip=True):
            return h1.get_text(strip=True)

        return ""

    @staticmethod
    def _clean_title(title: str) -> str:
        """Remove aggregator boilerplate and publisher suffixes from headline."""
        if not title:
            return ""
        t = title.strip()
        # Aggregator prefixes
        t = re.sub(r"^Google News\s*[-|–—:]\s*", "", t, flags=re.I)
        t = re.sub(r"^More headlines and perspectives\s*[-|–—:]\s*", "", t, flags=re.I)
        # Aggregator suffixes
        t = re.sub(r"\s*[-|–—]\s*Google News$", "", t, flags=re.I)
        t = re.sub(r"\s*[-|–—]\s*Overview$", "", t, flags=re.I)
        t = re.sub(r"\s*\|\s*Google News$", "", t, flags=re.I)
        # Generic brand suffix e.g. " - The Hindu", " - The Times of India", " | BBC News"
        t = re.sub(r"\s+[-|–—]\s+[A-Za-z0-9\s.]{3,30}$", "", t)
        return t.strip()

    # ── Content Extraction ────────────────────────────────────────

    @staticmethod
    def _extract_content(soup: BeautifulSoup, url: str = "") -> str:
        """Extract main article body text from HTML."""
        # Remove script, style, nav, footer, header
        for tag in soup(["script", "style", "nav", "footer", "header",
                         "aside", "iframe", "form"]):
            tag.decompose()

        # Special handling for Google News aggregator pages
        if "news.google.com" in url.lower():
            story_headlines = []
            for h in soup.find_all(["h1", "h2", "h3", "h4", "a"]):
                text = h.get_text(strip=True)
                if 20 <= len(text) <= 180:
                    if not any(skip in text.lower() for skip in [
                        "google news", "terms", "privacy", "sign in", "settings",
                        "more headlines", "sort by", "save for later", "share",
                        "view full coverage", "feedback"
                    ]):
                        if text not in story_headlines:
                            story_headlines.append(text)
            if story_headlines:
                return ". ".join(story_headlines[:12])

        # Try article tag first
        article = soup.find("article")
        if article:
            text = article.get_text(separator=" ", strip=True)
            if len(text) > 100:
                return text[:5000]

        # Try common content containers
        for selector in [
            {"class_": re.compile(r"article|story|post-content|entry-content", re.I)},
            {"id": re.compile(r"article|story|content|main", re.I)},
            {"role": "main"},
        ]:
            container = soup.find("div", **selector)
            if container:
                text = container.get_text(separator=" ", strip=True)
                if len(text) > 100:
                    return text[:5000]

        # Fallback: collect all <p> tags
        paragraphs = soup.find_all("p")
        text = " ".join(p.get_text(strip=True) for p in paragraphs)
        if len(text) > 50:
            return text[:5000]

        # Last resort: body text
        body = soup.find("body")
        if body:
            return body.get_text(separator=" ", strip=True)[:3000]

        return ""

    # ── Date Extraction ───────────────────────────────────────────

    @staticmethod
    def _extract_date(soup: BeautifulSoup) -> str:
        """Try to extract publication date from meta tags."""
        for prop in [
            "article:published_time",
            "datePublished",
            "og:published_time",
            "date",
        ]:
            meta = soup.find("meta", attrs={"property": prop}) or \
                   soup.find("meta", attrs={"name": prop})
            if meta and meta.get("content"):
                return meta["content"]

        # Try time tag
        time_tag = soup.find("time")
        if time_tag and time_tag.get("datetime"):
            return time_tag["datetime"]

        return ""

    # ── Validation ────────────────────────────────────────────────

    @staticmethod
    def _is_valid_url(url: str) -> bool:
        """Check if the URL is valid and uses http/https."""
        try:
            parsed = urlparse(url)
            return parsed.scheme in ("http", "https") and bool(parsed.netloc)
        except Exception:
            return False

    @staticmethod
    def _is_blocked_host(url: str) -> bool:
        """Block localhost, private IPs, and reserved ranges."""
        try:
            parsed = urlparse(url)
            hostname = parsed.hostname or ""

            if hostname in BLOCKED_HOSTNAMES:
                return True

            # Resolve and check IP
            try:
                ip = ipaddress.ip_address(hostname)
                return ip.is_private or ip.is_reserved or ip.is_loopback
            except ValueError:
                # It's a hostname, try to resolve
                try:
                    resolved = socket.gethostbyname(hostname)
                    ip = ipaddress.ip_address(resolved)
                    return ip.is_private or ip.is_reserved or ip.is_loopback
                except socket.gaierror:
                    return False

        except Exception:
            return True  # Block on error

    @staticmethod
    def _extract_domain(url: str) -> str:
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
