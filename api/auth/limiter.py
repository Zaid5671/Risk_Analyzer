from slowapi import Limiter
from slowapi.util import get_remote_address
from api.config import settings

# Global rate limiter instance keyed by client IP address
limiter = Limiter(
    key_func=get_remote_address,
    storage_uri=settings.RATE_LIMIT_STORAGE_URL,
    default_limits=["120/minute"]
)
