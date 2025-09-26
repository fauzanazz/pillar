import logging
import time
from typing import List, Optional, Dict, Any
from datetime import datetime, date, timedelta
from difflib import SequenceMatcher

from app.models.search import (
    SearchIntent, SearchFilters, SearchQuery, SearchMatch, SearchResponse,
    SEARCH_QUERY_SCHEMA
)
from app.models.workflow import ContractDraft, ContractStatus
from app.services.db_storage import db_contract_storage
from app.services.openai_client import openai_client
from app.services.search_cache import search_cache

logger = logging.getLogger(__name__)


class SmartSearchService:
    def __init__(self):
        self.storage = db_contract_storage
        self.cache = search_cache
        
    async def search(self, query: str, correlation_id: Optional[str] = None) -> SearchResponse:
        start_time = time.time()
        
        try:
            logger.info(f"Processing search query: {query}", extra={"correlation_id": correlation_id})
            
            cached_result = self.cache.get(query)
            if cached_result:
                logger.info("Returning cached search result", extra={"correlation_id": correlation_id})
                return cached_result
            
            search_query = await self._understand_query(query, correlation_id)
            matches = await self._execute_search(search_query, correlation_id)
            ranked_matches = self._rank_results(matches, search_query)
            processing_time = int((time.time() - start_time) * 1000)
            
            response = SearchResponse(
                query=search_query,
                matches=ranked_matches,
                total_found=len(ranked_matches),
                processing_time_ms=processing_time,
                suggestions=self._generate_suggestions(query, ranked_matches)
            )
            
            logger.info(
                f"Search completed: {len(ranked_matches)} results in {processing_time}ms",
                extra={"correlation_id": correlation_id}
            )
            
            self.cache.set(query, response)
            return response
            
        except Exception as e:
            logger.error(f"Search failed: {e}", extra={"correlation_id": correlation_id})
            return SearchResponse(
                query=SearchQuery(
                    original_query=query,
                    intent=SearchIntent.GENERAL_QUERY,
                    confidence=0.0,
                    explanation="Search failed"
                ),
                matches=[],
                total_found=0,
                processing_time_ms=int((time.time() - start_time) * 1000)
            )
    
    async def _understand_query(self, query: str, correlation_id: Optional[str] = None) -> SearchQuery:
        system_prompt = """You are an expert at understanding natural language queries for contract search.

Your job is to analyze user queries and extract structured search parameters.

Common query patterns:
- "Show contracts with [company]" → party search
- "Contracts expiring in [X] days" → expiring contracts
- "Find penalty clauses over [amount]" → clause value search
- "All approved contracts" → status filter
- "Contracts from [date] to [date]" → date range

Be smart about:
- Company name variations (ASUS, PT ASUS, Asus)
- Date formats (90 days, 3 months, next quarter)
- Value formats (500 juta, Rp 500 million, 500M)
- Status synonyms (final=approved, pending=draft)

Always provide high confidence (0.8+) if you clearly understand the intent."""

        try:
            ai_response = await openai_client.responses_create(
                system=system_prompt,
                user_json={"query": query},
                json_schema=SEARCH_QUERY_SCHEMA,
                correlation_id=correlation_id
            )
            
            filter_data = ai_response["filters"]
            for key, value in filter_data.items():
                if value == "":
                    filter_data[key] = None
            
            search_query = SearchQuery(
                original_query=query,
                intent=SearchIntent(ai_response["intent"]),
                confidence=ai_response["confidence"],
                explanation=ai_response["explanation"],
                filters=SearchFilters(**filter_data)
            )
            
            logger.info(
                f"Query understood: {search_query.intent.value} (confidence: {search_query.confidence})",
                extra={"correlation_id": correlation_id}
            )
            
            return search_query
            
        except Exception as e:
            logger.warning(f"AI query understanding failed, using fallback: {e}")
            return SearchQuery(
                original_query=query,
                intent=SearchIntent.SEMANTIC_SEARCH,
                confidence=0.3,
                explanation="Fallback to keyword search",
                filters=SearchFilters(semantic_query=query)
            )
    
    async def _execute_search(self, query: SearchQuery, correlation_id: Optional[str] = None) -> List[SearchMatch]:
        # Use database storage to search contracts including ai_draft_data
        filters = query.filters
        
        # Build search filters for database query
        db_filters = {}
        if filters.statuses:
            db_filters['status'] = filters.statuses[0]  # Take first status for now
        if filters.party_names:
            db_filters['party_names'] = filters.party_names
        if filters.start_date:
            db_filters['start_date'] = filters.start_date
        if filters.end_date:
            db_filters['end_date'] = filters.end_date
        
        # Get contracts from database with enhanced search
        search_query = query.original_query if query.filters.semantic_query else query.filters.semantic_query or query.original_query
        all_contracts = await self.storage.search_contracts(search_query, db_filters)
        
        # If no database results and it's a semantic query, try broader search
        if not all_contracts and query.intent in [SearchIntent.GENERAL_QUERY, SearchIntent.SEMANTIC_SEARCH]:
            all_contracts = await self.storage.list_contracts(limit=100)
        
        matches = []
        logger.info(f"Searching through {len(all_contracts)} contracts from database")
        
        for contract in all_contracts:
            score, reasons, highlights = self._score_contract(contract, query)
            
            # Enhanced scoring with AI draft data
            ai_draft_score, ai_reasons, ai_highlights = await self._score_ai_draft_data(contract, query)
            if ai_draft_score > 0:
                score += ai_draft_score * 0.4  # Give AI draft data significant weight
                reasons.extend(ai_reasons)
                highlights.update(ai_highlights)
            
            # For general queries with no specific filters, always include with semantic scoring  
            is_semantic_query = (query.intent in [SearchIntent.GENERAL_QUERY, SearchIntent.SEMANTIC_SEARCH])
            
            if score > 0.1 or (is_semantic_query and not any([
                filters.party_names, filters.statuses, filters.start_date, filters.end_date, 
                filters.days_ahead, filters.min_value, filters.max_value
            ])):
                # If it's a semantic query with no score, give it semantic scoring
                if score <= 0.1 and is_semantic_query:
                    semantic_score, semantic_highlights = self._score_semantic_match(contract, query.original_query)
                    if semantic_score > 0.05:  # Lower semantic threshold  
                        score = semantic_score * max(query.confidence, 0.5)  # Don't let 0 confidence kill results
                        reasons = ["Semantic content match"]
                        highlights.update(semantic_highlights)
                        
                if score > 0.02:  # Much lower threshold for general queries
                    matches.append(SearchMatch(
                        contract=contract,
                        score=score,
                        match_reasons=reasons if reasons else ["General match"],
                        highlights=highlights
                    ))
        
        return matches
    
    def _score_contract(self, contract: ContractDraft, query: SearchQuery) -> tuple[float, List[str], Dict[str, List[str]]]:
        score = 0.0
        reasons = []
        highlights = {}
        filters = query.filters
        
        if filters.party_names:
            party_score = self._score_party_match(contract, filters.party_names)
            if party_score > 0.6:
                score += party_score * 0.3
                reasons.append(f"Matches party: {', '.join(filters.party_names)}")
                highlights["parties"] = [p.name for p in contract.template.parties 
                                       if any(self._fuzzy_match(p.name.lower(), pname.lower()) > 0.6 
                                             for pname in filters.party_names)]
        
        if filters.statuses:
            if any(status.lower() in contract.status.value.lower() for status in filters.statuses):
                score += 0.2
                reasons.append(f"Status matches: {contract.status.value}")
        
        date_score, date_reason = self._score_date_match(contract, filters)
        if date_score > 0:
            score += date_score * 0.25
            reasons.append(date_reason)
        
        value_score, value_reason = self._score_value_match(contract, filters)
        if value_score > 0:
            score += value_score * 0.2
            reasons.append(value_reason)
        
        clause_score, clause_reasons, clause_highlights = self._score_clause_match(contract, filters)
        if clause_score > 0:
            score += clause_score * 0.25
            reasons.extend(clause_reasons)
            highlights.update(clause_highlights)
        
        if filters.semantic_query:
            semantic_score, semantic_highlights = self._score_semantic_match(contract, filters.semantic_query)
            if semantic_score > 0:
                score += semantic_score * 0.2
                reasons.append("Semantic content match")
                highlights.update(semantic_highlights)
        
        score *= query.confidence
        return score, reasons, highlights
    
    def _score_party_match(self, contract: ContractDraft, party_names: List[str]) -> float:
        max_score = 0.0
        # Include both party names AND representatives in search
        searchable_parties = []
        for p in contract.template.parties:
            searchable_parties.append(p.name.lower())
            searchable_parties.append(p.rep.lower())  # Add representative
        
        for search_party in party_names:
            search_party_lower = search_party.lower()
            for contract_party in searchable_parties:
                similarity = self._fuzzy_match(contract_party, search_party_lower)
                max_score = max(max_score, similarity)
        
        return max_score
    
    def _score_date_match(self, contract: ContractDraft, filters: SearchFilters) -> tuple[float, str]:
        if filters.days_ahead:
            try:
                if contract.template.end_date:
                    end_date = datetime.strptime(contract.template.end_date, "%Y-%m-%d").date()
                    days_until_end = (end_date - date.today()).days
                    
                    if 0 <= days_until_end <= filters.days_ahead:
                        urgency_score = 1.0 - (days_until_end / filters.days_ahead)
                        return urgency_score, f"Expires in {days_until_end} days"
            except ValueError:
                pass
        
        if filters.start_date or filters.end_date:
            contract_date = contract.created_at.date()
            
            if filters.start_date and contract_date < filters.start_date:
                return 0.0, ""
            if filters.end_date and contract_date > filters.end_date:
                return 0.0, ""
                
            return 0.8, f"Created on {contract_date}"
        
        return 0.0, ""
    
    def _score_value_match(self, contract: ContractDraft, filters: SearchFilters) -> tuple[float, str]:
        if not contract.template.value:
            return 0.0, ""
        
        value = contract.template.value
        
        if filters.min_value and value < filters.min_value:
            return 0.0, ""
        if filters.max_value and value > filters.max_value:
            return 0.0, ""
        
        if filters.min_value or filters.max_value:
            return 0.9, f"Contract value: Rp {value:,.0f}"
        
        return 0.0, ""
    
    def _score_clause_match(self, contract: ContractDraft, filters: SearchFilters) -> tuple[float, List[str], Dict[str, List[str]]]:
        if not contract.clauses:
            return 0.0, [], {}
        
        score = 0.0
        reasons = []
        highlights = {}
        
        if filters.clause_keywords:
            matching_clauses = []
            for clause in contract.clauses:
                clause_text = clause.text.lower()
                for keyword in filters.clause_keywords:
                    if keyword.lower() in clause_text:
                        score += 0.3
                        matching_clauses.append(f"{clause.title}: ...{keyword}...")
            
            if matching_clauses:
                reasons.append(f"Found keywords in clauses")
                highlights["clauses"] = matching_clauses[:3]
        
        if filters.clause_types:
            for clause_type in filters.clause_types:
                for clause in contract.clauses:
                    if self._fuzzy_match(clause.title.lower(), clause_type.lower()) > 0.6:
                        score += 0.4
                        reasons.append(f"Found {clause_type} clause: {clause.title}")
        
        if filters.min_value or filters.max_value:
            monetary_clauses = self._find_monetary_clauses(contract.clauses, filters)
            if monetary_clauses:
                score += 0.5
                reasons.extend(monetary_clauses)
        
        return min(score, 1.0), reasons, highlights
    
    def _score_semantic_match(self, contract: ContractDraft, semantic_query: str) -> tuple[float, Dict[str, List[str]]]:
        query_words = set(semantic_query.lower().split())
        
        # Enhanced contract text including representatives and more fields
        contract_text = " ".join([
            contract.template.title.lower(),
            contract.template.description.lower(),
            # Include party names AND representatives
            " ".join([p.name.lower() + " " + p.rep.lower() for p in contract.template.parties]),
            # Include other contract metadata
            contract.status.value.lower(),
            contract.created_by.value.lower() if hasattr(contract.created_by, 'value') else str(contract.created_by).lower(),
            contract.current_assignee.value.lower() if hasattr(contract.current_assignee, 'value') else str(contract.current_assignee).lower(),
            " ".join([clause.title.lower() + " " + clause.text.lower() for clause in contract.clauses])
        ])
        
        contract_words = set(contract_text.split())
        
        enhanced_query_words = set()
        for word in query_words:
            enhanced_query_words.add(word)
            if word == "baru":
                enhanced_query_words.update(["recent", "new", "latest"])
            elif word == "kontrak":
                enhanced_query_words.update(["contract", "agreement"])
            elif word == "paling":
                enhanced_query_words.update(["most", "latest", "newest"])
            elif word == "all":
                enhanced_query_words.update(["contract", "agreement", "semua", "seluruh"])
            elif word == "contracts":
                enhanced_query_words.update(["contract", "agreement", "kontrak"])
            elif word == "air":
                enhanced_query_words.update(["water", "drink", "aqua", "mineral"])
            elif word == "tentang":
                enhanced_query_words.update(["about", "regarding", "concerning"])
            elif word == "mouse":
                enhanced_query_words.update(["tikus", "mouse", "perdagangan"])
            elif word == "mouse" in word or "tikus" in word:
                enhanced_query_words.update(["mouse", "perdagangan", "trading"])
            elif word == "api":
                enhanced_query_words.update(["api", "key", "usage"])
            elif word == "billing":
                enhanced_query_words.update(["tagihan", "billing", "invoice"])
            elif word == "sharing":
                enhanced_query_words.update(["berbagi", "sharing", "care", "caring"])
        
        overlap = len(enhanced_query_words.intersection(contract_words))
        total_words = len(enhanced_query_words)
        
        if total_words == 0:
            return 0.0, {}
        
        similarity = overlap / total_words
        
        if any(word in semantic_query.lower() for word in ["baru", "latest", "recent", "paling"]):
            import datetime
            now = datetime.datetime.now()
            contract_age_days = (now - contract.created_at).days
            update_age_days = (now - contract.updated_at).days
            
            if contract_age_days < 30:
                similarity += 0.3 * (1 - contract_age_days / 30)
            if update_age_days < 7:
                similarity += 0.2 * (1 - update_age_days / 7)
        
        highlights = {}
        if similarity > 0.2:
            matching_words = list(enhanced_query_words.intersection(contract_words))
            highlights["keywords"] = matching_words[:5]
        
        return min(similarity, 1.0), highlights
    
    async def _score_ai_draft_data(self, contract: ContractDraft, query: SearchQuery) -> tuple[float, List[str], Dict[str, List[str]]]:
        """Score matches in AI draft data (ai_draft_data JSON field)."""
        score = 0.0
        reasons = []
        highlights = {}
        
        # This scoring is already handled by the database search in search_contracts method
        # But we can add additional semantic analysis here if needed
        
        filters = query.filters
        query_words = set(query.original_query.lower().split())
        
        # Score based on clause content in AI draft data
        if contract.clauses:
            clause_matches = 0
            matching_clauses = []
            
            for clause in contract.clauses:
                clause_text = clause.text.lower()
                clause_title = clause.title.lower()
                
                # Check for direct word matches
                clause_words = set(clause_text.split() + clause_title.split())
                overlap = query_words.intersection(clause_words)
                
                if overlap:
                    clause_matches += len(overlap) / len(query_words)
                    matching_clauses.append(f"{clause.title}: {clause.text[:100]}...")
                
                # Check for keyword matches
                if filters.clause_keywords:
                    for keyword in filters.clause_keywords:
                        if keyword.lower() in clause_text or keyword.lower() in clause_title:
                            score += 0.3
                            reasons.append(f"Found keyword '{keyword}' in AI-generated clause")
                            if clause.title not in matching_clauses:
                                matching_clauses.append(f"{clause.title}: {clause.text[:100]}...")
            
            if clause_matches > 0:
                score += min(clause_matches, 1.0) * 0.5
                reasons.append(f"Found matches in {len(matching_clauses)} AI-generated clauses")
                highlights["ai_clauses"] = matching_clauses[:3]
        
        # Score based on contract description/summary
        if hasattr(contract.template, 'description') and contract.template.description:
            desc_words = set(contract.template.description.lower().split())
            overlap = query_words.intersection(desc_words)
            if overlap:
                score += (len(overlap) / len(query_words)) * 0.3
                reasons.append("Found matches in AI contract summary")
        
        return min(score, 1.0), reasons, highlights
    
    def _find_monetary_clauses(self, clauses, filters: SearchFilters) -> List[str]:
        import re
        monetary_patterns = [
            r'rp\s*([0-9.,]+)\s*(juta|miliar|ribu|million|billion|thousand)?',
            r'([0-9.,]+)\s*(rupiah|juta|miliar|ribu)',
            r'\$\s*([0-9.,]+)',
            r'([0-9.,]+)%'  
        ]
        
        matching_clauses = []
        
        for clause in clauses:
            clause_text = clause.text.lower()
            
            for pattern in monetary_patterns:
                matches = re.findall(pattern, clause_text)
                for match in matches:
                    try:
                        if isinstance(match, tuple):
                            value_str = match[0].replace(',', '')
                            multiplier = 1
                            if len(match) > 1:
                                unit = match[1].lower()
                                if 'juta' in unit or 'million' in unit:
                                    multiplier = 1_000_000
                                elif 'miliar' in unit or 'billion' in unit:
                                    multiplier = 1_000_000_000
                                elif 'ribu' in unit or 'thousand' in unit:
                                    multiplier = 1_000
                        else:
                            value_str = match.replace(',', '')
                            multiplier = 1
                        
                        value = float(value_str) * multiplier
                        
                        in_range = True
                        if filters.min_value and value < filters.min_value:
                            in_range = False
                        if filters.max_value and value > filters.max_value:
                            in_range = False
                        
                        if in_range:
                            matching_clauses.append(f"Found monetary clause: {clause.title} (Rp {value:,.0f})")
                            
                    except (ValueError, IndexError):
                        continue
        
        return matching_clauses
    
    def _fuzzy_match(self, a: str, b: str) -> float:
        return SequenceMatcher(None, a, b).ratio()
    
    def _rank_results(self, matches: List[SearchMatch], query: SearchQuery) -> List[SearchMatch]:
        original_query = query.original_query.lower()
        
        if any(word in original_query for word in ["baru", "latest", "recent", "paling"]):
            matches.sort(key=lambda x: (x.score, x.contract.created_at, x.contract.updated_at), reverse=True)
        else:
            matches.sort(key=lambda x: x.score, reverse=True)
            
        return matches[:50] 
    
    def _generate_suggestions(self, original_query: str, matches: List[SearchMatch]) -> Optional[List[str]]:
        if len(matches) == 0:
            return [
                "Try broader terms like 'all contracts' or 'recent contracts'",
                "Search by company name like 'contracts with ASUS'",
                "Try date queries like 'contracts expiring soon'"
            ]
        
        if len(matches) > 20:
            return [
                "Add filters like date range or specific company",
                "Try searching for specific clause types",
                "Filter by contract status"
            ]
        
        return None

search_service = SmartSearchService()