"""
Methodology, Quantitative Foundations, and Active System Configuration Endpoints.
Provides clear mathematical explanations, formulas, glossaries, and assumptions.
"""
from fastapi import APIRouter
from app.config import (
    DEFAULT_ROLLING_WINDOW, DEFAULT_ENTRY_THRESHOLD, DEFAULT_EXIT_THRESHOLD,
    DEFAULT_STOP_LOSS_THRESHOLD, DEFAULT_MAX_HOLDING_DAYS, DEFAULT_BROKERAGE_PCT,
    DEFAULT_EXCHANGE_FEE_PCT, DEFAULT_CTT_PCT, DEFAULT_GST_PCT, DEFAULT_STAMP_DUTY_PCT,
    DEFAULT_SLIPPAGE_BPS, APP_VERSION
)

router = APIRouter()


@router.get("/methodology/summary")
def get_methodology_summary():
    """
    Returns the complete quantitative methodology documentation, mathematical equations,
    and active default model assumptions.
    """
    return {
        "title": "Gold Intelligence Quantitative Methodology",
        "version": APP_VERSION,
        "core_thesis": (
            "The platform evaluates whether one MCX gold contract is behaving unusually relative "
            "to another related contract, and whether that deviation is statistically meaningful "
            "after accounting for contract specifications, liquidity, expiry, and transaction costs."
        ),
        "normalization": {
            "title": "Price Normalization Engine",
            "concept": (
                "Raw MCX contract quotes cannot be directly compared because they represent different "
                "lot sizes, quotation bases, and physical purity fineness standards."
            ),
            "formula_canonical": "P_fine_gram = P_quoted / (Quote_Unit_Grams * (Stated_Purity / 1000.0))",
            "formula_benchmark_10g_999": "P_10g_999 = P_fine_gram * (10.0 * 0.999)",
            "contract_specifications": {
                "GOLDM": "Quoted per 10g, 995 fineness -> 9.95 fine grams per quote unit.",
                "GOLDTEN": "Quoted per 10g, 999 fineness -> 9.99 fine grams per quote unit.",
                "GOLDGUINEA": "Quoted per 8g, 999 fineness -> 7.992 fine grams per quote unit.",
                "GOLDPETAL": "Quoted per 1g, 999 fineness -> 0.999 fine grams per quote unit."
            }
        },
        "relative_spread": {
            "title": "Normalized Relative Spread",
            "formula": "Relative_Spread_t = (P_A_fine,t / P_B_fine,t) - 1.0",
            "basis_points_formula": "Spread_BPS_t = Relative_Spread_t * 10,000",
            "explanation": (
                "Measures the percentage premium or discount of Leg A relative to Leg B on an identical "
                "100% fine gold basis."
            )
        },
        "rolling_statistics": {
            "title": "Look-Ahead-Free Rolling Baselines",
            "formula_mean": "mu_t = (1 / W) * sum_{i=1}^{W} Spread_{t-i}",
            "formula_std": "sigma_t = sqrt((1 / (W - 1)) * sum_{i=1}^{W} (Spread_{t-i} - mu_t)^2)",
            "formula_zscore": "Z_t = (Spread_t - mu_t) / sigma_t",
            "lookahead_prevention": (
                "Crucially, the rolling baseline for day t is computed strictly on prior days [t-W ... t-1]. "
                "Day t is never included in its own historical baseline."
            )
        },
        "filters": {
            "liquidity": "Volume and open interest thresholds filter out illiquid contract dates.",
            "expiry": (
                "Days-to-Expiry (DTE) filter rejects contracts in the tender/delivery window (DTE <= 3d) "
                "and flags excessive cycle mismatch (> 65d divergence)."
            ),
            "cost_hurdle": "Rejects statistical anomalies where observed spread is smaller than estimated round-trip friction."
        },
        "cost_model": {
            "brokerage_pct": DEFAULT_BROKERAGE_PCT,
            "exchange_fee_pct": DEFAULT_EXCHANGE_FEE_PCT,
            "ctt_pct": DEFAULT_CTT_PCT,
            "gst_pct": DEFAULT_GST_PCT,
            "stamp_duty_pct": DEFAULT_STAMP_DUTY_PCT,
            "slippage_bps": DEFAULT_SLIPPAGE_BPS,
            "notes": "CTT applies to sell turnover only; Stamp duty applies to buy turnover only."
        },
        "backtesting": {
            "execution": "Next-observation execution: Signal on bar t executes on bar t+1.",
            "position_sizing": "Equal notional allocation across both legs for true fine-gram parity.",
            "exits": "Mean reversion (Z <= exit_threshold), Stop Loss (Z >= stop_threshold), Max Holding (15 days), Expiry Safety (DTE <= 2 days)."
        },
        "glossary": [
            {"term": "Fineness / Purity", "definition": "Parts per thousand of pure gold (e.g. 995 fineness = 99.5% pure gold, 999 = 99.9%)."},
            {"term": "Quotation Basis", "definition": "The official physical quantity in grams against which the rupee price is published by MCX."},
            {"term": "Relative Spread", "definition": "The proportional price divergence between two normalized contract series expressed in basis points (1 bp = 0.01%)."},
            {"term": "Z-Score", "definition": "Number of standard deviations an observed relative spread deviates from its rolling historical baseline."},
            {"term": "Days to Expiry (DTE)", "definition": "Calendar days remaining until contract expiry on MCX."},
            {"term": "Tender Period", "definition": "Pre-expiry notice window during which delivery intentions are submitted and physical delivery obligations may arise."},
            {"term": "CTT", "definition": "Commodity Transaction Tax levied by the Government of India on non-agricultural commodity futures sell turnover."}
        ]
    }
