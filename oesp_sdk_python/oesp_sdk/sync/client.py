import httpx
import json
import hashlib
import base64
from typing import List, Optional, Dict, Any, TypedDict
from .env import SyncConfig, get_sync_config

class SyncSummary(TypedDict):
    success: bool
    uploaded_count: int
    total_bytes: int
    session_id: Optional[str]
    error: Optional[str]

class OESPSyncClient:
    def __init__(
        self, 
        base_url: Optional[str] = None,
        api_key: Optional[str] = None,
        timeout_sec: float = 30.0,
        max_chunk_bytes: int = 500000
    ):
        self.config = get_sync_config(base_url, api_key, timeout_sec, max_chunk_bytes)

    def set_base_url(self, url: str):
        self.config["base_url"] = url

    async def sync_tokens(
        self,
        tokens: List[str],
        device_did: str,
        device_pub_b64: Optional[str] = None,
        client_meta: Optional[Dict[str, Any]] = None,
        allow_expired: bool = True
    ) -> SyncSummary:
        async with httpx.AsyncClient(timeout=self.config["timeout_sec"]) as client:
            try:
                # 1. Start Session
                start_res = await client.post(
                    f"{self.config['base_url']}/sync/start",
                    json={
                        "did": device_did,
                        "pub": device_pub_b64,
                        "meta": client_meta
                    }
                )
                start_res.raise_for_status()
                session_id = start_res.json()["session_id"]

                # 2. Chunk and Upload
                jsonl_data = "\n".join([json.dumps({"token": t}) for t in tokens]).encode("utf-8")
                total_bytes = 0
                
                max_size = self.config["max_chunk_bytes"]
                chunks = [jsonl_data[i:i + max_size] for i in range(0, len(jsonl_data), max_size)]
                
                for i, chunk in enumerate(chunks):
                    upload_res = await client.post(
                        f"{self.config['base_url']}/sync/upload",
                        content=chunk,
                        headers={
                            "X-Session-ID": session_id,
                            "X-Chunk-Index": str(i),
                            "Content-Type": "application/octet-stream"
                        }
                    )
                    upload_res.raise_for_status()
                    total_bytes += len(chunk)

                # 3. Commit
                final_hash = base64.b64encode(hashlib.sha256(jsonl_data).digest()).decode("utf-8")
                commit_res = await client.post(
                    f"{self.config['base_url']}/sync/commit",
                    json={
                        "session_id": session_id,
                        "final_hash": final_hash,
                        "allow_expired": allow_expired
                    }
                )
                commit_res.raise_for_status()

                return {
                    "success": True,
                    "uploaded_count": len(tokens),
                    "total_bytes": total_bytes,
                    "session_id": session_id,
                    "error": None
                }

            except Exception as e:
                return {
                    "success": False,
                    "uploaded_count": 0,
                    "total_bytes": 0,
                    "session_id": None,
                    "error": str(e)
                }
