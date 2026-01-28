from typing import Tuple
from nacl.signing import SigningKey, VerifyKey

def generate_ed25519_keypair() -> Tuple[bytes, bytes]:
    """Generate an Ed25519 identity keypair."""
    sk = SigningKey.generate()
    vk = sk.verify_key
    return sk.encode(), vk.encode()

def sign_ed25519(priv: bytes, data: bytes) -> bytes:
    """Sign data with Ed25519."""
    sk = SigningKey(priv)
    signed = sk.sign(data)
    return signed.signature

def verify_ed25519(pub: bytes, data: bytes, sig: bytes) -> bool:
    """Verify Ed25519 signature."""
    try:
        vk = VerifyKey(pub)
        vk.verify(data, sig)
        return True
    except Exception:
        return False
