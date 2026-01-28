import json
from typing import Any, Iterable, Mapping

def canonical_json_bytes(obj: Mapping[str, Any], exclude_keys: Iterable[str] | None = None) -> bytes:
    """Serialize a JSON object into canonical UTF-8 bytes.
    
    Rules: sort keys, no spaces, compact separators, UTF-8.
    """
    exclude = set(exclude_keys or [])

    def remove(value: Any) -> Any:
        if isinstance(value, dict):
            return {k: remove(v) for k, v in value.items() if k not in exclude}
        if isinstance(value, list):
            return [remove(v) for v in value]
        return value

    filtered = remove(obj)
    s = json.dumps(filtered, separators=(",", ":"), sort_keys=True, ensure_ascii=False)
    return s.encode("utf-8")
