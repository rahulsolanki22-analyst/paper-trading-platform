import { useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";

import useAuthStore from "@/store/authStore";
import { addToWatchlist, removeFromWatchlist } from "@/api/watchlistApi";
import {
  fetchProfileCore,
  fetchProfileExtras,
  fetchWatchlistMerged,
} from "@/features/profile/api/fetchProfileData";
import { EditProfileSheet } from "@/features/profile/components/EditProfileSheet";
import { DashboardLayout } from "@/features/profile/components/DashboardLayout";

import { ErrorState } from "@/features/profile/components/ErrorState";

export default function Profile() {
  const [searchParams] = useSearchParams();
  const authUser = useAuthStore((s) => s.user);
  const [loadingCore, setLoadingCore] = useState(true);
  const [error, setError] = useState(null);
  const [payload, setPayload] = useState(null);
  const [editOpen, setEditOpen] = useState(false);
  const [watchlist, setWatchlist] = useState([]);
  const [toast, setToast] = useState(null);

  const mergedUser = useMemo(() => {
    const base = payload?.user;
    if (!base) {
      return {
        id: "me",
        username: authUser?.username || "Trader",
        email: "",
        accountType: "Free",
        avatarUrl: null,
        initials: (authUser?.username || "PT").slice(0, 2).toUpperCase(),
      };
    }
    return {
      ...base,
      username: authUser?.username ?? base.username,
    };
  }, [payload, authUser]);

  const fetchData = useCallback(async () => {
    setLoadingCore(true);
    setError(null);
    const simulateError = searchParams.get("error") === "1";
    try {
      if (simulateError) {
        throw new Error("Unable to reach profile service. Check your connection.");
      }
      // Stage 1: core data (fast)
      const core = await fetchProfileCore();
      setPayload(core);
      setWatchlist(core.watchlist || []);

      // Stage 2: slow extras (do not block shell render)
      fetchProfileExtras()
        .then((extras) => {
          setPayload((p) => (p ? { ...p, ...extras } : { ...core, ...extras }));
          if (extras?.watchlist) setWatchlist(extras.watchlist);
        })
        .catch(() => {
          // Keep shell usable even if slow widgets fail
        });
    } catch (err) {
      setError(err?.message || "Failed to load profile");
    } finally {
      setLoadingCore(false);
    }
  }, [searchParams]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleEditSave = (next) => {
    setPayload((p) => (p ? { ...p, user: { ...p.user, ...next } } : p));
    setToast("Profile updated locally");
    setTimeout(() => setToast(null), 3200);
  };

  const handleSettingsSave = (form) => {
    setPayload((p) =>
      p ? { ...p, user: { ...p.user, username: form.username, email: form.email } } : p
    );
    setToast("Settings saved locally");
    setTimeout(() => setToast(null), 3200);
  };

  const handleWatchlistRemove = async (symbol) => {
    try {
      await removeFromWatchlist(symbol);
      setWatchlist(await fetchWatchlistMerged());
      setToast(`${symbol} removed`);
      setTimeout(() => setToast(null), 2400);
    } catch (e) {
      setToast(e?.response?.data?.detail || "Could not remove");
      setTimeout(() => setToast(null), 3200);
    }
  };

  const handleWatchlistAdd = async (row) => {
    try {
      await addToWatchlist(row.symbol);
      setWatchlist(await fetchWatchlistMerged());
      setToast(`${row.symbol} added to watchlist`);
      setTimeout(() => setToast(null), 2400);
    } catch (e) {
      const msg = e?.response?.data?.detail || "Could not add";
      setToast(msg);
      setTimeout(() => setToast(null), 3200);
    }
  };

  return (
    <>
      {toast ? (
        <div className="fixed bottom-6 left-1/2 z-[100] -translate-x-1/2 rounded-2xl border border-white/15 bg-zinc-950/90 px-5 py-3 text-sm font-medium shadow-2xl backdrop-blur-xl">
          {toast}
        </div>
      ) : null}

      {loadingCore ? (
        <div className="flex h-screen">
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-sm text-muted-foreground">Loading dashboard...</p>
            </div>
          </div>
        </div>
      ) : error ? (
        <div className="flex h-screen">
          <div className="flex-1 flex items-center justify-center p-6">
            <ErrorState message={error} onRetry={fetchData} />
          </div>
        </div>
      ) : (
        <DashboardLayout
          stats={payload.stats}
          dailyPnl={payload.dailyPnl}
          dailyPnlPercent={payload.dailyPnlPercent}
          portfolioSeries={payload.portfolioSeries}
          recentTrades={payload.recentTrades}
          tradingHistory={payload.tradingHistory}
          watchlist={watchlist}
          onWatchlistRemove={handleWatchlistRemove}
          onWatchlistAdd={handleWatchlistAdd}
          settingsUser={{ username: mergedUser.username, email: mergedUser.email }}
          onSettingsSave={handleSettingsSave}
        />
      )}

      <EditProfileSheet
        open={editOpen}
        onOpenChange={setEditOpen}
        user={mergedUser}
        onSave={handleEditSave}
      />
    </>
  );
}
