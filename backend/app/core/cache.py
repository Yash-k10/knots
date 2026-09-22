import asyncio
import time
from typing import Any, Callable, TypeVar

T = TypeVar("T")


class InMemoryTTLCache:
    """
    High-performance in-memory TTL cache with sub-millisecond retrieval.
    Ideal for reducing remote database round-trips for frequently requested,
    slowly changing resources (user auth info, feeds, directory lists).
    """

    def __init__(self, default_ttl_seconds: float = 30.0):
        self._cache: dict[str, tuple[Any, float]] = {}
        self._default_ttl = default_ttl_seconds
        self._lock = asyncio.Lock()

    def get(self, key: str) -> Any | None:
        """Retrieve an item if it exists and has not expired."""
        entry = self._cache.get(key)
        if entry is None:
            return None
        value, expiry = entry
        if time.monotonic() > expiry:
            self._cache.pop(key, None)
            return None
        return value

    def set(self, key: str, value: Any, ttl_seconds: float | None = None) -> None:
        """Set an item with a TTL in seconds."""
        ttl = ttl_seconds if ttl_seconds is not None else self._default_ttl
        expiry = time.monotonic() + ttl
        self._cache[key] = (value, expiry)

    def delete(self, key: str) -> None:
        """Explicitly remove an item by key."""
        self._cache.pop(key, None)

    def clear_prefix(self, prefix: str) -> None:
        """Invalidate all cache keys starting with the given prefix."""
        to_remove = [k for k in self._cache.keys() if k.startswith(prefix)]
        for k in to_remove:
            self._cache.pop(k, None)

    def clear(self) -> None:
        """Wipe entire cache."""
        self._cache.clear()

    async def get_or_set(
        self, key: str, factory: Callable[[], Any], ttl_seconds: float | None = None
    ) -> Any:
        """Retrieve from cache or compute via async factory and store."""
        val = self.get(key)
        if val is not None:
            return val

        async with self._lock:
            # Re-check under lock in case another coroutine populated it
            val = self.get(key)
            if val is not None:
                return val

            if asyncio.iscoroutinefunction(factory):
                val = await factory()
            else:
                val = factory()

            if val is not None:
                self.set(key, val, ttl_seconds)
            return val


# Global cache singletons
user_cache = InMemoryTTLCache(default_ttl_seconds=60.0)  # User identity & role
feed_cache = InMemoryTTLCache(default_ttl_seconds=15.0)  # Post feed & comments
dept_cache = InMemoryTTLCache(default_ttl_seconds=30.0)  # Department students/stats
clubs_cache = InMemoryTTLCache(default_ttl_seconds=30.0)  # Clubs & candidates
events_cache = InMemoryTTLCache(default_ttl_seconds=30.0)  # Events & calendars
