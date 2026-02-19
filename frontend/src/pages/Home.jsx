import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

const Home = () => {
  const navigate = useNavigate();
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const handleMouseMove = (e) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
    };
    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  const features = [
    {
      icon: "📊",
      title: "Advanced Charts",
      description: "TradingView-style charts with multiple timeframes and 50+ technical indicators",
      gradient: "from-blue-500 to-cyan-500"
    },
    {
      icon: "🤖",
      title: "AI-Powered Signals",
      description: "Machine learning models analyze patterns and provide BUY/SELL/HOLD recommendations",
      gradient: "from-purple-500 to-pink-500"
    },
    {
      icon: "💼",
      title: "Paper Trading",
      description: "Practice with ₹1,00,000 virtual money. Zero risk, maximum learning",
      gradient: "from-green-500 to-emerald-500"
    },
    {
      icon: "🔔",
      title: "Price Alerts",
      description: "Set custom alerts and never miss a trading opportunity",
      gradient: "from-orange-500 to-amber-500"
    },
    {
      icon: "📈",
      title: "Portfolio Analytics",
      description: "Track win rate, P&L, equity curve, and detailed trade analysis",
      gradient: "from-rose-500 to-red-500"
    },
    {
      icon: "⚡",
      title: "Advanced Orders",
      description: "Stop-loss, take-profit, and trailing stop orders for risk management",
      gradient: "from-indigo-500 to-violet-500"
    }
  ];

  const stats = [
    { value: "₹1,00,000", label: "Virtual Capital", icon: "💰" },
    { value: "50+", label: "Technical Indicators", icon: "📉" },
    { value: "Real-time", label: "Market Data", icon: "⚡" },
    { value: "0%", label: "Trading Risk", icon: "🛡️" }
  ];

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white overflow-hidden relative">
      {/* Animated Background Gradient */}
      <div
        className="fixed inset-0 opacity-30 pointer-events-none"
        style={{
          background: `radial-gradient(600px circle at ${mousePosition.x}px ${mousePosition.y}px, rgba(59, 130, 246, 0.15), transparent 40%)`
        }}
      />

      {/* Grid Pattern Background */}
      <div className="fixed inset-0 opacity-[0.02] pointer-events-none"
        style={{
          backgroundImage: `linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)`,
          backgroundSize: '50px 50px'
        }}
      />

      {/* Floating Orbs */}
      <div className="fixed top-20 left-20 w-72 h-72 bg-blue-500/20 rounded-full blur-[100px] animate-pulse" />
      <div className="fixed bottom-20 right-20 w-96 h-96 bg-purple-500/20 rounded-full blur-[120px] animate-pulse" style={{ animationDelay: '1s' }} />
      <div className="fixed top-1/2 left-1/2 w-64 h-64 bg-green-500/10 rounded-full blur-[80px] animate-pulse" style={{ animationDelay: '2s' }} />

      {/* Navigation */}
      <nav className="relative z-10 flex items-center justify-between px-6 lg:px-12 py-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center font-bold text-lg">
            PT
          </div>
          <span className="text-xl font-bold">PaperTrade</span>
        </div>
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate("/login")}
            className="px-5 py-2.5 text-slate-300 hover:text-white transition-colors font-medium"
          >
            Sign In
          </button>
          <button
            onClick={() => navigate("/signup")}
            className="px-5 py-2.5 bg-white/10 hover:bg-white/20 backdrop-blur-sm border border-white/10 rounded-xl font-medium transition-all"
          >
            Get Started
          </button>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative z-10 px-6 lg:px-12 pt-16 lg:pt-24 pb-20">
        <div className="max-w-6xl mx-auto text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/5 backdrop-blur-sm border border-white/10 rounded-full mb-8">
            <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
            <span className="text-sm text-slate-300">Live Market Data • No Real Money Required</span>
          </div>

          {/* Main Heading */}
          <h1 className="text-5xl md:text-7xl lg:text-8xl font-bold mb-6 leading-tight">
            <span className="bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent">
              Master Trading
            </span>
            <br />
            <span className="bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
              Without The Risk
            </span>
          </h1>

          {/* Subtitle */}
          <p className="text-xl md:text-2xl text-slate-400 max-w-3xl mx-auto mb-12 leading-relaxed">
            Practice stock trading with AI-powered insights, real-time data, and
            <span className="text-white font-medium"> ₹1,00,000 virtual capital</span>.
            Build your skills before risking real money.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-16">
            <button
              onClick={() => navigate("/trade")}
              className="group relative px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl font-semibold text-lg transition-all hover:scale-105 hover:shadow-2xl hover:shadow-blue-500/25"
            >
              <span className="flex items-center gap-2">
                Start Trading Free
                <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </span>
            </button>
            <button
              onClick={() => navigate("/analytics")}
              className="px-8 py-4 bg-white/5 hover:bg-white/10 backdrop-blur-sm border border-white/10 rounded-2xl font-semibold text-lg transition-all"
            >
              View Demo Analytics
            </button>
          </div>

          {/* Stats Row */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto">
            {stats.map((stat, i) => (
              <div
                key={i}
                className="group p-6 bg-white/[0.03] backdrop-blur-sm border border-white/5 rounded-2xl hover:bg-white/[0.06] hover:border-white/10 transition-all cursor-default"
              >
                <div className="text-2xl mb-2">{stat.icon}</div>
                <div className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">
                  {stat.value}
                </div>
                <div className="text-sm text-slate-500 mt-1">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="relative z-10 px-6 lg:px-12 py-24">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              Everything You Need to
              <span className="bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent"> Trade Smarter</span>
            </h2>
            <p className="text-xl text-slate-400 max-w-2xl mx-auto">
              Professional-grade tools and AI assistance, completely free
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, i) => (
              <div
                key={i}
                className="group p-8 bg-white/[0.02] backdrop-blur-sm border border-white/5 rounded-3xl hover:bg-white/[0.05] hover:border-white/10 transition-all duration-300 hover:-translate-y-1"
              >
                <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${feature.gradient} flex items-center justify-center text-2xl mb-6 group-hover:scale-110 transition-transform`}>
                  {feature.icon}
                </div>
                <h3 className="text-xl font-semibold mb-3 text-white">
                  {feature.title}
                </h3>
                <p className="text-slate-400 leading-relaxed">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative z-10 px-6 lg:px-12 py-24">
        <div className="max-w-4xl mx-auto">
          <div className="relative p-12 md:p-16 rounded-[2.5rem] overflow-hidden">
            {/* Background Gradient */}
            <div className="absolute inset-0 bg-gradient-to-br from-blue-600/20 via-purple-600/20 to-pink-600/20" />
            <div className="absolute inset-0 backdrop-blur-xl" />
            <div className="absolute inset-0 border border-white/10 rounded-[2.5rem]" />

            <div className="relative text-center">
              <h2 className="text-4xl md:text-5xl font-bold mb-6">
                Ready to Start Your
                <br />
                <span className="bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                  Trading Journey?
                </span>
              </h2>
              <p className="text-xl text-slate-300 mb-10 max-w-2xl mx-auto">
                Join thousands of traders who are learning and practicing without risking their savings.
              </p>
              <button
                onClick={() => navigate("/signup")}
                className="px-10 py-5 bg-white text-slate-900 rounded-2xl font-bold text-lg hover:bg-slate-100 transition-all hover:scale-105 hover:shadow-2xl hover:shadow-white/20"
              >
                Create Free Account
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 px-6 lg:px-12 py-12 border-t border-white/5">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center font-bold text-sm">
              PT
            </div>
            <span className="font-semibold">PaperTrade</span>
          </div>
          <p className="text-slate-500 text-sm">
            Practice trading with AI assistance. No real money involved.
          </p>
          <div className="flex gap-6">
            <button onClick={() => navigate("/trade")} className="text-slate-400 hover:text-white transition-colors text-sm">
              Trade
            </button>
            <button onClick={() => navigate("/analytics")} className="text-slate-400 hover:text-white transition-colors text-sm">
              Analytics
            </button>
            <button onClick={() => navigate("/login")} className="text-slate-400 hover:text-white transition-colors text-sm">
              Sign In
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Home;