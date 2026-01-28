from oesp_sdk.crypto.rng import DeterministicRNG
from oesp_sdk.core.did import derive_did
from oesp_sdk.core.canonical import canonical_json_bytes
from oesp_sdk.core.b64url import encode as b64url_encode

# Fixed seeds for deterministic tests
SEED_A = b"A" * 32
SEED_B = b"B" * 32

def test_deterministic_did():
    # Verify DID derivation is stable
    pub = b"\x01" * 32
    did = derive_did(pub)
    assert did == "oesp:did:olgw5bbcyqd7w3ijq2ipceylpxwx5qxx6xq5gc6z2uq7afjwg6jq"

def test_canonical_sort():
    obj = {"b": 2, "a": 1, "c": {"z": 0, "x": 1}}
    out = canonical_json_bytes(obj)
    assert out == b'{"a":1,"b":2,"c":{"x":1,"z":0}}'

def test_rng_determinism():
    rng = DeterministicRNG(b"seed")
    val1 = rng.read(10)
    rng2 = DeterministicRNG(b"seed")
    val2 = rng2.read(10)
    assert val1 == val2
