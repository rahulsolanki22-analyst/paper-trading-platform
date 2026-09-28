import { cn } from "@/lib/utils";
import { SettingsTab } from "./tabs/SettingsTab";
import { ProfileHeader } from "./ProfileHeader";

export function DashboardLayout({ 
  user,
  onEdit,
  settingsUser,
  onSettingsSave 
}) {
  return (
    <div className="min-h-screen bg-background text-foreground relative">
      {/* Main Content */}
      <div className="w-full">
        <div className="p-4 lg:p-6 max-w-2xl mx-auto space-y-6">
          <ProfileHeader user={user} onEdit={onEdit} />
          <SettingsTab
            username={settingsUser.username}
            email={settingsUser.email}
            fullName={settingsUser.fullName}
            bio={settingsUser.bio}
            onSave={onSettingsSave}
          />
        </div>
      </div>
    </div>
  );
}
