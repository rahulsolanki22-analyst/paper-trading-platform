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

---
# AI Paper Trading Platform

A full-stack paper trading platform to simulate stock trading with live-like data, portfolio tracking, FX-aware valuation, and a simple ML signal panel.

## Features
- User authentication with JWT (register/login)
- Candlestick trading chart with symbol/timeframe switching
- Simulated Buy/Sell orders and holdings tracking
- Portfolio valuation with base currency conversion to INR
- Daily P&L based on previous close
- Live portfolio refresh every 10s (pauses when tab not visible)
- Currency-aware display (native symbol and INR)
- ML signal panel (buy/hold/sell confidence)
- Language selector (English, Hindi, Spanish)

## Tech Stack
- Frontend: React (Vite), React Router, Zustand, Axios, Lightweight Charts
- Backend: FastAPI, SQLAlchemy ORM, Pydantic, Uvicorn, CORS
- Database: SQLite (`backend/app/paper_trading.db`)
- Data: yfinance for quotes/FX and previous close
- Auth: JWT tokens, password hashing via passlib/bcrypt

## Architecture & Folder Structure
```
ai-paper-trading-platform/
├─ backend/
│  └─ app/
│     ├─ main.py                 # FastAPI app and router includes
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
      ├─ pages/                  # Login, Signup, Trading
      ├─ components/             # Chart, Portfolio, TradePanel, etc.
      ├─ api/                    # axios.js, authApi.js, stocksApi.js, mlApi.js
      └─ store/                  # authStore, languageStore, themeStore
```

## Prerequisites
- Node.js 18+
- Python 3.10+
- Git

## Backend Setup (FastAPI)
1. Create and activate a virtual environment (recommended):
   - Windows (PowerShell):
     ```powershell
     python -m venv .venv
     .venv\Scripts\Activate.ps1
     ```
2. Install dependencies:
   ```powershell
   pip install -r requirements.txt
   ```
3. Environment variables (create a `.env` in `backend/app` if applicable):
   - `JWT_SECRET=your-secret-key`
   - `JWT_ALGORITHM=HS256`
   - `CORS_ORIGINS=http://localhost:5174`
4. Run the API server:
   ```powershell
   uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
   ```
5. Verify: open http://127.0.0.1:8000

## Frontend Setup (React + Vite)
1. Install dependencies:
   ```powershell
   cd frontend
   npm install
   ```
2. Configure base API URL (defaults to `http://127.0.0.1:8000` in `src/api/axios.js`).
3. Start the dev server:
   ```powershell
   npm run dev
   ```
4. Open http://localhost:5174

## API Overview (selected)
- Auth
  - `POST /auth/register` { username, email, password }
  - `POST /auth/login` form-encoded: username, password → returns access token
  - `GET /auth/me` bearer token → current user
- Portfolio
  - `GET /valuation/portfolio` bearer token → holdings, INR valuation, daily P&L
- ML Signals
  - `GET /ml/signal?symbol=...` → confidence for buy/hold/sell
- Stocks
  - `GET /stocks/details?symbol=...` → instrument details

## Development Notes
- Axios attaches the JWT from the auth store to protected calls.
- A 401 interceptor logs out and redirects to `/login` for protected calls but lets `/auth/login` and `/auth/register` show inline errors.
- Portfolio polling runs every 10s and pauses on tab hide for efficiency.
- Valuation converts native currency values to INR using live FX rates.

## Troubleshooting
- Blank login/signup: check browser Network tab for response; backend logs for errors.
- CORS errors: ensure `CORS_ORIGINS` includes `http://localhost:5174` and FastAPI CORS middleware is enabled.
- Prices/FX missing: ensure internet access; yfinance may throttle; try again.
- DB issues: delete `paper_trading.db` (only for dev) to recreate, or verify tables in SQLite.

## Security
- Do not commit real secrets. Use `.env` for `JWT_SECRET` in development.
- Never expose tokens in logs.

## License
This project is provided as-is for development and educational purposes.
"# paper-trading-platform" 
