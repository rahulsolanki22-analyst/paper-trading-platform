import { useState } from "react";

import ThemeToggle from "@/components/ThemeToggle";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { glassCard } from "../glass";

export function SettingsTab({ username, email, onSave }) {
  const [u, setU] = useState(username);
  const [e, setE] = useState(email);
  const [pw, setPw] = useState("");

  return (
    <div className={cn(glassCard("max-w-2xl space-y-8 p-6 md:p-8"))}>
      <div>
        <h3 className="text-sm font-semibold">Account</h3>
        <p className="text-xs text-muted-foreground">Credentials are stored securely (mock).</p>
      </div>

      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="set-user">Username</Label>
          <Input
            id="set-user"
            value={u}
            onChange={(ev) => setU(ev.target.value)}
            className="rounded-xl border-white/10 bg-white/5"
            autoComplete="username"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="set-mail">Email</Label>
          <Input
            id="set-mail"
            type="email"
            value={e}
            onChange={(ev) => setE(ev.target.value)}
            className="rounded-xl border-white/10 bg-white/5"
            autoComplete="email"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="set-pw">Password</Label>
          <Input
            id="set-pw"
            type="password"
            value={pw}
            onChange={(ev) => setPw(ev.target.value)}
            placeholder="••••••••"
            className="rounded-xl border-white/10 bg-white/5"
            autoComplete="new-password"
          />
        </div>
      </div>

      <Separator className="bg-white/10" />

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-medium">Appearance</p>
          <p className="text-xs text-muted-foreground">Switch between dark and light themes.</p>
        </div>
        <ThemeToggle />
      </div>

      <div className="flex justify-end pt-2">
        <Button
          type="button"
          className="rounded-xl px-6"
          onClick={() => onSave?.({ username: u, email: e, password: pw })}
        >
          Save changes
        </Button>
      </div>
    </div>
  );
}
