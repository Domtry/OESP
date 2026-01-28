import hashlib
import base64

def derive_did(pubkey_bytes: bytes) -> str:
    """Derive OESP DID from a public key.
    
    Spec: DID = "oesp:did:" + base32(sha256(pubkey_bytes)) without padding.
    """
    digest = hashlib.sha256(pubkey_bytes).digest()
    # base32 encoding, remove padding, lowercase
    b32 = base64.b32encode(digest).decode("ascii").rstrip("=").lower()
    return f"oesp:did:{b32}"
