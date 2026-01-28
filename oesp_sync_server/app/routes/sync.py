from fastapi import APIRouter, Depends, Request, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from uuid import UUID

from ..db import get_session
from ..services.sync_service import SyncService
from ..schemas.schemas import SyncStartRequest, SyncStartResponse, ChunkUploadRequest, CommitRequest
from ..settings import settings
from oesp_sdk.core.b64url import decode as b64_decode

router = APIRouter(prefix="/v1/sync", tags=["sync"])

@router.post("/start", response_model=SyncStartResponse)
async def start_sync(
    req: SyncStartRequest, 
    request: Request,
    db: AsyncSession = Depends(get_session)
):
    # Verify X-OESP-DEVICE matches body device_did
    if request.state.device_did != req.device_did:
         raise HTTPException(status_code=400, detail={"error": {"code": "BAD_REQUEST", "message": "X-OESP-DEVICE does not match body device_did"}})
    
    service = SyncService(db)
    session = await service.start_session(
        device_did=req.device_did,
        expected_total_bytes=req.expected_total_bytes,
        expected_total_items=req.expected_total_items,
        device_pub_b64=req.device_pub_b64,
        client_meta=req.client_meta
    )
    
    return {
        "session_id": session.session_id,
        "max_chunk_bytes": settings.MAX_CHUNK_BYTES,
        "resume": {
            "last_acked_seq": session.last_acked_seq,
            "acked_chunks": session.acked_chunks
        }
    }

@router.post("/{session_id}/chunk")
async def upload_chunk(
    session_id: UUID,
    req: ChunkUploadRequest,
    db: AsyncSession = Depends(get_session)
):
    service = SyncService(db)
    payload = b64_decode(req.payload_b64)
    sha256_bytes = b64_decode(req.sha256_b64)
    
    session = await service.add_chunk(
        session_id=session_id,
        seq=req.seq,
        payload=payload,
        sha256_bytes=sha256_bytes
    )
    
    return {
        "acked_seq": req.seq,
        "last_acked_seq": session.last_acked_seq,
        "acked_chunks": session.acked_chunks,
        "status": "ok"
    }

@router.get("/{session_id}/status")
async def get_status(
    session_id: UUID,
    db: AsyncSession = Depends(get_session)
):
    service = SyncService(db)
    session = await service.get_session(session_id)
    
    return {
        "status": session.status,
        "last_acked_seq": session.last_acked_seq,
        "acked_chunks": session.acked_chunks
    }

@router.post("/{session_id}/commit")
async def commit_sync(
    session_id: UUID,
    req: CommitRequest,
    db: AsyncSession = Depends(get_session)
):
    service = SyncService(db)
    final_hash_bytes = b64_decode(req.final_hash_b64)
    
    result = await service.commit_session(
        session_id=session_id,
        final_hash_bytes=final_hash_bytes,
        allow_expired=req.allow_expired
    )
    return result
