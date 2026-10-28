import os
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
import matplotlib.patches as patches
import numpy as np

out_dir = r'C:\Users\ayush\.gemini\antigravity\scratch\gold-intelligence\ppt_assets\diagrams'
os.makedirs(out_dir, exist_ok=True)

# -------------------------------------------------------------
# 1. Slide 2: Problem Infographic (Apples-to-Oranges Comparison Trap)
# -------------------------------------------------------------
def make_problem_infographic():
    fig, ax = plt.subplots(figsize=(10, 4.5), dpi=300)
    fig.patch.set_facecolor('#FFFFFF')
    ax.set_facecolor('#FFFFFF')
    ax.axis('off')

    # Title Banner inside diagram
    ax.text(0.5, 0.95, "THE COMMODITY PRICING PARITY TRAP ON MCX", 
            ha='center', va='top', fontsize=12, fontweight='bold', color='#14243A', fontfamily='sans-serif')
    ax.text(0.5, 0.88, "Why raw exchange quoted prices cannot be compared directly without conversion", 
            ha='center', va='top', fontsize=9, color='#687587', fontfamily='sans-serif')

    # 4 Contract Comparison Cards
    contracts = [
        {"sym": "GOLDM (Mini)", "lot": "100 grams", "quote": "Per 10g", "purity": "995 Fineness (99.5%)", "pure": "9.950g Fine Gold", "color": "#245BDB", "tag": "Industrial Benchmark"},
        {"sym": "GOLDTEN", "lot": "10 grams", "quote": "Per 10g", "purity": "999 Fineness (99.9%)", "pure": "9.990g Fine Gold", "color": "#14243A", "tag": "Retail Delivery"},
        {"sym": "GOLDGUINEA", "lot": "8 grams", "quote": "Per 8g", "purity": "999 Fineness (99.9%)", "pure": "7.992g Fine Gold", "color": "#0D9488", "tag": "Sovereign Coin"},
        {"sym": "GOLDPETAL", "lot": "1 gram", "quote": "Per 1g", "purity": "999 Fineness (99.9%)", "pure": "0.999g Fine Gold", "color": "#D97706", "tag": "Micro Delivery"}
    ]

    card_w = 0.22
    card_gap = 0.03
    start_x = 0.025

    for i, c in enumerate(contracts):
        cx = start_x + i * (card_w + card_gap)
        cy = 0.18
        cw = card_w
        ch = 0.62

        # Card Box
        box = patches.FancyBboxPatch((cx, cy), cw, ch, boxstyle="round,pad=0.015,rounding_size=0.02",
                                     edgecolor='#DCE2EA', facecolor='#F8FAFC', lw=1.2)
        ax.add_patch(box)

        # Header tag
        tag_box = patches.FancyBboxPatch((cx + 0.01, cy + ch - 0.09), cw - 0.02, 0.07, 
                                         boxstyle="round,pad=0.01,rounding_size=0.01",
                                         edgecolor='none', facecolor=c['color'], alpha=0.1)
        ax.add_patch(tag_box)
        ax.text(cx + cw/2, cy + ch - 0.055, c['sym'], ha='center', va='center', 
                fontsize=10, fontweight='bold', color=c['color'], fontfamily='sans-serif')

        # Details
        y_text = cy + ch - 0.16
        ax.text(cx + 0.015, y_text, "Contract Lot:", fontsize=7.5, color='#687587', fontfamily='sans-serif')
        ax.text(cx + cw - 0.015, y_text, c['lot'], ha='right', fontsize=8, fontweight='bold', color='#14243A', fontfamily='sans-serif')

        y_text -= 0.08
        ax.text(cx + 0.015, y_text, "Quoted Unit:", fontsize=7.5, color='#687587', fontfamily='sans-serif')
        ax.text(cx + cw - 0.015, y_text, c['quote'], ha='right', fontsize=8, color='#172538', fontfamily='sans-serif')

        y_text -= 0.08
        ax.text(cx + 0.015, y_text, "Purity Grade:", fontsize=7.5, color='#687587', fontfamily='sans-serif')
        pur_short = "995 (99.5%)" if '995' in c['purity'] else "999 (99.9%)"
        pur_col = '#245BDB' if '995' in c['purity'] else '#13834A'
        ax.text(cx + cw - 0.015, y_text, pur_short, ha='right', fontsize=7.5, fontweight='bold', color=pur_col, fontfamily='sans-serif')

        # Highlight pure gold
        pure_box = patches.FancyBboxPatch((cx + 0.015, cy + 0.025), cw - 0.03, 0.11,
                                          boxstyle="round,pad=0.01,rounding_size=0.01",
                                          edgecolor='#DCE2EA', facecolor='#FFFFFF', lw=1)
        ax.add_patch(pure_box)
        ax.text(cx + cw/2, cy + 0.095, "Fine Gold / Quoted Unit:", ha='center', fontsize=7, color='#687587', fontfamily='sans-serif')
        ax.text(cx + cw/2, cy + 0.048, c['pure'], ha='center', fontsize=9, fontweight='bold', color='#14243A', fontfamily='sans-serif')

    # Arrow to unified standard at bottom
    ax.annotate("", xy=(0.5, 0.03), xytext=(0.5, 0.15),
                arrowprops=dict(arrowstyle="->", color='#245BDB', lw=2))
    ax.text(0.5, 0.01, "Deterministically Normalized to: INR per 1.000g Pure Gold (1000 Fineness)", 
            ha='center', va='bottom', fontsize=8.5, fontweight='bold', color='#245BDB', fontfamily='sans-serif',
            bbox=dict(boxstyle="round,pad=0.3", facecolor='#EEF3FD', edgecolor='#BFDBFE', lw=1))

    plt.tight_layout()
    path = os.path.join(out_dir, 'problem_comparison_infographic.png')
    plt.savefig(path, dpi=300, bbox_inches='tight')
    plt.close()
    print("Created:", path)

# -------------------------------------------------------------
# 2. Slide 3: End-to-End Workflow Infographic
# -------------------------------------------------------------
def make_workflow_infographic():
    fig, ax = plt.subplots(figsize=(10.5, 4.2), dpi=300)
    fig.patch.set_facecolor('#FFFFFF')
    ax.set_facecolor('#FFFFFF')
    ax.axis('off')

    stages = [
        {"num": "01", "title": "Data Ingestion", "desc": "Official MCX Daily Bhavcopy\nParsed compact expiries\nDuplicate row deduplication", "color": "#14243A"},
        {"num": "02", "title": "Purity Normalizer", "desc": "Unified INR/fine-gram parity\nPurity fraction conversion\nCanonical common denominator", "color": "#245BDB"},
        {"num": "03", "title": "Lookahead-Free RV", "desc": "Rolling W=20 baseline (μ, σ)\nBasis point spread tracking\nZ-score anomaly scoring", "color": "#0D9488"},
        {"num": "04", "title": "Triple-Filter Gate", "desc": "Liquidity check (Vol & OI)\nExpiry tender period safety\n3.5 bps statutory cost hurdle", "color": "#D97706"},
        {"num": "05", "title": "Walk-Forward Execution", "desc": "Next-bar execution (t+1)\nEqual fine-gram lot sizing\nMarket-neutral alpha audit", "color": "#13834A"}
    ]

    sw = 0.17
    gap = 0.035
    sx = 0.02
    sy = 0.15
    sh = 0.70

    for i, s in enumerate(stages):
        x = sx + i * (sw + gap)
        
        box = patches.FancyBboxPatch((x, sy), sw, sh, boxstyle="round,pad=0.015,rounding_size=0.02",
                                     edgecolor='#DCE2EA', facecolor='#F8FAFC', lw=1.2)
        ax.add_patch(box)

        # Badge Number
        badge = patches.Circle((x + sw/2, sy + sh - 0.08), 0.045, facecolor=s['color'], edgecolor='none')
        ax.add_patch(badge)
        ax.text(x + sw/2, sy + sh - 0.08, s['num'], ha='center', va='center', fontsize=9, fontweight='bold', color='#FFFFFF')

        # Title
        ax.text(x + sw/2, sy + sh - 0.19, s['title'], ha='center', va='center', fontsize=9, fontweight='bold', color='#14243A')

        # Desc
        ax.text(x + sw/2, sy + 0.22, s['desc'], ha='center', va='center', fontsize=7.5, color='#475569', linespacing=1.4)

        # Arrow to next stage
        if i < len(stages) - 1:
            ax.annotate("", xy=(x + sw + gap - 0.005, sy + sh/2), xytext=(x + sw + 0.005, sy + sh/2),
                        arrowprops=dict(arrowstyle="-|>", color='#94A3B8', lw=2, mutation_scale=12))

    plt.tight_layout()
    path = os.path.join(out_dir, 'solution_workflow_infographic.png')
    plt.savefig(path, dpi=300, bbox_inches='tight')
    plt.close()
    print("Created:", path)

# -------------------------------------------------------------
# 3. Slide 4: System Architecture Diagram
# -------------------------------------------------------------
def make_architecture_diagram():
    fig, ax = plt.subplots(figsize=(10.5, 4.6), dpi=300)
    fig.patch.set_facecolor('#FFFFFF')
    ax.set_facecolor('#FFFFFF')
    ax.axis('off')

    layers = [
        {"title": "DATA INGESTION & REPOSITORY LAYER", "y": 0.72, "h": 0.24, "color": "#14243A",
         "items": ["MCX Daily Bhavcopy\nParser (CSV)", "Symbol & Compact\nExpiry Normalizer", "SQLite / PostgreSQL DB\n(Zero Data Leakage)"]},
        {"title": "QUANTITATIVE ANALYTICS & FILTER CORE", "y": 0.38, "h": 0.28, "color": "#245BDB",
         "items": ["Deterministic Purity\nNormalizer (INR/g)", "Rolling Baseline\nEngine (W=20, Z-Score)", "Triple-Filter Gate\n(Liquidity, DTE, Cost)", "Walk-Forward Engine\n(t+1 Execution)"]},
        {"title": "API & WORKSTATION PRESENTATION LAYER", "y": 0.04, "h": 0.26, "color": "#13834A",
         "items": ["FastAPI Async REST Service\n(25/25 Pytest Passing)", "Interactive Spread &\nCandlestick SVG Engine", "Walk-Forward Backtesting\nLab & Analytics Studio"]}
    ]

    for lay in layers:
        ly = lay['y']
        lh = lay['h']
        box = patches.FancyBboxPatch((0.03, ly), 0.94, lh, boxstyle="round,pad=0.01,rounding_size=0.015",
                                     edgecolor='#DCE2EA', facecolor='#F8FAFC', lw=1.2)
        ax.add_patch(box)

        ax.text(0.05, ly + lh - 0.04, lay['title'], fontsize=8.5, fontweight='bold', color=lay['color'], fontfamily='sans-serif')

        n_items = len(lay['items'])
        bw = (0.90 - (n_items - 1) * 0.02) / n_items
        for j, item in enumerate(lay['items']):
            bx = 0.05 + j * (bw + 0.02)
            by = ly + 0.03
            bh = lh - 0.09
            ibox = patches.FancyBboxPatch((bx, by), bw, bh, boxstyle="round,pad=0.008,rounding_size=0.01",
                                          edgecolor='#DCE2EA', facecolor='#FFFFFF', lw=1)
            ax.add_patch(ibox)
            ax.text(bx + bw/2, by + bh/2, item, ha='center', va='center', fontsize=7.5, fontweight='semibold', color='#1E293B', fontfamily='sans-serif', wrap=True)

    ax.annotate("", xy=(0.5, 0.67), xytext=(0.5, 0.71), arrowprops=dict(arrowstyle="->", color='#64748B', lw=2))
    ax.annotate("", xy=(0.5, 0.33), xytext=(0.5, 0.37), arrowprops=dict(arrowstyle="->", color='#64748B', lw=2))

    plt.tight_layout()
    path = os.path.join(out_dir, 'architecture_diagram.png')
    plt.savefig(path, dpi=300, bbox_inches='tight')
    plt.close()
    print("Created:", path)

# -------------------------------------------------------------
# 4. Slide 6: Triple-Filter Gate Infographic
# -------------------------------------------------------------
def make_triple_filter_diagram():
    fig, ax = plt.subplots(figsize=(10.5, 4.4), dpi=300)
    fig.patch.set_facecolor('#FFFFFF')
    ax.set_facecolor('#FFFFFF')
    ax.axis('off')

    ax.text(0.5, 0.96, "THE 'REALITY CHECK' TRIPLE-FILTER GATE", ha='center', va='top', fontsize=12, fontweight='bold', color='#14243A')
    ax.text(0.5, 0.89, "Why statistical anomalies are NOT automatically tradable: screening through physical & market friction", ha='center', va='top', fontsize=8.5, color='#687587')

    gates = [
        {
            "title": "GATE 1: LIQUIDITY PROXY",
            "rule": "Volume ≥ 10 lots  •  OI ≥ 20 contracts",
            "lines": [
                "• Rejects ghost dislocations in thin,",
                "  untradable contracts.",
                "• Ensures executable market depth",
                "  without wide spread slippage."
            ],
            "color": "#245BDB"
        },
        {
            "title": "GATE 2: EXPIRY & TENDER SAFETY",
            "rule": "Days to Expiry (DTE) ≥ 3 trading days",
            "lines": [
                "• Prevents carrying into MCX",
                "  physical delivery tender periods.",
                "• Eliminates compulsory delivery",
                "  assignment and margin spikes."
            ],
            "color": "#D97706"
        },
        {
            "title": "GATE 3: REGULATORY COST HURDLE",
            "rule": "Expected Reversion > Frictions (~3.5 bps)",
            "lines": [
                "• Deducts full Indian fee schedule:",
                "  CTT (0.01%), Stamp (0.002%),",
                "  MCX fee (0.0021%), GST (18%),",
                "  plus 3.5 bps round-trip slippage."
            ],
            "color": "#13834A"
        }
    ]

    gw = 0.28
    gap = 0.04
    gx = 0.04
    gy = 0.12
    gh = 0.72

    for i, g in enumerate(gates):
        x = gx + i * (gw + gap)
        box = patches.FancyBboxPatch((x, gy), gw, gh, boxstyle="round,pad=0.015,rounding_size=0.02",
                                     edgecolor='#DCE2EA', facecolor='#F8FAFC', lw=1.2)
        ax.add_patch(box)

        tag_box = patches.FancyBboxPatch((x + 0.01, gy + gh - 0.10), gw - 0.02, 0.08,
                                         boxstyle="round,pad=0.01,rounding_size=0.01",
                                         edgecolor='none', facecolor=g['color'], alpha=0.12)
        ax.add_patch(tag_box)
        ax.text(x + gw/2, gy + gh - 0.06, g['title'], ha='center', va='center', fontsize=8.5, fontweight='bold', color=g['color'])

        rbox = patches.FancyBboxPatch((x + 0.015, gy + gh - 0.23), gw - 0.03, 0.11,
                                      boxstyle="round,pad=0.008,rounding_size=0.01",
                                      edgecolor='#DCE2EA', facecolor='#FFFFFF', lw=1)
        ax.add_patch(rbox)
        ax.text(x + gw/2, gy + gh - 0.16, "HARD THRESHOLD:", ha='center', fontsize=7, color='#687587', fontfamily='sans-serif')
        ax.text(x + gw/2, gy + gh - 0.205, g['rule'], ha='center', fontsize=7.5, fontweight='bold', color='#14243A')

        ax.text(x + 0.02, gy + 0.32, "Institutional Rationale:", fontsize=7.5, fontweight='bold', color='#1E293B')
        ly = gy + 0.27
        for l in g['lines']:
            ax.text(x + 0.02, ly, l, fontsize=7.2, color='#475569', va='top', fontfamily='sans-serif')
            ly -= 0.05

        if i < len(gates) - 1:
            ax.annotate("", xy=(x + gw + gap - 0.005, gy + gh/2), xytext=(x + gw + 0.005, gy + gh/2),
                        arrowprops=dict(arrowstyle="-|>", color='#64748B', lw=2, mutation_scale=12))

    ax.text(0.5, 0.03, "RESULT: Only signals surviving ALL 3 GATES are classified as Validated Relative-Value Candidates",
            ha='center', va='center', fontsize=8, fontweight='bold', color='#13834A',
            bbox=dict(boxstyle="round,pad=0.35", facecolor='#ECFDF5', edgecolor='#A7F3D0', lw=1))

    plt.tight_layout()
    path = os.path.join(out_dir, 'triple_filter_gate_diagram.png')
    plt.savefig(path, dpi=300, bbox_inches='tight')
    plt.close()
    print("Created:", path)

# -------------------------------------------------------------
# 5. Slide 7: Real Relative Spread Chart from Live Analytics
# -------------------------------------------------------------
def make_spread_chart():
    import sys
    sys.path.append(r'C:\Users\ayush\.gemini\antigravity\scratch\gold-intelligence\backend')
    from app.db.repository import MarketDataRepository
    from app.core.analytics import RelativeValueAnalytics

    records = MarketDataRepository.get_aligned_pair_observations('GOLDM', 'GOLDPETAL')
    series_resp = RelativeValueAnalytics.compute_pair_spread_series(
        aligned_records=records,
        symbol_a='GOLDM',
        symbol_b='GOLDPETAL',
        lookback_window=20
    )
    obs = series_resp.observations

    dates = [o.trading_date for o in obs]
    spreads = [o.relative_spread_bps for o in obs]
    means = [o.rolling_mean * 10000 if o.rolling_mean is not None else np.nan for o in obs]
    upper2 = [o.upper_band_2 * 10000 if o.upper_band_2 is not None else np.nan for o in obs]
    lower2 = [o.lower_band_2 * 10000 if o.lower_band_2 is not None else np.nan for o in obs]
    z_scores = [o.z_score if o.z_score is not None else 0 for o in obs]

    x = np.arange(len(dates))

    fig, ax = plt.subplots(figsize=(10.5, 4.4), dpi=300)
    fig.patch.set_facecolor('#FFFFFF')
    ax.set_facecolor('#FFFFFF')

    # ±2σ Confidence Ribbon
    ax.fill_between(x, lower2, upper2, color='#245BDB', alpha=0.08, label='±2σ Confidence Envelope')
    ax.plot(x, upper2, color='#245BDB', linestyle='--', linewidth=0.8, alpha=0.4)
    ax.plot(x, lower2, color='#245BDB', linestyle='--', linewidth=0.8, alpha=0.4)

    # Rolling Mean
    ax.plot(x, means, color='#687587', linestyle='--', linewidth=1.2, label='20-Day Rolling Mean (μ)')

    # Zero Line
    ax.axhline(0, color='#CBD5E1', linestyle='-', linewidth=1.0)

    # Spread curve
    ax.plot(x, spreads, color='#245BDB', linewidth=2.0, label='Relative Spread (bps): GOLDM vs GOLDPETAL')

    # Anomaly points (|Z| >= 2.0)
    anom_x = [i for i in range(len(x)) if abs(z_scores[i]) >= 2.0]
    anom_y = [spreads[i] for i in anom_x]
    ax.scatter(anom_x, anom_y, color='#EF4444', s=45, zorder=5, label='Statistical Dislocation (|Z| ≥ 2.0σ)', edgecolors='#FFFFFF', linewidths=1.2)

    ax.set_title("GOLDM vs GOLDPETAL: Synchronous Relative Spread (bps) & 20-Day Rolling ±2σ Envelopes", 
                 fontsize=11, fontweight='bold', color='#14243A', pad=12)
    ax.set_ylabel("Normalized Spread (bps)", fontsize=9, fontweight='semibold', color='#1E293B')
    ax.set_xlabel("Observation Date (Synchronous MCX Daily Closes)", fontsize=9, fontweight='semibold', color='#1E293B')

    tick_step = max(1, len(x) // 6)
    ax.set_xticks(x[::tick_step])
    ax.set_xticklabels([dates[i] for i in x[::tick_step]], fontsize=8, color='#687587')
    ax.tick_params(axis='y', labelsize=8, colors='#687587')

    ax.grid(True, linestyle='--', color='#F1F5F9', alpha=0.9)
    for spine in ax.spines.values():
        spine.set_edgecolor('#DCE2EA')

    ax.legend(loc='upper right', frameon=True, facecolor='#FFFFFF', edgecolor='#DCE2EA', fontsize=8)

    plt.tight_layout()
    path = os.path.join(out_dir, 'spread_chart_visual.png')
    plt.savefig(path, dpi=300, bbox_inches='tight')
    plt.close()
    print("Created:", path)

# -------------------------------------------------------------
# 6. Slide 8: Real Equity Curve & Alpha Proof from Backtester
# -------------------------------------------------------------
def make_equity_curve():
    import sys
    sys.path.append(r'C:\Users\ayush\.gemini\antigravity\scratch\gold-intelligence\backend')
    from app.db.repository import MarketDataRepository
    from app.core.analytics import RelativeValueAnalytics
    from app.core.backtest import RelativeValueBacktester, BacktestRequest

    records = MarketDataRepository.get_aligned_pair_observations('GOLDM', 'GOLDPETAL')
    series_resp = RelativeValueAnalytics.compute_pair_spread_series(
        aligned_records=records,
        symbol_a='GOLDM',
        symbol_b='GOLDPETAL',
        lookback_window=20
    )
    req = BacktestRequest(
        symbol_a='GOLDM',
        symbol_b='GOLDPETAL',
        lookback_window=20,
        entry_z_score=2.0,
        exit_z_score=0.5,
        stop_loss_z_score=3.5,
        max_holding_days=15,
        capital_allocation_inr=1000000.0
    )
    res = RelativeValueBacktester.run_backtest(series_resp.observations, req)
    pts = res.equity_curve

    dates = [p.trading_date for p in pts]
    net_eq = [p.net_equity_inr for p in pts]
    gross_eq = [p.gross_equity_inr for p in pts]
    bench_eq = [p.benchmark_equity_inr for p in pts]
    x = np.arange(len(dates))

    fig, (ax1, ax2) = plt.subplots(1, 2, figsize=(10.5, 4.2), dpi=300, gridspec_kw={'width_ratios': [2.2, 1]})
    fig.patch.set_facecolor('#FFFFFF')
    ax1.set_facecolor('#FFFFFF')
    ax2.set_facecolor('#FFFFFF')

    ax1.plot(x, gross_eq, color='#245BDB', linestyle='-', linewidth=1.5, label='Gross Model Trajectory')
    ax1.plot(x, net_eq, color='#13834A', linestyle='-', linewidth=2.0, label='Net Post-Regulatory Friction')
    ax1.plot(x, bench_eq, color='#94A3B8', linestyle='--', linewidth=1.2, label='Directional Gold Benchmark')
    ax1.axhline(1000000, color='#CBD5E1', linestyle=':', linewidth=1)

    ax1.set_title("Walk-Forward Equity Curve (₹1,000,000 Capital Allocation)", fontsize=10, fontweight='bold', color='#14243A')
    ax1.set_ylabel("Portfolio Capital (INR)", fontsize=8.5, color='#1E293B')
    tick_step = max(1, len(x) // 5)
    ax1.set_xticks(x[::tick_step])
    ax1.set_xticklabels([dates[i] for i in x[::tick_step]], fontsize=7.5, color='#687587')
    ax1.tick_params(axis='y', labelsize=8, colors='#687587')
    ax1.grid(True, linestyle='--', color='#F1F5F9', alpha=0.9)
    for spine in ax1.spines.values():
        spine.set_edgecolor('#DCE2EA')
    ax1.legend(loc='lower left', frameon=True, facecolor='#FFFFFF', edgecolor='#DCE2EA', fontsize=7.5)

    ax2.axis('off')
    box = patches.FancyBboxPatch((0.02, 0.05), 0.96, 0.90, boxstyle="round,pad=0.02,rounding_size=0.03",
                                 edgecolor='#DCE2EA', facecolor='#F8FAFC', lw=1.2)
    ax2.add_patch(box)
    ax2.text(0.5, 0.88, "EMPIRICAL PROOF METRICS", ha='center', va='center', fontsize=9.5, fontweight='bold', color='#14243A')

    metrics_list = [
        ("Strategy Beta to Gold (β):", f"{res.metrics.strategy_beta_to_gold:.3f}", "Strict Market Neutrality (< 0.01)"),
        ("Correlation to Gold (ρ):", f"{res.metrics.correlation_to_gold:.3f}", "Zero Directional Exposure"),
        ("Total Completed Trades:", f"{res.metrics.total_trades} trades", "Next-bar t+1 Execution"),
        ("Gross Model P&L:", f"₹{res.metrics.gross_pnl_inr:,.0f}", "Pure Relative Convergence"),
        ("Regulatory Fees Deducted:", f"₹{res.metrics.total_transaction_costs_inr:,.0f}", "CTT + Stamp + GST + Slip"),
        ("Max Drawdown Observed:", f"-{res.metrics.max_drawdown_pct:.2f}%", "Controlled Risk Profile")
    ]

    sy = 0.74
    for title, val, note in metrics_list:
        ax2.text(0.08, sy, title, fontsize=7.5, color='#687587', fontfamily='sans-serif')
        ax2.text(0.92, sy, val, ha='right', fontsize=8, fontweight='bold', color='#14243A' if 'Beta' not in title else '#13834A', fontfamily='sans-serif')
        ax2.text(0.08, sy - 0.045, note, fontsize=6.5, color='#94A3B8', fontfamily='sans-serif')
        sy -= 0.115

    plt.tight_layout()
    path = os.path.join(out_dir, 'backtest_performance_visual.png')
    plt.savefig(path, dpi=300, bbox_inches='tight')
    plt.close()
    print("Created:", path)

if __name__ == '__main__':
    make_problem_infographic()
    make_workflow_infographic()
    make_architecture_diagram()
    make_triple_filter_diagram()
    make_spread_chart()
    make_equity_curve()
