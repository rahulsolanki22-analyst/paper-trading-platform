import { create } from 'zustand';
import { persist } from 'zustand/middleware';

const useTradingStore = create(
  persist(
    (set) => ({
      // Selected symbol (persisted)
      symbol: 'AAPL',
      setSymbol: (symbol) => set({ symbol }),

      // Trading mode: 'VIEWER' | 'PAPER'
      tradingMode: 'VIEWER',
      setTradingMode: (mode) => set({ tradingMode: mode }),

      // Chart timeframe
      timeframe: '1d',
      setTimeframe: (timeframe) => set({ timeframe }),

      // Active indicators
      indicators: {
        sma: false,
        ema: false,
        rsi: false,
        macd: false,
        vwap: false,
      },
      toggleIndicator: (indicator) =>
        set((state) => ({
          indicators: {
            ...state.indicators,
            [indicator]: !state.indicators[indicator],
          },
        })),
    }),
    {
      name: 'trading-store', // localStorage key
      partialize: (state) => ({
        symbol: state.symbol,
        tradingMode: state.tradingMode,
        timeframe: state.timeframe,
      }), // Only persist these fields
    }
  )
);

export default useTradingStore;

