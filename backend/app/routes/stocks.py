from fastapi import APIRouter
import yfinance as yf

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
