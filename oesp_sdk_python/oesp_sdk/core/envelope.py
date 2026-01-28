from dataclasses import dataclass, field
from typing import Optional, Mapping, Any, Literal
from .errors import InvalidFormatError

@dataclass(frozen=True)
class From:
    did: str
    pub: str

    @classmethod
    def from_dict(cls, d: Mapping[str, Any]) -> "From":
        try:
            return cls(did=d["did"], pub=d["pub"])
        except KeyError as e:
            raise InvalidFormatError(f"Missing field in 'from': {e}")

@dataclass(frozen=True)
class To:
    did: str

    @classmethod
    def from_dict(cls, d: Mapping[str, Any]) -> "To":
        try:
            return cls(did=d["did"])
        except KeyError as e:
            raise InvalidFormatError(f"Missing field in 'to': {e}")

@dataclass(frozen=True)
class EnvelopeV1:
    v: Literal[1]
    typ: str
    mid: str
    sid: str
    ts: int
    exp: int
    sender: From
    recipient: To
    enc: str
    kex: str
    ek: str
    iv: str
    ct: str
    sig_alg: str
    sig: str
    tag: Optional[str] = None

    @classmethod
    def from_dict(cls, d: Mapping[str, Any]) -> "EnvelopeV1":
        try:
            return cls(
                v=d["v"],
                typ=d["typ"],
                mid=d["mid"],
                sid=d["sid"],
                ts=d["ts"],
                exp=d["exp"],
                sender=From.from_dict(d["from"]),
                recipient=To.from_dict(d["to"]),
                enc=d["enc"],
                kex=d["kex"],
                ek=d["ek"],
                iv=d["iv"],
                ct=d["ct"],
                sig_alg=d["sig_alg"],
                sig=d["sig"],
                tag=d.get("tag")
            )
        except (KeyError, TypeError) as e:
            raise InvalidFormatError(f"Invalid envelope structure: {e}")

    def to_dict(self) -> Mapping[str, Any]:
        d = {
            "v": self.v,
            "typ": self.typ,
            "mid": self.mid,
            "sid": self.sid,
            "ts": self.ts,
            "exp": self.exp,
            "from": {"did": self.sender.did, "pub": self.sender.pub},
            "to": {"did": self.recipient.did},
            "enc": self.enc,
            "kex": self.kex,
            "ek": self.ek,
            "iv": self.iv,
            "ct": self.ct,
            "sig_alg": self.sig_alg,
            "sig": self.sig
        }
        if self.tag is not None:
            d["tag"] = self.tag
        return d
