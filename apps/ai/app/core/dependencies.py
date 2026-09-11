from app.core.config import settings
import httpx
import asyncpg
import redis.asyncio as aioredis

_pool: asyncpg.Pool | None = None
_redis: aioredis.Redis | None = None

async def get_db() -> asyncpg.Pool:
    global _pool
    if _pool is None:
        _pool = await asyncpg.create_pool(
            settings.DATABASE_URL,
            min_size=2,
            max_size=10,
            command_timeout=30,
        )
    return _pool

async def get_redis() -> aioredis.Redis:
    global _redis
    if _redis is None:
        _redis = aioredis.from_url(
            settings.REDIS_URL,
            decode_responses=True,
        )
    return _redis

async def get_http_client():
    async with httpx.AsyncClient(timeout=60.0) as client:
        yield client

async def close_connections():
    global _pool, _redis
    if _pool:
        await _pool.close()
        _pool = None
    if _redis:
        await _redis.close()
        _redis = None
