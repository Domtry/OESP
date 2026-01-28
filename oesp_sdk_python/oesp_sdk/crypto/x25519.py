from typing import Tuple
from nacl.public import PublicKey, PrivateKey, SealedBox

def generate_x25519_keypair() -> Tuple[bytes, bytes]:
    """Generate an X25519 keypair."""
    sk = PrivateKey.generate()
    pk = sk.public_key
    return bytes(sk), bytes(pk)

def seal_session_key_x25519(recipient_pub: bytes, session_key: bytes) -> bytes:
    """Seal a session key to the recipient using X25519 sealed box."""
    pk = PublicKey(recipient_pub)
    box = SealedBox(pk)
    return box.encrypt(session_key)

def open_sealed_session_key_x25519(recipient_priv: bytes, ek: bytes) -> bytes:
    """Open a sealed session key using recipient X25519 private key."""
    sk = PrivateKey(recipient_priv)
    box = SealedBox(sk)
    return box.decrypt(ek)
