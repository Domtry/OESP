from typing import Optional
from .types import ErrorCode

class OESPError(Exception):
    def __init__(self, code: str, message: str, detail: Optional[str] = None):
        super().__init__(message)
        self.code = code
        self.detail = detail

class InvalidSignatureError(OESPError):
    def __init__(self, detail: Optional[str] = None):
        super().__init__(ErrorCode.INVALID_SIGNATURE, "Invalid signature", detail)

class ExpiredError(OESPError):
    def __init__(self, detail: Optional[str] = None):
        super().__init__(ErrorCode.EXPIRED, "Envelope expired", detail)

class ReplayError(OESPError):
    def __init__(self, detail: Optional[str] = None):
        super().__init__(ErrorCode.REPLAY, "Replay detected", detail)

class InvalidFormatError(OESPError):
    def __init__(self, detail: Optional[str] = None):
        super().__init__(ErrorCode.INVALID_FORMAT, "Invalid envelope format", detail)

class UnsupportedAlgError(OESPError):
    def __init__(self, detail: Optional[str] = None):
        super().__init__(ErrorCode.UNSUPPORTED_ALG, "Unsupported algorithm", detail)

class DecryptionFailedError(OESPError):
    def __init__(self, detail: Optional[str] = None):
        super().__init__(ErrorCode.DECRYPTION_FAILED, "Decryption failed", detail)

class KexFailedError(OESPError):
    def __init__(self, detail: Optional[str] = None):
        super().__init__(ErrorCode.KEX_FAILED, "Key exchange failed", detail)

class StorageError(OESPError):
    def __init__(self, detail: Optional[str] = None):
        super().__init__(ErrorCode.STORAGE_ERROR, "Storage error", detail)

class ResolveFailedError(OESPError):
    def __init__(self, detail: Optional[str] = None):
        super().__init__(ErrorCode.RESOLVE_FAILED, "Resolver failure", detail)

class InvalidDIDError(OESPError):
    def __init__(self, detail: Optional[str] = None):
        super().__init__(ErrorCode.INVALID_DID, "Invalid DID", detail)

class ClockSkewError(OESPError):
    def __init__(self, detail: Optional[str] = None):
        super().__init__(ErrorCode.CLOCK_SKEW, "Clock skew detected", detail)

class UnknownDeviceError(OESPError):
    def __init__(self, detail: Optional[str] = None):
        super().__init__(ErrorCode.UNKNOWN_DEVICE, "Unknown device", detail)
