import React, { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  BarChart3,
  Table2,
  House,
  LogOut,
  LogIn,
  Menu,
  X,
  BookOpen,
} from "lucide-react";

import useAuthStore from "@/store/authStore";

const nav = [
  { to: "/trade", label: "Trading", icon: LayoutDashboard },
  { to: "/analytics", label: "Analytics", icon: BarChart3 },
  { to: "/stocks", label: "Markets", icon: Table2 },
  { to: "/markets-hub", label: "Markets Hub", icon: Table2 },
  { to: "/diary", label: "Trading Diary", icon: BookOpen },
  { to: "/", label: "Home", icon: House },
];

function navActive(pathname, to) {
  if (to === "/") return pathname === "/";
  return pathname === to;
}

export default function AppNavbar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout, isAuthenticated } = useAuthStore();
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleLogout = () => {
    logout();
    setMobileOpen(false);
    navigate("/login");
  };

  const closeMobileMenu = () => {
    setMobileOpen(false);
  };

  return (
    <>
      <header className="sticky top-0 z-40 flex h-16 w-full items-center justify-between border-b border-gray-200 bg-white/80 px-4 backdrop-blur-xl shadow-[0_4px_20px_rgb(0,0,0,0.03)] md:px-6 transition-all duration-300">
        {/* Left: Logo */}
        <div className="flex items-center gap-6">
          <Link
            to="/"
            className="flex items-center gap-2.5 transition-opacity hover:opacity-80"
          >
            <BarChart3 className="h-5 w-5 fill-black text-black" />
            <div className="flex flex-col leading-tight">
              <span className="text-lg font-semibold tracking-tight text-black">
                StellerTrade
              </span>
              <span className="text-[11px] text-gray-400">Paper trading</span>
            </div>
          </Link>

          {/* Desktop Nav Links */}
          <nav className="hidden items-center gap-1 md:flex ml-4">
            {nav.map(({ to, label }) => {
              const active = navActive(location.pathname, to);
              return (
                <Link
                  key={to}
                  to={to}
                  className={`rounded-full px-4 py-2 text-sm font-medium transition-all ${
                    active
                      ? "bg-black text-white shadow-sm"
                      : "text-gray-500 hover:bg-gray-100 hover:text-black"
                  }`}
                >
                  {label}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Right: Controls & Profile (Desktop) */}
        <div className="hidden items-center gap-4 md:flex">
          {isAuthenticated && user ? (
            <div className="flex items-center gap-3 border-l border-gray-200 pl-4">
              <Link
                to="/profile"
                className="flex items-center gap-2 rounded-full border border-gray-200 bg-gray-50 px-3 py-1.5 hover:bg-gray-100 transition-colors cursor-pointer"
              >
                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-black text-xs font-bold text-white">
                  {user.username?.charAt(0)?.toUpperCase() || "U"}
                </div>
                <span className="text-sm font-medium text-black max-w-[100px] truncate">
                  {user.username}
                </span>
              </Link>
              <button
                type="button"
                onClick={handleLogout}
                className="flex h-9 w-9 items-center justify-center rounded-full text-gray-400 transition-colors hover:bg-red-50 hover:text-red-600"
                title="Log out"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </div>
          ) : (
            <div className="border-l border-gray-200 pl-4">
              <button
                type="button"
                onClick={() => navigate("/login")}
                className="flex items-center justify-center gap-2 rounded-full bg-black px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-gray-800"
              >
                <LogIn className="h-4 w-4" />
                Sign in
              </button>
            </div>
          )}
        </div>

        {/* Mobile Menu Button */}
        <button
          type="button"
          aria-label="Open menu"
          onClick={() => setMobileOpen(true)}
          className="flex h-9 w-9 items-center justify-center rounded-xl border border-gray-200 text-gray-600 transition-colors hover:bg-gray-50 hover:text-black md:hidden"
        >
          <Menu className="h-4 w-4" />
        </button>
      </header>

      {/* Mobile Sidebar Overlay */}
      {mobileOpen && (
        <>
          <div
            className="fixed inset-0 z-50 bg-black/20 backdrop-blur-sm md:hidden"
            onClick={closeMobileMenu}
          />
          <div
            className="fixed inset-y-0 left-0 z-50 w-72 border-r border-gray-200 bg-white shadow-2xl md:hidden animate-fade-in-up"
            style={{ animationDuration: "0.25s" }}
          >
            <div className="flex items-center justify-end p-3 border-b border-gray-100">
              <button
                type="button"
                onClick={closeMobileMenu}
                className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 hover:text-black"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            
            <div className="flex flex-col gap-4 p-4 h-[calc(100%-60px)] overflow-y-auto">
              {/* Mobile Navigation */}
              <nav className="flex flex-col gap-1">
                {nav.map(({ to, label, icon: Icon }) => {
                  const active = navActive(location.pathname, to);
                  return (
                    <Link
                      key={to}
                      to={to}
                      onClick={closeMobileMenu}
                      className={`flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-medium transition-all ${
                        active
                          ? "bg-black text-white shadow-sm"
                          : "text-gray-500 hover:bg-gray-100 hover:text-black"
                      }`}
                    >
                      <Icon className="h-4 w-4 shrink-0" />
                      {label}
                    </Link>
                  );
                })}
              </nav>

              {/* Bottom Section */}
              <div className="mt-auto space-y-3 border-t border-gray-200 pt-4">
                {isAuthenticated && user ? (
                  <div className="rounded-xl border border-gray-200 bg-gray-50 p-3">
                    <div className="flex items-center justify-between">
                      <Link
                        to="/profile"
                        onClick={closeMobileMenu}
                        className="flex items-center gap-2 hover:opacity-80 transition-opacity cursor-pointer"
                      >
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-black text-xs font-bold text-white">
                          {user.username?.charAt(0)?.toUpperCase() || "U"}
                        </div>
                        <span className="text-sm font-medium text-black truncate max-w-[100px]">
                          {user.username}
                        </span>
                      </Link>
                      <button
                        type="button"
                        onClick={handleLogout}
                        className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 transition-colors hover:bg-red-50 hover:text-red-600"
                        title="Log out"
                      >
                        <LogOut className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      closeMobileMenu();
                      navigate("/login");
                    }}
                    className="flex w-full items-center justify-center gap-2 rounded-full bg-black px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-gray-800"
                  >
                    <LogIn className="h-4 w-4" />
                    Sign in
                  </button>
                )}
              </div>
            </div>
          </div>
        </>
      )}
    </>
  );
}
