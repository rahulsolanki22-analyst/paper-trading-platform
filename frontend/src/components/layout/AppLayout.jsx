import React, { useEffect } from "react";
import AppNavbar from "@/components/layout/AppNavbar";
import { applyThemeToDocument } from "@/store/themeStore";

export default function AppLayout({ children }) {
  // Force homepage-style light theme for all app pages
  useEffect(() => {
    applyThemeToDocument("light");
  }, []);

  return (
    <div
      className="flex min-h-svh flex-col bg-white text-black"
      style={{ fontFamily: "'Inter', sans-serif" }}
    >
      {/* Top Navbar */}
      <AppNavbar />

      {/* Main Content Area */}
      <main className="flex-1 w-full max-w-[1600px] mx-auto bg-white p-4 md:p-6 overflow-x-hidden">
        {children}
      </main>
    </div>
  );
}
