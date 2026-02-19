import React, { useEffect, useState } from "react";
import { fetchNewsWithSentiment } from "../../api/newsApi";

const timeAgo = (unix) => {
  const diff = Math.floor(Date.now() / 1000 - unix);
  const days = Math.floor(diff / 86400);
  if (days > 0) return `${days} days ago`;
  const hours = Math.floor(diff / 3600);
  if (hours > 0) return `${hours} hours ago`;
  return "Just now";
};

const SentimentBadge = ({ score, label, compact = false }) => {
  const getColors = () => {
    if (label === "Bullish") return "bg-emerald-500/10 text-emerald-400 border-emerald-500/20";
    if (label === "Bearish") return "bg-rose-500/10 text-rose-400 border-rose-500/20";
    return "bg-slate-500/10 text-slate-400 border-slate-500/20";
  };

  if (compact) {
    const dotColor = label === "Bullish" ? "bg-emerald-400" : label === "Bearish" ? "bg-rose-400" : "bg-slate-400";
    return (
      <div className={`flex items-center gap-1.5 px-2 py-0.5 rounded-full border text-[10px] font-medium ${getColors()}`}>
        <div className={`w-1.5 h-1.5 rounded-full ${dotColor}`} />
        {score !== undefined ? score.toFixed(2) : label}
      </div>
    );
  }

  return (
    <div className={`px-3 py-1 rounded-full border text-sm font-semibold flex items-center gap-2 ${getColors()}`}>
      <span>{label}</span>
      <span className="opacity-50 text-xs">Score: {score.toFixed(4)}</span>
    </div>
  );
};

const StockNews = ({ symbol }) => {
  const [data, setData] = useState({ articles: [], sentiment_score: 0, sentiment_label: "Neutral" });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    fetchNewsWithSentiment(symbol)
      .then((res) => {
        setData(res);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Error fetching news:", err);
        setError("Unable to load news. Please try again later.");
        setLoading(false);
      });
  }, [symbol]);

  const { articles, sentiment_score, sentiment_label } = data;

  return (
    <div className="mt-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-xl font-bold text-white mb-1">Market Sentiment</h2>
          <p className="text-slate-400 text-sm">AI-powered news analysis for {symbol}</p>
        </div>

        {!loading && !error && articles.length > 0 && (
          <SentimentBadge score={sentiment_score} label={sentiment_label} />
        )}

        {loading && (
          <span className="text-slate-500 text-sm animate-pulse">Analyzing news...</span>
        )}
      </div>

      {error && (
        <div className="bg-rose-900/10 border border-rose-500/20 rounded-xl p-4 mb-6">
          <p className="text-rose-400 text-sm flex items-center gap-2">
            <span className="material-icons text-base">error_outline</span>
            {error}
          </p>
        </div>
      )}

      {loading && !error && (
        <div className="flex flex-col items-center justify-center py-12 bg-slate-900/50 rounded-2xl border border-slate-800 border-dashed">
          <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mb-4" />
          <p className="text-slate-400 text-sm">Processing headlines...</p>
        </div>
      )}

      {!loading && !error && articles.length === 0 && (
        <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-12 text-center">
          <div className="text-slate-500 mb-4">
            <span className="material-icons text-5xl">newspaper</span>
          </div>
          <h3 className="text-white font-medium mb-1">No News Found</h3>
          <p className="text-slate-500 text-sm max-w-xs mx-auto">
            We couldn't find any recent news for {symbol}. Try checking again later.
          </p>
        </div>
      )}

      {!loading && articles.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-4">
          {articles.map((n, i) => (
            <a
              key={i}
              href={n.link}
              target="_blank"
              rel="noreferrer"
              className="group bg-slate-900/40 border border-slate-800/50 rounded-xl p-5 hover:bg-slate-800/60 transition-all duration-300 hover:border-slate-700 hover:translate-y-[-2px] flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">
                    {n.publisher || "Market"}
                  </div>
                  <SentimentBadge
                    score={n.sentiment}
                    label={n.sentiment > 0.05 ? "Bullish" : n.sentiment < -0.05 ? "Bearish" : "Neutral"}
                    compact
                  />
                </div>

                <h4 className="text-slate-200 text-[14px] leading-relaxed font-semibold group-hover:text-white transition-colors">
                  {n.title}
                </h4>
              </div>

              <div className="mt-4 text-[11px] text-slate-500 flex items-center gap-1.5">
                <span className="material-icons text-xs">history</span>
                {n.time ? timeAgo(n.time) : "Recent"}
              </div>
            </a>
          ))}
        </div>
      )}
    </div>
  );
};

export default StockNews;
