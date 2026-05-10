import { useState } from "react";
import { X, LayoutGrid, History, Star, Settings2, TrendingUp, Activity, Menu } from "lucide-react";
import { cn } from "@/lib/utils";

const sidebarItems = [
  {
    id: "overview",
    label: "Overview",
    icon: LayoutGrid,
    description: "Portfolio performance"
  },
  {
    id: "history", 
    label: "Trading history",
    icon: History,
    description: "Past transactions"
  },
  {
    id: "watchlist",
    label: "Watchlist", 
    icon: Star,
    description: "Saved stocks"
  },
  {
    id: "analytics",
    label: "Analytics",
    icon: TrendingUp,
    description: "Trading insights"
  },
  {
    id: "activity",
    label: "Activity",
    icon: Activity,
    description: "Recent actions"
  },
  {
    id: "settings",
    label: "Settings",
    icon: Settings2,
    description: "Account settings"
  }
];

export function MobileSidebar({ activeTab, onTabChange, isOpen, onClose }) {
  return (
    <>
      {/* Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 lg:hidden"
          onClick={onClose}
        />
      )}
      
      {/* Sidebar */}
      <div className={cn(
        "fixed top-0 left-0 z-50 w-72 h-screen bg-zinc-950/95 backdrop-blur-xl border-r border-white/10 transform transition-transform duration-300 ease-in-out lg:hidden",
        isOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="flex h-screen flex-col">
          {/* Header */}
          <div className="p-6 border-b border-white/10 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-white">Dashboard</h2>
              <p className="text-xs text-muted-foreground mt-1">Trading Analytics</p>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-white/10 transition-colors"
            >
              <X className="w-4 h-4 text-muted-foreground" />
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
            {sidebarItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    onTabChange(item.id);
                    onClose();
                  }}
                  className={cn(
                    "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all duration-200",
                    "hover:bg-white/5 hover:text-white",
                    isActive 
                      ? "bg-primary/10 text-primary border border-primary/20" 
                      : "text-muted-foreground border border-transparent"
                  )}
                >
                  <div className={cn(
                    "flex items-center justify-center w-8 h-8 rounded-lg transition-all",
                    isActive ? "bg-primary/20" : "bg-white/5"
                  )}>
                    <Icon className={cn(
                      "w-4 h-4",
                      isActive ? "text-primary" : "text-muted-foreground"
                    )} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium">{item.label}</div>
                    <div className="text-xs text-muted-foreground/70 truncate">
                      {item.description}
                    </div>
                  </div>
                </button>
              );
            })}
          </nav>

          {/* Footer */}
          <div className="p-4 border-t border-white/10">
            <div className="px-3 py-2 rounded-lg bg-white/5 border border-white/10">
              <div className="text-xs text-muted-foreground">Account Type</div>
              <div className="text-sm font-medium text-white">Paper Trading</div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

export function MobileMenuButton({ onClick }) {
  return (
    <button
      onClick={onClick}
      className="lg:hidden fixed top-4 left-4 z-30 p-2 rounded-xl bg-zinc-950/80 backdrop-blur-xl border border-white/10 hover:bg-white/10 transition-colors"
    >
      <Menu className="w-5 h-5 text-white" />
    </button>
  );
}
