import base64

def encode(data: bytes) -> str:
    """Encode bytes to base64url string without padding."""
    return base64.urlsafe_b64encode(data).decode("ascii").rstrip("=")

def decode(s: str) -> bytes:
    """Decode base64url string without padding to bytes."""
    pad_len = (4 - (len(s) % 4)) % 4
    padded = s + ("=" * pad_len)
    return base64.urlsafe_b64decode(padded)
