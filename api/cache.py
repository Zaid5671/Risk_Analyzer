"""
Process-wide memoisation for expensive, read-only aggregations.

All analytical tables are written once by the offline pipelines and never change while
the API runs, so results can be kept for the lifetime of the process. Restarting the
API (e.g. after re-ingesting data) clears everything.
"""
import threading
from typing import Any, Callable, Dict, Hashable

_store: Dict[Hashable, Any] = {}
_lock = threading.Lock()
_key_locks: Dict[Hashable, threading.Lock] = {}


def get_or_compute(key: Hashable, compute: Callable[[], Any]) -> Any:
    """Returns the cached value for `key`, computing it once (per key) if absent."""
    if key in _store:
        return _store[key]
    with _lock:
        key_lock = _key_locks.setdefault(key, threading.Lock())
    # Only one thread computes a given key; concurrent callers wait for it.
    with key_lock:
        if key not in _store:
            _store[key] = compute()
        return _store[key]


def clear() -> None:
    with _lock:
        _store.clear()
        _key_locks.clear()
