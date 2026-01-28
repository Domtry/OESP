import json
import time
import os
from typing import Optional, Mapping, Any, Union
from ..core.envelope import EnvelopeV1
from ..core.b64url import encode as b64url_encode, decode as b64url_decode
from ..core.canonical import canonical_json_bytes
from ..core.did import derive_did
from ..core.types import DecodedMessage, VerifiedEnvelope
from ..core.errors import (
    ResolveFailedError,
    DecryptionFailedError,
    InvalidDIDError,
    InvalidSignatureError,
    ExpiredError,
    ReplayError,
)
from ..crypto.ed25519 import sign_ed25519, verify_ed25519
from ..crypto.x25519 import seal_session_key_x25519, open_sealed_session_key_x25519
from ..crypto.aead import aead_encrypt, aead_decrypt
from ..crypto.rng import RNG, default_rng
from .keystore import Keystore
from .adapters import Storage, Resolver

class OESPClient:
    def __init__(
        self, 
        keystore: Keystore, 
        storage: Optional[Storage] = None, 
        resolver: Optional[Resolver] = None,
        rng: Optional[RNG] = None
    ):
        self.keystore = keystore
        self.storage = storage
        self.resolver = resolver
        self.rng = rng or default_rng

    def get_did(self) -> str:
        """Return sender DID derived from Ed25519 public key."""
        ed_pub = self.keystore.get_ed25519_public()
        return derive_did(ed_pub)

    def _normalize_body(self, body: Union[bytes, Mapping[str, Any]]) -> bytes:
        if isinstance(body, (bytes, bytearray)):
            return bytes(body)
        return json.dumps(body, separators=(",", ":"), ensure_ascii=False).encode("utf-8")

    def pack(
        self, 
        to_did: str, 
        body: Union[bytes, Mapping[str, Any]], 
        ttl_sec: int = 600,
        typ: str = "oesp.envelope"
    ) -> str:
        """Pack and sign a token for recipient DID."""
        if self.resolver is None:
            raise ResolveFailedError("Resolver required for packing")

        now = int(time.time())
        exp = now + ttl_sec
        mid = b64url_encode(self.rng.read(12))
        sid = self.get_did()
        ed_pub = self.keystore.get_ed25519_public()
        
        try:
            to_x_pub = self.resolver.resolve_did(to_did)
        except Exception as e:
            raise ResolveFailedError(f"Failed to resolve DID {to_did}: {e}")

        session_key = self.rng.read(32)
        ek_bytes = seal_session_key_x25519(to_x_pub, session_key)
        
        # Initial env to compute AAD
        env_dict: Mapping[str, Any] = {
            "v": 1,
            "typ": typ,
            "mid": mid,
            "sid": sid,
            "ts": now,
            "exp": exp,
            "from": {"did": sid, "pub": b64url_encode(ed_pub)},
            "to": {"did": to_did},
            "enc": "CHACHA20-POLY1305",
            "kex": "X25519",
            "ek": b64url_encode(ek_bytes),
            "iv": "", # Will be filled
            "ct": "", # Will be filled
            "sig_alg": "Ed25519",
            "sig": "",
        }

        # AAD = canonical(envelope headers sans ct/sig/iv)
        aad = canonical_json_bytes(env_dict, ["ct", "sig", "iv"])
        iv, ct = aead_encrypt(session_key, self._normalize_body(body), aad=aad, rng=self.rng)
        
        # Update env with encrypted data
        env_dict = dict(env_dict)
        env_dict["iv"] = b64url_encode(iv)
        env_dict["ct"] = b64url_encode(ct)
        
        # Sign
        # data_to_sign = canonical(envelope sans "sig") + ct
        to_sign_base = canonical_json_bytes(env_dict, ["sig"])
        data_to_sign = to_sign_base + ct
        sig = self.keystore.sign(data_to_sign)
        env_dict["sig"] = b64url_encode(sig)
        
        token_payload = canonical_json_bytes(env_dict)
        return f"OESP1.{b64url_encode(token_payload)}"

    def unpack(self, token: str) -> DecodedMessage:
        """Verify and decrypt token, returning decoded message."""
        # Note: In a dual-use SDK, unpack uses core/server logic for verification
        from ..server.verifier import parse_token, verify_envelope
        
        env = parse_token(token)
        now = int(time.time())
        
        # Verify envelope (basic server-side logic)
        verify_envelope(env, now=now)
        
        # Anti-replay (client-side specific check)
        if self.storage is not None:
            if self.storage.has_mid(env.mid):
                raise ReplayError(f"Duplicate message ID {env.mid}")

        # Decrypt
        try:
            iv_bytes = b64url_decode(env.iv)
            ct_bytes = b64url_decode(env.ct)
            ek_bytes = b64url_decode(env.ek)
            
            session_key = open_sealed_session_key_x25519(
                self.keystore.get_x25519_private(), 
                ek_bytes
            )
            
            # AAD = canonical(envelope headers sans ct/sig/iv)
            aad = canonical_json_bytes(env.to_dict(), ["ct", "sig", "iv"])
            plaintext = aead_decrypt(session_key, iv_bytes, ct_bytes, aad)
        except Exception as e:
            raise DecryptionFailedError(f"Failed to decrypt message: {e}")

        # Store mid if successful
        if self.storage is not None:
            self.storage.store_mid(env.mid)

        return {
            "mid": env.mid,
            "sid": env.sid,
            "ts": env.ts,
            "exp": env.exp,
            "from_did": env.sender.did,
            "to_did": env.recipient.did,
            "plaintext": plaintext,
        }
