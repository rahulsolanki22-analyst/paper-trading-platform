"""Redis-backed caching for Markets Hub.

Production notes:
- Uses simple JSON serialization.
- TTLs are controlled by callers.
- Falls back to in-memory behavior if Redis is not configured.
"""

from __future__ import annotations

import json
import os
import time
import logging
from typing import Any, Optional

try:
    import redis  # type: ignore
except Exception:  # pragma: no cover
    redis = None

logger = logging.getLogger(__name__)


_redis_client = None


def _get_redis_client():
    global _redis_client
    if _redis_client is not None:
        return _redis_client

    redis_url = os.getenv("REDIS_URL")
    if not redis_url or redis is None:
        _redis_client = None
        return None

    try:
        _redis_client = redis.Redis.from_url(redis_url, decode_responses=True)
        # ping to validate
        _redis_client.ping()
        return _redis_client
    except Exception as e:  # pragma: no cover
        logger.warning("Redis unavailable, using in-memory fallback: %s", str(e))
        _redis_client = None
        return None


# In-memory fallback
_memory_store: dict[str, tuple[float, str]] = {}


def _memory_get(key: str) -> Optional[str]:
    now = time.time()
    item = _memory_store.get(key)
    if not item:
        return None
    expires_at, value = item
    if now >= expires_at:
        _memory_store.pop(key, None)
        return None
    return value


def _memory_set(key: str, value: str, ttl_seconds: int) -> None:
    expires_at = time.time() + max(1, int(ttl_seconds))
    _memory_store[key] = (expires_at, value)


def set_json(key: str, value: Any, ttl_seconds: int) -> None:
    """Set JSON-serializable value with TTL."""
    payload = json.dumps(value, default=str)
    client = _get_redis_client()
    if client:
        try:
            client.setex(key, int(ttl_seconds), payload)
            return
        except Exception as e:  # pragma: no cover
            logger.warning("Redis set failed, falling back to memory: %s", str(e))

    _memory_set(key, payload, ttl_seconds)


def get_json(key: str) -> Optional[Any]:
    """Get JSON value by key."""
    client = _get_redis_client()
    raw: Optional[str] = None
    if client:
        try:
            raw = client.get(key)
        except Exception as e:  # pragma: no cover
            logger.warning("Redis get failed, falling back to memory: %s", str(e))
            raw = _memory_get(key)
    else:
        raw = _memory_get(key)

    if raw is None:
        return None

    try:
        return json.loads(raw)
    except Exception:
        return None

