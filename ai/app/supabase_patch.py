"""
Supabase client wrapper that patches the gotrue library proxy issue.
This module patches the gotrue library at runtime to fix the proxy/proxies parameter issue
before importing the supabase client.
"""

import sys
from typing import Optional

def patch_gotrue():
    """
    Patch the gotrue library to fix the proxy parameter issue.
    This must be called before importing supabase.
    """
    try:
        # Import the gotrue modules that need patching
        import gotrue._sync.gotrue_base_api
        import gotrue._async.gotrue_base_api
        
        # Save the original __init__ methods
        sync_original_init = gotrue._sync.gotrue_base_api.SyncGoTrueBaseAPI.__init__
        async_original_init = gotrue._async.gotrue_base_api.AsyncGoTrueBaseAPI.__init__
        
        # Create patched versions that rename proxy to proxies
        def sync_patched_init(self, *, url: str, headers: dict, http_client=None, 
                             verify: bool = True, proxy: Optional[str] = None):
            """Patched __init__ that converts proxy to proxies parameter."""
            # Import httpx Client here to avoid circular imports
            from gotrue.http_clients import SyncClient
            
            # If no http_client provided, create one with correct parameter name
            if http_client is None:
                http_client = SyncClient(
                    verify=bool(verify),
                    proxies=proxy,  # Changed from proxy to proxies
                    follow_redirects=True,
                    http2=True,
                )
            
            # Set the instance variables directly
            self._url = url
            self._headers = headers
            self._http_client = http_client
        
        def async_patched_init(self, *, url: str, headers: dict, http_client=None,
                              verify: bool = True, proxy: Optional[str] = None):
            """Patched __init__ that converts proxy to proxies parameter."""
            # Import httpx AsyncClient here to avoid circular imports
            from gotrue.http_clients import AsyncClient
            
            # If no http_client provided, create one with correct parameter name
            if http_client is None:
                http_client = AsyncClient(
                    verify=bool(verify),
                    proxies=proxy,  # Changed from proxy to proxies
                    follow_redirects=True,
                    http2=True,
                )
            
            # Set the instance variables directly
            self._url = url
            self._headers = headers
            self._http_client = http_client
        
        # Replace the __init__ methods
        gotrue._sync.gotrue_base_api.SyncGoTrueBaseAPI.__init__ = sync_patched_init
        gotrue._async.gotrue_base_api.AsyncGoTrueBaseAPI.__init__ = async_patched_init
        
        print("Successfully patched gotrue library proxy issue", file=sys.stderr)
        return True
        
    except Exception as e:
        print(f"Warning: Failed to patch gotrue library: {e}", file=sys.stderr)
        return False


# Apply the patch when this module is imported
_patch_applied = patch_gotrue()

# Now we can safely import supabase
from supabase import create_client as _original_create_client, Client
from supabase.lib.client_options import ClientOptions

# Export the same interface as the original supabase module
create_client = _original_create_client

__all__ = ['create_client', 'Client', 'ClientOptions']