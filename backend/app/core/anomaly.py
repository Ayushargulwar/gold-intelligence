"""
Statistical Anomaly Scanner Engine.
Identifies relative-value pricing dislocations and subjects them to
independent liquidity, expiry, and transaction cost qualification hurdles.
"""
from typing import List, Optional
from app.models.schemas import (
    SpreadObservation, AnomalyFinding, AnomalyScanRequest, CostModelSettings
)
from app.core.filters import QuantitativeFilters
from app.core.cost_model import TransactionCostEngine


class AnomalyScannerEngine:
    """Scans and qualifies statistical relative-value anomalies."""

    @classmethod
    def scan_observations(
        cls,
        observations: List[SpreadObservation],
        params: AnomalyScanRequest,
        cost_settings: Optional[CostModelSettings] = None
    ) -> List[AnomalyFinding]:
        """
        Scan spread observations and generate qualified anomaly findings.
        """
        if cost_settings is None:
            cost_settings = CostModelSettings()

        estimated_hurdle_bps = TransactionCostEngine.estimate_round_trip_bps(cost_settings)
        findings: List[AnomalyFinding] = []

        for idx, obs in enumerate(observations):
            if obs.z_score is None:
                continue

            z_abs = abs(obs.z_score)
            if z_abs < params.z_threshold:
                continue

            # Deviation classification
            if z_abs >= 2.5:
                classification = "EXTREME_DEVIATION"
            elif z_abs >= 1.8:
                classification = "ELEVATED_DEVIATION"
            else:
                classification = "NORMAL"

            # Directional relative-value implication
            if obs.z_score > 0:
                direction = f"{obs.symbol_a} Rich / {obs.symbol_b} Cheap (Short {obs.symbol_a}, Long {obs.symbol_b})"
            else:
                direction = f"{obs.symbol_a} Cheap / {obs.symbol_b} Rich (Long {obs.symbol_a}, Short {obs.symbol_b})"

            # Independent Filter Evaluations
            liq_eval = QuantitativeFilters.evaluate_liquidity(
                volume_a=obs.volume_a,
                volume_b=obs.volume_b,
                oi_a=obs.open_interest_a,
                oi_b=obs.open_interest_b,
                min_volume=params.min_volume,
                min_oi=params.min_open_interest
            )

            exp_eval = QuantitativeFilters.evaluate_expiry(
                dte_a=obs.days_to_expiry_a,
                dte_b=obs.days_to_expiry_b,
                min_days_to_expiry=params.min_days_to_expiry,
                max_expiry_divergence_days=params.max_days_to_expiry
            )

            cost_eval = QuantitativeFilters.evaluate_cost_hurdle(
                abs_spread_bps=abs(obs.relative_spread_bps),
                estimated_round_trip_cost_bps=estimated_hurdle_bps
            )

            # Overall qualified status: must pass liquidity and expiry
            overall_qualified = liq_eval.passed and exp_eval.passed and cost_eval.passed

            # Construct transparent, analytical narrative explanation
            z_sign = "+" if obs.z_score > 0 else ""
            spread_sign = "+" if obs.relative_spread_bps > 0 else ""
            
            narrative = (
                f"Candidate flagged on {obs.trading_date}: Observed relative spread "
                f"({spread_sign}{obs.relative_spread_bps:.1f} bps) deviated {z_sign}{obs.z_score:.2f}σ "
                f"from its prior {params.lookback_window}-day historical mean. "
                f"Liquidity status: {liq_eval.status} ({liq_eval.reason}). "
                f"Expiry status: {exp_eval.status} ({exp_eval.reason}). "
                f"Cost hurdle: {cost_eval.status} ({cost_eval.reason}). "
                f"{'Qualified for execution consideration.' if overall_qualified else 'Disqualified due to execution/filter friction.'}"
            )

            finding = AnomalyFinding(
                id=f"{obs.symbol_a}_{obs.symbol_b}_{obs.trading_date}_{idx}",
                trading_date=obs.trading_date,
                pair=f"{obs.symbol_a} / {obs.symbol_b}",
                symbol_a=obs.symbol_a,
                symbol_b=obs.symbol_b,
                expiry_a=obs.expiry_a,
                expiry_b=obs.expiry_b,
                relative_spread_bps=obs.relative_spread_bps,
                z_score=obs.z_score,
                classification=classification,
                liquidity_filter=liq_eval,
                expiry_filter=exp_eval,
                cost_filter=cost_eval,
                overall_qualified=overall_qualified,
                direction_implication=direction,
                narrative_explanation=narrative
            )
            findings.append(finding)

        # Sort descending by absolute z-score by default
        findings.sort(key=lambda x: abs(x.z_score), reverse=True)
        return findings
