import React from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { format } from "date-fns";

export default function TradeTable({ trades, onRowClick }) {
  if (!trades || trades.length === 0) {
    return (
      <div className="p-8 text-center text-gray-500 rounded-[24px] border border-gray-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] bg-white mt-6">
        No trades recorded in your diary yet.
      </div>
    );
  }

  return (
    <div className="rounded-[24px] border border-gray-100 bg-white shadow-[0_8px_30px_rgb(0,0,0,0.04)] overflow-hidden mt-6 animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Symbol</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>Date</TableHead>
            <TableHead className="text-right">Buy</TableHead>
            <TableHead className="text-right">Sell</TableHead>
            <TableHead className="text-right">P&L</TableHead>
            <TableHead className="text-center">Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {trades.map((trade) => (
            <TableRow 
              key={trade.id} 
              className="cursor-pointer hover:bg-gray-50 transition-colors"
              onClick={() => onRowClick(trade)}
            >
              <TableCell className="font-semibold">{trade.symbol}</TableCell>
              <TableCell>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${trade.trade_type === 'BUY' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
                  {trade.trade_type}
                </span>
              </TableCell>
              <TableCell className="text-sm text-gray-500">
                {trade.buy_time ? format(new Date(trade.buy_time), "MMM d, HH:mm") : "-"}
              </TableCell>
              <TableCell className="text-right tabular-nums">
                {trade.buy_price ? `₹${trade.buy_price.toFixed(2)}` : "-"}
              </TableCell>
              <TableCell className="text-right tabular-nums">
                {trade.sell_price ? `₹${trade.sell_price.toFixed(2)}` : "-"}
              </TableCell>
              <TableCell className={`text-right font-medium tabular-nums ${trade.pnl > 0 ? 'text-emerald-600' : trade.pnl < 0 ? 'text-red-600' : 'text-gray-500'}`}>
                {trade.pnl ? `${trade.pnl > 0 ? '+' : ''}₹${trade.pnl.toFixed(2)}` : "-"}
              </TableCell>
              <TableCell className="text-center">
                <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${trade.status === 'CLOSED' ? 'bg-gray-100 text-gray-600' : 'bg-blue-100 text-blue-700'}`}>
                  {trade.status}
                </span>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
