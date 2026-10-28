"""
Relative-Value Quantitative Analytics Module.
Calculates pairwise comparable spreads, strictly look-ahead-free historical rolling baselines,
z-scores, confidence bands, and summary statistics.
"""
from typing import List, Dict, Any, Optional
from datetime import datetime
import numpy as np
from app.core.normalizer import PriceNormalizer
from app.models.schemas import SpreadObservation, RelativeValueSeriesResponse


class RelativeValueAnalytics:
    """Quantitative engine for pair relative-value analysis."""

    @staticmethod
    def calculate_days_to_expiry(trading_date_str: str, expiry_date_str: str) -> int:
        """Calculate integer calendar days to expiry from trading date."""
        try:
            t_dt = datetime.strptime(trading_date_str, "%Y-%m-%d").date()
            e_dt = datetime.strptime(expiry_date_str, "%Y-%m-%d").date()
            return max(0, (e_dt - t_dt).days)
        except Exception:
            return 0

    @classmethod
    def compute_pair_spread_series(
        cls,
        aligned_records: List[Dict[str, Any]],
        symbol_a: str,
        symbol_b: str,
        lookback_window: int = 20,
        min_periods: int = 10
    ) -> RelativeValueSeriesResponse:
        """
        Process aligned market records into a full relative-value time series
        with rolling statistical baselines computed strictly on prior historical bars.
        """
        if not aligned_records:
            return RelativeValueSeriesResponse(
                symbol_a=symbol_a,
                symbol_b=symbol_b,
                lookback_window=lookback_window,
                total_observations=0,
                observations=[],
                summary_statistics={
                    "status": "NO_DATA",
                    "message": f"No overlapping observations found for {symbol_a} and {symbol_b}."
                }
            )

        spread_history: List[float] = []
        observations: List[SpreadObservation] = []

        for row in aligned_records:
            t_date = row["trading_date"]
            exp_a = row.get("expiry_a", "")
            exp_b = row.get("expiry_b", "")
            close_a = float(row["close_a"])
            close_b = float(row["close_b"])

            # Normalize prices to canonical INR / fine-gram
            norm_a = PriceNormalizer.normalize_price(symbol_a, close_a, t_date, exp_a)
            norm_b = PriceNormalizer.normalize_price(symbol_b, close_b, t_date, exp_b)

            p_a_fine = norm_a.normalized_price_per_fine_gram
            p_b_fine = norm_b.normalized_price_per_fine_gram

            open_a = float(row["open_a"]) if row.get("open_a") is not None else close_a
            high_a = float(row["high_a"]) if row.get("high_a") is not None else close_a
            low_a = float(row["low_a"]) if row.get("low_a") is not None else close_a

            open_b = float(row["open_b"]) if row.get("open_b") is not None else close_b
            high_b = float(row["high_b"]) if row.get("high_b") is not None else close_b
            low_b = float(row["low_b"]) if row.get("low_b") is not None else close_b

            norm_a_open = PriceNormalizer.normalize_price(symbol_a, open_a, t_date, exp_a).normalized_price_per_fine_gram
            norm_a_high = PriceNormalizer.normalize_price(symbol_a, high_a, t_date, exp_a).normalized_price_per_fine_gram
            norm_a_low = PriceNormalizer.normalize_price(symbol_a, low_a, t_date, exp_a).normalized_price_per_fine_gram

            norm_b_open = PriceNormalizer.normalize_price(symbol_b, open_b, t_date, exp_b).normalized_price_per_fine_gram
            norm_b_high = PriceNormalizer.normalize_price(symbol_b, high_b, t_date, exp_b).normalized_price_per_fine_gram
            norm_b_low = PriceNormalizer.normalize_price(symbol_b, low_b, t_date, exp_b).normalized_price_per_fine_gram

            # Relative spread: (Price_A / Price_B) - 1
            rel_spread = (p_a_fine / p_b_fine) - 1.0 if p_b_fine > 0 else 0.0
            rel_spread_bps = rel_spread * 10000.0
            abs_diff = p_a_fine - p_b_fine

            # Compute Spread Candlestick OHLC in basis points
            sp_open = ((norm_a_open / norm_b_open) - 1.0) * 10000.0 if norm_b_open > 0 else rel_spread_bps
            sp_close = rel_spread_bps
            c_high = ((norm_a_high / norm_b_low) - 1.0) * 10000.0 if norm_b_low > 0 else max(sp_open, sp_close)
            c_low = ((norm_a_low / norm_b_high) - 1.0) * 10000.0 if norm_b_high > 0 else min(sp_open, sp_close)
            sp_high = max(sp_open, sp_close, c_high)
            sp_low = min(sp_open, sp_close, c_low)

            dte_a = cls.calculate_days_to_expiry(t_date, exp_a)
            dte_b = cls.calculate_days_to_expiry(t_date, exp_b)

            # Rolling stats calculation: strictly prior observations (t-W to t-1)
            # This ensures no look-ahead bias in the deviation calculation
            rolling_mean: Optional[float] = None
            rolling_std: Optional[float] = None
            z_score: Optional[float] = None
            u_band_1: Optional[float] = None
            l_band_1: Optional[float] = None
            u_band_2: Optional[float] = None
            l_band_2: Optional[float] = None

            if len(spread_history) >= min_periods:
                # Use at most lookback_window prior historical points
                window_slice = spread_history[-lookback_window:]
                mean_val = float(np.mean(window_slice))
                std_val = float(np.std(window_slice, ddof=1)) if len(window_slice) > 1 else 0.0

                rolling_mean = mean_val
                rolling_std = std_val
                u_band_1 = mean_val + 1.0 * std_val
                l_band_1 = mean_val - 1.0 * std_val
                u_band_2 = mean_val + 2.0 * std_val
                l_band_2 = mean_val - 2.0 * std_val

                if std_val > 1e-9:
                    z_score = float((rel_spread - mean_val) / std_val)
                else:
                    z_score = 0.0

            obs = SpreadObservation(
                trading_date=t_date,
                symbol_a=symbol_a,
                symbol_b=symbol_b,
                expiry_a=exp_a,
                expiry_b=exp_b,
                price_a_raw=close_a,
                price_b_raw=close_b,
                price_a_fine_gram=round(p_a_fine, 4),
                price_b_fine_gram=round(p_b_fine, 4),
                relative_spread=round(rel_spread, 6),
                relative_spread_bps=round(rel_spread_bps, 2),
                absolute_diff_fine_gram=round(abs_diff, 4),
                rolling_mean=round(rolling_mean, 6) if rolling_mean is not None else None,
                rolling_std=round(rolling_std, 6) if rolling_std is not None else None,
                z_score=round(z_score, 3) if z_score is not None else None,
                upper_band_1=round(u_band_1, 6) if u_band_1 is not None else None,
                lower_band_1=round(l_band_1, 6) if l_band_1 is not None else None,
                upper_band_2=round(u_band_2, 6) if u_band_2 is not None else None,
                lower_band_2=round(l_band_2, 6) if l_band_2 is not None else None,
                volume_a=int(row.get("volume_a", 0)),
                volume_b=int(row.get("volume_b", 0)),
                open_interest_a=int(row.get("oi_a", 0)),
                open_interest_b=int(row.get("oi_b", 0)),
                days_to_expiry_a=dte_a,
                days_to_expiry_b=dte_b,
                spread_open_bps=round(sp_open, 2),
                spread_high_bps=round(sp_high, 2),
                spread_low_bps=round(sp_low, 2),
                spread_close_bps=round(sp_close, 2),
                price_a_open_fine=round(norm_a_open, 4),
                price_a_high_fine=round(norm_a_high, 4),
                price_a_low_fine=round(norm_a_low, 4),
                price_b_open_fine=round(norm_b_open, 4),
                price_b_high_fine=round(norm_b_high, 4),
                price_b_low_fine=round(norm_b_low, 4),
            )
            observations.append(obs)

            # Append current spread to historical cache for subsequent days
            spread_history.append(rel_spread)

        # Compute summary statistics
        valid_z = [o.z_score for o in observations if o.z_score is not None]
        spreads_bps = [o.relative_spread_bps for o in observations]

        summary_stats = {
            "total_observations": len(observations),
            "observations_with_zscore": len(valid_z),
            "mean_spread_bps": round(float(np.mean(spreads_bps)), 2) if spreads_bps else 0.0,
            "min_spread_bps": round(float(np.min(spreads_bps)), 2) if spreads_bps else 0.0,
            "max_spread_bps": round(float(np.max(spreads_bps)), 2) if spreads_bps else 0.0,
            "std_spread_bps": round(float(np.std(spreads_bps)), 2) if spreads_bps else 0.0,
            "latest_relative_spread_bps": observations[-1].relative_spread_bps if observations else None,
            "latest_z_score": observations[-1].z_score if observations else None,
            "latest_trading_date": observations[-1].trading_date if observations else None,
            "max_abs_z_score": round(float(np.max(np.abs(valid_z))), 2) if valid_z else 0.0,
        }

        return RelativeValueSeriesResponse(
            symbol_a=symbol_a,
            symbol_b=symbol_b,
            lookback_window=lookback_window,
            total_observations=len(observations),
            observations=observations,
            summary_statistics=summary_stats
        )
