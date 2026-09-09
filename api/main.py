import time
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded

from api.config import settings
from api.auth.limiter import limiter
from api.routers import (
    health_router,
    auth_router,
    works_router,
    cost_router,
    duplicate_router,
    fund_router,
    delay_router,
    summary_router,
    trend_router
)

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description=settings.DESCRIPTION,
    openapi_url=f"{settings.API_V1_STR}/openapi.json",
    docs_url=f"{settings.API_V1_STR}/docs",
    redoc_url=f"{settings.API_V1_STR}/redoc"
)

# Attach slowapi rate limiter
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)


# CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Request Timing & Diagnostic Middleware
@app.middleware("http")
async def add_process_time_header(request: Request, call_next):
    start_time = time.time()
    response = await call_next(request)
    process_time = (time.time() - start_time) * 1000.0
    response.headers["X-Process-Time-Ms"] = f"{process_time:.2f}"
    return response

# Register API v1 Routers
app.include_router(health_router, prefix=settings.API_V1_STR)
app.include_router(auth_router, prefix=settings.API_V1_STR)
app.include_router(works_router, prefix=settings.API_V1_STR)
app.include_router(cost_router, prefix=settings.API_V1_STR)
app.include_router(duplicate_router, prefix=settings.API_V1_STR)
app.include_router(fund_router, prefix=settings.API_V1_STR)
app.include_router(delay_router, prefix=settings.API_V1_STR)
app.include_router(summary_router, prefix=settings.API_V1_STR)
app.include_router(trend_router, prefix=settings.API_V1_STR)

@app.get("/", tags=["Root"])
def root():
    return {
        "platform": settings.PROJECT_NAME,
        "version": settings.VERSION,
        "docs_url": f"{settings.API_V1_STR}/docs",
        "health_check": f"{settings.API_V1_STR}/health"
    }
