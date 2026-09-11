from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import List, Optional
import asyncpg
import time
import json
from app.core.dependencies import get_db

router = APIRouter()

class SearchRequest(BaseModel):
    query: str
    legal_area: Optional[str] = None
    corporation: Optional[str] = None
    chamber: Optional[str] = None
    date_from: Optional[str] = None
    date_to: Optional[str] = None
    radicado: Optional[str] = None
    magistrate: Optional[str] = None
    themes: Optional[List[str]] = None
    norms: Optional[List[str]] = None
    keywords: Optional[List[str]] = None
    top_k: int = 20

class SearchResult(BaseModel):
    ruling_id: str
    citation: str
    score: float
    snippet: str
    corporation: str
    ruling_date: Optional[str] = None
    legal_area: Optional[str] = None
    themes: Optional[List[str]] = None
    summary: Optional[str] = None
    chunk_id: Optional[str] = None
    section_type: Optional[str] = None
    page_numbers: Optional[str] = None

class SearchResponse(BaseModel):
    results: List[SearchResult]
    total: int
    processing_time_ms: int

async def get_db() -> asyncpg.Pool:
    from app.core.dependencies import get_db as _get_db
    return await _get_db()

def _build_where_clauses(request: SearchRequest, param_offset: int = 1) -> tuple:
    conditions = []
    params = []
    idx = param_offset

    if request.legal_area:
        conditions.append(f"r.legal_area = ${idx}")
        params.append(request.legal_area)
        idx += 1

    if request.corporation:
        conditions.append(f"r.corporation = ${idx}")
        params.append(request.corporation)
        idx += 1

    if request.chamber:
        conditions.append(f"r.chamber = ${idx}")
        params.append(request.chamber)
        idx += 1

    if request.date_from:
        conditions.append(f"r.ruling_date >= ${idx}::date")
        params.append(request.date_from)
        idx += 1

    if request.date_to:
        conditions.append(f"r.ruling_date <= ${idx}::date")
        params.append(request.date_to)
        idx += 1

    if request.radicado:
        conditions.append(f"r.radicado = ${idx}")
        params.append(request.radicado)
        idx += 1

    if request.magistrate:
        conditions.append(f"r.magistrate_ponent ILIKE ${idx}")
        params.append(f"%{request.magistrate}%")
        idx += 1

    where = " AND ".join(conditions) if conditions else "1=1"
    return where, params, idx

@router.post("/", response_model=SearchResponse)
async def hybrid_search(request: SearchRequest):
    """Hybrid search combining full-text + keyword matching + optional vector search."""
    start_time = time.time()
    db = await get_db()

    where_clause, params, next_idx = _build_where_clauses(request)

    keywords = request.keywords or []
    query_words = [w for w in request.query.split() if len(w) > 2]
    all_keywords = list(set(keywords + query_words))

    if all_keywords:
        keyword_conditions = []
        for kw in all_keywords:
            params.append(f"%{kw}%")
            keyword_conditions.append(
                f"(r.summary ILIKE ${next_idx} OR r.citation ILIKE ${next_idx} "
                f"OR r.resuelve ILIKE ${next_idx} OR r.full_text ILIKE ${next_idx} "
                f"OR r.process_type ILIKE ${next_idx} OR r.radicado ILIKE ${next_idx} "
                f"OR r.magistrate_ponent ILIKE ${next_idx})"
            )
            next_idx += 1
        keyword_filter = " OR ".join(keyword_conditions)
        where_clause = f"({where_clause}) AND ({keyword_filter})"

    sql = f"""
        SELECT
            r.id as ruling_id,
            r.citation,
            r.corporation,
            r.ruling_date,
            r.legal_area,
            r.themes,
            r.summary,
            r.resuelve,
            r.source_url,
            r.radicado,
            r.magistrate_ponent,
            r.process_type,
            r.referenced_norms,
            CASE
                WHEN r.summary IS NOT NULL AND r.summary != '' THEN LEFT(r.summary, 500)
                WHEN r.resuelve IS NOT NULL AND r.resuelve != '' THEN LEFT(r.resuelve, 500)
                ELSE LEFT(r.full_text, 500)
            END as snippet,
            CASE
                WHEN r.citation ILIKE $1 THEN 10.0
                WHEN r.radicado = $1 THEN 9.0
                ELSE GREATEST(
                    CASE WHEN r.summary ILIKE $1 THEN 5.0 ELSE 0.0 END,
                    CASE WHEN r.resuelve ILIKE $1 THEN 4.0 ELSE 0.0 END,
                    CASE WHEN r.full_text ILIKE $1 THEN 2.0 ELSE 0.0 END
                )
            END as relevance_score
        FROM rulings r
        WHERE {where_clause}
        ORDER BY relevance_score DESC, r.ruling_date DESC NULLS LAST
        LIMIT ${next_idx}
    """
    params.append(request.top_k)

    try:
        rows = await db.fetch(sql, *params)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error en búsqueda: {str(e)}")

    results = []
    for row in rows:
        themes_raw = row["themes"]
        if isinstance(themes_raw, str):
            try:
                themes_parsed = json.loads(themes_raw)
            except (json.JSONDecodeError, TypeError):
                themes_parsed = []
        elif isinstance(themes_raw, list):
            themes_parsed = themes_raw
        else:
            themes_parsed = []

        results.append(SearchResult(
            ruling_id=str(row["ruling_id"]),
            citation=row["citation"],
            score=float(row["relevance_score"]),
            snippet=row["snippet"] or "",
            corporation=row["corporation"],
            ruling_date=str(row["ruling_date"]) if row["ruling_date"] else None,
            legal_area=row["legal_area"],
            themes=themes_parsed,
            summary=row["summary"],
        ))

    if results and request.top_k > 5:
        try:
            from app.providers.reranking.cohere_provider import CohereRerankingProvider
            reranker = CohereRerankingProvider()
            docs = [f"{r.citation}: {r.snippet[:200]}" for r in results]
            reranked = await reranker.rerank(request.query, docs, top_k=min(request.top_k, len(results)))

            reranked_results = []
            for idx, score in reranked:
                result = results[idx]
                result.score = float(score)
                reranked_results.append(result)
            results = reranked_results
        except Exception:
            pass

    elapsed_ms = int((time.time() - start_time) * 1000)

    return SearchResponse(
        results=results,
        total=len(results),
        processing_time_ms=elapsed_ms,
    )

@router.post("/semantic", response_model=SearchResponse)
async def semantic_search(request: SearchRequest):
    """Pure semantic vector search using embeddings."""
    start_time = time.time()
    db = await get_db()

    try:
        from app.providers.embeddings.openai_provider import OpenAIEmbeddingProvider
        embedding_provider = OpenAIEmbeddingProvider()
        query_embedding = await embedding_provider.embed_text(request.query)
    except ImportError:
        raise HTTPException(status_code=503, detail="OpenAI not installed")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error generando embedding: {str(e)}")

    where_clause, params, next_idx = _build_where_clauses(request, param_offset=2)
    params.insert(0, str(query_embedding))
    params.insert(1, request.top_k * 2)

    sql = f"""
        SELECT
            rc.id as chunk_id,
            rc.ruling_id,
            rc.content,
            rc.section_type,
            rc.section_title,
            rc.page_numbers,
            rc.chunk_level,
            r.citation,
            r.corporation,
            r.ruling_date,
            r.legal_area,
            r.themes,
            r.summary,
            r.source_url,
            1 - (rc.embedding <=> $1::vector) as similarity_score
        FROM ruling_chunks rc
        JOIN rulings r ON r.id = rc.ruling_id
        WHERE {where_clause}
          AND rc.embedding IS NOT NULL
        ORDER BY rc.embedding <=> $1::vector
        LIMIT $2
    """

    try:
        rows = await db.fetch(sql, *params)
    except Exception:
        where_clause2, params2, next_idx2 = _build_where_clauses(request)
        query_words = [w for w in request.query.split() if len(w) > 2]
        if query_words:
            kw_conditions = []
            for kw in query_words:
                params2.append(f"%{kw}%")
                kw_conditions.append(
                    f"(r.summary ILIKE ${next_idx2} OR r.full_text ILIKE ${next_idx2} "
                    f"OR r.citation ILIKE ${next_idx2})"
                )
                next_idx2 += 1
            where_clause2 = f"({where_clause2}) AND ({' OR '.join(kw_conditions)})"

        fallback_sql = f"""
            SELECT
                NULL as chunk_id,
                r.id as ruling_id,
                CASE
                    WHEN r.summary IS NOT NULL AND r.summary != '' THEN LEFT(r.summary, 500)
                    ELSE LEFT(r.full_text, 500)
                END as content,
                NULL as section_type,
                NULL as section_title,
                NULL as page_numbers,
                2 as chunk_level,
                r.citation,
                r.corporation,
                r.ruling_date,
                r.legal_area,
                r.themes,
                r.summary,
                r.source_url,
                1.0 as similarity_score
            FROM rulings r
            WHERE {where_clause2}
            ORDER BY r.ruling_date DESC NULLS LAST
            LIMIT ${next_idx2}
        """
        params2.append(request.top_k)

        try:
            rows = await db.fetch(fallback_sql, *params2)
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Error en búsqueda semántica: {str(e)}")

    results = []
    for row in rows:
        themes_raw = row["themes"]
        if isinstance(themes_raw, str):
            try:
                themes_parsed = json.loads(themes_raw)
            except (json.JSONDecodeError, TypeError):
                themes_parsed = []
        elif isinstance(themes_raw, list):
            themes_parsed = themes_raw
        else:
            themes_parsed = []

        results.append(SearchResult(
            ruling_id=str(row["ruling_id"]),
            citation=row["citation"],
            score=float(row["similarity_score"]),
            snippet=row["content"][:500] if row["content"] else "",
            corporation=row["corporation"],
            ruling_date=str(row["ruling_date"]) if row["ruling_date"] else None,
            legal_area=row["legal_area"],
            themes=themes_parsed,
            summary=row["summary"],
            chunk_id=str(row["chunk_id"]) if row["chunk_id"] else None,
            section_type=row["section_type"],
            page_numbers=row["page_numbers"],
        ))

    if results and len(results) > 3:
        try:
            from app.providers.reranking.cohere_provider import CohereRerankingProvider
            reranker = CohereRerankingProvider()
            docs = [f"{r.citation}: {r.snippet[:200]}" for r in results]
            reranked = await reranker.rerank(request.query, docs, top_k=min(request.top_k, len(results)))
            reranked_results = []
            for idx, score in reranked:
                result = results[idx]
                result.score = float(score)
                reranked_results.append(result)
            results = reranked_results
        except Exception:
            pass

    elapsed_ms = int((time.time() - start_time) * 1000)

    return SearchResponse(
        results=results[:request.top_k],
        total=len(results),
        processing_time_ms=elapsed_ms,
    )
