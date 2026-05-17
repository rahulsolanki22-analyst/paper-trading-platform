import { create } from "zustand";

const useMarketsHubStore = create((set, get) => ({
  connection: {
    status: "disconnected", // disconnected | connecting | connected | error
    lastError: null,
    lastMessageAt: null,
  },

  indices: [],
  trending: [],
  topGainers: [],
  topLosers: [],
  news: [],
  featured: null,



  setConnectionStatus: (status, lastError = null) =>
    set((s) => ({
      connection: {
        ...s.connection,
        status,
        lastError,
      },
    })),

  setLastMessageAt: () =>
    set((s) => ({
      connection: {
        ...s.connection,
        lastMessageAt: Date.now(),
      },
    })),

  setTickerIndices: (indices) => set({ indices: Array.isArray(indices) ? indices : [] }),
  setTrending: (trending) => set({ trending: Array.isArray(trending) ? trending : [] }),
  setTopGainers: (topGainers) => set({ topGainers: Array.isArray(topGainers) ? topGainers : [] }),
  setTopLosers: (topLosers) => set({ topLosers: Array.isArray(topLosers) ? topLosers : [] }),
  setNews: (news) => set({ news: Array.isArray(news) ? news : [] }),
  setFeatured: (featured) => set({ featured: featured || null }),

  // For fetching fallback HTTP data
  hydrateFromHttp: ({ indices, trending, topGainers, topLosers, news }) =>
    set((s) => ({
      indices: Array.isArray(indices) ? indices : s.indices,
      trending: Array.isArray(trending) ? trending : s.trending,
      topGainers: Array.isArray(topGainers) ? topGainers : s.topGainers,
      topLosers: Array.isArray(topLosers) ? topLosers : s.topLosers,
      news: Array.isArray(news) ? news : s.news,
    })),

  reset: () =>
    set({

      connection: {
        status: "disconnected",
        lastError: null,
        lastMessageAt: null,
      },
      indices: [],
      trending: [],
      topGainers: [],
      topLosers: [],
      news: [],
      featured: null,
    }),
}));

export default useMarketsHubStore;

