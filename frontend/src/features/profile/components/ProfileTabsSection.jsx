import { LayoutGrid, History, Star, Settings2 } from "lucide-react";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { glassCard } from "./glass";
import { OverviewTab } from "./tabs/OverviewTab";
import { SettingsTab } from "./tabs/SettingsTab";
import { TradingHistoryTab } from "./tabs/TradingHistoryTab";
import { WatchlistTab } from "./tabs/WatchlistTab";

const tabTriggerClass =
  "gap-2 rounded-xl px-4 py-2 text-xs font-medium transition-all data-[state=active]:bg-white/10 data-[state=active]:text-foreground data-[state=inactive]:text-muted-foreground";

export function ProfileTabsSection({
  portfolioSeries,
  recentTrades,
  tradingHistory,
  watchlist,
  onWatchlistRemove,
  onWatchlistAdd,
  settingsUser,
  onSettingsSave,
}) {
  return (
    <div className={cn(glassCard("p-3 md:p-5"))}>
      <Tabs defaultValue="overview" className="w-full gap-6">
        <TabsList
          variant="line"
          className="flex h-auto w-full flex-wrap justify-start gap-1 bg-transparent p-1 md:flex-nowrap"
        >
          <TabsTrigger value="overview" className={tabTriggerClass}>
            <LayoutGrid className="size-3.5 opacity-80" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="history" className={tabTriggerClass}>
            <History className="size-3.5 opacity-80" />
            Trading history
          </TabsTrigger>
          <TabsTrigger value="watchlist" className={tabTriggerClass}>
            <Star className="size-3.5 opacity-80" />
            Watchlist
          </TabsTrigger>
          <TabsTrigger value="settings" className={tabTriggerClass}>
            <Settings2 className="size-3.5 opacity-80" />
            Settings
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-0 w-full outline-none">
          <OverviewTab portfolioSeries={portfolioSeries} recentTrades={recentTrades} />
        </TabsContent>
        <TabsContent value="history" className="mt-0 w-full outline-none">
          <TradingHistoryTab trades={tradingHistory} />
        </TabsContent>
        <TabsContent value="watchlist" className="mt-0 w-full outline-none">
          <WatchlistTab items={watchlist} onRemove={onWatchlistRemove} onAdd={onWatchlistAdd} />
        </TabsContent>
        <TabsContent value="settings" className="mt-0 w-full outline-none">
          <SettingsTab
            username={settingsUser.username}
            email={settingsUser.email}
            onSave={onSettingsSave}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
