import React, { useState } from "react";
import useThemeStore from "../store/themeStore";
import { Button } from "@/components/ui/button";

const ThemeToggle = () => {
  const { currentTheme, setTheme, availableThemes } = useThemeStore();
  const [isOpen, setIsOpen] = useState(false);

  const currentThemeData = availableThemes.find((t) => t.name === currentTheme);

  const handleThemeChange = (themeName) => {
    setTheme(themeName);
    setIsOpen(false);
  };

  return (
    <div className="relative">
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="gap-1.5"
        title="Theme"
        onClick={() => setIsOpen(!isOpen)}
      >
        <span>{currentThemeData?.icon}</span>
        <span className="hidden sm:inline">{currentThemeData?.label}</span>
        <svg
          className={`size-4 transition-transform ${isOpen ? "rotate-180" : ""}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </Button>

      {isOpen ? (
        <div
          className="bg-popover text-popover-foreground absolute left-0 bottom-full z-50 mb-1 max-h-[min(240px,calc(100vh-5rem))] w-56 max-w-[min(14rem,calc(100vw-1rem))] overflow-y-auto rounded-lg border border-border shadow-lg"
          role="listbox"
        >
          <div className="py-1">
            {availableThemes.map((theme) => (
              <button
                key={theme.name}
                type="button"
                onClick={() => handleThemeChange(theme.name)}
                className={`flex w-full items-start gap-3 px-3 py-2.5 text-left text-sm transition-colors ${
                  currentTheme === theme.name ? "bg-primary/15" : "hover:bg-muted"
                }`}
              >
                <span className="text-lg">{theme.icon}</span>
                <span>
                  <span className="block font-medium">{theme.label}</span>
                  <span className="text-muted-foreground block text-xs">{theme.description}</span>
                </span>
              </button>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
};

export default ThemeToggle;
