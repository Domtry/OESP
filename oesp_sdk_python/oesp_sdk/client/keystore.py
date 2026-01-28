from typing import Protocol, Tuple
from ..crypto.ed25519 import generate_ed25519_keypair, sign_ed25519
from ..crypto.x25519 import generate_x25519_keypair

class Keystore(Protocol):
    def get_ed25519_public(self) -> bytes:
        ...
    def get_ed25519_private(self) -> bytes:
        ...
    def get_x25519_public(self) -> bytes:
        ...
    def get_x25519_private(self) -> bytes:
        ...
    def sign(self, payload: bytes) -> bytes:
        ...

class MemoryKeystore:
    def __init__(self):
        ed_priv, ed_pub = generate_ed25519_keypair()
        x_priv, x_pub = generate_x25519_keypair()
        self._ed_priv = ed_priv
        self._ed_pub = ed_pub
        self._x_priv = x_priv
        self._x_pub = x_pub

    def get_ed25519_public(self) -> bytes:
        return self._ed_pub

    def get_ed25519_private(self) -> bytes:
        return self._ed_priv

    def get_x25519_public(self) -> bytes:
        return self._x_pub

    def get_x25519_private(self) -> bytes:
        return self._x_priv

    def sign(self, payload: bytes) -> bytes:
        return sign_ed25519(self._ed_priv, payload)

class OSKeystore:
    """Placeholder for OS-level secure storage (e.g. Keychain, Keystore)."""
    def __init__(self):
        raise NotImplementedError("OSKeystore not implemented in this SDK version")
