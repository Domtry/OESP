import json
import time
from typing import Optional, Mapping, Any
from ..core.envelope import EnvelopeV1
from ..core.b64url import decode as b64url_decode
from ..core.canonical import canonical_json_bytes
from ..core.did import derive_did
from ..core.errors import (
    InvalidFormatError,
    ExpiredError,
    InvalidSignatureError,
    ReplayError,
    ClockSkewError,
    InvalidDIDError,
)
from ..core.types import VerifiedEnvelope
from ..crypto.ed25519 import verify_ed25519
from .policies import ServerPolicy
from .replay import ReplayStore

def parse_token(token: str) -> EnvelopeV1:
    """Parse an OESP token into an EnvelopeV1 object."""
    if not token.startswith("OESP1."):
        raise InvalidFormatError("Invalid token prefix")
    
    try:
        payload_b64 = token[len("OESP1."):]
        payload_json = b64url_decode(payload_b64).decode("utf-8")
        data = json.loads(payload_json)
        return EnvelopeV1.from_dict(data)
    except Exception as e:
        raise InvalidFormatError(f"Failed to parse token: {e}")

def verify_envelope(
    env: EnvelopeV1,
    *,
    now: Optional[int] = None,
    policy: ServerPolicy = ServerPolicy(),
    replay_store: Optional[ReplayStore] = None
) -> VerifiedEnvelope:
    """Verify an EnvelopeV1 against a policy and replay store."""
    if now is None:
        now = int(time.time())

    # 1. Structure/Type validation (already done by EnvelopeV1.from_dict mostly)
    if policy.enforce_typ and env.typ != policy.enforce_typ:
        raise InvalidFormatError(f"Unexpected envelope type: {env.typ}")

    # 2. Expiration and Clock Skew
    if not policy.allow_expired and env.exp < now:
        raise ExpiredError(f"Token expired at {env.exp}, now {now}")
    
    if abs(env.ts - now) > policy.max_clock_skew_sec:
        raise ClockSkewError(f"Timestamp {env.ts} too far from now {now}")

    # 3. DID/PubKey match
    pub_bytes = b64url_decode(env.sender.pub)
    derived = derive_did(pub_bytes)
    if derived != env.sender.did:
        raise InvalidDIDError(f"DID {env.sender.did} does not match pubkey")

    # 4. Signature verification
    # data_to_sign = canonical(envelope sans "sig") + ct
    env_dict = env.to_dict()
    ct_bytes = b64url_decode(env.ct)
    sig_bytes = b64url_decode(env.sig)
    
    # We need the canonical bytes of the envelope WITHOUT the signature
    to_sign_base = canonical_json_bytes(env_dict, exclude_keys=["sig"])
    data_to_sign = to_sign_base + ct_bytes
    
    if not verify_ed25519(pub_bytes, data_to_sign, sig_bytes):
        raise InvalidSignatureError()

    # 5. Anti-replay
    if replay_store is not None:
        if replay_store.seen(env.mid, env.sender.did):
            raise ReplayError(f"Duplicate message ID {env.mid} for DID {env.sender.did}")
        replay_store.mark_seen(env.mid, env.sender.did)

    return {
        "envelope": env.to_dict(),
        "verified": True,
        "signer_did": env.sender.did
    }

def verify_token(
    token: str,
    *,
    now: Optional[int] = None,
    policy: ServerPolicy = ServerPolicy(),
    replay_store: Optional[ReplayStore] = None
) -> VerifiedEnvelope:
    """High-level function to parse and verify a token."""
    env = parse_token(token)
    return verify_envelope(env, now=now, policy=policy, replay_store=replay_store)
