import { create } from 'zustand';
import { persist } from 'zustand/middleware';

const translations = {
  en: {
    // Navigation
    home: 'Home',
    logout: 'Logout',
    
    // Trading Page
    paperTrading: 'Paper Trading',
    welcome: 'Welcome',
    viewerMode: 'Viewer Mode',
    viewerModeDesc: 'Charts and analysis only. Trading is disabled.',
    enablePaperTrading: 'Enable Paper Trading',
    paperTradingMode: 'Paper Trading Mode',
    paperTradingModeDesc: 'Simulated trading enabled. All trades are virtual.',
    switchToViewerMode: 'Switch to Viewer Mode',
    
    // Trading Panel
    trade: 'Trade',
    quantity: 'Quantity',
    buy: 'Buy',
    sell: 'Sell',
    processing: 'Processing...',
    resetPaperMoney: 'Reset Paper Money',
    
    // Portfolio
    portfolio: 'Portfolio',
    cashBalance: 'Cash Balance',
    totalValue: 'Total Value',
    dailyPL: 'Daily P&L',
    noHoldings: 'No holdings',
    startTrading: 'Start trading to build your portfolio',
    symbol: 'Symbol',
    qty: 'Qty',
    avgPrice: 'Avg Price',
    ltp: 'LTP',
    pl: 'P&L',
    
    // Company Details
    marketCap: 'Market Cap',
    peRatio: 'P/E Ratio',
    volume: 'Volume',
    avgVolume: 'Avg Volume',
    dayRange: 'Day Range',
    week52Range: '52W Range',
    beta: 'Beta',
    dividendYield: 'Dividend Yield',
    sector: 'Sector',
    industry: 'Industry',
    exchange: 'Exchange',
    website: 'Website',
    
    // General
    loading: 'Loading...',
    error: 'Error',
    success: 'Success'
  },
  
  hi: {
    // Navigation
    home: 'होम',
    logout: 'लॉगआउट',
    
    // Trading Page
    paperTrading: 'पेपर ट्रेडिंग',
    welcome: 'स्वागत है',
    viewerMode: 'व्यूअर मोड',
    viewerModeDesc: 'केवल चार्ट और विश्लेषण। ट्रेडिंग अक्षम है।',
    enablePaperTrading: 'पेपर ट्रेडिंग सक्षम करें',
    paperTradingMode: 'पेपर ट्रेडिंग मोड',
    paperTradingModeDesc: 'सिमुलेटेड ट्रेडिंग सक्षम। सभी ट्रेड वर्चुअल हैं।',
    switchToViewerMode: 'व्यूअर मोड में स्विच करें',
    
    // Trading Panel
    trade: 'ट्रेड',
    quantity: 'मात्रा',
    buy: 'खरीदें',
    sell: 'बेचें',
    processing: 'प्रोसेसिंग...',
    resetPaperMoney: 'पेपर मनी रीसेट करें',
    
    // Portfolio
    portfolio: 'पोर्टफोलियो',
    cashBalance: 'नकदी शेष',
    totalValue: 'कुल मूल्य',
    dailyPL: 'दैनिक पीएल',
    noHoldings: 'कोई होल्डिंग नहीं',
    startTrading: 'अपना पोर्टफोलियो बनाने के लिए ट्रेडिंग शुरू करें',
    symbol: 'प्रतीक',
    qty: 'मात्रा',
    avgPrice: 'औसत मूल्य',
    ltp: 'एलटीपी',
    pl: 'पीएल',
    
    // Company Details
    marketCap: 'मार्केट कैप',
    peRatio: 'पी/ई अनुपात',
    volume: 'वॉल्यूम',
    avgVolume: 'औसत वॉल्यूम',
    dayRange: 'दिन की रेंज',
    week52Range: '52W रेंज',
    beta: 'बीटा',
    dividendYield: 'लाभांश प्रतिफल',
    sector: 'क्षेत्र',
    industry: 'उद्योग',
    exchange: 'एक्सचेंज',
    website: 'वेबसाइट',
    
    // General
    loading: 'लोड हो रहा है...',
    error: 'त्रुटि',
    success: 'सफलता'
  },
  
  es: {
    // Navigation
    home: 'Inicio',
    logout: 'Cerrar sesión',
    
    // Trading Page
    paperTrading: 'Trading de Papel',
    welcome: 'Bienvenido',
    viewerMode: 'Modo Visor',
    viewerModeDesc: 'Solo gráficos y análisis. El trading está deshabilitado.',
    enablePaperTrading: 'Habilitar Trading de Papel',
    paperTradingMode: 'Modo Trading de Papel',
    paperTradingModeDesc: 'Trading simulado habilitado. Todas las operaciones son virtuales.',
    switchToViewerMode: 'Cambiar a Modo Visor',
    
    // Trading Panel
    trade: 'Operar',
    quantity: 'Cantidad',
    buy: 'Comprar',
    sell: 'Vender',
    processing: 'Procesando...',
    resetPaperMoney: 'Restablecer Dinero de Papel',
    
    // Portfolio
    portfolio: 'Cartera',
    cashBalance: 'Saldo de Efectivo',
    totalValue: 'Valor Total',
    dailyPL: 'P&L Diario',
    noHoldings: 'Sin posiciones',
    startTrading: 'Comienza a operar para construir tu cartera',
    symbol: 'Símbolo',
    qty: 'Ctd',
    avgPrice: 'Precio Prom',
    ltp: 'Último Precio',
    pl: 'P&L',
    
    // Company Details
    marketCap: 'Capitalización',
    peRatio: 'Ratio P/E',
    volume: 'Volumen',
    avgVolume: 'Volumen Prom',
    dayRange: 'Rango del Día',
    week52Range: 'Rango 52S',
    beta: 'Beta',
    dividendYield: 'Rendimiento Dividendo',
    sector: 'Sector',
    industry: 'Industria',
    exchange: 'Bolsa',
    website: 'Sitio Web',
    
    // General
    loading: 'Cargando...',
    error: 'Error',
    success: 'Éxito'
  }
};

const useLanguageStore = create(
  persist(
    (set, get) => ({
      currentLanguage: 'en',
      
      setLanguage: (language) => {
        set({ currentLanguage: language });
      },
      
      translate: (key) => {
        const { currentLanguage } = get();
        return translations[currentLanguage]?.[key] || translations.en[key] || key;
      },
      
      availableLanguages: [
        { code: 'en', name: 'English', flag: '🇺🇸' },
        { code: 'hi', name: 'हिन्दी', flag: '🇮🇳' },
        { code: 'es', name: 'Español', flag: '🇪🇸' }
      ]
    }),
    {
      name: 'language-store',
      partialize: (state) => ({
        currentLanguage: state.currentLanguage
      })
    }
  )
);

export default useLanguageStore;
