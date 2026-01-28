import hashlib

class HashStream:
    """Computes SHA256 in a streaming fashion."""
    def __init__(self):
        self._hash = hashlib.sha256()

    def update(self, data: bytes):
        self._hash.update(data)

    def digest(self) -> bytes:
        return self._hash.digest()

    def hexdigest(self) -> str:
        return self._hash.hexdigest()
