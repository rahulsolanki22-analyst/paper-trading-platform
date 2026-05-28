import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, TrendingDown, Target, Brain, Clock } from "lucide-react";

export default function TradeAnalytics({ data }) {
  if (!data) return null;

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 animate-fade-in-up">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-xs font-medium uppercase tracking-wide text-gray-500">
            Win Rate
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2">
            <Target className="h-4 w-4 text-emerald-500" />
            <span className="text-2xl font-semibold">{data.win_rate}%</span>
          </div>
          <p className="text-xs text-gray-500 mt-1">{data.total_trades} total trades</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-xs font-medium uppercase tracking-wide text-gray-500">
            Average Profit / Loss
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <div>
              <div className="flex items-center gap-1.5 text-emerald-600">
                <TrendingUp className="h-4 w-4" />
                <span className="font-semibold text-lg">+₹{data.average_profit.toLocaleString()}</span>
              </div>
            </div>
            <div className="w-px h-8 bg-gray-200"></div>
            <div>
              <div className="flex items-center gap-1.5 text-red-600">
                <TrendingDown className="h-4 w-4" />
                <span className="font-semibold text-lg">₹{data.average_loss.toLocaleString()}</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-xs font-medium uppercase tracking-wide text-gray-500">
            Most Common Emotion
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2">
            <Brain className="h-4 w-4 text-purple-500" />
            <span className="text-lg font-semibold capitalize">
              {data.most_common_emotion || "None"}
            </span>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            {data.fomo_trade_count} FOMO trades recorded
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-xs font-medium uppercase tracking-wide text-gray-500">
            Avg Holding Time
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-blue-500" />
            <span className="text-lg font-semibold">
              {data.average_holding_time_mins > 60 
                ? `${(data.average_holding_time_mins / 60).toFixed(1)} hrs` 
                : `${Math.round(data.average_holding_time_mins)} mins`}
            </span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
