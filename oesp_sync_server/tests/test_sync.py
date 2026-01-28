import pytest
import json
from uuid import uuid4
from oesp_sdk.client import OESPClient, MemoryKeystore
from oesp_sdk.core.b64url import encode as b64_encode
from oesp_sdk.core.canonical import canonical_json_bytes
import hashlib

class SimpleResolver:
    def __init__(self):
        self.map = {}
    def add(self, did, pub):
        self.map[did] = pub
    def resolve_did(self, did):
        return self.map[did]

def create_test_token(sender_ks, recipient_ks, body):
    resolver = SimpleResolver()
    recipient_did = "oesp:did:recipient"
    resolver.add(recipient_did, recipient_ks.get_x25519_public())
    client = OESPClient(sender_ks, resolver=resolver)
    return client.pack(recipient_did, body)

@pytest.mark.asyncio
async def test_start_idempotent(client):
    device_did = "oesp:did:test_device"
    device_pub = b"test_pub_key"
    payload = {
        "device_did": device_did,
        "device_pub_b64": b64_encode(device_pub),
        "expected_total_bytes": 1000,
        "expected_total_items": 10,
        "client_meta": {"app_version": "1.0"}
    }
    headers = {"X-OESP-DEVICE": device_did}
    
    # First start
    resp1 = await client.post("/v1/sync/start", json=payload, headers=headers)
    assert resp1.status_code == 200
    data1 = resp1.json()
    session_id = data1["session_id"]
    
    # Second start (idempotent)
    resp2 = await client.post("/v1/sync/start", json=payload, headers=headers)
    assert resp2.status_code == 200
    data2 = resp2.json()
    assert data2["session_id"] == session_id

@pytest.mark.asyncio
async def test_chunk_idempotent(client):
    device_did = "oesp:did:test_device_chunk"
    device_pub = b"test_pub_key_chunk"
    headers = {"X-OESP-DEVICE": device_did}
    
    start_payload = {
        "device_did": device_did,
        "device_pub_b64": b64_encode(device_pub),
        "expected_total_bytes": 1000,
        "expected_total_items": 10
    }
    resp = await client.post("/v1/sync/start", json=start_payload, headers=headers)
    session_id = resp.json()["session_id"]
    
    chunk_payload = b'{"token":"test"}\n'
    sha256_b64 = b64_encode(hashlib.sha256(chunk_payload).digest())
    
    upload_payload = {
        "seq": 0,
        "payload_b64": b64_encode(chunk_payload),
        "sha256_b64": sha256_b64
    }
    
    # First upload
    resp1 = await client.post(f"/v1/sync/{session_id}/chunk", json=upload_payload, headers=headers)
    assert resp1.status_code == 200
    assert resp1.json()["acked_chunks"] == 1
    
    # Second upload (idempotent)
    resp2 = await client.post(f"/v1/sync/{session_id}/chunk", json=upload_payload, headers=headers)
    assert resp2.status_code == 200
    assert resp2.json()["acked_chunks"] == 1

@pytest.mark.asyncio
async def test_commit_streaming(client):
    # Setup tokens
    sender_ks = MemoryKeystore()
    recipient_ks = MemoryKeystore() # The server acts as recipient or verifier
    
    token1 = create_test_token(sender_ks, recipient_ks, {"msg": "first"})
    token2 = create_test_token(sender_ks, recipient_ks, {"msg": "second"})
    
    jsonl = f'{{"token":"{token1}"}}\n{{"token":"{token2}"}}\n'.encode("utf-8")
    
    device_did = "oesp:did:streaming_test"
    device_pub = b"streaming_pub"
    headers = {"X-OESP-DEVICE": device_did}
    
    # Start
    start_resp = await client.post("/v1/sync/start", json={
        "device_did": device_did,
        "device_pub_b64": b64_encode(device_pub),
        "expected_total_bytes": len(jsonl),
        "expected_total_items": 2
    }, headers=headers)
    session_id = start_resp.json()["session_id"]
    
    # Upload one big chunk (simplified)
    await client.post(f"/v1/sync/{session_id}/chunk", json={
        "seq": 0,
        "payload_b64": b64_encode(jsonl),
        "sha256_b64": b64_encode(hashlib.sha256(jsonl).digest())
    }, headers=headers)
    
    # Commit
    commit_resp = await client.post(f"/v1/sync/{session_id}/commit", json={
        "final_hash_b64": b64_encode(hashlib.sha256(jsonl).digest()),
        "allow_expired": True
    }, headers=headers)
    
    assert commit_resp.status_code == 200
    data = commit_resp.json()
    assert data["status"] == "committed"
    assert data["inserted"] == 2

@pytest.mark.asyncio
async def test_commit_invalid_token(client):
    jsonl = b'{"token":"OESP1.INVALID"}\n{"token":"OESP1.ALSO_INVALID"}\n'
    
    device_did = "oesp:did:invalid_test"
    device_pub = b"invalid_pub"
    headers = {"X-OESP-DEVICE": device_did}
    
    start_resp = await client.post("/v1/sync/start", json={
        "device_did": device_did,
        "device_pub_b64": b64_encode(device_pub),
        "expected_total_bytes": len(jsonl),
        "expected_total_items": 2
    }, headers=headers)
    session_id = start_resp.json()["session_id"]
    
    await client.post(f"/v1/sync/{session_id}/chunk", json={
        "seq": 0,
        "payload_b64": b64_encode(jsonl),
        "sha256_b64": b64_encode(hashlib.sha256(jsonl).digest())
    }, headers=headers)
    
    commit_resp = await client.post(f"/v1/sync/{session_id}/commit", json={
        "final_hash_b64": b64_encode(hashlib.sha256(jsonl).digest()),
        "allow_expired": True
    }, headers=headers)
    
    assert commit_resp.status_code == 200
    data = commit_resp.json()
    assert data["invalid"] == 2
