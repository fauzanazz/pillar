import time
import hashlib
from typing import Optional, Dict, Any
from app.models.search import SearchResponse


class SearchCache:
    def __init__(self, max_size: int = 1000, ttl_seconds: int = 300):
        self.max_size = max_size
        self.ttl_seconds = ttl_seconds
        self._cache: Dict[str, Dict[str, Any]] = {}
        self._access_times: Dict[str, float] = {}
    
    def _generate_key(self, query: str) -> str:
        return hashlib.md5(query.lower().encode()).hexdigest()
    
    def get(self, query: str) -> Optional[SearchResponse]:
        key = self._generate_key(query)
        
        if key not in self._cache:
            return None
        
        entry = self._cache[key]
        
        if time.time() - entry['timestamp'] > self.ttl_seconds:
            self._cache.pop(key, None)
            self._access_times.pop(key, None)
            return None
        
        self._access_times[key] = time.time()
        
        return SearchResponse(**entry['data'])
    
    def set(self, query: str, result: SearchResponse):
        key = self._generate_key(query)
        
        if len(self._cache) >= self.max_size:
            self._cleanup()
        
        self._cache[key] = {
            'data': result.model_dump(),
            'timestamp': time.time()
        }
        self._access_times[key] = time.time()
    
    def _cleanup(self):
        current_time = time.time()
        expired_keys = [
            key for key, entry in self._cache.items()
            if current_time - entry['timestamp'] > self.ttl_seconds
        ]
        
        for key in expired_keys:
            self._cache.pop(key, None)
            self._access_times.pop(key, None)
        
        if len(self._cache) >= self.max_size:
            sorted_keys = sorted(self._access_times.keys(), key=lambda k: self._access_times[k])
            
            num_to_remove = max(1, len(sorted_keys) // 5)
            for key in sorted_keys[:num_to_remove]:
                self._cache.pop(key, None)
                self._access_times.pop(key, None)
    
    def clear(self):
        self._cache.clear()
        self._access_times.clear()
    
    def stats(self) -> Dict[str, Any]:
        current_time = time.time()
        expired_count = sum(
            1 for entry in self._cache.values()
            if current_time - entry['timestamp'] > self.ttl_seconds
        )
        
        return {
            'size': len(self._cache),
            'max_size': self.max_size,
            'ttl_seconds': self.ttl_seconds,
            'expired_entries': expired_count,
            'hit_rate': getattr(self, '_hit_count', 0) / max(getattr(self, '_total_requests', 1), 1)
        }


search_cache = SearchCache(max_size=500, ttl_seconds=300) 