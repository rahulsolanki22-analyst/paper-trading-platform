import { useState } from "react";

import ThemeToggle from "@/components/ThemeToggle";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { glassCard } from "../glass";

export function SettingsTab({ username, email, fullName, bio, onSave }) {
  const [u, setU] = useState(username || "");
  const [e, setE] = useState(email || "");
  const [fn, setFn] = useState(fullName || "");
  const [b, setB] = useState(bio || "");
  const [pw, setPw] = useState("");

  const handleSave = () => {
    const payload = {
      username: u,
      email: e,
      full_name: fn,
      bio: b,
    };
    // Only send password if user explicitly typed a new one
    if (pw.trim()) {
      payload.password = pw;
    }
    onSave?.(payload);
    // Clear password field after saving
    setPw("");
  };

  return (
    <div className={cn(glassCard("max-w-2xl space-y-8 p-6 md:p-8 text-foreground"))}>
      <div>
        <h3 className="text-sm font-semibold text-foreground">Account Settings</h3>
        <p className="text-xs text-muted-foreground">Manage your credentials and personal info.</p>
      </div>

      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="set-user" className="text-foreground font-medium">Username</Label>
          <Input
            id="set-user"
            value={u}
            onChange={(ev) => setU(ev.target.value)}
            className="rounded-xl border-border bg-background text-foreground"
            autoComplete="username"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="set-mail" className="text-foreground font-medium">Email</Label>
          <Input
            id="set-mail"
            type="email"
            value={e}
            onChange={(ev) => setE(ev.target.value)}
            className="rounded-xl border-border bg-background text-foreground"
            autoComplete="email"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="set-fullname" className="text-foreground font-medium">Full Name</Label>
          <Input
            id="set-fullname"
            value={fn}
            onChange={(ev) => setFn(ev.target.value)}
            className="rounded-xl border-border bg-background text-foreground"
            placeholder="e.g. John Doe"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="set-bio" className="text-foreground font-medium">Bio</Label>
          <textarea
            id="set-bio"
            value={b}
            onChange={(ev) => setB(ev.target.value)}
            placeholder="Tell us about yourself..."
            className="flex min-h-[80px] w-full rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-zinc-500 focus-visible:outline-none focus-visible:border-border/80"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="set-pw" className="text-foreground font-medium">New Password (leave blank to keep current)</Label>
          <Input
            id="set-pw"
            type="password"
            value={pw}
            onChange={(ev) => setPw(ev.target.value)}
            placeholder="••••••••"
            className="rounded-xl border-border bg-background text-foreground"
            autoComplete="new-password"
          />
        </div>
      </div>

      <div className="flex justify-end pt-2">
        <Button
          type="button"
          className="rounded-xl px-6 bg-black text-white hover:bg-zinc-800 font-medium dark:bg-white dark:text-black dark:hover:bg-zinc-200"
          onClick={handleSave}
        >
          Save changes
        </Button>
      </div>
    </div>
  );
}
