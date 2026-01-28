from oesp_sdk.client import OESPClient, MemoryKeystore
from oesp_sdk.crypto.rng import DeterministicRNG

class SimpleResolver:
    def __init__(self):
        self.map = {}
    def add(self, did, pub):
        self.map[did] = pub
    def resolve_did(self, did):
        return self.map[did]

def test_full_roundtrip():
    # Setup
    sender_ks = MemoryKeystore()
    recipient_ks = MemoryKeystore()
    
    resolver = SimpleResolver()
    
    # We need to resolve the X25519 public key for the recipient
    recipient_did = "oesp:did:recipient" # In reality derived from Ed25519
    resolver.add(recipient_did, recipient_ks.get_x25519_public())
    
    client = OESPClient(sender_ks, resolver=resolver)
    body = {"msg": "hello"}
    
    # Pack
    token = client.pack(recipient_did, body)
    assert token.startswith("OESP1.")
    
    # Unpack (recipient side)
    # The recipient needs their own keystore to decrypt
    recipient_client = OESPClient(recipient_ks)
    decoded = recipient_client.unpack(token)
    
    import json
    assert json.loads(decoded["plaintext"]) == body
    assert decoded["from_did"] == client.get_did()
