from app.services.market_data import get_live_price as _get_live_price

def get_live_price(symbol: str) -> float:
    """Get live price using robust market data service."""
    return _get_live_price(symbol)
