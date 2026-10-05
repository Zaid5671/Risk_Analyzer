import logging
import time

from database.connection import get_session

log = logging.getLogger("api.warmup")


def warm_caches() -> None:
    """Builds the slow, static caches once at startup. Failures are logged, never fatal."""
    from api.enrichment import cost_peer_stats
    from api.duplicate_groups import get_index
    from api.routers.trends import get_warnings_df

    start = time.time()
    try:
        cost_peer_stats()
        get_warnings_df()
        db = get_session()
        try:
            get_index(db)
        finally:
            db.close()
        log.warning("Cache warm-up finished in %.1fs", time.time() - start)
    except Exception:
        log.exception("Cache warm-up failed; caches will build on first request instead")
