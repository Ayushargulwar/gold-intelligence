"""
Chronological Walk-Forward Backtesting Engine for MCX Relative-Value Strategies.
Implements next-bar execution, strict lookahead avoidance, realistic fee friction,
and market-neutral benchmark comparison against directional gold movements.
"""
from typing import List, Dict, Any, Optional
import numpy as np
from app.models.schemas import (
    SpreadObservation, BacktestRequest, BacktestResultResponse,
    BacktestTradeEvent, BacktestEquityPoint, BacktestMetrics
)
from app.core.cost_model import TransactionCostEngine
from app.core.filters import QuantitativeFilters


class RelativeValueBacktester:
    """Rigorous chronological walk-forward backtester for pair trading."""

    @classmethod
    def run_backtest(
        cls,
        observations: List[SpreadObservation],
        params: BacktestRequest
    ) -> BacktestResultResponse:
        """
        Execute chronological walk-forward simulation across observations.
        """
        if len(observations) < params.lookback_window + 5:
            return BacktestResultResponse(
                parameters=params.model_dump(),
                metrics=BacktestMetrics(
                    total_trades=0,
                    winning_trades=0,
                    losing_trades=0,
                    win_rate_pct=0.0,
                    gross_pnl_inr=0.0,
                    net_pnl_inr=0.0,
                    total_transaction_costs_inr=0.0,
                    profit_factor=None,
                    max_drawdown_inr=0.0,
                    max_drawdown_pct=0.0,
                    average_trade_return_pct=0.0,
                    average_holding_days=0.0,
                    annualized_sharpe_ratio=None,
                    benchmark_total_return_pct=0.0,
                    strategy_alpha_pct=0.0,
                    strategy_beta_to_gold=0.0,
                    correlation_to_gold=0.0
                ),
                equity_curve=[],
                trades=[],
                insufficient_data_warning=(
                    f"Insufficient observations ({len(observations)}) for lookback window {params.lookback_window}. "
                    "Minimum required is lookback window + 5 trading days."
                )
            )

        capital = params.capital_allocation_inr
        current_gross_equity = capital
        current_net_equity = capital
        peak_net_equity = capital

        trades: List[BacktestTradeEvent] = []
        equity_curve: List[BacktestEquityPoint] = []

        # Trade tracking state
        in_trade = False
        trade_id = 0
        active_trade: Optional[Dict[str, Any]] = None
        pending_signal: Optional[Dict[str, Any]] = None

        # Benchmark tracking: 100% buy and hold gold on Leg A fine-gram price
        initial_benchmark_price = observations[0].price_a_fine_gram
        benchmark_units = capital / initial_benchmark_price if initial_benchmark_price > 0 else 0.0

        for i, obs in enumerate(observations):
            t_date = obs.trading_date
            z = obs.z_score
            p_a = obs.price_a_fine_gram
            p_b = obs.price_b_fine_gram

            # 1. PROCESS PENDING SIGNAL FROM PREVIOUS BAR (NEXT-BAR EXECUTION)
            if pending_signal is not None and not in_trade:
                # Execute entry at today's observation price
                direction = pending_signal["direction"]
                entry_z = pending_signal["signal_z"]
                entry_spread = obs.relative_spread_bps

                # Allocate half capital to Leg A, half to Leg B
                leg_capital = capital / 2.0
                units_a = leg_capital / p_a if p_a > 0 else 0.0
                units_b = leg_capital / p_b if p_b > 0 else 0.0

                trade_id += 1
                active_trade = {
                    "trade_id": trade_id,
                    "entry_date": t_date,
                    "entry_index": i,
                    "direction": direction,
                    "entry_z": entry_z,
                    "entry_spread_bps": entry_spread,
                    "entry_price_a": p_a,
                    "entry_price_b": p_b,
                    "units_a": units_a,
                    "units_b": units_b,
                    "notional_entry_a": leg_capital,
                    "notional_entry_b": leg_capital,
                }
                in_trade = True
                pending_signal = None

            # 2. EVALUATE ACTIVE TRADE EXIT CONDITIONS
            if in_trade and active_trade is not None:
                holding_days = i - active_trade["entry_index"]
                should_exit = False
                exit_reason = ""

                # Condition A: Mean reversion exit
                if active_trade["direction"] == "SHORT_A_LONG_B":
                    if z is not None and z <= params.exit_z_score:
                        should_exit = True
                        exit_reason = "MEAN_REVERSION"
                elif active_trade["direction"] == "LONG_A_SHORT_B":
                    if z is not None and z >= -params.exit_z_score:
                        should_exit = True
                        exit_reason = "MEAN_REVERSION"

                # Condition B: Stop loss threshold
                if not should_exit and z is not None and abs(z) >= params.stop_loss_z_score:
                    should_exit = True
                    exit_reason = "STOP_LOSS"

                # Condition C: Maximum holding days
                if not should_exit and holding_days >= params.max_holding_days:
                    should_exit = True
                    exit_reason = "MAX_HOLDING"

                # Condition D: Expiry safety (near tender period)
                min_dte = min(obs.days_to_expiry_a, obs.days_to_expiry_b)
                if not should_exit and min_dte <= params.min_days_to_expiry:
                    should_exit = True
                    exit_reason = "EXPIRY_SAFETY"

                # If last available bar, force close
                if not should_exit and i == len(observations) - 1:
                    should_exit = True
                    exit_reason = "END_OF_SERIES"

                if should_exit:
                    # Calculate final exit gross PnL
                    u_a = active_trade["units_a"]
                    u_b = active_trade["units_b"]
                    entry_p_a = active_trade["entry_price_a"]
                    entry_p_b = active_trade["entry_price_b"]

                    notional_exit_a = u_a * p_a
                    notional_exit_b = u_b * p_b

                    if active_trade["direction"] == "SHORT_A_LONG_B":
                        # Short A: (entry - exit) * units
                        pnl_a = (entry_p_a - p_a) * u_a
                        # Long B: (exit - entry) * units
                        pnl_b = (p_b - entry_p_b) * u_b
                    else:
                        # Long A: (exit - entry) * units
                        pnl_a = (p_a - entry_p_a) * u_a
                        # Short B: (entry - exit) * units
                        pnl_b = (entry_p_b - p_b) * u_b

                    gross_pnl = pnl_a + pnl_b

                    # Compute accurate MCX transaction costs
                    costs_breakdown = TransactionCostEngine.calculate_trade_friction(
                        notional_entry_a=active_trade["notional_entry_a"],
                        notional_exit_a=notional_exit_a,
                        notional_entry_b=active_trade["notional_entry_b"],
                        notional_exit_b=notional_exit_b,
                        direction=active_trade["direction"],
                        settings=params.costs
                    )
                    trade_costs = costs_breakdown["total_cost"]
                    net_pnl = gross_pnl - trade_costs
                    ret_pct = (net_pnl / capital) * 100.0

                    current_gross_equity += gross_pnl
                    current_net_equity += net_pnl

                    trades.append(BacktestTradeEvent(
                        trade_id=active_trade["trade_id"],
                        entry_date=active_trade["entry_date"],
                        exit_date=t_date,
                        holding_days=max(1, holding_days),
                        signal_direction=active_trade["direction"],
                        entry_z_score=round(active_trade["entry_z"], 2),
                        exit_z_score=round(z, 2) if z is not None else 0.0,
                        entry_spread_bps=round(active_trade["entry_spread_bps"], 1),
                        exit_spread_bps=round(obs.relative_spread_bps, 1),
                        entry_price_a=round(entry_p_a, 2),
                        entry_price_b=round(entry_p_b, 2),
                        exit_price_a=round(p_a, 2),
                        exit_price_b=round(p_b, 2),
                        size_a_units=round(u_a, 4),
                        size_b_units=round(u_b, 4),
                        gross_pnl_inr=round(gross_pnl, 2),
                        total_costs_inr=round(trade_costs, 2),
                        net_pnl_inr=round(net_pnl, 2),
                        return_pct=round(ret_pct, 3),
                        exit_reason=exit_reason
                    ))

                    in_trade = False
                    active_trade = None

            # 3. GENERATE SIGNAL FOR NEXT BAR (IF FLAT)
            if not in_trade and pending_signal is None and z is not None:
                # Check liquidity and expiry viability before triggering
                liq = QuantitativeFilters.evaluate_liquidity(
                    obs.volume_a, obs.volume_b, obs.open_interest_a, obs.open_interest_b,
                    min_volume=params.min_volume
                )
                exp = QuantitativeFilters.evaluate_expiry(
                    obs.days_to_expiry_a, obs.days_to_expiry_b,
                    min_days_to_expiry=params.min_days_to_expiry
                )

                if liq.passed and exp.passed:
                    if z >= params.entry_z_score:
                        # Leg A is rich -> Short A, Long B on next bar
                        pending_signal = {"direction": "SHORT_A_LONG_B", "signal_z": z}
                    elif z <= -params.entry_z_score:
                        # Leg A is cheap -> Long A, Short B on next bar
                        pending_signal = {"direction": "LONG_A_SHORT_B", "signal_z": z}

            # 4. RECORD DAILY EQUITY POINT
            if current_net_equity > peak_net_equity:
                peak_net_equity = current_net_equity
            dd_pct = ((peak_net_equity - current_net_equity) / peak_net_equity) * 100.0 if peak_net_equity > 0 else 0.0

            benchmark_equity = benchmark_units * p_a
            benchmark_ret_pct = ((benchmark_equity - capital) / capital) * 100.0

            equity_curve.append(BacktestEquityPoint(
                trading_date=t_date,
                gross_equity_inr=round(current_gross_equity, 2),
                net_equity_inr=round(current_net_equity, 2),
                cumulative_return_pct=round(((current_net_equity - capital) / capital) * 100.0, 3),
                drawdown_pct=round(dd_pct, 2),
                benchmark_equity_inr=round(benchmark_equity, 2),
                benchmark_return_pct=round(benchmark_ret_pct, 2),
                in_position=in_trade,
                active_trade_id=active_trade["trade_id"] if active_trade else None
            ))

        # 5. COMPUTE OVERALL PERFORMANCE & RISK METRICS
        total_trades = len(trades)
        winning_trades = sum(1 for t in trades if t.net_pnl_inr > 0)
        losing_trades = sum(1 for t in trades if t.net_pnl_inr <= 0)
        win_rate = (winning_trades / total_trades * 100.0) if total_trades > 0 else 0.0

        total_gross_pnl = sum(t.gross_pnl_inr for t in trades)
        total_costs = sum(t.total_costs_inr for t in trades)
        total_net_pnl = sum(t.net_pnl_inr for t in trades)

        gross_wins = sum(t.gross_pnl_inr for t in trades if t.gross_pnl_inr > 0)
        gross_losses = abs(sum(t.gross_pnl_inr for t in trades if t.gross_pnl_inr < 0))
        profit_factor = (gross_wins / gross_losses) if gross_losses > 0 else (99.0 if gross_wins > 0 else None)

        # Max drawdown
        dd_series = [pt.drawdown_pct for pt in equity_curve]
        max_dd_pct = float(np.max(dd_series)) if dd_series else 0.0
        max_dd_inr = (max_dd_pct / 100.0) * capital

        avg_trade_ret = float(np.mean([t.return_pct for t in trades])) if trades else 0.0
        avg_holding = float(np.mean([t.holding_days for t in trades])) if trades else 0.0

        # Annualized Sharpe ratio on daily equity returns
        daily_equities = [pt.net_equity_inr for pt in equity_curve]
        if len(daily_equities) > 5:
            daily_returns = np.diff(daily_equities) / daily_equities[:-1]
            ret_std = float(np.std(daily_returns))
            ret_mean = float(np.mean(daily_returns))
            sharpe = (ret_mean / ret_std * np.sqrt(252.0)) if ret_std > 1e-8 else 0.0
        else:
            sharpe = None

        # Benchmark comparison: Strategy vs Buy-and-Hold Gold
        benchmark_final_ret = equity_curve[-1].benchmark_return_pct if equity_curve else 0.0
        strategy_final_ret = equity_curve[-1].cumulative_return_pct if equity_curve else 0.0
        strategy_alpha = strategy_final_ret - benchmark_final_ret

        # Beta & Correlation against gold price series
        gold_prices = [obs.price_a_fine_gram for obs in observations]
        if len(gold_prices) > 5 and len(daily_equities) == len(gold_prices):
            gold_rets = np.diff(gold_prices) / gold_prices[:-1]
            strat_rets = np.diff(daily_equities) / daily_equities[:-1]
            cov = np.cov(strat_rets, gold_rets)
            beta = float(cov[0, 1] / cov[1, 1]) if cov[1, 1] > 1e-8 else 0.0
            corr = float(np.corrcoef(strat_rets, gold_rets)[0, 1]) if np.std(strat_rets) > 1e-8 and np.std(gold_rets) > 1e-8 else 0.0
        else:
            beta = 0.0
            corr = 0.0

        metrics = BacktestMetrics(
            total_trades=total_trades,
            winning_trades=winning_trades,
            losing_trades=losing_trades,
            win_rate_pct=round(win_rate, 1),
            gross_pnl_inr=round(total_gross_pnl, 2),
            net_pnl_inr=round(total_net_pnl, 2),
            total_transaction_costs_inr=round(total_costs, 2),
            profit_factor=round(profit_factor, 2) if profit_factor is not None else None,
            max_drawdown_inr=round(max_dd_inr, 2),
            max_drawdown_pct=round(max_dd_pct, 2),
            average_trade_return_pct=round(avg_trade_ret, 3),
            average_holding_days=round(avg_holding, 1),
            annualized_sharpe_ratio=round(sharpe, 2) if sharpe is not None else None,
            benchmark_total_return_pct=round(benchmark_final_ret, 2),
            strategy_alpha_pct=round(strategy_alpha, 2),
            strategy_beta_to_gold=round(beta, 3),
            correlation_to_gold=round(corr, 3)
        )

        return BacktestResultResponse(
            parameters=params.model_dump(),
            metrics=metrics,
            equity_curve=equity_curve,
            trades=trades,
            insufficient_data_warning=None
        )
