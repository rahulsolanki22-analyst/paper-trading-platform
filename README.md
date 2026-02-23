# AI Paper Trading Platform – Full Stack Web Application

A modern, responsive paper trading platform to simulate stock trading, analyze performance, and learn without risking real money.

## Features

### ✅ Completed Features
- **User Authentication**: Register, login, logout with JWT
- **Trading Workflow**: Buy/Sell simulated orders, pending orders, portfolio tracking
- **Live-like Data**: Pricing and FX via yfinance with caching
- **Portfolio Valuation**: Base currency conversion to INR; native currency display
- **Daily P&L**: Computed using previous close
- **Analytics**: Summary metrics and trade analysis
- **News & Signals**: Stock news with sentiment and ML signal panel
- **Internationalization**: Language selector (English, Hindi, Spanish)
- **Responsive UI**: Clean, modern interface

### 🔧 Core Functionality
- **Charting**: Candlestick chart with symbol/timeframe switching
- **Holdings & Cash**: Track positions, cash balance, and total value
- **Protected Routes**: Token-attached API requests with interceptors
- **Polling**: Live portfolio refresh every 10 seconds (pauses when tab hidden)
- **Currency Awareness**: Native symbol display and INR conversion

## Tech Stack

### Frontend
- **React (Vite)** – Fast dev server and modern React
- **Zustand** – Lightweight state management (auth, language, trading)
- **React Router** – Client-side routing
- **Axios** – HTTP client with token interceptors
- **Lightweight Charts** – Trading chart
- **CSS** – Custom styling

### Backend
- **FastAPI** – High-performance Python web framework
- **SQLAlchemy ORM** – Database access
- **Pydantic** – Request/response models
- **Uvicorn** – ASGI server
- **CORS** – Cross-origin requests

### Data & Auth
- **SQLite** – Development database (`backend/app/paper_trading.db`)
- **JWT** – Auth tokens (access)
- **passlib/bcrypt** – Password hashing
- **yfinance** – Quotes, FX, previous close

## Project Structure

```
ai-paper-trading-platform/
├─ backend/
│  └─ app/
│     ├─ main.py                 # FastAPI app & router includes
│     ├─ routes/
│     │  ├─ auth.py              # Register, login, current user
│     │  ├─ valuation.py         # Portfolio valuation + FX + daily P&L
│     │  ├─ ml_signal.py         # ML signals endpoint
│     │  └─ stocks.py            # Stock info endpoints
│     ├─ utils/
│     │  └─ auth.py              # JWT + password hashing helpers
│     ├─ services/
│     │  └─ pricing.py           # Live price wrapper
│     ├─ models/
│     │  └─ user.py              # SQLAlchemy User model
│     └─ paper_trading.db        # SQLite database
└─ frontend/
   └─ src/
      ├─ pages/                  # Login, Signup, Trading, Analytics
      ├─ components/             # Chart, Portfolio, TradePanel, etc.
      ├─ api/                    # axios.js, authApi.js, stocksApi.js, mlApi.js
      └─ store/                  # authStore, languageStore, tradingStore
```

## Prerequisites
- Node.js 18+
- Python 3.10+
- Git

## Installation & Setup

### 1) Backend (FastAPI)
1. Create and activate virtual environment (Windows PowerShell):
   ```powershell
   python -m venv .venv
   .venv\Scripts\Activate.ps1
   ```
2. Install dependencies:
   ```powershell
   pip install -r requirements.txt
   ```
3. Environment variables (create `backend/app/.env` if needed):
   ```env
   JWT_SECRET=your-secret-key
   JWT_ALGORITHM=HS256
   CORS_ORIGINS=http://localhost:5174
   ```
4. Run the API server:
   ```powershell
   uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
   ```
5. Verify: open http://127.0.0.1:8000

### 2) Frontend (React + Vite)
1. Install dependencies:
   ```powershell
   cd frontend
   npm install
   ```
2. Base API URL (defaults to `http://127.0.0.1:8000` in `src/api/axios.js`).
3. Start dev server:
   ```powershell
   npm run dev
   ```
4. Open http://localhost:5174

## Usage

### 1) User Registration & Login
- Use the Signup and Login pages to create/sign in to an account.
- JWT tokens are stored client-side and attached to protected requests.

### 2) Trading & Portfolio
- Search/select a symbol and use the chart to view prices.
- Place Buy/Sell orders in Paper mode; view pending orders and portfolio.
- Portfolio updates automatically every 10 seconds.

### 3) Analytics
- View performance summary and trade analysis.

## API Endpoints (selected)

### Authentication
- `POST /auth/register` – Register user
- `POST /auth/login` – Login (x-www-form-urlencoded)
- `GET /auth/me` – Current user (Bearer)

### Portfolio & Valuation
- `GET /valuation/portfolio` – Holdings, INR valuation, daily P&L (Bearer)

### Stocks & ML
- `GET /stocks/details?symbol=...` – Stock details
- `GET /ml/signal?symbol=...` – ML signal

## Development
- Tests: add unit/E2E tests as needed
- Build frontend for production: `cd frontend && npm run build`
- Lint frontend: `cd frontend && npm run lint`

## Troubleshooting
- 401 on non-auth endpoints: token may be invalid → logout and login again
- CORS errors: ensure `CORS_ORIGINS` includes `http://localhost:5174`
- Missing prices/FX: yfinance rate limits occasionally; retry
- DB issues: for dev, recreate `paper_trading.db` if schema corrupt

## License
MIT (or project-specific; update as needed)

