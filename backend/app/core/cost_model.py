"""
MCX Derivative Transaction Cost Engine.
Calculates realistic regulatory fees, exchange charges, CTT, GST, stamp duty,
brokerage, and bid-ask slippage.
"""
from typing import Dict, Any
from app.models.schemas import CostModelSettings


class TransactionCostEngine:
    """Computes transparent gross-to-net execution friction for relative value trades."""

    @classmethod
    def calculate_trade_friction(
        cls,
        notional_entry_a: float,
        notional_exit_a: float,
        notional_entry_b: float,
        notional_exit_b: float,
        direction: str,  # "SHORT_A_LONG_B" or "LONG_A_SHORT_B"
        settings: CostModelSettings
    ) -> Dict[str, float]:
        """
        Calculate total execution costs across both legs for entry and exit.
        
        Rules:
        - CTT (Commodity Transaction Tax) is levied ONLY on SELL turnover at 0.01%.
        - Stamp Duty is levied ONLY on BUY turnover at 0.002%.
        - Exchange turnover charges apply to both buy and sell.
        - Brokerage applies to both buy and sell.
        - GST applies to (Brokerage + Exchange charges).
        - Slippage applies to total turnover.
        """
        # Determine buy and sell sides
        if direction == "SHORT_A_LONG_B":
            # Leg A: Sell entry, Buy exit
            turnover_sell_a = notional_entry_a
            turnover_buy_a = notional_exit_a
            # Leg B: Buy entry, Sell exit
            turnover_buy_b = notional_entry_b
            turnover_sell_b = notional_exit_b
        else:
            # Leg A: Buy entry, Sell exit
            turnover_buy_a = notional_entry_a
            turnover_sell_a = notional_exit_a
            # Leg B: Sell entry, Buy exit
            turnover_sell_b = notional_entry_b
            turnover_buy_b = notional_exit_b

        total_buy_turnover = turnover_buy_a + turnover_buy_b
        total_sell_turnover = turnover_sell_a + turnover_sell_b
        total_turnover = total_buy_turnover + total_sell_turnover

        # 1. Brokerage
        brokerage = total_turnover * settings.brokerage_pct

        # 2. MCX Exchange Turnover Fees
        exchange_fees = total_turnover * settings.exchange_fee_pct

        # 3. CTT (0.01% on Sell turnover)
        ctt = total_sell_turnover * settings.ctt_pct

        # 4. Stamp Duty (0.002% on Buy turnover)
        stamp_duty = total_buy_turnover * settings.stamp_duty_pct

        # 5. GST (18% on Brokerage + Exchange Fees)
        gst = (brokerage + exchange_fees) * settings.gst_pct

        # 6. Bid-ask slippage per leg
        slippage_pct = (settings.slippage_bps_per_leg * 2) / 10000.0  # round trip
        slippage_cost = total_turnover * (settings.slippage_bps_per_leg / 10000.0)

        total_statutory_and_brokerage = brokerage + exchange_fees + ctt + stamp_duty + gst
        total_friction = total_statutory_and_brokerage + slippage_cost

        return {
            "total_turnover": round(total_turnover, 2),
            "brokerage": round(brokerage, 2),
            "exchange_fees": round(exchange_fees, 2),
            "ctt": round(ctt, 2),
            "stamp_duty": round(stamp_duty, 2),
            "gst": round(gst, 2),
            "slippage_cost": round(slippage_cost, 2),
            "total_cost": round(total_friction, 2),
            "total_cost_bps": round((total_friction / total_turnover) * 10000.0, 2) if total_turnover > 0 else 0.0
        }

    @classmethod
    def estimate_round_trip_bps(cls, settings: CostModelSettings) -> float:
        """Estimate standard round-trip hurdle in basis points for filter screening."""
        # Baseline rough hurdle in bps:
        # Brokerage round-trip ~ 3 bps
        # Exchange fee round-trip ~ 0.4 bps
        # CTT (half-turnover) ~ 1.0 bps
        # Stamp duty (half-turnover) ~ 0.2 bps
        # GST ~ 0.6 bps
        # Slippage ~ 5 bps
        # Total ~ 10-12 bps
        brokerage_bps = settings.brokerage_pct * 10000.0
        exchange_bps = settings.exchange_fee_pct * 10000.0
        ctt_bps = (settings.ctt_pct / 2.0) * 10000.0
        stamp_bps = (settings.stamp_duty_pct / 2.0) * 10000.0
        gst_bps = ((brokerage_bps + exchange_bps) * settings.gst_pct)
        slippage_bps = settings.slippage_bps_per_leg * 2.0

        return brokerage_bps + exchange_bps + ctt_bps + stamp_bps + gst_bps + slippage_bps
