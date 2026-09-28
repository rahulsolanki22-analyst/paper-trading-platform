import os
from dotenv import load_dotenv

# Load .env BEFORE any app imports so DATABASE_URL, JWT_SECRET, etc. are available
load_dotenv()

from fastapi import FastAPI, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
from starlette.exceptions import HTTPException as StarletteHTTPException
import logging
from fastapi.staticfiles import StaticFiles
from app.database import Base, engine
from app.routes import (
    market, portfolio, trading, indicators, signals,
    backtest, dataset, ml_signal, search, news,
    valuation, reset, stocks, auth, markets,
    analytics, watchlist, alerts, ai_features, markets_hub,
    diary
)


# Import models to ensure tables are created (import without name conflict)
from app.models import (
    user as user_model,
    portfolio as portfolio_model,
    trade as trade_model,
    order as order_model,
    portfolio_snapshot as snapshot_model,
    watchlist as watchlist_model,
    pending_order as pending_order_model,
    bot_config as bot_model,
    markets_stock as markets_stock_model,
    diary as diary_model
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)

Base.metadata.create_all(bind=engine)

# Auto-seed demo account for instant out-of-the-box paper trading
from app.database import SessionLocal
from app.utils.auth import get_password_hash

def _seed_demo_account():
    try:
        db = SessionLocal()
        demo = db.query(user_model.User).filter(user_model.User.email == "demo@example.com").first()
        if not demo:
            demo = user_model.User(
                username="demo",
                email="demo@example.com",
                hashed_password=get_password_hash("demo123"),
                full_name="Demo Trader"
            )
            db.add(demo)
            db.commit()
            db.refresh(demo)
            
            p = portfolio_model.Portfolio(user_id=demo.id, balance=100000.0)
            db.add(p)
            db.commit()
            logging.info("Default demo account (demo@example.com) seeded successfully.")
            
        rahul = db.query(user_model.User).filter(user_model.User.email == "rahul@gmail.com").first()
        if rahul:
            order_exists = db.query(order_model.OrderHistory).filter(order_model.OrderHistory.user_id == rahul.id).first()
            if not order_exists:
                from app.services.demo_seeder import seed_demo_data_for_user
                seed_demo_data_for_user(db, "rahul@gmail.com")
                logging.info("Rahul account (rahul@gmail.com) demo data seeded successfully.")
        db.close()
    except Exception as e:
        logging.warning(f"Demo seeding skipped: {e}")

_seed_demo_account()

app = FastAPI(title="AI Paper Trading Backend")

# CORS configuration - read allowed origins from env or dynamically match requesting origins
_cors_raw = os.getenv("CORS_ORIGINS", "")
_configured_origins = [o.strip() for o in _cors_raw.split(",") if o.strip() and o.strip() != "*"]

app.add_middleware(
    CORSMiddleware,
    allow_origins=_configured_origins if _configured_origins else ["*"],
    allow_origin_regex=r"https?://.*",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["*"],
)

def _get_cors_headers(request: Request):
    origin = request.headers.get("origin") or "*"
    return {
        "Access-Control-Allow-Origin": origin,
        "Access-Control-Allow-Credentials": "true",
        "Access-Control-Allow-Methods": "*",
        "Access-Control-Allow-Headers": "*",
    }

# Lightweight In-Memory Rate Limiter Middleware
import time
from collections import defaultdict

_rate_limits = defaultdict(list)
_MAX_REQUESTS_PER_MINUTE = 200

@app.middleware("http")
async def rate_limit_middleware(request: Request, call_next):
    # Allow docs, openapi, health, and static files without restriction
    path = request.url.path
    if path.startswith(("/docs", "/openapi.json", "/health", "/uploads")):
        return await call_next(request)

    client_ip = request.client.host if request.client else "unknown"
    now = time.time()
    
    # Filter timestamps older than 60s
    recent_requests = [t for t in _rate_limits[client_ip] if now - t < 60]
    
    if len(recent_requests) >= _MAX_REQUESTS_PER_MINUTE:
        headers = _get_cors_headers(request)
        headers["Retry-After"] = "60"
        return JSONResponse(
            status_code=429,
            content={"detail": "Too many requests. Please slow down."},
            headers=headers
        )
    
    recent_requests.append(now)
    _rate_limits[client_ip] = recent_requests
    return await call_next(request)


# Global exception handlers to ensure CORS headers are always present
@app.exception_handler(StarletteHTTPException)
async def http_exception_handler(request: Request, exc: StarletteHTTPException):
    return JSONResponse(
        status_code=exc.status_code,
        content={"detail": exc.detail},
        headers=_get_cors_headers(request)
    )

@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    return JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        content={"detail": exc.errors()},
        headers=_get_cors_headers(request)
    )

@app.exception_handler(Exception)
async def general_exception_handler(request: Request, exc: Exception):
    logging.error(f"Unhandled exception: {str(exc)}", exc_info=True)
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={"detail": "Internal server error"},
        headers=_get_cors_headers(request)
    )

app.include_router(auth.router, prefix="/auth", tags=["authentication"])
app.include_router(markets.router, prefix="/markets", tags=["markets"])
app.include_router(market.router, prefix="/market")
app.include_router(portfolio.router, prefix="/portfolio")
app.include_router(trading.router, prefix="/trade")
app.include_router(indicators.router, prefix="/indicators")
app.include_router(signals.router, prefix="/signals")
app.include_router(backtest.router, prefix="/backtest")
app.include_router(dataset.router, prefix="/dataset")
app.include_router(ml_signal.router, prefix="/ml-signal")
app.include_router(search.router)
app.include_router(news.router)
app.include_router(valuation.router)
app.include_router(reset.router)
app.include_router(stocks.router)
app.include_router(analytics.router, prefix="/analytics", tags=["analytics"])
app.include_router(watchlist.router, prefix="/watchlist", tags=["watchlist"])
app.include_router(alerts.router, prefix="/alerts", tags=["alerts"])
app.include_router(ai_features.router, prefix="/ai", tags=["ai"])
app.include_router(diary.router, prefix="/diary", tags=["diary"])

# Markets Hub (HTTP routes + WebSocket)
app.include_router(markets_hub.router, prefix="/api/markets", tags=["markets-hub"])

# Mount static files for diary uploads
import os
uploads_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "../data/uploads"))
app.mount("/uploads", StaticFiles(directory=uploads_dir), name="uploads")

@app.get("/")
def root():
    return {"status": "Backend running"}

@app.get("/health")
def health_check():
    """Health check endpoint — verifies database connectivity."""
    from app.database import SessionLocal
    from sqlalchemy import text
    try:
        db = SessionLocal()
        db.execute(text("SELECT 1"))
        db.close()
        return {"status": "healthy", "database": "connected"}
    except Exception as e:
        return JSONResponse(
            status_code=503,
            content={"status": "unhealthy", "database": str(e)}
        )
