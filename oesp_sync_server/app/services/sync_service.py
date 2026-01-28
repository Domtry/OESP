import hashlib
import json
import time
from uuid import UUID
from datetime import datetime
from typing import List, Optional, Dict, Any, AsyncIterator
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update, and_
from sqlmodel import select as sql_select
from fastapi import HTTPException

from ..models.models import Device, SyncSession, SyncChunk, OESPMessage, SessionItem
from .hash_stream import HashStream
from ..utils.jsonl_stream import parse_jsonl_stream
from ..settings import settings

# Import OESP SDK
try:
    from oesp_sdk.server.verifier import verify_token
    from oesp_sdk.server.policies import ServerPolicy
    from oesp_sdk.core.errors import OESPError
    from oesp_sdk.core.b64url import decode as b64_decode
except ImportError:
    # This might happen during development if not installed
    # In production, we'll ensure it's installed
    pass

class SyncService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def start_session(
        self, 
        device_did: str, 
        expected_total_bytes: int, 
        expected_total_items: int,
        device_pub_b64: Optional[str] = None,
        client_meta: Optional[Dict[str, Any]] = None
    ) -> SyncSession:
        # 1. Handle Device
        result = await self.db.execute(sql_select(Device).where(Device.did == device_did))
        device = result.scalar_one_or_none()
        
        if not device:
            if not device_pub_b64:
                raise HTTPException(status_code=400, detail={"error": {"code": "BAD_REQUEST", "message": "Device unknown and pub key not provided"}})
            device = Device(did=device_did, pub=b64_decode(device_pub_b64))
            self.db.add(device)
        else:
            if device_pub_b64:
                if device.pub != b64_decode(device_pub_b64):
                    raise HTTPException(status_code=400, detail={"error": {"code": "BAD_DEVICE_KEY", "message": "Device key mismatch"}})
            device.last_seen_at = datetime.utcnow()
            self.db.add(device)

        # 2. Idempotent session start
        if client_meta:
            # Check for existing open session with same meta for this device
            stmt = sql_select(SyncSession).where(
                and_(
                    SyncSession.device_did == device_did,
                    SyncSession.status == "open",
                )
            )
            result = await self.db.execute(stmt)
            sessions = result.scalars().all()
            for s in sessions:
                if s.client_meta == client_meta:
                    return s

        # 3. Create new session
        session = SyncSession(
            device_did=device_did,
            expected_total_bytes=expected_total_bytes,
            expected_total_items=expected_total_items,
            client_meta=client_meta
        )
        self.db.add(session)
        await self.db.commit()
        await self.db.refresh(session)
        return session

    async def get_session(self, session_id: UUID) -> SyncSession:
        result = await self.db.execute(sql_select(SyncSession).where(SyncSession.session_id == session_id))
        session = result.scalar_one_or_none()
        if not session:
            raise HTTPException(status_code=404, detail={"error": {"code": "SESSION_NOT_FOUND", "message": "Session not found"}})
        return session

    async def add_chunk(self, session_id: UUID, seq: int, payload: bytes, sha256_bytes: bytes) -> SyncSession:
        # Validate session
        session = await self.get_session(session_id)
        if session.status != "open":
            raise HTTPException(status_code=400, detail={"error": {"code": "SESSION_CLOSED", "message": "Session is not open"}})

        # Validate size
        if len(payload) > settings.MAX_CHUNK_BYTES:
            raise HTTPException(status_code=400, detail={"error": {"code": "TOO_LARGE", "message": f"Chunk too large, max {settings.MAX_CHUNK_BYTES}"}})

        # Validate hash
        actual_hash = hashlib.sha256(payload).digest()
        if actual_hash != sha256_bytes:
            raise HTTPException(status_code=400, detail={"error": {"code": "INVALID_HASH", "message": "SHA256 mismatch"}})

        # Upsert chunk
        chunk = SyncChunk(
            session_id=session_id,
            seq=seq,
            size=len(payload),
            sha256=sha256_bytes,
            payload=payload
        )
        await self.db.merge(chunk)
        
        # Update session ack stats
        session.last_acked_seq = max(session.last_acked_seq, seq)
        res = await self.db.execute(select(SyncChunk).where(SyncChunk.session_id == session_id))
        session.acked_chunks = len(res.scalars().all())
        
        self.db.add(session)
        await self.db.commit()
        await self.db.refresh(session)
        return session

    async def commit_session(self, session_id: UUID, final_hash_bytes: bytes, allow_expired: bool = True) -> Dict[str, Any]:
        session = await self.get_session(session_id)
        if session.status != "open":
            raise HTTPException(status_code=400, detail={"error": {"code": "SESSION_CLOSED", "message": "Session is not open"}})

        # Streaming processing
        hash_stream = HashStream()
        stats = {"inserted": 0, "duplicates": 0, "invalid": 0}
        
        async def chunk_payload_stream() -> AsyncIterator[bytes]:
            stmt = sql_select(SyncChunk).where(SyncChunk.session_id == session_id).order_by(SyncChunk.seq)
            res = await self.db.stream(stmt)
            async for row in res:
                chunk = row[0]
                hash_stream.update(chunk.payload)
                yield chunk.payload

        policy = ServerPolicy(allow_expired=allow_expired, max_clock_skew_sec=settings.MAX_CLOCK_SKEW_SEC)

        async for item in parse_jsonl_stream(chunk_payload_stream()):
            token = item.get("token")
            if not token:
                stats["invalid"] += 1
                continue
            
            try:
                verified = verify_token(token, policy=policy)
                env = verified["envelope"]
                
                msg = OESPMessage(
                    from_did=env["from"]["did"],
                    mid=env["mid"],
                    ts=env["ts"],
                    exp=env["exp"],
                    token=token,
                    envelope_json=env,
                    is_expired=env["exp"] < int(time.time()) if "exp" in env else False
                )
                
                try:
                    self.db.add(msg)
                    await self.db.flush()
                    stats["inserted"] += 1
                except Exception:
                    await self.db.rollback()
                    stats["duplicates"] += 1
                    stmt = sql_select(OESPMessage).where(and_(OESPMessage.from_did == msg.from_did, OESPMessage.mid == msg.mid))
                    res = await self.db.execute(stmt)
                    msg = res.scalar_one()
                
                session_item = SessionItem(session_id=session_id, message_id=msg.id)
                await self.db.merge(session_item)
                
            except OESPError:
                stats["invalid"] += 1
            except Exception:
                stats["invalid"] += 1

        if hash_stream.digest() != final_hash_bytes:
             await self.db.rollback()
             raise HTTPException(status_code=400, detail={"error": {"code": "INVALID_HASH", "message": "Final hash mismatch"}})

        session.status = "committed"
        session.final_hash = final_hash_bytes
        self.db.add(session)
        await self.db.commit()
        
        return {
            "status": "committed",
            **stats
        }
