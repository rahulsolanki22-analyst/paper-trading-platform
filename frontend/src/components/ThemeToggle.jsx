import React, { useState } from 'react';
import useThemeStore from '../store/themeStore';

const ThemeToggle = () => {
  const { currentTheme, setTheme, availableThemes } = useThemeStore();
  const [isOpen, setIsOpen] = useState(false);

  const currentThemeData = availableThemes.find(theme => theme.name === currentTheme);

  const handleThemeChange = (themeName) => {
    setTheme(themeName);
    setIsOpen(false);
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-all duration-200 ${
          currentTheme === 'dark' 
            ? 'bg-slate-700 hover:bg-slate-600 text-slate-200' 
            : 'bg-gray-200 hover:bg-gray-300 text-gray-700'
        }`}
        title="Toggle theme"
      >
        <span className="text-lg">{currentThemeData?.icon}</span>
        <span className="hidden sm:inline">{currentThemeData?.label}</span>
        <svg 
          className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} 
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <div className={`absolute right-0 mt-2 w-48 rounded-lg shadow-lg z-50 border ${
          currentTheme === 'dark'
            ? 'bg-slate-800 border-slate-700'
            : 'bg-white border-gray-200'
        }`}>
          <div className="py-2">
            {availableThemes.map((theme) => (
              <button
                key={theme.name}
                onClick={() => handleThemeChange(theme.name)}
                className={`w-full flex items-center gap-3 px-4 py-3 text-sm transition-colors ${
                  currentTheme === theme.name
                    ? currentTheme === 'dark'
                      ? 'bg-blue-600 text-white'
                      : 'bg-blue-50 text-blue-600 border-l-4 border-blue-600'
                    : currentTheme === 'dark'
                      ? 'text-slate-200 hover:bg-slate-700'
                      : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                <span className="text-xl">{theme.icon}</span>
                <div className="text-left">
                  <div className="font-medium">{theme.label}</div>
                  <div className={`text-xs ${
                    currentTheme === 'dark' ? 'text-slate-400' : 'text-gray-500'
                  }`}>
                    {theme.description}
                  </div>
                </div>
                {currentTheme === theme.name && (
                  <svg className="w-4 h-4 ml-auto" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                )}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ThemeToggle;
