import json
from typing import AsyncIterator, Dict, Any

async def parse_jsonl_stream(chunks: AsyncIterator[bytes]) -> AsyncIterator[Dict[str, Any]]:
    """Parses a stream of bytes as JSON Lines."""
    buffer = b""
    async for chunk in chunks:
        buffer += chunk
        while b"\n" in buffer:
            line, buffer = buffer.split(b"\n", 1)
            line = line.strip()
            if line:
                yield json.loads(line)
    
    # Final line if not ending with \n
    buffer = buffer.strip()
    if buffer:
        yield json.loads(buffer)
