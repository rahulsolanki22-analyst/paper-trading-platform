import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";

import Home from "./pages/Home";
import Trading from "./pages/Trading";
import Stocks from "./pages/Stocks";
import Analytics from "./pages/Analytics";

import ProtectedRoute from "./components/ProtectedRoute";
import AppLayout from "./components/layout/AppLayout";
import MarketsHub from "./pages/MarketsHub";
import TradingDiary from "./pages/TradingDiary";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Home />} />
        <Route path="/signup" element={<Home />} />

        <Route
          path="/trade"
          element={
            <ProtectedRoute>
              <AppLayout>
                <Trading />
              </AppLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/analytics"
          element={
            <ProtectedRoute>
              <AppLayout>
                <Analytics />
              </AppLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/diary"
          element={
            <ProtectedRoute>
              <AppLayout>
                <TradingDiary />
              </AppLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/stocks"
          element={
            <AppLayout>
              <Stocks />
            </AppLayout>
          }
        />

        <Route
          path="/markets-hub"
          element={
            <AppLayout>
              <MarketsHub />
            </AppLayout>
          }
        />
      </Routes>
    </Router>
  );
}


export default App;
