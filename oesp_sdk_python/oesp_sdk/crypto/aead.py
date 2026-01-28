from typing import Tuple, Optional
from cryptography.hazmat.primitives.ciphers.aead import ChaCha20Poly1305
from .rng import RNG, default_rng

def aead_encrypt(session_key: bytes, plaintext: bytes, aad: bytes, rng: Optional[RNG] = None) -> Tuple[bytes, bytes]:
    """Encrypt using ChaCha20-Poly1305 AEAD."""
    if len(session_key) != 32:
        raise ValueError("session_key must be 32 bytes")
    rng = rng or default_rng
    iv = rng.read(12)
    aead = ChaCha20Poly1305(session_key)
    ct = aead.encrypt(iv, plaintext, aad)
    return iv, ct

def aead_decrypt(session_key: bytes, iv: bytes, ct: bytes, aad: bytes) -> bytes:
    """Decrypt ChaCha20-Poly1305 AEAD."""
    if len(session_key) != 32:
        raise ValueError("session_key must be 32 bytes")
    aead = ChaCha20Poly1305(session_key)
    return aead.decrypt(iv, ct, aad)
