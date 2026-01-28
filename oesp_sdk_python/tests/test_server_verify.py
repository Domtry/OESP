import time
import pytest
from oesp_sdk.client import OESPClient, MemoryKeystore
from oesp_sdk.server import verify_token, ServerPolicy, InMemoryReplayStore
from oesp_sdk.core.errors import ExpiredError, InvalidSignatureError, ReplayError

class SimpleResolver:
    def __init__(self):
        self.map = {}
    def add(self, did, pub):
        self.map[did] = pub
    def resolve_did(self, did):
        return self.map[did]

def test_server_verification_success():
    ks = MemoryKeystore()
    resolver = SimpleResolver()
    client = OESPClient(ks, resolver=resolver)
    
    # Pack for self (just for test)
    did = client.get_did()
    resolver.add(did, ks.get_x25519_public())
    
    token = client.pack(did, {"data": 123})
    
    # Server side verify
    res = verify_token(token)
    assert res["verified"] is True
    assert res["signer_did"] == did

def test_server_expired_policy():
    ks = MemoryKeystore()
    resolver = SimpleResolver()
    client = OESPClient(ks, resolver=resolver)
    did = client.get_did()
    resolver.add(did, ks.get_x25519_public())
    
    # Token that expires in 1 second
    token = client.pack(did, {"data": 1}, ttl_sec=1)
    
    # Success now
    verify_token(token, policy=ServerPolicy(allow_expired=False))
    
    # Fail later
    future_now = int(time.time()) + 10
    with pytest.raises(ExpiredError):
        verify_token(token, now=future_now, policy=ServerPolicy(allow_expired=False))
    
    # Success later if policy allows
    res = verify_token(token, now=future_now, policy=ServerPolicy(allow_expired=True))
    assert res["verified"] is True

def test_server_replay():
    ks = MemoryKeystore()
    resolver = SimpleResolver()
    client = OESPClient(ks, resolver=resolver)
    did = client.get_did()
    resolver.add(did, ks.get_x25519_public())
    
    token = client.pack(did, {"data": 1})
    
    store = InMemoryReplayStore()
    
    # First time ok
    verify_token(token, replay_store=store)
    
    # Second time fail
    with pytest.raises(ReplayError):
        verify_token(token, replay_store=store)

def test_bad_signature():
    ks = MemoryKeystore()
    resolver = SimpleResolver()
    client = OESPClient(ks, resolver=resolver)
    did = client.get_did()
    resolver.add(did, ks.get_x25519_public())
    
    token = client.pack(did, {"data": 1})
    
    # Corrupt token payload
    prefix, payload_b64 = token.split(".")
    from oesp_sdk.core.b64url import decode, encode
    import json
    
    payload = json.loads(decode(payload_b64).decode("utf-8"))
    payload["mid"] = "corrupted"
    corrupted_token = f"{prefix}.{encode(json.dumps(payload).encode('utf-8'))}"
    
    with pytest.raises(InvalidSignatureError):
        verify_token(corrupted_token)
