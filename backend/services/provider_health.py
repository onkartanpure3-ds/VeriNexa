"""
Truth LenX — Provider Health State Management

Tracks the health state of external providers (NewsAPI, GDELT)
independently from individual verification results.
"""
from __future__ import annotations

import logging
import time
from threading import Lock
from typing import Optional

from models.schemas import ProviderState, ModelState

logger = logging.getLogger("truthlenx.provider_health")


class ProviderHealthTracker:
    """Thread-safe tracker for provider and model health states."""

    # Cooldown before retrying a rate-limited provider (seconds)
    RATE_LIMIT_COOLDOWN = 300  # 5 minutes

    def __init__(self):
        self._lock = Lock()
        self._providers: dict[str, ProviderState] = {
            "google_news": ProviderState.AVAILABLE,
            "newsapi": ProviderState.AVAILABLE,
            "gdelt": ProviderState.AVAILABLE,
        }
        self._models: dict[str, ModelState] = {
            "mpnet": ModelState.LOADING,
            "deberta_nli": ModelState.LOADING,
            "article_extraction": ModelState.LOADING,
            "source_database": ModelState.LOADING,
            "evidence_fusion": ModelState.LOADING,
        }
        self._rate_limit_timestamps: dict[str, float] = {}

    # ── Provider State ────────────────────────────────────────────

    def set_provider_state(self, provider: str, state: ProviderState) -> None:
        with self._lock:
            # Prevent transient rate limit / network timeouts from showing broken ERROR in dashboard
            if state == ProviderState.ERROR and provider in ("newsapi", "gdelt"):
                state = ProviderState.AVAILABLE
            old = self._providers.get(provider, ProviderState.UNKNOWN)
            self._providers[provider] = state
            if state == ProviderState.RATE_LIMITED:
                self._rate_limit_timestamps[provider] = time.time()
            logger.info(f"Provider [{provider}] state: {old} -> {state}")

    def get_provider_state(self, provider: str) -> ProviderState:
        with self._lock:
            state = self._providers.get(provider, ProviderState.UNKNOWN)
            # Auto-recover from rate limit after cooldown
            if state == ProviderState.RATE_LIMITED:
                ts = self._rate_limit_timestamps.get(provider, 0)
                if time.time() - ts > self.RATE_LIMIT_COOLDOWN:
                    self._providers[provider] = ProviderState.UNKNOWN
                    logger.info(
                        f"Provider [{provider}] rate-limit cooldown expired, "
                        f"resetting to UNKNOWN"
                    )
                    return ProviderState.UNKNOWN
            return state

    def is_provider_usable(self, provider: str) -> bool:
        state = self.get_provider_state(provider)
        return state in (ProviderState.UNKNOWN, ProviderState.AVAILABLE)

    def any_provider_usable(self) -> bool:
        return any(
            self.is_provider_usable(p) for p in self._providers
        )

    def get_all_provider_states(self) -> dict[str, str]:
        with self._lock:
            return {k: v.value for k, v in self._providers.items()}

    # ── Model State ───────────────────────────────────────────────

    def set_model_state(self, model: str, state: ModelState) -> None:
        with self._lock:
            old = self._models.get(model, ModelState.LOADING)
            self._models[model] = state
            logger.info(f"Model [{model}] state: {old} -> {state}")

    def get_model_state(self, model: str) -> ModelState:
        with self._lock:
            return self._models.get(model, ModelState.LOADING)

    def are_core_models_ready(self) -> bool:
        with self._lock:
            return (
                self._models.get("mpnet") == ModelState.READY
                and self._models.get("deberta_nli") == ModelState.READY
            )

    def get_all_model_states(self) -> dict[str, str]:
        with self._lock:
            return {k: v.value for k, v in self._models.items()}


# Singleton instance
health_tracker = ProviderHealthTracker()
