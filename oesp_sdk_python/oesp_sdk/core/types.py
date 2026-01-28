from typing import Optional, TypedDict, Literal, Any, Mapping

class From(TypedDict):
    did: str
    pub: str

class To(TypedDict):
    did: str

class EnvelopeV1Dict(TypedDict):
    v: Literal[1]
    typ: str
    mid: str
    sid: str
    ts: int
    exp: int
    from_: From  # Note: renamed from 'from' for TypedDict compatibility if needed, but we use string keys usually
    to: To
    enc: str
    kex: str
    ek: str
    iv: str
    ct: str
    tag: Optional[str]
    sig_alg: str
    sig: str

class DecodedMessage(TypedDict):
    mid: str
    sid: str
    ts: int
    exp: int
    from_did: str
    to_did: str
    plaintext: bytes

class VerifiedEnvelope(TypedDict):
    envelope: Mapping[str, Any]
    verified: bool
    signer_did: str

class ErrorCode:
    INVALID_SIGNATURE = "INVALID_SIGNATURE"
    EXPIRED = "EXPIRED"
    REPLAY = "REPLAY"
    INVALID_FORMAT = "INVALID_FORMAT"
    UNSUPPORTED_ALG = "UNSUPPORTED_ALG"
    DECRYPTION_FAILED = "DECRYPTION_FAILED"
    KEX_FAILED = "KEX_FAILED"
    STORAGE_ERROR = "STORAGE_ERROR"
    RESOLVE_FAILED = "RESOLVE_FAILED"
    INVALID_DID = "INVALID_DID"
    CLOCK_SKEW = "CLOCK_SKEW"
    UNKNOWN_DEVICE = "UNKNOWN_DEVICE"
