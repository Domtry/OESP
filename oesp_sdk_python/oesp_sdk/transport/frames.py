from typing import Literal, TypedDict, Union, Optional, List, Dict, Any

OESP_BLE_SERVICE_UUID = "e95f1234-5678-4321-8765-abcdef012345"
OESP_BLE_CHAR_RX_UUID = "e95f1235-5678-4321-8765-abcdef012345"  # Central -> Peripheral (Write)
OESP_BLE_CHAR_TX_UUID = "e95f1236-5678-4321-8765-abcdef012345"  # Peripheral -> Central (Notify)
OESP_BLE_CHAR_META_UUID = "e95f1237-5678-4321-8765-abcdef012345"  # Meta (Read)

FrameType = Literal["HELLO", "START", "CHUNK", "END", "ACK", "NACK"]

class BaseFrame(TypedDict):
    t: FrameType
    sid: str

class HelloFrame(BaseFrame):
    ver: int
    did: str
    caps: Dict[str, Any]

class StartFrame(BaseFrame):
    mid: str
    totalLen: int
    parts: int
    sha256: str

class ChunkFrame(BaseFrame):
    seq: int
    data: str  # Base64

class EndFrame(BaseFrame):
    pass

class AckFrame(BaseFrame):
    ack: int

class NackFrame(BaseFrame):
    at: int
    reason: Literal["BAD_HASH", "TIMEOUT", "BAD_SEQ", "UNKNOWN"]

OESPBleFrame = Union[HelloFrame, StartFrame, ChunkFrame, EndFrame, AckFrame, NackFrame]
