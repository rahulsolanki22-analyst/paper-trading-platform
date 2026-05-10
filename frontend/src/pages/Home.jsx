import React from "react";
import { Link } from "react-router-dom";
import {
  BarChart3,
  Bot,
  Wallet,
  Bell,
  LineChart,
  Zap,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

const highlights = [
  {
    title: "Charts & timeframes",
    description: "Candlesticks with intervals and overlays suited for equity practice.",
    icon: BarChart3,
  },
  {
    title: "ML signal panel",
    description: "Model-assisted buy / sell / hold hints alongside your own judgment.",
    icon: Bot,
  },
  {
    title: "Paper wallet",
    description: "Trade with virtual capital — no brokerage link required.",
    icon: Wallet,
  },
  {
    title: "Alerts & watchlists",
    description: "Track symbols and price triggers without leaving the desk view.",
    icon: Bell,
  },
  {
    title: "Analytics",
    description: "Win rate, P&amp;L, and per-symbol history when you are signed in.",
    icon: LineChart,
  },
  {
    title: "Order types",
    description: "Stops, limits, and trailing ideas for risk practice (where enabled).",
    icon: Zap,
  },
];

const stats = [
  { label: "Virtual capital", value: "₹1,00,000" },
  { label: "Risk", value: "0% real money" },
  { label: "Data", value: "Live quotes" },
  { label: "Focus", value: "Learning" },
];

export default function Home() {
  return (
    <div className="bg-background min-h-svh">
      <header className="border-border/80 border-b">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-4 md:px-8">
          <Link to="/" className="flex items-center gap-2 font-semibold tracking-tight">
            <span className="bg-primary text-primary-foreground flex size-9 items-center justify-center rounded-lg text-sm">
              PT
            </span>
            PaperTrade
          </Link>
          <div className="flex items-center gap-2">
            <Link to="/login">
              <Button variant="ghost">Sign in</Button>
            </Link>
            <Link to="/signup">
              <Button>Get started</Button>
            </Link>
          </div>
        </div>
      </header>

      <main>
        <section className="mx-auto max-w-6xl space-y-8 px-4 py-16 md:px-8 md:py-24">
          <div className="max-w-2xl space-y-6">
            <p className="text-primary text-sm font-medium tracking-wide uppercase">
              AI paper trading
            </p>
            <h1 className="text-4xl font-semibold tracking-tight md:text-5xl lg:text-6xl">
              Practice markets with structure, not guesswork.
            </h1>
            <p className="text-muted-foreground text-lg leading-relaxed">
              A focused workspace for charts, news context, watchlists, and virtual execution — built
              for repeating good habits before you trade real size.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link to="/signup">
                <Button size="lg">Create account</Button>
              </Link>
              <Link to="/stocks">
                <Button size="lg" variant="outline">
                  Browse markets
                </Button>
              </Link>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {stats.map((s) => (
              <Card key={s.label} size="sm">
                <CardHeader className="pb-2">
                  <CardDescription>{s.label}</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-lg font-semibold">{s.value}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        <section className="border-border bg-muted/30 border-y">
          <div className="mx-auto max-w-6xl space-y-10 px-4 py-16 md:px-8 md:py-20">
            <div className="max-w-xl space-y-3">
              <h2 className="text-3xl font-semibold tracking-tight">What you get</h2>
              <p className="text-muted-foreground text-lg">
                Everything in one layout: research rail, chart, and execution panels.
              </p>
            </div>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {highlights.map(({ title, description, icon: Icon }) => (
                <Card key={title}>
                  <CardHeader>
                    <div className="text-primary mb-2">
                      <Icon className="size-5" />
                    </div>
                    <CardTitle className="text-base">{title}</CardTitle>
                    <CardDescription className="leading-relaxed">{description}</CardDescription>
                  </CardHeader>
                </Card>
              ))}
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-4 py-16 md:px-8 md:py-20">
          <Card className="bg-card overflow-hidden">
            <CardContent className="flex flex-col gap-6 p-8 md:flex-row md:items-center md:justify-between md:p-10">
              <div className="max-w-xl space-y-2">
                <h2 className="text-2xl font-semibold tracking-tight">Ready when you are</h2>
                <p className="text-muted-foreground">
                  Log in to open the trading desk, or stay on the home page to learn the product.
                </p>
              </div>
              <Link to="/login">
                <Button size="lg">Sign in to trade</Button>
              </Link>
            </CardContent>
          </Card>
        </section>

        <footer className="border-border text-muted-foreground border-t py-10 text-sm">
          <div className="mx-auto flex max-w-6xl flex-col items-start justify-between gap-6 px-4 md:flex-row md:items-center md:px-8">
            <span>© {new Date().getFullYear()} PaperTrade — practice only.</span>
            <div className="flex flex-wrap gap-4">
              <Link to="/stocks" className="hover:text-foreground transition-colors">
                Markets
              </Link>
              <Link to="/login" className="hover:text-foreground transition-colors">
                Sign in
              </Link>
            </div>
          </div>
        </footer>
      </main>
    </div>
  );
}
