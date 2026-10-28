"""
Liquidity and Expiry Independent Filter Engine.
Evaluates volume, open interest, contract roll proximity, and delivery safety.
"""
from typing import Dict, Any, Optional
from app.models.schemas import FilterEvaluation


class QuantitativeFilters:
    """Evaluates whether a relative-value anomaly meets execution viability criteria."""

    @staticmethod
    def evaluate_liquidity(
        volume_a: int,
        volume_b: int,
        oi_a: int,
        oi_b: int,
        min_volume: int = 10,
        min_oi: int = 20
    ) -> FilterEvaluation:
        """
        Evaluate market liquidity using volume and open interest proxies.
        Note: Volume/OI are screening proxies, not proof of order book depth.
        """
        if volume_a is None or volume_b is None:
            return FilterEvaluation(
                passed=False,
                status="INSUFFICIENT_DATA",
                reason="Volume data unavailable in source Bhavcopy.",
                metric_name="volume",
                observed_value={"volume_a": volume_a, "volume_b": volume_b},
                threshold_value={"min_volume": min_volume}
            )

        min_observed_vol = min(volume_a, volume_b)
        min_observed_oi = min(oi_a, oi_b)

        if volume_a >= min_volume and volume_b >= min_volume and oi_a >= min_oi and oi_b >= min_oi:
            return FilterEvaluation(
                passed=True,
                status="PASS",
                reason=f"Adequate liquidity: Leg A vol={volume_a}, OI={oi_a}; Leg B vol={volume_b}, OI={oi_b}.",
                metric_name="volume_and_oi",
                observed_value={"vol_a": volume_a, "vol_b": volume_b, "oi_a": oi_a, "oi_b": oi_b},
                threshold_value={"min_vol": min_volume, "min_oi": min_oi}
            )
        elif volume_a >= min_volume and volume_b >= min_volume:
            return FilterEvaluation(
                passed=True,
                status="WARN",
                reason=f"Volume passed (A={volume_a}, B={volume_b}), but Open Interest is thin (min OI={min_observed_oi} < {min_oi}).",
                metric_name="open_interest",
                observed_value={"oi_a": oi_a, "oi_b": oi_b},
                threshold_value={"min_oi": min_oi}
            )
        else:
            return FilterEvaluation(
                passed=False,
                status="FAIL",
                reason=f"Insufficient trading volume: Min observed volume {min_observed_vol} is below threshold {min_volume}.",
                metric_name="volume",
                observed_value={"volume_a": volume_a, "volume_b": volume_b},
                threshold_value={"min_volume": min_volume}
            )

    @staticmethod
    def evaluate_expiry(
        dte_a: int,
        dte_b: int,
        min_days_to_expiry: int = 3,
        max_expiry_divergence_days: int = 65
    ) -> FilterEvaluation:
        """
        Evaluate contract expiry compatibility and tender period risk.
        Rejects contracts in the tender/delivery window or with mismatched cycles.
        """
        min_dte = min(dte_a, dte_b)
        dte_diff = abs(dte_a - dte_b)

        if min_dte <= 0:
            return FilterEvaluation(
                passed=False,
                status="FAIL",
                reason=f"Contract is at or past expiration (DTE A: {dte_a}d, DTE B: {dte_b}d).",
                metric_name="days_to_expiry",
                observed_value={"dte_a": dte_a, "dte_b": dte_b},
                threshold_value={"min_dte": min_days_to_expiry}
            )

        if min_dte < min_days_to_expiry:
            return FilterEvaluation(
                passed=False,
                status="FAIL",
                reason=f"Tender period safety hazard: Contract expires in {min_dte} days (cutoff: {min_days_to_expiry} days).",
                metric_name="tender_cutoff",
                observed_value={"min_dte": min_dte},
                threshold_value={"min_dte": min_days_to_expiry}
            )

        if dte_diff > max_expiry_divergence_days:
            return FilterEvaluation(
                passed=False,
                status="FAIL",
                reason=f"Incompatible expiry horizons: {dte_diff} days divergence between Leg A ({dte_a}d) and Leg B ({dte_b}d).",
                metric_name="expiry_mismatch",
                observed_value={"dte_a": dte_a, "dte_b": dte_b, "divergence": dte_diff},
                threshold_value={"max_divergence": max_expiry_divergence_days}
            )

        if min_dte < 7:
            return FilterEvaluation(
                passed=True,
                status="WARN",
                reason=f"Near expiry roll warning: Contract expires in {min_dte} days. Monitor roll liquidity.",
                metric_name="near_expiry",
                observed_value={"dte_a": dte_a, "dte_b": dte_b},
                threshold_value={"warning_dte": 7}
            )

        return FilterEvaluation(
            passed=True,
            status="PASS",
            reason=f"Viable expiry profile: Leg A has {dte_a} DTE, Leg B has {dte_b} DTE (divergence: {dte_diff}d).",
            metric_name="days_to_expiry",
            observed_value={"dte_a": dte_a, "dte_b": dte_b},
            threshold_value={"min_dte": min_days_to_expiry}
        )

    @staticmethod
    def evaluate_cost_hurdle(
        abs_spread_bps: float,
        estimated_round_trip_cost_bps: float
    ) -> FilterEvaluation:
        """
        Check whether the statistical spread deviation exceeds estimated round-trip transaction costs.
        """
        if abs_spread_bps > estimated_round_trip_cost_bps * 1.5:
            return FilterEvaluation(
                passed=True,
                status="PASS",
                reason=f"Spread deviation ({abs_spread_bps:.1f} bps) exceeds estimated round-trip friction ({estimated_round_trip_cost_bps:.1f} bps).",
                metric_name="cost_hurdle",
                observed_value={"spread_bps": round(abs_spread_bps, 1)},
                threshold_value={"estimated_cost_bps": round(estimated_round_trip_cost_bps, 1)}
            )
        elif abs_spread_bps > estimated_round_trip_cost_bps:
            return FilterEvaluation(
                passed=True,
                status="WARN",
                reason=f"Marginal edge: Spread deviation ({abs_spread_bps:.1f} bps) barely covers estimated friction ({estimated_round_trip_cost_bps:.1f} bps).",
                metric_name="cost_hurdle",
                observed_value={"spread_bps": round(abs_spread_bps, 1)},
                threshold_value={"estimated_cost_bps": round(estimated_round_trip_cost_bps, 1)}
            )
        else:
            return FilterEvaluation(
                passed=False,
                status="FAIL",
                reason=f"Friction absorption: Deviation ({abs_spread_bps:.1f} bps) is smaller than estimated round-trip costs ({estimated_round_trip_cost_bps:.1f} bps).",
                metric_name="cost_hurdle",
                observed_value={"spread_bps": round(abs_spread_bps, 1)},
                threshold_value={"estimated_cost_bps": round(estimated_round_trip_cost_bps, 1)}
            )
