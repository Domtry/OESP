from typing import Protocol, Optional

class Resolver(Protocol):
    def resolve_did(self, did: str) -> bytes:
        ...

class Storage(Protocol):
    def has_mid(self, mid: str) -> bool:
        ...
    def store_mid(self, mid: str) -> None:
        ...

class Transport(Protocol):
    def send(self, data: bytes) -> None:
        ...
    def receive(self) -> bytes:
        ...
