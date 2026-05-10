import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  BarChart3,
  Table2,
  House,
  LogOut,
  LogIn,
  UserRound,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import useAuthStore from "@/store/authStore";
import LanguageSelector from "@/components/LanguageSelector";
import ThemeToggle from "@/components/ThemeToggle";

const nav = [
  { to: "/trade", label: "Trading", icon: LayoutDashboard },
  { to: "/analytics", label: "Analytics", icon: BarChart3 },
  { to: "/profile", label: "Profile", icon: UserRound },
  { to: "/stocks", label: "Markets", icon: Table2 },
  { to: "/", label: "Home", icon: House },
];

function navActive(pathname, to) {
  if (to === "/") return pathname === "/";
  return pathname === to;
}

export default function AppSidebarNav({ onNavigate }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout, isAuthenticated } = useAuthStore();

  const afterNav = () => {
    onNavigate?.();
  };

  const handleLogout = () => {
    logout();
    afterNav();
    navigate("/login");
  };

  return (
    <div className="flex h-full flex-col gap-4 p-4">
      <Link
        to="/"
        onClick={afterNav}
        className="flex items-center gap-2 rounded-lg px-2 py-1.5 transition-opacity hover:opacity-90"
      >
        <div className="flex size-9 items-center justify-center rounded-lg bg-primary text-sm font-bold text-primary-foreground">
          PT
        </div>
        <div className="flex flex-col leading-tight">
          <span className="font-semibold tracking-tight">PaperTrade</span>
          <span className="text-xs text-muted-foreground">Paper trading</span>
        </div>
      </Link>

      <nav className="flex flex-1 flex-col gap-1">
        {nav.map(({ to, label, icon: Icon }) => (
          <Link
            key={to}
            to={to}
            onClick={afterNav}
            className={cn(
              "flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
              navActive(location.pathname, to)
                ? "bg-sidebar-accent text-sidebar-accent-foreground"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            )}
          >
            <Icon className="size-4 shrink-0 opacity-80" />
            {label}
          </Link>
        ))}
      </nav>

      <div className="relative z-10 mt-auto space-y-3 overflow-visible border-t border-sidebar-border pt-4">
        <div className="flex flex-wrap items-center gap-2 overflow-visible">
          <LanguageSelector />
          <ThemeToggle />
        </div>

        {isAuthenticated && user ? (
          <DropdownMenu>
            <DropdownMenuTrigger
              render={<Button variant="outline" className="w-full justify-between gap-2" />}
            >
              <span className="truncate text-left">{user.username}</span>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-56">
              <DropdownMenuLabel>Account</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout}>
                <LogOut className="size-4" />
                Log out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ) : (
          <Button
            variant="secondary"
            className="w-full"
            onClick={() => {
              afterNav();
              navigate("/login");
            }}
          >
            <LogIn className="size-4" />
            Sign in
          </Button>
        )}
      </div>
    </div>
  );
}
