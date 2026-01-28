from typing import Callable, Any, Mapping
from ..core.envelope import EnvelopeV1

OnValidHook = Callable[[EnvelopeV1], None]
OnInvalidHook = Callable[[Mapping[str, Any], Exception], None]
