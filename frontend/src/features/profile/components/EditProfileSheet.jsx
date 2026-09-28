import { useState, useEffect } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";

export function EditProfileSheet({ open, onOpenChange, user, onSave }) {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [fullName, setFullName] = useState("");
  const [bio, setBio] = useState("");

  // Sync state with user prop when sheet opens
  useEffect(() => {
    if (open && user) {
      setUsername(user.username || "");
      setEmail(user.email || "");
      setFullName(user.full_name || "");
      setBio(user.bio || "");
    }
  }, [open, user]);

  const handleSave = () => {
    onSave?.({
      username,
      email,
      full_name: fullName,
      bio,
    });
    onOpenChange(false);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="border-border bg-background backdrop-blur-xl sm:max-w-md text-foreground">
        <SheetHeader>
          <SheetTitle className="text-foreground">Edit profile</SheetTitle>
          <SheetDescription className="text-muted-foreground">
            Update how you appear across the platform.
          </SheetDescription>
        </SheetHeader>
        <div className="mt-6 space-y-4 px-1">
          <div className="space-y-2">
            <Label htmlFor="ep-user" className="text-muted-foreground font-medium">Username</Label>
            <Input
              id="ep-user"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="rounded-xl border-border bg-card text-foreground"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="ep-mail" className="text-muted-foreground font-medium">Email</Label>
            <Input
              id="ep-mail"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="rounded-xl border-border bg-card text-foreground"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="ep-fullname" className="text-muted-foreground font-medium">Full Name</Label>
            <Input
              id="ep-fullname"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="rounded-xl border-border bg-card text-foreground"
              placeholder="e.g. John Doe"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="ep-bio" className="text-muted-foreground font-medium">Bio</Label>
            <textarea
              id="ep-bio"
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Tell us about yourself..."
              className="flex min-h-[80px] w-full rounded-xl border border-border bg-card px-3 py-2 text-sm text-foreground placeholder:text-zinc-500 focus-visible:outline-none focus-visible:border-border/80"
            />
          </div>
        </div>
        <SheetFooter className="mt-8 gap-2 sm:justify-end">
          <Button type="button" variant="ghost" onClick={() => onOpenChange(false)} className="text-muted-foreground hover:text-foreground">
            Cancel
          </Button>
          <Button type="button" onClick={handleSave} className="bg-black text-white hover:bg-zinc-800 font-medium">
            Save changes
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
