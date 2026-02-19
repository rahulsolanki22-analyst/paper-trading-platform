import requests
from fastapi import APIRouter, Query, HTTPException
import time
import logging
from vaderSentiment.vaderSentiment import SentimentIntensityAnalyzer

logger = logging.getLogger(__name__)
router = APIRouter()

analyzer = SentimentIntensityAnalyzer()

HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    "Accept": "application/json",
    "Accept-Language": "en-US,en;q=0.9",
    "Referer": "https://finance.yahoo.com/",
}

@router.get("/news")
def stock_news(symbol: str = Query(..., min_length=1)):
    """
    Get stock news with retries and better error handling.
    """
    max_retries = 3
    retry_delay = 1.0
    
    for attempt in range(max_retries):
        try:
            # Try multiple Yahoo Finance endpoints
            urls = [
                f"https://query2.finance.yahoo.com/v1/finance/search?q={symbol}&newsCount=10&quotesCount=0",
                f"https://query1.finance.yahoo.com/v1/finance/search?q={symbol}&newsCount=10&quotesCount=0",
            ]
            
            for url in urls:
                try:
                    r = requests.get(url, headers=HEADERS, timeout=15)
                    
                    if r.status_code == 200 and r.text:
                        try:
                            data = r.json()
                            news = []
                            
                            for n in data.get("news", []):
                                news.append({
                                    "title": n.get("title", "No title"),
                                    "publisher": n.get("publisher", "Unknown"),
                                    "link": n.get("link", ""),
                                    "time": n.get("providerPublishTime")
                                })
                            
                            if news:
                                return news
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
            logger.error(f"Error fetching news for {symbol} (attempt {attempt + 1}): {str(e)}")
            if attempt < max_retries - 1:
                time.sleep(retry_delay * (attempt + 1))
    
    # Return empty list instead of raising exception
    logger.warning(f"Failed to fetch news for {symbol} after {max_retries} attempts")
    return []

@router.get("/news/sentiment")
def stock_news_sentiment(symbol: str = Query(..., min_length=1)):
    """
    Get stock news with sentiment scores.
    """
    news = stock_news(symbol)
    
    if not news:
        return {"sentiment_score": 0, "sentiment_label": "Neutral", "articles": []}
    
    total_score = 0
    scored_articles = []
    
    for article in news:
        scores = analyzer.polarity_scores(article["title"])
        compound = scores["compound"]
        article["sentiment"] = compound
        scored_articles.append(article)
        total_score += compound
        
    avg_score = total_score / len(news)
    
    # Determine label
    if avg_score >= 0.05:
        label = "Bullish"
    elif avg_score <= -0.05:
        label = "Bearish"
    else:
        label = "Neutral"
        
    return {
        "symbol": symbol,
        "sentiment_score": round(avg_score, 4),
        "sentiment_label": label,
        "articles": scored_articles
    }
