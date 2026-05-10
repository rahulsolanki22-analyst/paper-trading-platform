import { useState } from "react";

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
  const [username, setUsername] = useState(user.username);
  const [email, setEmail] = useState(user.email);

  const handleSave = () => {
    onSave?.({ username, email });
    onOpenChange(false);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="border-white/10 bg-zinc-950/95 backdrop-blur-xl sm:max-w-md">
        <SheetHeader>
          <SheetTitle>Edit profile</SheetTitle>
          <SheetDescription>Update how you appear across the platform.</SheetDescription>
        </SheetHeader>
        <div className="mt-6 space-y-4 px-1">
          <div className="space-y-2">
            <Label htmlFor="ep-user">Username</Label>
            <Input
              id="ep-user"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="rounded-xl border-white/10 bg-white/5"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="ep-mail">Email</Label>
            <Input
              id="ep-mail"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="rounded-xl border-white/10 bg-white/5"
            />
          </div>
        </div>
        <SheetFooter className="mt-8 gap-2 sm:justify-end">
          <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button type="button" onClick={handleSave}>
            Save changes
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
