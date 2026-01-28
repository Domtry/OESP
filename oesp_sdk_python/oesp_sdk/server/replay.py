import sqlite3
from typing import Protocol, Set

class ReplayStore(Protocol):
    def seen(self, mid: str, from_did: str) -> bool:
        ...
    def mark_seen(self, mid: str, from_did: str) -> None:
        ...

class InMemoryReplayStore:
    def __init__(self):
        self._seen: Set[str] = set()

    def seen(self, mid: str, from_did: str) -> bool:
        return f"{from_did}:{mid}" in self._seen

    def mark_seen(self, mid: str, from_did: str) -> None:
        self._seen.add(f"{from_did}:{mid}")

class SqlReplayStore:
    def __init__(self, db_path: str):
        self._db_path = db_path
        self._init_db()

    def _init_db(self):
        with sqlite3.connect(self._db_path) as conn:
            conn.execute(
                "CREATE TABLE IF NOT EXISTS replay_store (from_did TEXT, mid TEXT, PRIMARY KEY(from_did, mid))"
            )

    def seen(self, mid: str, from_did: str) -> bool:
        with sqlite3.connect(self._db_path) as conn:
            cur = conn.execute(
                "SELECT 1 FROM replay_store WHERE from_did = ? AND mid = ?", (from_did, mid)
            )
            return cur.fetchone() is not None

    def mark_seen(self, mid: str, from_did: str) -> None:
        with sqlite3.connect(self._db_path) as conn:
            conn.execute(
                "INSERT OR IGNORE INTO replay_store (from_did, mid) VALUES (?, ?)", (from_did, mid)
            )
