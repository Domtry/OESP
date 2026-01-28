from dataclasses import dataclass

@dataclass(frozen=True)
class ServerPolicy:
    allow_expired: bool = True
    max_clock_skew_sec: int = 300
    require_known_device: bool = False
    enforce_typ: str = "oesp.envelope"
