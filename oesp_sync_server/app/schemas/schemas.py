from pydantic import BaseModel
from typing import Optional, Dict, Any
from uuid import UUID

class SyncStartRequest(BaseModel):
    device_did: str
    device_pub_b64: Optional[str] = None
    expected_total_bytes: int
    expected_total_items: int
    client_meta: Optional[Dict[str, Any]] = None

class SyncStartResponse(BaseModel):
    session_id: UUID
    max_chunk_bytes: int
    resume: Dict[str, Any]

class ChunkUploadRequest(BaseModel):
    seq: int
    payload_b64: str
    sha256_b64: str

class CommitRequest(BaseModel):
    final_hash_b64: str
    format: str = "tokens-jsonl"
    allow_expired: bool = True
