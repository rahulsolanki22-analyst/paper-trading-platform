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
            className="size-20 border border-gray-200 shadow-sm ring-2 ring-gray-100"
            size="lg"
          >
            {user.avatarUrl ? (
              <AvatarImage src={user.avatarUrl} alt={user.username} />
            ) : null}
            <AvatarFallback className="bg-gradient-to-br from-zinc-200 to-zinc-50 text-lg font-semibold text-zinc-800">
              {user.initials || user.username?.slice(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>

          <div className="min-w-0 space-y-1.5">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="truncate text-2xl font-bold tracking-tight md:text-3xl text-zinc-900">
                {user.fullName || user.full_name || user.username}
              </h1>
              <Badge
                className={cn(
                  "rounded-full border px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider",
                  isPro
                    ? "border-amber-500/30 bg-amber-500/10 text-amber-700"
                    : "border-gray-200 bg-gray-100 text-zinc-600"
                )}
              >
                {isPro ? "Pro" : "Free"}
              </Badge>
            </div>
            {(user.fullName || user.full_name) && (
              <p className="text-sm font-medium text-zinc-500">@{user.username}</p>
            )}
            <p className="truncate text-sm text-zinc-500">{user.email}</p>
            {user.bio && (
              <p className="text-sm text-zinc-650 mt-2 max-w-xl line-clamp-2">
                {user.bio}
              </p>
            )}
            <p className="text-xs text-zinc-400">
              Paper trading account · AI-assisted insights
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
