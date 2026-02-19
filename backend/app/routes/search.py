import requests
from fastapi import APIRouter, Query, HTTPException
import time
import logging

logger = logging.getLogger(__name__)
router = APIRouter()

HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    "Accept": "application/json",
    "Accept-Language": "en-US,en;q=0.9",
    "Referer": "https://finance.yahoo.com/",
}

@router.get("/search")
def search_stock(query: str = Query(..., min_length=1)):
    """
    Search for stocks with retries and fallback endpoints.
    """
    max_retries = 3
    retry_delay = 1.0
    
    for attempt in range(max_retries):
        try:
            # Try multiple Yahoo Finance endpoints
            urls = [
                f"https://query2.finance.yahoo.com/v1/finance/search?q={query}&quotesCount=10&newsCount=0",
                f"https://query1.finance.yahoo.com/v1/finance/search?q={query}&quotesCount=10&newsCount=0",
            ]
            
            for url in urls:
                try:
                    r = requests.get(url, headers=HEADERS, timeout=15)
                    
                    if r.status_code == 200 and r.text:
                        try:
                            data = r.json()
                            results = []
                            
                            for q in data.get("quotes", []):
                                symbol = q.get("symbol")
                                name = q.get("shortname") or q.get("longname")
                                exchange = q.get("exchange")

                                if symbol and name:
                                    results.append({
                                        "symbol": symbol,
                                        "name": name,
                                        "exchange": exchange
                                    })
                            
                            if results:
                                return results
                        except ValueError:
                            # Not JSON, try next URL
                            continue
                            
                except requests.exceptions.RequestException as e:
                    logger.warning(f"Request failed for {url}: {str(e)}")
                    continue
            
            # If all URLs failed, wait and retry
            if attempt < max_retries - 1:
                time.sleep(retry_delay * (attempt + 1))
                
        except Exception as e:
            logger.error(f"Error searching for {query} (attempt {attempt + 1}): {str(e)}")
            if attempt < max_retries - 1:
                time.sleep(retry_delay * (attempt + 1))
    
    # Return empty list instead of raising exception
    logger.warning(f"Failed to search for {query} after {max_retries} attempts")
    return []
