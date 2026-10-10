"""
Truth LenX — Main FastAPI Application
"""
import asyncio
import logging
import time
from contextlib import asynccontextmanager
from typing import Any

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

from config import (
    CORS_ORIGINS, get_evidence_window, TOP_K_EVIDENCE, HOST, PORT,
    MAX_CONCURRENT_VERIFICATIONS
)
from models.schemas import (
    VerifyTextRequest, VerifyUrlRequest, VerifyClaimRequest,
    VerificationResponse, VerificationStatus, SystemStatus, InputType, EvidenceRelation, SourceSummary
)
from services.provider_health import health_tracker
from services.claim_extractor import ClaimExtractor
from services.query_generator import QueryGenerator
from services.news_retriever import NewsRetriever
from services.article_extractor import ArticleExtractor
from services.semantic_ranker import SemanticRanker
from services.nli_classifier import NLIClassifier
from services.duplicate_detector import DuplicateDetector
from services.source_credibility import SourceCredibilityService
from services.evidence_scorer import EvidenceScorer
from services.evidence_fusion import EvidenceFusion
from services.memory_tracker import log_memory, get_memory_mb, cleanup_memory

# Setup basic logging
logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(name)s - %(levelname)s - %(message)s")
logger = logging.getLogger("truthlenx.main")

# ─── Initialize Services (Singletons) ──────────────────────────────────

claim_extractor = ClaimExtractor()
query_generator = QueryGenerator()
article_extractor = ArticleExtractor()
news_retriever = NewsRetriever()
semantic_ranker = SemanticRanker()
nli_classifier = NLIClassifier()
duplicate_detector = DuplicateDetector()
source_credibility = SourceCredibilityService()
evidence_scorer = EvidenceScorer()
evidence_fusion = EvidenceFusion()

# Limit concurrent inference to prevent memory spikes on constrained containers
verification_semaphore = asyncio.Semaphore(MAX_CONCURRENT_VERIFICATIONS)

START_TIME = time.time()

# ─── App Lifespan ──────────────────────────────────────────────────────

@asynccontextmanager
async def lifespan(app: FastAPI):
    log_memory("FastAPI Lifespan Startup - Starting")
    
    # 1. Load Source Credibility DB
    source_credibility.load_database()
    log_memory("After Source Credibility database load")
    
    # 2. Sequential, measured model loading
    try:
        semantic_ranker.load_model()
    except Exception as e:
        logger.error(f"Semantic ranker failed to load during startup: {e}")
        
    cleanup_memory()
    
    try:
        nli_classifier.load_model()
    except Exception as e:
        logger.error(f"NLI classifier failed to load during startup: {e}")
        
    cleanup_memory()
    log_memory("FastAPI Lifespan Startup - Complete")
    
    yield
    
    # Shutdown
    await article_extractor.close()
    await news_retriever.close()
    logger.info("Truth LenX shutdown complete")

# ─── FastAPI Setup ─────────────────────────────────────────────────────

app = FastAPI(
    title="VeriNexa API",
    description="Live Evidence Intelligence & Multi-Source Claim Verification System",
    version="2.0.0",
    lifespan=lifespan
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ─── Verification Pipeline Logic ───────────────────────────────────────

async def run_verification_pipeline(
    input_data: dict,
) -> VerificationResponse:
    """Core verification pipeline guarded by concurrency semaphore and strict evidence bounds."""
    async with verification_semaphore:
        claim = input_data["claim"]
        entities = input_data["entities"]
        
        # 1. Generate Queries
        queries = query_generator.generate(claim, entities)
        
        # 2. Retrieve News
        raw_articles = await news_retriever.retrieve(queries)
        
        # Guard: Evidence-first architecture requires live evidence.
        # If no articles could be retrieved, return VERIFICATION_UNAVAILABLE instead of ML hallucinations.
        if not raw_articles:
            logger.warning(f"No evidence retrieved across providers for claim: {claim[:80]}")
            return VerificationResponse(
                status=VerificationStatus.VERIFICATION_UNAVAILABLE,
                confidence=0.0,
                trust_score=0.5,
                claim=claim,
                input_type=input_data["input_type"],
                evidence_window=get_evidence_window(),
                candidate_count=0,
                evidence_count=0,
                supporting_count=0,
                contradicting_count=0,
                related_count=0,
                insufficient_count=0,
                source_diversity=0,
                independent_clusters=0,
                evidence=[],
                source_summary=[],
                reason="No evidence articles could be retrieved from live news providers (NewsAPI, GDELT, Google News) within the 30-day evidence window.",
                methodology="Evidence-first verification requires corroborating or refuting reporting. Live retrieval yielded zero articles.",
                provider_status=health_tracker.get_all_provider_states(),
                model_status=health_tracker.get_all_model_states(),
                article_analysis={
                    "headline": input_data.get("headline", ""),
                    "entities": entities,
                    "claim_type": "Factual Claim",
                    "input_type": input_data["input_type"].value,
                    "source_domain": input_data.get("domain", ""),
                    "publication_date": input_data.get("published_at", ""),
                    "evidence_window": get_evidence_window()
                },
                extraction_metadata=input_data.get("extraction_metadata")
            )
            
        # 3. Deduplicate & Cluster
        dedup_result = duplicate_detector.process(raw_articles)
        unique_articles = dedup_result["unique_articles"]
        
        # 4. Source Credibility
        unique_articles = source_credibility.enrich_articles(unique_articles)
        
        # 5. Verify Core Models Availability
        if not health_tracker.are_core_models_ready():
            logger.error("Verification requested but core ML models are not in READY state.")
            return VerificationResponse(
                status=VerificationStatus.VERIFICATION_UNAVAILABLE,
                confidence=0.0,
                trust_score=0.5,
                claim=claim,
                input_type=input_data["input_type"],
                evidence_window=get_evidence_window(),
                candidate_count=len(raw_articles),
                evidence_count=0,
                supporting_count=0,
                contradicting_count=0,
                related_count=0,
                insufficient_count=0,
                source_diversity=dedup_result["stats"]["unique_count"],
                independent_clusters=dedup_result["stats"]["independent_groups"],
                evidence=[],
                source_summary=[],
                reason="Verification engine unavailable: Core neural models (MPNet semantic ranker or DeBERTa NLI) failed to initialize or exceeded system memory limits.",
                methodology="Dual-retrieval gathered candidates, but neural semantic ranking and NLI classification are not available.",
                provider_status=health_tracker.get_all_provider_states(),
                model_status=health_tracker.get_all_model_states(),
                article_analysis={
                    "headline": input_data.get("headline", ""),
                    "entities": entities,
                    "claim_type": "Factual Claim",
                    "input_type": input_data["input_type"].value,
                    "source_domain": input_data.get("domain", ""),
                    "publication_date": input_data.get("published_at", ""),
                    "evidence_window": get_evidence_window()
                },
                extraction_metadata=input_data.get("extraction_metadata")
            )

        # 6. Semantic Ranking (MPNet)
        ranked_articles = semantic_ranker.rank_articles(claim, unique_articles)
            
        # 7. NLI Classification (DeBERTa) on top candidate evidence
        candidate_articles = ranked_articles[:TOP_K_EVIDENCE]
        classified_articles = nli_classifier.classify_batch(claim, candidate_articles)
            
        # 8. Evidence Scoring
        scored_articles = evidence_scorer.score(claim, entities, classified_articles)
        
        # 9. Evidence Fusion
        provider_status = health_tracker.get_all_provider_states()
        fusion_result = evidence_fusion.evaluate(scored_articles, provider_status)
        
        # 10. Build Response
        supp_count = sum(1 for a in scored_articles if a.get("relation") == EvidenceRelation.SUPPORTING.value)
        cont_count = sum(1 for a in scored_articles if a.get("relation") == EvidenceRelation.CONTRADICTING.value)
        rel_count = sum(1 for a in scored_articles if a.get("relation") == EvidenceRelation.RELATED.value)
        ins_count = sum(1 for a in scored_articles if a.get("relation") == EvidenceRelation.INSUFFICIENT.value)
        
        source_stats = {}
        for art in scored_articles:
            dom = art.get("domain", "")
            if dom not in source_stats:
                cred = art.get("source_credibility", {})
                source_stats[dom] = {
                    "domain": dom,
                    "source_type": cred.get("source_type", "Unknown"),
                    "credibility_level": cred.get("credibility_level", "Unknown"),
                    "category": cred.get("category", "Unknown"),
                    "articles_count": 0,
                    "quality_sum": 0.0
                }
            source_stats[dom]["articles_count"] += 1
            source_stats[dom]["quality_sum"] += art.get("source_quality", 0.5)
            
        source_summaries = []
        for stats in source_stats.values():
            stats["avg_quality"] = stats["quality_sum"] / stats["articles_count"]
            del stats["quality_sum"]
            source_summaries.append(SourceSummary(**stats))
            
        article_analysis = {
            "headline": input_data.get("headline", ""),
            "entities": entities,
            "claim_type": "Factual Claim",
            "input_type": input_data["input_type"].value,
            "source_domain": input_data.get("domain", ""),
            "publication_date": input_data.get("published_at", ""),
            "evidence_window": get_evidence_window()
        }

        cleanup_memory()

        return VerificationResponse(
            status=fusion_result["status"],
            confidence=fusion_result["confidence"],
            trust_score=fusion_result.get("trust_score", round(fusion_result["confidence"] / 100.0, 2)),
            claim=claim,
            input_type=input_data["input_type"],
            evidence_window=get_evidence_window(),
            candidate_count=dedup_result["stats"]["total_retrieved"],
            evidence_count=len(scored_articles),
            supporting_count=supp_count,
            contradicting_count=cont_count,
            related_count=rel_count,
            insufficient_count=ins_count,
            source_diversity=dedup_result["stats"]["unique_count"],
            independent_clusters=dedup_result["stats"]["independent_groups"],
            evidence=scored_articles,
            source_summary=source_summaries,
            reason=fusion_result["reason"],
            methodology=fusion_result["methodology"],
            provider_status=provider_status,
            model_status=health_tracker.get_all_model_states(),
            article_analysis=article_analysis,
            extraction_metadata=input_data.get("extraction_metadata")
        )


# ─── API Endpoints ─────────────────────────────────────────────────────

@app.get("/")
@app.get("/health")
async def health_check():
    """Health check endpoint exposing process memory and model states."""
    mem = get_memory_mb()
    models_ready = health_tracker.are_core_models_ready()
    return {
        "status": "healthy" if models_ready else "degraded",
        "service": "VeriNexa API",
        "version": "2.0.0",
        "memory_rss_mb": mem,
        "models_ready": models_ready,
        "model_status": health_tracker.get_all_model_states(),
        "provider_status": health_tracker.get_all_provider_states(),
        "uptime_seconds": round(time.time() - START_TIME, 1),
    }

@app.post("/api/verify/claim", response_model=VerificationResponse)
async def verify_claim(request: VerifyClaimRequest):
    """Verify a short claim or headline directly."""
    input_data = claim_extractor.extract_from_claim(request.claim)
    return await run_verification_pipeline(input_data)

@app.post("/api/verify/text", response_model=VerificationResponse)
async def verify_text(request: VerifyTextRequest):
    """Verify a long-form article text."""
    input_data = claim_extractor.extract_from_text(request.text)
    return await run_verification_pipeline(input_data)

@app.post("/api/verify/url", response_model=VerificationResponse)
async def verify_url(request: VerifyUrlRequest):
    """Extract content from URL and verify."""
    ext = await article_extractor.extract(request.url)
    input_data = claim_extractor.extract_from_url_content(ext["title"], ext["content"])
    input_data["domain"] = ext["domain"]
    input_data["published_at"] = ext["published_at"]
    input_data["extraction_metadata"] = ext
    return await run_verification_pipeline(input_data)

@app.get("/api/system/status", response_model=SystemStatus)
async def get_system_status():
    """Get health status of providers and models."""
    return SystemStatus(
        providers=health_tracker.get_all_provider_states(),
        models=health_tracker.get_all_model_states(),
        source_database="READY" if source_credibility.source_count > 0 else "ERROR",
        evidence_fusion="READY",
    )

@app.get("/api/news/latest")
async def get_latest_news(category: str = "all", limit: int = 6):
    """Retrieve current daily news articles for verification showcase."""
    query_map = {
        "all": ["technology AI science global world economy"],
        "tech": ["artificial intelligence technology quantum computing cybersecurity"],
        "science": ["space exploration climate science medical discovery physics"],
        "world": ["international summit global trade energy policy diplomacy"],
        "business": ["stock market global economy tech stocks venture capital"]
    }
    queries = query_map.get(category.lower(), query_map["all"])
    
    try:
        articles = await news_retriever.retrieve(queries)
    except Exception as e:
        logger.warning(f"Failed to fetch live news from retriever: {e}")
        articles = []

    results = []
    seen_titles = set()
    
    for art in articles:
        title = art.get("title", "").strip()
        if not title or title.lower() in seen_titles:
            continue
        seen_titles.add(title.lower())
        
        domain = art.get("domain", "")
        if not domain and art.get("url"):
            domain = news_retriever._extract_domain(art.get("url"))
            
        cred_info = source_credibility.get_credibility(domain)
        
        results.append({
            "id": f"news-{len(results)+1}",
            "title": title,
            "description": art.get("description", "") or (art.get("content", "")[:180] + "..."),
            "source": art.get("source", "") or domain or "Global News Feed",
            "domain": domain,
            "url": art.get("url", "#"),
            "published_at": art.get("published_at", "Just now"),
            "category": category.upper() if category != "all" else "TRENDING",
            "credibility_level": cred_info.get("credibility_level", "VERIFIED_SOURCE"),
            "source_type": cred_info.get("source_type", "News Outlet"),
            "verifiable_claim": title
        })
        if len(results) >= limit:
            break

    return {"category": category, "count": len(results), "articles": results}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host=HOST, port=PORT, reload=False)
