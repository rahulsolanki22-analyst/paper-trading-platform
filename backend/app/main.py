from fastapi import FastAPI, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
from starlette.exceptions import HTTPException as StarletteHTTPException
from dotenv import load_dotenv
import logging
from app.database import Base, engine
from app.routes import (
    market, portfolio, trading, indicators, signals,
    backtest, dataset, ml_signal, search, news,
    valuation, reset, stocks, auth,
    analytics, watchlist, alerts, ai_features
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
    bot_config as bot_model
)

load_dotenv()

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)

Base.metadata.create_all(bind=engine)

app = FastAPI(title="AI Paper Trading Backend")

# CORS configuration - must be added before routes
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all origins for development
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["*"],
)

# Global exception handlers to ensure CORS headers are always present
@app.exception_handler(StarletteHTTPException)
async def http_exception_handler(request: Request, exc: StarletteHTTPException):
    return JSONResponse(
        status_code=exc.status_code,
        content={"detail": exc.detail},
        headers={
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Credentials": "true",
        }
    )

@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    return JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        content={"detail": exc.errors()},
        headers={
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Credentials": "true",
        }
    )

@app.exception_handler(Exception)
async def general_exception_handler(request: Request, exc: Exception):
    logging.error(f"Unhandled exception: {str(exc)}", exc_info=True)
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={"detail": "Internal server error"},
        headers={
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Credentials": "true",
        }
    )

app.include_router(auth.router, prefix="/auth", tags=["authentication"])
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
@app.get("/")
def root():
    return {"status": "Backend running"}
