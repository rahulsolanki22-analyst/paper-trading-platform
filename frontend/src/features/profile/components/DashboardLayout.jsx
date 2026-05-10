import { useState } from "react";
import { cn } from "@/lib/utils";
import { glassCard } from "./glass";
import { DashboardSidebar } from "./DashboardSidebar";
import { MobileSidebar, MobileMenuButton } from "./MobileSidebar";
import { OverviewTab } from "./tabs/OverviewTab";
import { TradingHistoryTab } from "./tabs/TradingHistoryTab";
import { WatchlistTab } from "./tabs/WatchlistTab";
import { SettingsTab } from "./tabs/SettingsTab";

// Placeholder components for new sections
function AnalyticsTab() {
  return (
    <div className={cn(glassCard("p-6"))}>
      <h3 className="text-lg font-semibold mb-4">Trading Analytics</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="p-4 rounded-xl border border-white/10 bg-white/5">
          <h4 className="text-sm font-medium mb-2">Performance Metrics</h4>
          <p className="text-xs text-muted-foreground">Coming soon...</p>
        </div>
        <div className="p-4 rounded-xl border border-white/10 bg-white/5">
          <h4 className="text-sm font-medium mb-2">Risk Analysis</h4>
          <p className="text-xs text-muted-foreground">Coming soon...</p>
        </div>
      </div>
    </div>
  );
}

function ActivityTab() {
  return (
    <div className={cn(glassCard("p-6"))}>
      <h3 className="text-lg font-semibold mb-4">Recent Activity</h3>
      <div className="p-4 rounded-xl border border-white/10 bg-white/5">
        <p className="text-xs text-muted-foreground">No recent activity</p>
      </div>
    </div>
  );
}

// Right panel component
function RightPanel({ recentTrades, watchlist }) {
  return (
    <div className="hidden xl:block w-80 space-y-4">
      {/* Recent Trades */}
      <div className={cn(glassCard("p-4"))}>
        <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-emerald-400"></div>
          Recent Trades
        </h3>
        {recentTrades?.length > 0 ? (
          <div className="space-y-2">
            {recentTrades.slice(0, 5).map((trade) => (
              <div key={trade.id} className="p-2 rounded-lg border border-white/5 bg-white/5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono font-medium">{trade.symbol}</span>
                  <span className={cn(
                    "text-[10px] px-2 py-0.5 rounded font-semibold uppercase",
                    trade.side === "BUY" 
                      ? "bg-emerald-500/15 text-emerald-400" 
                      : "bg-red-500/15 text-red-400"
                  )}>
                    {trade.side}
                  </span>
                </div>
                {trade.pnl != null && (
                  <div className={cn(
                    "text-xs font-mono mt-1",
                    trade.pnl >= 0 ? "text-emerald-400" : "text-red-400"
                  )}>
                    {trade.pnl >= 0 ? "+" : ""}₹{Math.abs(trade.pnl).toLocaleString("en-IN")}
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="p-4 rounded-lg border border-dashed border-white/10 bg-white/5">
            <p className="text-xs text-muted-foreground text-center">
              No recent trades
            </p>
            <p className="text-xs text-muted-foreground/70 text-center mt-1">
              Execute trades to populate
            </p>
          </div>
        )}
      </div>

      {/* Watchlist Preview */}
      <div className={cn(glassCard("p-4"))}>
        <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-blue-400"></div>
          Watchlist
        </h3>
        {watchlist?.length > 0 ? (
          <div className="space-y-2">
            {watchlist.slice(0, 4).map((item) => (
              <div key={item.symbol} className="p-2 rounded-lg border border-white/5 bg-white/5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono font-medium">{item.symbol}</span>
                  <span className="text-xs text-muted-foreground">₹{item.price?.toFixed(2) || "0.00"}</span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-4 rounded-lg border border-dashed border-white/10 bg-white/5">
            <p className="text-xs text-muted-foreground text-center">
              No watchlist items
            </p>
          </div>
        )}
      </div>

      {/* Quick Stats */}
      <div className={cn(glassCard("p-4"))}>
        <h3 className="text-sm font-semibold mb-3">Quick Stats</h3>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">Today's Change</span>
            <span className="text-xs font-mono text-emerald-400">+2.4%</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">Win Rate</span>
            <span className="text-xs font-mono">68.5%</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">Active Positions</span>
            <span className="text-xs font-mono">3</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export function DashboardLayout({ 
  stats,
  dailyPnl,
  dailyPnlPercent,
  portfolioSeries, 
  recentTrades, 
  tradingHistory, 
  watchlist,
  onWatchlistRemove,
  onWatchlistAdd,
  settingsUser,
  onSettingsSave 
}) {
  const [activeTab, setActiveTab] = useState("overview");
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  const renderTabContent = () => {
    switch (activeTab) {
      case "overview":
        return (
          <OverviewTab
            stats={stats}
            dailyPnl={dailyPnl}
            dailyPnlPercent={dailyPnlPercent}
            portfolioSeries={portfolioSeries}
            recentTrades={recentTrades}
          />
        );
      case "history":
        return <TradingHistoryTab trades={tradingHistory} />;
      case "watchlist":
        return <WatchlistTab items={watchlist} onRemove={onWatchlistRemove} onAdd={onWatchlistAdd} />;
      case "analytics":
        return <AnalyticsTab />;
      case "activity":
        return <ActivityTab />;
      case "settings":
        return <SettingsTab username={settingsUser.username} email={settingsUser.email} onSave={onSettingsSave} />;
      default:
        return (
          <OverviewTab
            stats={stats}
            dailyPnl={dailyPnl}
            dailyPnlPercent={dailyPnlPercent}
            portfolioSeries={portfolioSeries}
            recentTrades={recentTrades}
          />
        );
    }
  };

  return (
    <div className="flex h-screen bg-zinc-950 relative">
      {/* Mobile Menu Button */}
      <MobileMenuButton onClick={() => setMobileSidebarOpen(true)} />
      
      {/* Mobile Sidebar */}
      <MobileSidebar 
        activeTab={activeTab} 
        onTabChange={setActiveTab} 
        isOpen={mobileSidebarOpen} 
        onClose={() => setMobileSidebarOpen(false)} 
      />
      
      {/* Desktop Sidebar */}
      <DashboardSidebar activeTab={activeTab} onTabChange={setActiveTab} />
      
      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        <div className="flex-1 overflow-y-auto">
          <div className="p-4 lg:p-6 max-w-6xl mx-auto">
            {renderTabContent()}
          </div>
        </div>
        
        {/* Right Panel - Hidden on mobile */}
        <div className="hidden xl:block w-80 space-y-4 overflow-y-auto">
          <RightPanel recentTrades={recentTrades} watchlist={watchlist} />
        </div>
      </div>
    </div>
  );
}
