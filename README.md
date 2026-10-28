# Gold Intelligence — MCX Gold Contract Relative-Value Intelligence Platform

[![Hack in Hills '26](https://img.shields.io/badge/Hack%20in%20Hills%20'26-Problem%2003-amber.svg)](https://hackinhills.com)
[![Team](https://img.shields.io/badge/Team-LNX-cyan.svg)](#)
[![Python](https://img.shields.io/badge/Backend-FastAPI%20%7C%20Pandas%20%7C%20NumPy-blue.svg)](#)
[![Frontend](https://img.shields.io/badge/Frontend-React%2019%20%7C%20Vite%20%7C%20Tailwind%204-purple.svg)](#)
[![Tests](https://img.shields.io/badge/Pytest-25%20Passed-emerald.svg)](#)

Developed for **Hack in Hills '26**, **Problem 03: Commodity Derivatives Intelligence**, by **Team LNX**.

---

## 1. Product Vision & Central Thesis

The central question addressed by Gold Intelligence is **NOT**:
> *"Will gold prices go up or down?"*

It is:
> **"Is one MCX gold contract behaving unusually relative to another related contract, and is that deviation statistically meaningful after accounting for contract specifications, liquidity, expiry, and transaction costs?"**

### Covered MCX Contracts
| Contract | Contract Size | Quoted Unit | Stated Purity | Delivery Unit | Fine Gold / Quoted Unit |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **GOLDM** (Mini) | 100 g | Per 10 g | 995 fineness (99.5%) | 100 g | **9.950 g** pure gold |
| **GOLDTEN** | 10 g | Per 10 g | 999 fineness (99.9%) | 10 g | **9.990 g** pure gold |
| **GOLDGUINEA** | 8 g | Per 8 g | 999 fineness (99.9%) | 8 g | **7.992 g** pure gold |
| **GOLDPETAL** | 1 g | Per 1 g | 999 fineness (99.9%) | 1 g | **0.999 g** pure gold |

---

## 2. Core Quantitative Architecture

### A. Price Normalization Engine
Raw quoted prices cannot be compared directly because ₹74,500 for `GOLDM` represents 10g of 995 gold, whereas ₹59,880 for `GOLDGUINEA` represents 8g of 999 gold.
- **Canonical Metric**: INR per 1.0 fine gram of 100% pure gold:
  $$\text{Price}_{\text{fine\_gram}} = \frac{\text{Quoted Price}}{\text{Quote Unit Grams} \times (\text{Stated Purity} / 1000)}$$
- **Physical Benchmark Reference**: INR per 10 grams of 999 standard gold:
  $$\text{Price}_{10g\_999} = \text{Price}_{\text{fine\_gram}} \times 9.99$$
- Every calculation produces a 6-step verifiable audit trail viewable in the **Normalization Inspector**.

### B. Relative Spread & Lookahead-Free Rolling Baselines
- **Normalized Relative Spread**:
  $$\text{Spread}_t = \left(\frac{P_{A, t}^{\text{fine}}}{P_{B, t}^{\text{fine}}}\right) - 1.0 \quad (\text{in basis points: } \text{Spread}_t \times 10,000)$$
- **Strict Lookahead Avoidance**:
  The rolling baseline mean $\mu_t$ and sample standard deviation $\sigma_t$ for day $t$ are computed **strictly on prior historical observations** $[t-W \dots t-1]$. The observation at day $t$ is **never** included in its own historical baseline.
  $$Z_t = \frac{\text{Spread}_t - \mu_{\text{prior}}}{\sigma_{\text{prior}}}$$

### C. Independent Filter Pipeline
Statistical anomalies do **not** automatically imply tradable opportunities:
1. **Liquidity Filter**: Evaluates volume and open interest proxies to reject illiquid contract days.
2. **Expiry & Tender Safety Filter**: Evaluates Days to Expiry (DTE) and enforces a pre-expiry tender notice cutoff ($\text{DTE} \le 3$ days) to prevent physical delivery obligations.
3. **Execution Cost Hurdle Filter**: Screens whether the spread deviation exceeds estimated round-trip trading friction.

### D. Indian Commodity Regulatory Cost Model
- **Brokerage Proxy**: 0.015% or ₹20/order
- **MCX Turnover Fee**: 0.0021% on total turnover
- **Commodity Transaction Tax (CTT)**: 0.01% on **sell turnover only** (non-agri commodity futures)
- **Stamp Duty**: 0.002% on **buy turnover only**
- **GST**: 18% on (Brokerage + Exchange Fees)
- **Bid-Ask Slippage**: Configurable basis points per leg (default 2.5 bps)

### E. Chronological Walk-Forward Backtester
- **Execution Timing**: Next-bar execution ($t+1$) prevents same-bar lookahead bias.
- **Position Sizing**: Equal fine-gram notional balance across both legs ensures pure gold-weight parity.
- **Directional Benchmark Separation**: Compares net relative-value cumulative returns against buy-and-hold gold, computing **Strategy Alpha**, **Beta to Gold ($\approx 0$)**, and **Correlation ($\approx 0$)** to prove true market neutrality.

### F. Visual Design System — Institutional Blue & White Palette
The application implements an institutional **Blue & White** financial terminal workstation aesthetic:
- **Royal & Cobalt Blue (`#2563EB`, `#1D4ED8`)**: Primary brand identity, geometric diamond emblem, primary action CTAs, key KPI highlights, and relative spread time-series curves.
- **Pure White (`#FFFFFF`)**: Crisp analytical card surfaces, modal dialog containers, table containers, and top/side navigation bars.
- **Ice Blue Wash (`#EFF6FF`, `#DBEAFE`)**: Active module selection background, soft pill badges, and secondary indicators with light blue borders (`#BFDBFE`).
- **Crisp Slate Canvas (`#F8FAFC`)**: Clean, light, distraction-free workstation background.
- **Deep Slate Navy Typography (`#0F172A`, `#334155`, `#64748B`)**: High-contrast AAA readability on pure white and light blue surfaces.
- **Clean Separators (`#E2E8F0`, `#F1F5F9`)**: Crisp borders and subtle gridlines.
- **Financial Typography**: Strict tabular numerals (`font-variant-numeric: tabular-nums`) for currency and basis-point alignment.

---

## 3. Quickstart & Local Setup

### Prerequisites
- Python 3.10+ (tested on Python 3.14)
- Node.js 18+ (tested on Node v24)
- npm 9+

### A. Start the Backend API
```powershell
cd backend
python -m pip install -r requirements.txt
python -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
```
The backend initializes the SQLite database schema and automatically loads the deterministic Hackathon demo dataset if the database is fresh.
- Interactive API Docs: [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs)
- Health Check: [http://127.0.0.1:8000/api/health](http://127.0.0.1:8000/api/health)

### B. Start the Frontend
In a separate terminal:
```powershell
cd frontend
npm install
npm run dev
```
Open [http://localhost:5173](http://localhost:5173) in your browser.

---

## 4. Running the Automated Test Suite

All financial and quantitative algorithms are covered by 25 unit and integration tests.

Run tests from the `backend/` directory:
```powershell
cd backend
python -m pytest -v
```

### Verified Test Results (25 Passed):
- `tests/test_metadata.py`: Contract specs, lot multipliers, fine gram factors (4 passed)
- `tests/test_normalizer.py`: Hand-calculated purity and unit normalization (5 passed)
- `tests/test_analytics.py`: Pair alignment, lookahead-free rolling Z-scores, DTE (3 passed)
- `tests/test_filters_and_cost.py`: Liquidity proxy, tender period hazard, CTT/Stamp duty (4 passed)
- `tests/test_backtest.py`: Walk-forward simulation, PnL math, next-bar timing (1 passed)
- `tests/test_ingestion.py`: Bhavcopy CSV parsing, compact expiries, duplicate detection (2 passed)
- `tests/test_api.py`: FastAPI endpoints integration (6 passed)

---

## 5. Hackathon Live Demo Workflow

During the Hack in Hills '26 presentation:

1. **Launch the Platform**: Open [http://localhost:5173](http://localhost:5173). The top bar indicates `DEMO SYNTHETIC FIXTURE` with 180+ trading days of historical data.
2. **Overview Dashboard**:
   - Inspect the KPI cards: 4 supported contracts, 720 observations, date coverage, strongest standardized deviation ($Z \ge 2.5\sigma$).
   - Review the Relative Spread chart with $\pm 2\sigma$ rolling confidence ribbons and anomaly markers.
   - Click on any finding in the **Recent Findings Table** to open the **Investigation Modal** showing why the anomaly triggered and its filter outcomes.
3. **Contract Explorer**:
   - Show the **Specification Parity Matrix** comparing `GOLDM`, `GOLDTEN`, `GOLDGUINEA`, and `GOLDPETAL`.
   - Use the **Live Price Normalization Inspector** to enter ₹74,500 for `GOLDM` and demonstrate how the 6-step audit trail converts it to ₹7,487.4372 per fine gram.
4. **Relative Value Engine**:
   - Toggle between contract pairs (`GOLDM vs GOLDPETAL`, `GOLDTEN vs GOLDGUINEA`).
   - Adjust the lookback slider ($W$) dynamically to show reactive re-calibration.
   - Inspect the standardized Z-score oscillator.
5. **Anomaly Scanner**:
   - Adjust the Z-threshold slider to filter elevated ($\ge 1.8\sigma$) vs extreme ($\ge 2.5\sigma$) dislocations.
   - Toggle the **Qualified Only** checkbox to see which statistical anomalies survive execution friction.
6. **Backtesting Lab**:
   - Click **Run Simulation** to execute the chronological walk-forward backtest.
   - Review the **Equity Curve** comparing Net Strategy Equity against the Gold Benchmark.
   - Point out the **Benchmark Separation Metrics**: Beta $\approx 0.0$ and Correlation $\approx 0.0$, demonstrating genuine market neutrality.
   - Scroll through the trade log with exact entry/exit Z-scores, costs, and exit reasons.
7. **Data Center**:
   - Demonstrate the Bhavcopy CSV upload workflow with schema validation and duplicate detection.
   - Explain the single-click **Load Demo Dataset** button for reliable offline judging.
8. **Methodology**:
   - Review the transparent mathematical equations, SEBI regulatory fee schedule, and financial glossary.

---

## 6. Real MCX Bhavcopy Data Ingestion

To ingest official MCX Bhavcopy data:
1. Download official daily Bhavcopy CSV files from the [MCX India](https://www.mcxindia.com) market operations portal.
2. Navigate to the **Data Center** tab in the Gold Intelligence platform.
3. Drag and drop the CSV file into the upload dropzone.
4. The system automatically:
   - Detects column header synonyms (`Date`, `Trade_Date`, `Symbol`, `Close_Price`, etc.).
   - Parses date formats (`DD-MM-YYYY`, `YYYY-MM-DD`, `05MAY2026`).
   - Validates supported symbols (`GOLDM`, `GOLDTEN`, `GOLDGUINEA`, `GOLDPETAL`).
   - Skips duplicate `(trading_date, symbol, expiry_date)` records.
   - Labels records as `VERIFIED MCX BHAVCOPY`.

---

## 7. Project Structure

```
gold-intelligence/
├── backend/
│   ├── app/
│   │   ├── api/               # FastAPI route controllers
│   │   ├── core/              # Quantitative analytics, normalizer, filters, backtest
│   │   ├── db/                # SQLite persistence repository & WAL mode connection
│   │   ├── models/            # Pydantic data transfer schemas
│   │   ├── config.py          # System constants & MCX cost parameters
│   │   └── main.py            # Application lifespan & router registration
│   ├── tests/                 # 25 automated pytest test cases
│   └── requirements.txt       # Python dependencies
├── frontend/
│   ├── src/
│   │   ├── api/client.ts      # Typed API client
│   │   ├── components/        # Interactive SVG charts, modals, layout
│   │   ├── pages/             # Overview, Contracts, RV, Scanner, Lab, DataCenter, Methodology
│   │   ├── types/             # TypeScript definitions
│   │   ├── App.tsx            # Main shell with deeplink routing
│   │   └── index.css          # Quantitative dark terminal styling
│   ├── package.json
│   ├── vite.config.ts
│   └── tsconfig.json
└── README.md
```

---

## 8. Known Limitations & Future Roadmap

- **Intraday Tick-Level Order Book**: The current engine uses daily closing Bhavcopy observations. A high-frequency WebSocket feed for Level 3 market depth is planned for post-hackathon deployment.
- **Physical Delivery Margining**: Tender-period safety rules currently reject contracts within 3 days of expiry. Explicit cash-versus-physical delivery margin modeling can be integrated.
- **Multi-Leg Basket Arbitrage**: Extending pairwise spread models to 3-contract and 4-contract cointegration vector error-correction models (VECM).
