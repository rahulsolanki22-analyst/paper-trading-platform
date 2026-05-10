import { Pencil } from "lucide-react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { glassCard } from "./glass";

export function ProfileHeader({ user, onEdit }) {
  const isPro = user.accountType === "Pro";

  return (
    <div className={cn(glassCard("p-6 md:p-8"))}>
      <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
          <Avatar
            className="size-20 border border-white/10 shadow-lg shadow-black/30 ring-2 ring-primary/20"
            size="lg"
          >
            {user.avatarUrl ? (
              <AvatarImage src={user.avatarUrl} alt={user.username} />
            ) : null}
            <AvatarFallback className="bg-gradient-to-br from-primary/30 to-primary/5 text-lg font-semibold text-primary">
              {user.initials || user.username?.slice(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>

          <div className="min-w-0 space-y-1.5">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="truncate text-2xl font-semibold tracking-tight md:text-3xl">{user.username}</h1>
              <Badge
                className={cn(
                  "rounded-full border px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider",
                  isPro
                    ? "border-amber-500/40 bg-amber-500/15 text-amber-400"
                    : "border-white/15 bg-white/5 text-muted-foreground"
                )}
              >
                {isPro ? "Pro" : "Free"}
              </Badge>
            </div>
            <p className="truncate text-sm text-muted-foreground">{user.email}</p>
            <p className="text-xs text-muted-foreground/80">
              Paper trading account · AI-assisted insights
            </p>
          </div>
        </div>

        <Button
          type="button"
          variant="outline"
          className="h-11 shrink-0 gap-2 rounded-xl border-white/15 bg-white/5 hover:bg-white/10"
          onClick={onEdit}
        >
          <Pencil className="size-4" />
          Edit profile
        </Button>
      </div>
    </div>
  );
}
