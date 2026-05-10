import React, { useState } from "react";
import useLanguageStore from "../store/languageStore";
import { Button } from "@/components/ui/button";

const LanguageSelector = () => {
  const { currentLanguage, setLanguage, availableLanguages } = useLanguageStore();
  const [isOpen, setIsOpen] = useState(false);

  const currentLang = availableLanguages.find((lang) => lang.code === currentLanguage);

  const handleLanguageChange = (languageCode) => {
    setLanguage(languageCode);
    setIsOpen(false);
  };

  return (
    <div className="relative">
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="min-w-[8rem] justify-between gap-1"
        onClick={() => setIsOpen(!isOpen)}
      >
        <span className="flex items-center gap-1.5 truncate">
          <span>{currentLang?.flag}</span>
          <span className="truncate">{currentLang?.name}</span>
        </span>
        <svg
          className={`size-4 shrink-0 transition-transform ${isOpen ? "rotate-180" : ""}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </Button>

      {isOpen ? (
        <div
          className="bg-popover text-popover-foreground absolute left-0 bottom-full z-50 mb-1 max-h-[min(280px,calc(100vh-5rem))] w-48 max-w-[min(12rem,calc(100vw-1rem))] overflow-y-auto rounded-lg border border-border shadow-lg"
          role="listbox"
        >
          <div className="py-1">
            {availableLanguages.map((language) => (
              <button
                key={language.code}
                type="button"
                onClick={() => handleLanguageChange(language.code)}
                className={`flex w-full items-center gap-3 px-3 py-2 text-left text-sm transition-colors ${
                  currentLanguage === language.code
                    ? "bg-primary/15 text-primary font-medium"
                    : "hover:bg-muted"
                }`}
              >
                <span>{language.flag}</span>
                <span>{language.name}</span>
              </button>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
};

export default LanguageSelector;
