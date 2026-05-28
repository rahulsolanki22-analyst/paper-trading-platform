import React, { useEffect, useState } from "react";
import { BookOpen } from "lucide-react";
import useLanguageStore from "@/store/languageStore";
import { getDiaryTrades, getDiaryAnalytics } from "@/api/diaryApi";
import TradeAnalytics from "@/features/diary/components/TradeAnalytics";
import TradeTable from "@/features/diary/components/TradeTable";
import TradeDetailModal from "@/features/diary/components/TradeDetailModal";

export default function TradingDiary() {
  const { translate } = useLanguageStore();
  const [trades, setTrades] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedTrade, setSelectedTrade] = useState(null);

  const loadData = async () => {
    try {
      setLoading(true);
      const [fetchedTrades, fetchedAnalytics] = await Promise.all([
        getDiaryTrades(),
        getDiaryAnalytics()
      ]);
      setTrades(fetchedTrades);
      setAnalytics(fetchedAnalytics);
    } catch (error) {
      console.error("Failed to load diary:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  if (loading) {
    return (
      <div className="flex h-[40vh] items-center justify-center text-sm text-gray-500">
        Loading diary...
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-[1600px] space-y-6">
      {/* Page Header */}
      <div className="animate-fade-in-up">
        <div className="flex items-center gap-3 mb-6">
          <div className="flex h-10 w-10 items-center justify-center rounded-[12px] bg-black">
            <BookOpen className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-semibold tracking-tight text-black">
              Trading Diary
            </h1>
            <p className="text-sm text-gray-500">
              Journal your trades, track your psychology, and review your performance.
            </p>
          </div>
        </div>
      </div>

      <TradeAnalytics data={analytics} />

      <TradeTable trades={trades} onRowClick={(trade) => setSelectedTrade(trade)} />
      
      {selectedTrade && (
        <TradeDetailModal 
          trade={selectedTrade} 
          onClose={() => setSelectedTrade(null)} 
          onSave={(updatedTrade) => {
            setTrades(trades.map(t => t.id === updatedTrade.id ? updatedTrade : t));
            loadData(); // refresh analytics
          }} 
        />
      )}
    </div>
  );
}
