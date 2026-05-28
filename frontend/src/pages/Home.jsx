import React, { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { applyThemeToDocument } from "@/store/themeStore";
import { login, register } from "@/api/authApi";
import useAuthStore from "@/store/authStore";
import {
  Star,
  ChevronDown,
  BarChart3,
  BookOpen,
  Users,
  Rocket,
  Check,
  ArrowLeft,
} from "lucide-react";

const TABS = [
  { id: "analyse", label: "Analyse", icon: BarChart3 },
  { id: "train", label: "Train", icon: BookOpen },
  { id: "testing", label: "Testing", icon: Users },
  { id: "deploy", label: "Deploy", icon: Rocket },
];

const TAB_CYCLE = ["analyse", "train", "testing", "deploy"];

function fadeStyle(delay) {
  return {
    opacity: 0,
    animationDelay: `${delay}s`,
  };
}

function NavLink({ children }) {
  return (
    <button
      type="button"
      className="flex items-center gap-1 text-sm text-gray-700 transition-colors hover:text-black"
    >
      {children}
      <ChevronDown className="h-4 w-4" />
    </button>
  );
}

function TabButton({ tab, activeTab, onSelect, showDivider }) {
  const Icon = tab.icon;
  const isActive = activeTab === tab.id;
  return (
    <>
      {showDivider && <div className="hidden h-5 w-px bg-gray-300 md:block" />}
      <button
        type="button"
        onClick={() => onSelect(tab.id)}
        className={`flex items-center justify-center gap-2 rounded-md px-4 py-2.5 text-sm font-medium transition-colors ${
          isActive
            ? "bg-white text-black shadow-sm"
            : "text-gray-600 hover:text-black"
        }`}
      >
        <Icon className="h-4 w-4" />
        {tab.label}
      </button>
    </>
  );
}

function AnalyseOverlay() {
  const steps = [
    { label: "Select target stocks (e.g. AAPL, TSLA)", done: true },
    { label: "Configure technical indicators (RSI, MACD)", done: true },
    { label: "Set stop-loss & take-profit risk limits", active: true },
    { label: "Launch backtest simulator", done: false },
  ];
  return (
    <div className="animate-fade-in-overlay absolute inset-0 flex items-center justify-center bg-black/20 p-4">
      <div
        className="animate-slide-up-overlay absolute left-1/2 top-1/2 w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl"
        key="analyse"
      >
        <h3 className="mb-1 text-lg font-semibold text-black">Configure Trading Strategy</h3>
        <p className="mb-4 text-sm text-gray-500">Step 1 of 4 — risk-management setup</p>
        <div className="mb-5 h-2 overflow-hidden rounded-full bg-gray-100">
          <div className="h-full w-1/4 rounded-full bg-purple-600" />
        </div>
        <ul className="space-y-3">
          {steps.map((step) => (
            <li key={step.label} className="flex items-center gap-3 text-sm">
              <span
                className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full ${
                  step.done
                    ? "bg-purple-100 text-purple-700"
                    : step.active
                      ? "border-2 border-purple-600"
                      : "border border-gray-200"
                }`}
              >
                {step.done && <Check className="h-3 w-3" />}
              </span>
              <span className={step.done || step.active ? "text-black" : "text-gray-400"}>
                {step.label}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

function TrainOverlay() {
  const metrics = [
    { label: "Training Epochs", value: "85 / 100" },
    { label: "Signal Loss", value: "0.018" },
    { label: "Prediction Accuracy", value: "89.4%" },
    { label: "Time Remaining", value: "4 min" },
  ];
  return (
    <div className="animate-fade-in-overlay absolute inset-0 flex items-center justify-center bg-black/20 p-4">
      <div
        className="animate-slide-up-overlay absolute left-1/2 top-1/2 w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl"
        key="train"
      >
        <h3 className="mb-1 text-lg font-semibold text-black">Training Trading Bot</h3>
        <p className="mb-4 text-sm text-gray-500">Optimizing signals for maximum simulated returns</p>
        <div className="mb-5 h-2 overflow-hidden rounded-full bg-gray-100">
          <div className="h-full w-[67%] rounded-full bg-orange-500" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          {metrics.map((m) => (
            <div key={m.label} className="rounded-lg bg-gray-50 px-3 py-2.5">
              <p className="text-xs text-gray-500">{m.label}</p>
              <p className="text-sm font-semibold text-black">{m.value}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function TestingOverlay() {
  return (
    <div className="animate-fade-in-overlay absolute inset-0 flex items-center justify-center bg-black/20 p-4">
      <div
        className="animate-slide-up-overlay absolute left-1/2 top-1/2 w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl"
        key="testing"
      >
        <h3 className="mb-1 text-lg font-semibold text-black">Strategy Backtest Results</h3>
        <p className="mb-4 text-sm text-gray-500">Historical performance validation</p>
        <div className="mb-4 flex items-center gap-3 rounded-xl bg-green-50 px-4 py-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-full bg-green-500 text-white">
            <Check className="h-5 w-5" />
          </span>
          <div>
            <p className="text-2xl font-semibold text-green-700">+34.8% APY</p>
            <p className="text-sm text-green-600">Simulated Sharpe Ratio: 2.4</p>
          </div>
        </div>
        <ul className="space-y-2 text-sm text-gray-600">
          <li className="flex justify-between">
            <span>Historical Backtest</span>
            <span className="font-medium text-green-600">Passed</span>
          </li>
          <li className="flex justify-between">
            <span>Max Drawdown Limit (&lt; 10%)</span>
            <span className="font-medium text-green-600">Passed</span>
          </li>
          <li className="flex justify-between">
            <span>Paper Order Execution</span>
            <span className="font-medium text-green-600">Passed</span>
          </li>
        </ul>
      </div>
    </div>
  );
}

function DeployOverlay() {
  const items = [
    "Simulated capital allocated ($100k)",
    "Real-time data stream connected",
    "AI signals activated",
    "Auto-balancing enabled",
  ];
  return (
    <div className="animate-fade-in-overlay absolute inset-0 flex items-center justify-center bg-black/20 p-4">
      <div
        className="animate-slide-up-overlay absolute left-1/2 top-1/2 w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl"
        key="deploy"
      >
        <h3 className="mb-1 text-lg font-semibold text-black">Deploy AI Trading Bot</h3>
        <p className="mb-4 text-sm text-gray-500">Simulated portfolio desk ready to execute</p>
        <ul className="mb-6 space-y-3">
          {items.map((item) => (
            <li key={item} className="flex items-center gap-3 text-sm text-black">
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-black text-white">
                <Check className="h-3 w-3" />
              </span>
              {item}
            </li>
          ))}
        </ul>
        <button
          type="button"
          className="w-full rounded-full bg-black py-3 text-sm font-medium text-white transition-colors hover:bg-gray-800"
        >
          Go Live in Paper Mode
        </button>
      </div>
    </div>
  );
}

function CompanyLogos() {
  return (
    <div
      className="animate-fade-in-up mt-24 flex flex-wrap items-center justify-center gap-8 px-4 md:gap-12"
      style={fadeStyle(0.8)}
    >
      <span className="text-sm font-bold tracking-[0.2em] text-gray-400">INTERSCOPE</span>
      <span className="text-lg font-bold text-gray-400">SPOTIFY</span>
      <div className="flex items-center gap-2">
        <div className="grid grid-cols-3 gap-0.5">
          {Array.from({ length: 9 }).map((_, i) => (
            <span key={i} className="h-1 w-1 rounded-full bg-gray-400" />
          ))}
        </div>
        <span className="text-sm font-semibold text-gray-500">Nexera</span>
      </div>
      <span className="font-serif text-2xl italic text-gray-400">M3</span>
      <div className="flex items-center gap-2">
        <span className="flex h-8 w-8 items-center justify-center rounded-full border border-gray-300 text-xs font-semibold text-gray-500">
          LC
        </span>
        <span className="text-xs font-medium tracking-widest text-gray-400">LAURA COLE</span>
      </div>
      <div className="flex items-center gap-1.5">
        <div className="flex -space-x-1">
          {[0, 1, 2].map((i) => (
            <span
              key={i}
              className="h-2 w-2 rounded-full bg-gray-400"
              style={{ opacity: 1 - i * 0.25 }}
            />
          ))}
        </div>
        <span className="text-sm font-medium lowercase text-gray-400">vertex</span>
      </div>
    </div>
  );
}

export default function Home() {
  const [activeTab, setActiveTab] = useState("analyse");
  const location = useLocation();
  const navigate = useNavigate();
  const setAuth = useAuthStore((state) => state.setAuth);

  // States for Login form
  const [loginData, setLoginData] = useState({ email: "", password: "" });
  const [loginError, setLoginError] = useState("");
  const [loginLoading, setLoginLoading] = useState(false);

  // States for Signup form
  const [signupData, setSignupData] = useState({
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [signupError, setSignupError] = useState("");
  const [signupLoading, setSignupLoading] = useState(false);

  const activeView =
    location.pathname === "/login"
      ? "login"
      : location.pathname === "/signup"
        ? "signup"
        : "landing";

  useEffect(() => {
    document.body.classList.add("landing-page-active");
    applyThemeToDocument("light");
    return () => {
      document.body.classList.remove("landing-page-active");
      try {
        const saved = localStorage.getItem("theme-store");
        const theme = saved ? JSON.parse(saved).state?.currentTheme : "dark";
        applyThemeToDocument(theme || "dark");
      } catch {
        applyThemeToDocument("dark");
      }
    };
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveTab((prev) => {
        const idx = TAB_CYCLE.indexOf(prev);
        return TAB_CYCLE[(idx + 1) % TAB_CYCLE.length];
      });
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  // Reset errors when view changes
  useEffect(() => {
    setLoginError("");
    setSignupError("");
  }, [activeView]);

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setLoginError("");
    setLoginLoading(true);

    try {
      const response = await login(loginData.email, loginData.password);
      setAuth(response.access_token, {
        id: response.user_id,
        username: response.username,
      });
      navigate("/trade");
    } catch (err) {
      setLoginError(
        err.response?.data?.detail || "Login failed. Please check your credentials."
      );
    } finally {
      setLoginLoading(false);
    }
  };

  const handleSignupSubmit = async (e) => {
    e.preventDefault();
    setSignupError("");

    if (signupData.password !== signupData.confirmPassword) {
      setSignupError("Passwords do not match");
      return;
    }

    if (signupData.password.length < 6) {
      setSignupError("Password must be at least 6 characters");
      return;
    }

    setSignupLoading(true);

    try {
      await register(signupData.username, signupData.email, signupData.password);
      const response = await login(signupData.email, signupData.password);
      setAuth(response.access_token, {
        id: response.user_id,
        username: response.username,
      });
      navigate("/trade");
    } catch (err) {
      setSignupError(err.response?.data?.detail || "Registration failed. Please try again.");
    } finally {
      setSignupLoading(false);
    }
  };

  return (
    <div
      className="landing-page min-h-svh bg-white text-black flex flex-col"
      style={{ fontFamily: "'Inter', sans-serif" }}
    >
      {/* Navigation */}
      <nav
        className="animate-fade-in-up mx-auto flex w-full max-w-7xl items-center justify-between px-6 py-4 shrink-0"
        style={fadeStyle(0.1)}
      >
        <Link to="/" className="flex items-center gap-2">
          <BarChart3 className="h-5 w-5 fill-black text-black" />
          <span className="text-lg font-semibold">StellerTrade</span>
        </Link>

        <div className="hidden items-center gap-8 md:flex">
          <NavLink>Trading Tools</NavLink>
          <NavLink>For Teams</NavLink>
          <button
            type="button"
            className="text-sm text-gray-700 transition-colors hover:text-black"
          >
            About Us
          </button>
          <button
            type="button"
            className="text-sm text-gray-700 transition-colors hover:text-black"
          >
            Learn Hub
          </button>
        </div>

        <div className="flex items-center gap-4">
          <Link
            to="/login"
            className={`text-sm font-medium transition-colors ${
              activeView === "login"
                ? "text-black underline underline-offset-4 font-semibold"
                : "text-gray-700 hover:text-black"
            }`}
          >
            Login
          </Link>
          <Link
            to="/signup"
            className={`rounded-full px-5 py-2.5 text-sm font-medium transition-all ${
              activeView === "signup"
                ? "bg-gray-800 text-white shadow-md scale-95"
                : "bg-black text-white hover:bg-gray-800"
            }`}
          >
            Get started free
          </Link>
        </div>
      </nav>

      {/* Main Container with transitions */}
      <main className="flex-1 flex flex-col justify-center relative w-full pb-24 pt-12 md:pt-16">
        
        {/* Landing View */}
        <div
          className={`transition-all duration-500 ease-in-out ${
            activeView === "landing"
              ? "opacity-100 translate-y-0 scale-100 pointer-events-auto"
              : "opacity-0 -translate-y-12 scale-95 pointer-events-none absolute inset-x-0 top-12"
          }`}
        >
          <section className="mx-auto max-w-7xl px-6 text-center">
            {/* Reviews badge */}
            <div
              className="animate-fade-in-up mb-8 inline-flex items-center gap-2"
              style={fadeStyle(0.2)}
            >
              <div className="flex h-6 w-6 items-center justify-center rounded border border-gray-300">
                <Star className="h-3.5 w-3.5 fill-black text-black" />
              </div>
              <span className="text-sm font-medium text-black">4.9 rating from 18.3K+ users</span>
            </div>

            {/* Heading */}
            <h1
              className="animate-fade-in-up mb-5 text-6xl font-normal leading-[1.1] tracking-tight md:text-7xl lg:text-[80px]"
              style={fadeStyle(0.3)}
            >
              Trade Smarter. Learn Faster.
              <br />
              <span className="bg-gradient-to-r from-black via-gray-500 to-gray-400 bg-clip-text text-transparent">
                AI Powers Your Portfolio.
              </span>
            </h1>

            {/* Subheading */}
            <p
              className="animate-fade-in-up mx-auto mb-8 max-w-2xl text-lg text-gray-600 md:text-xl"
              style={fadeStyle(0.4)}
            >
              Master the stock markets risk-free. Simulate real-time trades, analyze historical patterns, and let advanced AI refine your trading strategies.
            </p>

            {/* CTA */}
            <Link
              to="/signup"
              className="animate-fade-in-up mb-12 inline-block rounded-full bg-black px-8 py-3 text-base font-medium text-white transition-colors hover:bg-gray-800"
              style={fadeStyle(0.5)}
            >
              Start Trading Now
            </Link>

            {/* Tab bar */}
            <div className="animate-fade-in-up mx-auto max-w-xl" style={fadeStyle(0.6)}>
              <div className="rounded-lg bg-gray-100 p-1 md:hidden">
                <div className="grid grid-cols-2 gap-1">
                  {TABS.map((tab) => (
                    <TabButton
                      key={tab.id}
                      tab={tab}
                      activeTab={activeTab}
                      onSelect={setActiveTab}
                      showDivider={false}
                    />
                  ))}
                </div>
              </div>
              <div className="hidden items-center justify-center rounded-lg bg-gray-100 p-1 md:flex">
                {TABS.map((tab, i) => (
                  <TabButton
                    key={tab.id}
                    tab={tab}
                    activeTab={activeTab}
                    onSelect={setActiveTab}
                    showDivider={i > 0}
                  />
                ))}
              </div>
            </div>

            {/* Video + overlays */}
            <div
              className="animate-fade-in-up relative mx-auto mt-8 h-[400px] overflow-hidden rounded-3xl md:h-[500px]"
              style={fadeStyle(0.7)}
            >
              <video
                className="h-full w-full object-cover"
                src="https://assets.mixkit.co/videos/preview/mixkit-financial-bars-chart-going-down-and-up-34139-large.mp4"
                autoPlay
                loop
                muted
                playsInline
              />
              {activeTab === "analyse" && <AnalyseOverlay />}
              {activeTab === "train" && <TrainOverlay />}
              {activeTab === "testing" && <TestingOverlay />}
              {activeTab === "deploy" && <DeployOverlay />}
            </div>

            <CompanyLogos />
          </section>
        </div>

        {/* Login View */}
        <div
          className={`transition-all duration-500 ease-in-out ${
            activeView === "login"
              ? "opacity-100 translate-y-0 scale-100 pointer-events-auto"
              : "opacity-0 translate-y-12 scale-95 pointer-events-none absolute inset-x-0 top-12"
          }`}
        >
          <div className="mx-auto w-full max-w-[440px] px-4">
            <div className="mb-6 text-left animate-fade-in-up" style={fadeStyle(0.1)}>
              <Link
                to="/"
                className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-black transition-colors"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to home
              </Link>
            </div>

            <div className="bg-white border border-gray-200 rounded-3xl p-8 shadow-[0_8px_30px_rgb(0,0,0,0.03)] text-left animate-fade-in-up" style={fadeStyle(0.2)}>
              <h2 className="text-3xl font-semibold tracking-tight text-black">Welcome back</h2>
              <p className="text-sm text-gray-500 mt-2">
                Use your StellerTrade credentials to sign in.
              </p>

              {loginError && (
                <div
                  className="mt-6 border-red-100 bg-red-50 text-red-700 rounded-2xl border px-4 py-3 text-sm animate-fade-in-up"
                  role="alert"
                >
                  {loginError}
                </div>
              )}

              <form onSubmit={handleLoginSubmit} className="mt-6 space-y-4">
                <div className="space-y-1.5">
                  <label
                    className="text-xs font-bold uppercase tracking-wider text-gray-400"
                    htmlFor="login-email"
                  >
                    Email address
                  </label>
                  <input
                    id="login-email"
                    type="email"
                    autoComplete="email"
                    value={loginData.email}
                    onChange={(e) => setLoginData({ ...loginData, email: e.target.value })}
                    required
                    placeholder="name@example.com"
                    className="w-full rounded-2xl border border-gray-200 px-4 py-3 text-sm transition-all focus:border-black focus:ring-1 focus:ring-black outline-none bg-gray-50/50 focus:bg-white text-black"
                  />
                </div>

                <div className="space-y-1.5">
                  <label
                    className="text-xs font-bold uppercase tracking-wider text-gray-400"
                    htmlFor="login-password"
                  >
                    Password
                  </label>
                  <input
                    id="login-password"
                    type="password"
                    autoComplete="current-password"
                    value={loginData.password}
                    onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
                    required
                    placeholder="Enter your password"
                    className="w-full rounded-2xl border border-gray-200 px-4 py-3 text-sm transition-all focus:border-black focus:ring-1 focus:ring-black outline-none bg-gray-50/50 focus:bg-white text-black"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loginLoading}
                  className="w-full rounded-2xl bg-black py-3.5 text-sm font-semibold text-white transition-all hover:bg-gray-800 hover:shadow-lg disabled:opacity-50 mt-2"
                >
                  {loginLoading ? "Signing in..." : "Sign in"}
                </button>
              </form>

              <div className="mt-6 text-center text-sm text-gray-500">
                Don't have an account?{" "}
                <Link to="/signup" className="font-semibold text-black hover:underline">
                  Create one free
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Signup View */}
        <div
          className={`transition-all duration-500 ease-in-out ${
            activeView === "signup"
              ? "opacity-100 translate-y-0 scale-100 pointer-events-auto"
              : "opacity-0 translate-y-12 scale-95 pointer-events-none absolute inset-x-0 top-12"
          }`}
        >
          <div className="mx-auto w-full max-w-[440px] px-4">
            <div className="mb-6 text-left animate-fade-in-up" style={fadeStyle(0.1)}>
              <Link
                to="/"
                className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-black transition-colors"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to home
              </Link>
            </div>

            <div className="bg-white border border-gray-200 rounded-3xl p-8 shadow-[0_8px_30px_rgb(0,0,0,0.03)] text-left animate-fade-in-up" style={fadeStyle(0.2)}>
              <h2 className="text-3xl font-semibold tracking-tight text-black">Create account</h2>
              <p className="text-sm text-gray-500 mt-2">
                Start with a paper wallet — no broker connection.
              </p>

              {signupError && (
                <div
                  className="mt-6 border-red-100 bg-red-50 text-red-700 rounded-2xl border px-4 py-3 text-sm animate-fade-in-up"
                  role="alert"
                >
                  {signupError}
                </div>
              )}

              <form onSubmit={handleSignupSubmit} className="mt-6 space-y-4">
                <div className="space-y-1.5">
                  <label
                    className="text-xs font-bold uppercase tracking-wider text-gray-400"
                    htmlFor="signup-username"
                  >
                    Username
                  </label>
                  <input
                    id="signup-username"
                    type="text"
                    autoComplete="username"
                    value={signupData.username}
                    onChange={(e) => setSignupData({ ...signupData, username: e.target.value })}
                    required
                    placeholder="Choose a username"
                    className="w-full rounded-2xl border border-gray-200 px-4 py-3 text-sm transition-all focus:border-black focus:ring-1 focus:ring-black outline-none bg-gray-50/50 focus:bg-white text-black"
                  />
                </div>

                <div className="space-y-1.5">
                  <label
                    className="text-xs font-bold uppercase tracking-wider text-gray-400"
                    htmlFor="signup-email"
                  >
                    Email address
                  </label>
                  <input
                    id="signup-email"
                    type="email"
                    autoComplete="email"
                    value={signupData.email}
                    onChange={(e) => setSignupData({ ...signupData, email: e.target.value })}
                    required
                    placeholder="name@example.com"
                    className="w-full rounded-2xl border border-gray-200 px-4 py-3 text-sm transition-all focus:border-black focus:ring-1 focus:ring-black outline-none bg-gray-50/50 focus:bg-white text-black"
                  />
                </div>

                <div className="space-y-1.5">
                  <label
                    className="text-xs font-bold uppercase tracking-wider text-gray-400"
                    htmlFor="signup-password"
                  >
                    Password
                  </label>
                  <input
                    id="signup-password"
                    type="password"
                    autoComplete="new-password"
                    value={signupData.password}
                    onChange={(e) => setSignupData({ ...signupData, password: e.target.value })}
                    required
                    placeholder="At least 6 characters"
                    className="w-full rounded-2xl border border-gray-200 px-4 py-3 text-sm transition-all focus:border-black focus:ring-1 focus:ring-black outline-none bg-gray-50/50 focus:bg-white text-black"
                  />
                </div>

                <div className="space-y-1.5">
                  <label
                    className="text-xs font-bold uppercase tracking-wider text-gray-400"
                    htmlFor="signup-confirm-password"
                  >
                    Confirm password
                  </label>
                  <input
                    id="signup-confirm-password"
                    type="password"
                    autoComplete="new-password"
                    value={signupData.confirmPassword}
                    onChange={(e) => setSignupData({ ...signupData, confirmPassword: e.target.value })}
                    required
                    placeholder="Confirm your password"
                    className="w-full rounded-2xl border border-gray-200 px-4 py-3 text-sm transition-all focus:border-black focus:ring-1 focus:ring-black outline-none bg-gray-50/50 focus:bg-white text-black"
                  />
                </div>

                <button
                  type="submit"
                  disabled={signupLoading}
                  className="w-full rounded-2xl bg-black py-3.5 text-sm font-semibold text-white transition-all hover:bg-gray-800 hover:shadow-lg disabled:opacity-50 mt-2"
                >
                  {signupLoading ? "Creating account..." : "Sign up"}
                </button>
              </form>

              <div className="mt-6 text-center text-sm text-gray-500">
                Already registered?{" "}
                <Link to="/login" className="font-semibold text-black hover:underline">
                  Sign in
                </Link>
              </div>
            </div>
          </div>
        </div>

      </main>
    </div>
  );
}
