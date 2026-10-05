from fastapi import Request
from slowapi import Limiter
from slowapi.util import get_remote_address
from api.config import settings


def client_ip(request: Request) -> str:
    """
    Identify the visitor behind the hosting proxy.
    Vercel/Render forward the original address as the leftmost X-Forwarded-For entry;
    without that header (local runs) fall back to the socket address.
    """
    forwarded = request.headers.get("x-forwarded-for", "")
    first = forwarded.split(",")[0].strip()
    return first or get_remote_address(request)


# Global rate limiter instance keyed by client IP address
limiter = Limiter(
    key_func=client_ip,
    storage_uri=settings.RATE_LIMIT_STORAGE_URL,
    default_limits=["120/minute"]
)
