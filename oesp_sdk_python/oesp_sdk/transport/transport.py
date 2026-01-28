import json
import base64
import hashlib
import asyncio
import secrets
from typing import List, Callable, Optional, Set, Dict, Any
from .link import BleGattLink
from .frames import OESPBleFrame, StartFrame, ChunkFrame, AckFrame, NackFrame

class OESPBleGattTransport:
    def __init__(self, max_chunk_bytes: int = 1024, timeout_ms: int = 3000, retries: int = 3):
        self.max_chunk_bytes = max_chunk_bytes
        self.timeout_sec = timeout_ms / 1000.0
        self.retries = retries
        self._ack_events: Dict[str, asyncio.Event] = {}
        self._last_ack: Dict[str, int] = {}

    async def send_token(self, token: str, link: BleGattLink, sid: Optional[str] = None) -> None:
        if not sid:
            sid = secrets.token_hex(4)
            
        token_bytes = token.encode("utf-8")
        sha256_hash = hashlib.sha256(token_bytes).digest()
        sha256_b64 = base64.b64encode(sha256_hash).decode("utf-8")
        
        chunks = [token_bytes[i:i + self.max_chunk_bytes] for i in range(0, len(token_bytes), self.max_chunk_bytes)]
        
        # 1. Send START
        start_frame: StartFrame = {
            "t": "START",
            "sid": sid,
            "mid": secrets.token_hex(4),
            "totalLen": len(token_bytes),
            "parts": len(chunks),
            "sha256": sha256_b64
        }
        await self._send_frame_with_ack(link, start_frame, -1)

        # 2. Send CHUNKS
        for i, chunk in enumerate(chunks):
            chunk_frame: ChunkFrame = {
                "t": "CHUNK",
                "sid": sid,
                "seq": i,
                "data": base64.b64encode(chunk).decode("utf-8")
            }
            await self._send_frame_with_ack(link, chunk_frame, i)

        # 3. Send END
        await self._send_frame_with_ack(link, {"t": "END", "sid": sid}, -1)

    async def receive_loop(self, link: BleGattLink, on_token: Callable[[str], None]):
        current_session = None

        def handle_notify(data: bytes):
            nonlocal current_session
            try:
                frame: OESPBleFrame = json.loads(data.decode("utf-8"))
                t = frame["t"]
                sid = frame["sid"]

                if t == "ACK":
                    self._last_ack[sid] = frame["ack"]
                    if sid in self._ack_events:
                        self._ack_events[sid].set()
                    return

                if t == "START":
                    current_session = {
                        "sid": sid,
                        "expected_sha": frame["sha256"],
                        "expected_parts": frame["parts"],
                        "chunks": [None] * frame["parts"],
                        "received_parts": set()
                    }
                    asyncio.create_task(self._send_ack(link, sid, -1))
                
                elif t == "CHUNK":
                    if current_session and current_session["sid"] == sid:
                        seq = frame["seq"]
                        current_session["chunks"][seq] = base64.b64decode(frame["data"])
                        current_session["received_parts"].add(seq)
                        asyncio.create_task(self._send_ack(link, sid, seq))
                
                elif t == "END":
                    if current_session and current_session["sid"] == sid:
                        if len(current_session["received_parts"]) == current_session["expected_parts"]:
                            full_data = b"".join(current_session["chunks"])
                            actual_sha = base64.b64encode(hashlib.sha256(full_data).digest()).decode("utf-8")
                            
                            if actual_sha == current_session["expected_sha"]:
                                asyncio.create_task(self._send_ack(link, sid, -1))
                                on_token(full_data.decode("utf-8"))
                            else:
                                asyncio.create_task(self._send_nack(link, sid, -1, "BAD_HASH"))
                        else:
                            asyncio.create_task(self._send_nack(link, sid, -1, "BAD_SEQ"))
                        current_session = None

            except Exception as e:
                print(f"Error handling frame: {e}")

        link.on_tx_notify(handle_notify)

    async def _send_frame_with_ack(self, link: BleGattLink, frame: Dict[str, Any], expected_ack: int):
        sid = frame["sid"]
        frame_bytes = json.dumps(frame).encode("utf-8")
        
        for attempt in range(self.retries):
            self._ack_events[sid] = asyncio.Event()
            await link.write_rx(frame_bytes)
            
            try:
                await asyncio.wait_for(self._ack_events[sid].wait(), timeout=self.timeout_sec)
                if self._last_ack.get(sid) == expected_ack:
                    return
            except asyncio.TimeoutError:
                pass
            finally:
                self._ack_events.pop(sid, None)
                
        raise Exception(f"Failed to send {frame['t']} after {self.retries} retries")

    async def _send_ack(self, link: BleGattLink, sid: str, ack: int):
        ack_frame = {"t": "ACK", "sid": sid, "ack": ack}
        await link.write_rx(json.dumps(ack_frame).encode("utf-8"))

    async def _send_nack(self, link: BleGattLink, sid: str, at: int, reason: str):
        nack_frame = {"t": "NACK", "sid": sid, "at": at, "reason": reason}
        await link.write_rx(json.dumps(nack_frame).encode("utf-8"))
