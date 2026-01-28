import os
from typing import Optional, TypedDict

class SyncConfig(TypedDict):
    base_url: str
    api_key: Optional[str]
    timeout_sec: float
    max_chunk_bytes: int

def get_sync_config(
    base_url: Optional[str] = None,
    api_key: Optional[str] = None,
    timeout_sec: float = 30.0,
    max_chunk_bytes: int = 500000
) -> SyncConfig:
    default_base_url = "http://oesp-sync-server:8000"
    env_base_url = os.environ.get("OESP_SYNC_BASE_URL")
    
    return {
        "base_url": base_url or env_base_url or default_base_url,
        "api_key": api_key,
        "timeout_sec": timeout_sec,
        "max_chunk_bytes": max_chunk_bytes
    }
