import { useState } from "react";
import { X, LayoutGrid, Settings2, Menu } from "lucide-react";
import { cn } from "@/lib/utils";

const sidebarItems = [
  {
    id: "overview",
    label: "Overview",
    icon: LayoutGrid,
    description: "Portfolio performance"
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
          className="fixed inset-0 bg-black/30 backdrop-blur-sm z-40 lg:hidden"
          onClick={onClose}
        />
      )}
      
      {/* Sidebar */}
      <div className={cn(
        "fixed top-0 left-0 z-50 w-72 h-screen bg-white/95 backdrop-blur-xl border-r border-gray-200 transform transition-transform duration-300 ease-in-out lg:hidden",
        isOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="flex h-screen flex-col">
          {/* Header */}
          <div className="p-6 border-b border-gray-100 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-zinc-900">Dashboard</h2>
              <p className="text-xs text-zinc-500 mt-1">Trading Analytics</p>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <X className="w-4 h-4 text-zinc-550" />
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
                    isActive 
                      ? "bg-black text-white shadow-sm" 
                      : "text-zinc-600 hover:bg-gray-50 hover:text-zinc-900"
                  )}
                >
                  <div className={cn(
                    "flex items-center justify-center w-8 h-8 rounded-lg transition-all",
                    isActive ? "bg-white/15" : "bg-gray-100"
                  )}>
                    <Icon className={cn(
                      "w-4 h-4",
                      isActive ? "text-white" : "text-zinc-500"
                    )} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className={cn("text-sm font-medium", isActive ? "text-white" : "text-zinc-800")}>{item.label}</div>
                    <div className={cn("text-xs truncate", isActive ? "text-white/70" : "text-zinc-550")}>
                      {item.description}
                    </div>
                  </div>
                </button>
              );
            })}
          </nav>

          {/* Footer */}
          <div className="p-4 border-t border-gray-100">
            <div className="px-3 py-2 rounded-lg bg-gray-50 border border-gray-100">
              <div className="text-xs text-zinc-500">Account Type</div>
              <div className="text-sm font-medium text-zinc-850">Paper Trading</div>
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
      className="lg:hidden fixed top-20 left-4 z-30 p-2.5 rounded-xl bg-white/80 backdrop-blur-xl border border-gray-200 hover:bg-gray-50 transition-colors shadow-sm"
    >
      <Menu className="w-5 h-5 text-zinc-700" />
    </button>
  );
}
