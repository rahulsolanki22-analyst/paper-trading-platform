from fastapi import APIRouter, Query
import yfinance as yf
import requests
import logging

logger = logging.getLogger(__name__)

router = APIRouter()

POPULAR_STOCKS = [
    "AAPL", "MSFT", "GOOGL", "AMZN", "META",
    "TSLA", "NFLX", "NVDA",
    "RELIANCE.NS", "TCS.NS", "INFY.NS",
    "HDFCBANK.NS", "ICICIBANK.NS"
]

@router.get("/stocks")
def get_stocks():
    result = []

    for symbol in POPULAR_STOCKS:
        try:
            stock = yf.Ticker(symbol)
            info = stock.info

            price = info.get("regularMarketPrice")
            prev = info.get("regularMarketPreviousClose")

            if price and prev:
                change_pct = round(((price - prev) / prev) * 100, 2)
            else:
                change_pct = 0

            result.append({
                "symbol": symbol,
                "name": info.get("shortName"),
                "price": price,
                "change_pct": change_pct
            })
        except:
            continue

    return result


@router.get("/stocks/{symbol}/details")
def get_stock_details(symbol: str):
    try:
        stock = yf.Ticker(symbol)
        info = stock.info
        
        # Basic price information
        price = info.get("regularMarketPrice")
        prev_close = info.get("regularMarketPreviousClose")
        
        if price and prev_close:
            change = price - prev_close
            change_pct = round((change / prev_close) * 100, 2)
        else:
            change = 0
            change_pct = 0
        
        # Company details
        details = {
            "symbol": symbol.upper(),
            "name": info.get("shortName", "N/A"),
            "description": info.get("longBusinessSummary", "No description available"),
            "sector": info.get("sector", "N/A"),
            "industry": info.get("industry", "N/A"),
            "market_cap": info.get("marketCap"),
            "enterprise_value": info.get("enterpriseValue"),
            "trailing_pe": info.get("trailingPE"),
            "forward_pe": info.get("forwardPE"),
            "price_to_book": info.get("priceToBook"),
            "price_to_sales": info.get("priceToSalesTrailing12Months"),
            "dividend_yield": info.get("dividendYield"),
            "beta": info.get("beta"),
            "volume": info.get("regularMarketVolume"),
            "avg_volume": info.get("averageDailyVolume3Month"),
            "day_high": info.get("regularMarketDayHigh"),
            "day_low": info.get("regularMarketDayLow"),
            "week_52_high": info.get("fiftyTwoWeekHigh"),
            "week_52_low": info.get("fiftyTwoWeekLow"),
            "current_price": price,
            "change": change,
            "change_pct": change_pct,
            "previous_close": prev_close,
            "open": info.get("regularMarketOpen"),
            "employees": info.get("fullTimeEmployees"),
            "website": info.get("website"),
            "currency": info.get("currency", "USD"),
            "exchange": info.get("exchange", "N/A")
        }
        
        return details
        
    except Exception as e:
        return {"error": f"Failed to fetch details for {symbol}: {str(e)}"}


# Dedicated search endpoint for Markets page (symbols + suggestions)
HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    "Accept": "application/json",
    "Accept-Language": "en-US,en;q=0.9",
    "Referer": "https://finance.yahoo.com/",
}


@router.get("/stocks/search")
def stocks_search(q: str = Query(..., min_length=1)):
    """
    Search stock symbols dynamically (Yahoo Finance search).
    Returns a list of suggestions: {symbol, name, exchange}.
    """
    query = q.strip()
    if not query:
        return []

    urls = [
        f"https://query2.finance.yahoo.com/v1/finance/search?q={query}&quotesCount=10&newsCount=0",
        f"https://query1.finance.yahoo.com/v1/finance/search?q={query}&quotesCount=10&newsCount=0",
    ]

    for url in urls:
        try:
            r = requests.get(url, headers=HEADERS, timeout=10)
            if r.status_code != 200:
                continue
            data = r.json()
            results = []
            for item in data.get("quotes", []):
                symbol = item.get("symbol")
                name = item.get("shortname") or item.get("longname")
                exchange = item.get("exchange")
                if symbol and name:
                    results.append({"symbol": symbol, "name": name, "exchange": exchange})
            return results
        except Exception as e:
            logger.warning("stocks_search failed for %s: %s", url, str(e))
            continue

    return []
