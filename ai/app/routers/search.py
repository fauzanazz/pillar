import logging
from typing import Optional, List
from fastapi import APIRouter, HTTPException, Query, Request
from fastapi.responses import JSONResponse

from app.models.search import SearchResponse
from app.services.search_service import search_service
from app.services.search_cache import search_cache

logger = logging.getLogger(__name__)
router = APIRouter(tags=["Smart Search"])


@router.get(
    "/search",
    response_model=SearchResponse,
    summary="Smart Contract Search", 
    description="""
    🔍 **Smart AI-powered contract search**
    
    Search contracts using natural language queries. The AI understands context and intent.
    
    **Example queries:**
    - `"Show all contracts with ASUS that expire in 90 days"`
    - `"Find contracts with penalty clauses over 500 million"`
    - `"All approved contracts from last month"`
    - `"Contracts in Jakarta jurisdiction"`
    - `"Show me vendor X agreements"`
    
    **Features:**
    - 🧠 AI query understanding
    - 🎯 Intent recognition  
    - 📊 Relevance scoring
    - 💡 Smart suggestions
    - ⚡ Fast JSON-based search
    """
)
async def smart_search(
    request: Request,
    q: str = Query(..., description="Natural language search query", example="contracts with ASUS expiring soon"),
    limit: Optional[int] = Query(20, ge=1, le=100, description="Maximum number of results"),
) -> SearchResponse:
    correlation_id = getattr(request.state, 'correlation_id', None)
    
    try:
        logger.info(f"Smart search request: {q}", extra={"correlation_id": correlation_id})
        results = await search_service.search(q, correlation_id)
        
        if len(results.matches) > limit:
            results.matches = results.matches[:limit]
            results.total_found = len(results.matches)
        
        return results
        
    except Exception as e:
        logger.error(f"Search failed: {e}", extra={"correlation_id": correlation_id})
        raise HTTPException(
            status_code=500,
            detail={
                "error": {
                    "type": "search_error", 
                    "message": "Search request failed",
                    "detail": str(e)
                }
            }
        )


@router.get(
    "/search/suggestions",
    response_model=List[str],
    summary="Search Query Suggestions",
    description="Get sample search queries to help users understand capabilities"
)
async def get_search_suggestions() -> List[str]:
    return [
        "contracts with ASUS",
        "all vendor agreements with Microsoft", 
        "show contracts with PT Telkom",
        
        "contracts expiring in 30 days",
        "contracts created last month",
        "agreements ending this year",
        "contracts expiring soon",
        
        "all approved contracts",
        "draft contracts pending review",
        "contracts under legal review",
        
        "contracts worth over 1 billion",
        "high value agreements",
        "contracts with payment terms",
        
        "contracts with penalty clauses",
        "find confidentiality agreements", 
        "contracts with termination clauses",
        "agreements with liability limits",
        
        "contracts under Indonesian jurisdiction",
        "Jakarta-based agreements",
        
        "software licensing agreements",
        "service level agreements",
        "partnership contracts",
        "supply chain agreements"
    ]


@router.get(
    "/search/intents",
    summary="Search Intent Types",
    description="Get list of search intent types the AI can recognize"
)
async def get_search_intents():
    from app.models.search import SearchIntent
    
    return {
        "intents": [
            {
                "name": intent.value,
                "description": _get_intent_description(intent),
                "examples": _get_intent_examples(intent)
            }
            for intent in SearchIntent
        ]
    }


def _get_intent_description(intent) -> str:
    descriptions = {
        "contract_by_party": "Search contracts by company or party name",
        "contract_by_status": "Filter contracts by approval status", 
        "contract_expiring": "Find contracts expiring within time frame",
        "clause_by_content": "Search within contract clause text",
        "clause_by_value": "Find clauses with specific monetary values",
        "contract_by_value": "Filter contracts by total value",
        "date_range": "Search contracts within date range",
        "semantic_search": "General semantic content search",
        "general_query": "Catch-all for complex queries"
    }
    
    return descriptions.get(intent.value, "General search")


def _get_intent_examples(intent) -> List[str]:
    examples = {
        "contract_by_party": [
            "contracts with ASUS",
            "show all Microsoft agreements"
        ],
        "contract_by_status": [
            "approved contracts",
            "contracts pending review"
        ],
        "contract_expiring": [
            "contracts expiring in 90 days", 
            "agreements ending soon"
        ],
        "clause_by_content": [
            "contracts with confidentiality clauses",
            "find penalty terms"
        ],
        "clause_by_value": [
            "clauses with penalties over 500 million",
            "payment terms above 1 billion"
        ],
        "contract_by_value": [
            "high value contracts",
            "agreements worth over 10 million"
        ],
        "date_range": [
            "contracts from January to March",
            "agreements created last year"
        ],
        "semantic_search": [
            "software licensing deals",
            "partnership agreements"  
        ],
        "general_query": [
            "complex multi-criteria searches"
        ]
    }
    
    return examples.get(intent.value, [])


@router.get(
    "/search/cache/stats",
    summary="Search Cache Statistics", 
    description="Get performance statistics for the search cache"
)
async def get_cache_stats():
    return search_cache.stats()


@router.delete(
    "/search/cache",
    summary="Clear Search Cache",
    description="Clear all cached search results"
)
async def clear_search_cache():
    search_cache.clear()
    return {"message": "Search cache cleared successfully"}