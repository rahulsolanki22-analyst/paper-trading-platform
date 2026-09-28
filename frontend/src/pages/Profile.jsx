import { useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";

import useAuthStore from "@/store/authStore";
import { updateProfile } from "@/api/authApi";
import { fetchProfileCore } from "@/features/profile/api/fetchProfileData";
import { DashboardLayout } from "@/features/profile/components/DashboardLayout";

import { ErrorState } from "@/features/profile/components/ErrorState";

export default function Profile() {
  const [searchParams] = useSearchParams();
  const { user: authUser, token, setAuth } = useAuthStore();
  const [loadingCore, setLoadingCore] = useState(true);
  const [error, setError] = useState(null);
  const [payload, setPayload] = useState(null);
  const [toast, setToast] = useState(null);

  const mergedUser = useMemo(() => {
    const base = payload?.user;
    if (!base) {
      return {
        id: "me",
        username: authUser?.username || "Trader",
        email: authUser?.email || "",
        full_name: authUser?.full_name || "",
        bio: authUser?.bio || "",
        accountType: authUser?.account_type || "Paper Trading",
        avatarUrl: null,
        initials: (authUser?.username || "ST").slice(0, 2).toUpperCase(),
      };
    }
    return {
      ...base,
      username: authUser?.username ?? base.username,
      email: authUser?.email ?? base.email,
      full_name: authUser?.full_name ?? base.full_name,
      bio: authUser?.bio ?? base.bio,
      fullName: authUser?.full_name ?? base.full_name,
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
      const core = await fetchProfileCore();
      setPayload(core);
    } catch (err) {
      setError(err?.message || "Failed to load profile");
    } finally {
      setLoadingCore(false);
    }
  }, [searchParams]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleProfileUpdate = async (nextData) => {
    try {
      const updatedUser = await updateProfile(nextData);
      
      // Update payload
      setPayload((p) => (p ? { ...p, user: { ...p.user, ...updatedUser } } : p));
      
      // Update Zustand store so navbar displays updated name/email
      setAuth(token, updatedUser);
      
      setToast("Profile saved successfully");
      setTimeout(() => setToast(null), 3200);
    } catch (e) {
      const errorMsg = e?.response?.data?.detail || "Failed to update profile";
      setToast(errorMsg);
      setTimeout(() => setToast(null), 4000);
    }
  };

  const handleSettingsSave = (form) => {
    handleProfileUpdate(form);
  };

  return (
    <>
      {toast ? (
        <div className="fixed bottom-6 left-1/2 z-[100] -translate-x-1/2 rounded-2xl border border-white/15 bg-zinc-950/90 px-5 py-3 text-sm font-medium shadow-2xl backdrop-blur-xl text-white">
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
          user={mergedUser}
          settingsUser={{
            username: mergedUser.username,
            email: mergedUser.email,
            fullName: mergedUser.fullName || mergedUser.full_name,
            bio: mergedUser.bio,
          }}
          onSettingsSave={handleSettingsSave}
        />
      )}
    </>
  );
}
