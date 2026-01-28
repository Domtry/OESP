from datetime import datetime
from uuid import UUID, uuid4
from typing import Optional, List, Dict, Any
from sqlmodel import SQLModel, Field, Relationship, Column, JSON
from sqlalchemy import UniqueConstraint

class Device(SQLModel, table=True):
    did: str = Field(primary_key=True)
    pub: bytes
    first_seen_at: datetime = Field(default_factory=datetime.utcnow)
    last_seen_at: datetime = Field(default_factory=datetime.utcnow)
    
    sessions: List["SyncSession"] = Relationship(back_populates="device")

class SyncSession(SQLModel, table=True):
    session_id: UUID = Field(default_factory=uuid4, primary_key=True)
    device_did: str = Field(foreign_key="device.did")
    created_at: datetime = Field(default_factory=datetime.utcnow)
    status: str = Field(default="open")  # "open" | "committed" | "aborted"
    expected_total_bytes: int
    expected_total_items: int
    acked_chunks: int = Field(default=0)
    last_acked_seq: int = Field(default=-1)
    final_hash: Optional[bytes] = Field(default=None)
    client_meta: Optional[Dict[str, Any]] = Field(default=None, sa_column=Column(JSON))
    
    device: Device = Relationship(back_populates="sessions")
    chunks: List["SyncChunk"] = Relationship(back_populates="session")

class SyncChunk(SQLModel, table=True):
    session_id: UUID = Field(foreign_key="syncsession.session_id", primary_key=True)
    seq: int = Field(primary_key=True)
    size: int
    sha256: bytes
    payload: bytes
    created_at: datetime = Field(default_factory=datetime.utcnow)
    
    session: SyncSession = Relationship(back_populates="chunks")

class OESPMessage(SQLModel, table=True):
    __table_args__ = (UniqueConstraint("from_did", "mid"),)
    id: UUID = Field(default_factory=uuid4, primary_key=True)
    from_did: str = Field(index=True)
    mid: str = Field(index=True) # mid from OESP envelope
    ts: int
    exp: int
    token: str
    envelope_json: Dict[str, Any] = Field(sa_column=Column(JSON))
    is_expired: bool = False
    received_at: datetime = Field(default_factory=datetime.utcnow)
    
    # Unique constraint (from_did, mid) is usually handled at the DB level or via code logic
    # SQLModel doesn't have a direct UniqueConstraint decorator like SQLAlchemy easily accessible
    # but it will be in the table_args.

class SessionItem(SQLModel, table=True):
    session_id: UUID = Field(foreign_key="syncsession.session_id", primary_key=True)
    message_id: UUID = Field(foreign_key="oespmessage.id", primary_key=True)
