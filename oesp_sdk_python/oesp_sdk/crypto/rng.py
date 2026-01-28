import os
from typing import Protocol

class RNG(Protocol):
    def read(self, n: int) -> bytes:
        ...

class OSRNG:
    def read(self, n: int) -> bytes:
        return os.urandom(n)

class DeterministicRNG:
    def __init__(self, seed: bytes):
        self._seed = seed
        self._pos = 0

    def read(self, n: int) -> bytes:
        out = bytearray()
        for _ in range(n):
            out.append(self._seed[self._pos % len(self._seed)])
            self._pos += 1
        return bytes(out)

# Default global RNG
default_rng = OSRNG()
