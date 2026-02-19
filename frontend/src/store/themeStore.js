import { create } from 'zustand';
import { persist } from 'zustand/middleware';

const themes = {
  dark: {
    name: 'dark',
    colors: {
      // Background colors
      bgPrimary: 'bg-slate-950',
      bgSecondary: 'bg-slate-900',
      bgTertiary: 'bg-slate-800',
      bgQuaternary: 'bg-slate-700',
      
      // Text colors
      textPrimary: 'text-slate-200',
      textSecondary: 'text-slate-400',
      textTertiary: 'text-slate-500',
      textMuted: 'text-slate-300',
      
      // Border colors
      borderPrimary: 'border-slate-700',
      borderSecondary: 'border-slate-800',
      
      // State colors
      success: 'text-green-400',
      successBg: 'bg-green-900/30',
      successBorder: 'border-green-700',
      error: 'text-red-400',
      errorBg: 'bg-red-900/30',
      errorBorder: 'border-red-700',
      warning: 'text-yellow-400',
      warningBg: 'bg-yellow-900/30',
      warningBorder: 'border-yellow-700',
      
      // Button colors
      buttonPrimary: 'bg-blue-600 hover:bg-blue-700',
      buttonSecondary: 'bg-slate-700 hover:bg-slate-600',
      buttonSuccess: 'bg-green-600 hover:bg-green-700',
      buttonDanger: 'bg-red-600 hover:bg-red-700',
      buttonDisabled: 'bg-slate-700 text-slate-400 cursor-not-allowed',
      
      // Input colors
      inputBg: 'bg-slate-800',
      inputBorder: 'border-slate-700',
      inputBorderError: 'border-red-500',
      
      // Chart colors
      chartBg: '#020617',
      chartGrid: '#1e293b',
      chartBorder: '#334155',
      chartText: '#e5e7eb',
      
      // Gradient
      gradient: 'from-slate-950 via-slate-900 to-slate-950'
    }
  },
  
  light: {
    name: 'light',
    colors: {
      // Background colors
      bgPrimary: 'bg-gray-50',
      bgSecondary: 'bg-white',
      bgTertiary: 'bg-gray-100',
      bgQuaternary: 'bg-gray-200',
      
      // Text colors
      textPrimary: 'text-gray-900',
      textSecondary: 'text-gray-600',
      textTertiary: 'text-gray-500',
      textMuted: 'text-gray-700',
      
      // Border colors
      borderPrimary: 'border-gray-300',
      borderSecondary: 'border-gray-200',
      
      // State colors
      success: 'text-green-600',
      successBg: 'bg-green-50',
      successBorder: 'border-green-300',
      error: 'text-red-600',
      errorBg: 'bg-red-50',
      errorBorder: 'border-red-300',
      warning: 'text-yellow-600',
      warningBg: 'bg-yellow-50',
      warningBorder: 'border-yellow-300',
      
      // Button colors
      buttonPrimary: 'bg-blue-600 hover:bg-blue-700',
      buttonSecondary: 'bg-gray-200 hover:bg-gray-300',
      buttonSuccess: 'bg-green-600 hover:bg-green-700',
      buttonDanger: 'bg-red-600 hover:bg-red-700',
      buttonDisabled: 'bg-gray-200 text-gray-400 cursor-not-allowed',
      
      // Input colors
      inputBg: 'bg-white',
      inputBorder: 'border-gray-300',
      inputBorderError: 'border-red-500',
      
      // Chart colors
      chartBg: '#ffffff',
      chartGrid: '#e5e7eb',
      chartBorder: '#d1d5db',
      chartText: '#111827',
      
      // Gradient
      gradient: 'from-gray-50 via-white to-gray-50'
    }
  }
};

const useThemeStore = create(
  persist(
    (set, get) => ({
      currentTheme: 'dark',
      
      setTheme: (themeName) => {
        set({ currentTheme: themeName });
        // Apply theme to document root
        document.documentElement.setAttribute('data-theme', themeName);
      },
      
      toggleTheme: () => {
        const { currentTheme } = get();
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
        get().setTheme(newTheme);
      },
      
      getTheme: () => {
        const { currentTheme } = get();
        return themes[currentTheme];
      },
      
      getColor: (colorKey) => {
        const { currentTheme } = get();
        return themes[currentTheme].colors[colorKey];
      },
      
      availableThemes: [
        {
          name: 'dark',
          label: 'Dark',
          icon: '🌙',
          description: 'Dark theme with slate colors'
        },
        {
          name: 'light',
          label: 'Light',
          icon: '☀️',
          description: 'Light theme with gray colors'
        }
      ]
    }),
    {
      name: 'theme-store',
      partialize: (state) => ({
        currentTheme: state.currentTheme
      })
    }
  )
);

// Initialize theme on app start
if (typeof window !== 'undefined') {
  const savedTheme = localStorage.getItem('theme-store');
  if (savedTheme) {
    try {
      const { currentTheme } = JSON.parse(savedTheme);
      document.documentElement.setAttribute('data-theme', currentTheme);
    } catch (e) {
      // Fallback to dark theme
      document.documentElement.setAttribute('data-theme', 'dark');
    }
  } else {
    // Set default theme
    document.documentElement.setAttribute('data-theme', 'dark');
  }
}

export default useThemeStore;
