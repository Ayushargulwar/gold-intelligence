import {
  ContractSpec,
  NormalizedPriceResult,
  RelativeValueSeriesResponse,
  AnomalyFinding,
  BacktestResultResponse,
  DatasetSummary,
  IngestionSummary,
  CostModelSettings
} from '../types';

const BASE_URL = '/api';

export async function fetchHealth() {
  const res = await fetch(`${BASE_URL}/health`);
  if (!res.ok) throw new Error('Failed to fetch health status');
  return res.json();
}

export async function fetchContracts(): Promise<ContractSpec[]> {
  const res = await fetch(`${BASE_URL}/contracts`);
  if (!res.ok) throw new Error('Failed to fetch contracts');
  return res.json();
}

export async function fetchContract(symbol: string): Promise<ContractSpec> {
  const res = await fetch(`${BASE_URL}/contracts/${symbol}`);
  if (!res.ok) throw new Error(`Failed to fetch contract ${symbol}`);
  return res.json();
}

export async function inspectNormalization(
  symbol: string,
  price: number,
  tradingDate?: string,
  expiryDate?: string
): Promise<NormalizedPriceResult> {
  const params = new URLSearchParams({
    price: price.toString(),
    ...(tradingDate && { trading_date: tradingDate }),
    ...(expiryDate && { expiry_date: expiryDate }),
  });
  const res = await fetch(`${BASE_URL}/contracts/${symbol}/normalize?${params.toString()}`);
  if (!res.ok) throw new Error('Failed to calculate normalization audit trail');
  return res.json();
}

export async function fetchDatasetSummary(): Promise<DatasetSummary> {
  const res = await fetch(`${BASE_URL}/data/summary`);
  if (!res.ok) throw new Error('Failed to fetch dataset summary');
  return res.json();
}

export async function loadDemoData(): Promise<DatasetSummary> {
  const res = await fetch(`${BASE_URL}/data/load-demo`, { method: 'POST' });
  if (!res.ok) throw new Error('Failed to load demo dataset');
  return res.json();
}

export async function clearAllData(): Promise<any> {
  const res = await fetch(`${BASE_URL}/data/clear`, { method: 'POST' });
  if (!res.ok) throw new Error('Failed to clear market data');
  return res.json();
}

export async function uploadBhavcopyCsv(file: File, isSynthetic: boolean = false): Promise<IngestionSummary> {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('is_synthetic', isSynthetic.toString());
  formData.append('source_name', file.name);

  const res = await fetch(`${BASE_URL}/data/upload-csv`, {
    method: 'POST',
    body: formData,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: 'Upload failed' }));
    throw new Error(err.detail || 'Upload failed');
  }
  return res.json();
}

export async function fetchRelativeValueSeries(
  symbolA: string,
  symbolB: string,
  lookbackWindow: number = 20,
  minPeriods: number = 10,
  startDate?: string,
  endDate?: string
): Promise<RelativeValueSeriesResponse> {
  const params = new URLSearchParams({
    symbol_a: symbolA,
    symbol_b: symbolB,
    lookback_window: lookbackWindow.toString(),
    min_periods: minPeriods.toString(),
    ...(startDate && { start_date: startDate }),
    ...(endDate && { end_date: endDate }),
  });
  const res = await fetch(`${BASE_URL}/relative-value/series?${params.toString()}`);
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: 'Failed to fetch series' }));
    throw new Error(err.detail || 'Failed to fetch series');
  }
  return res.json();
}

export async function scanAnomalies(
  symbolA: string,
  symbolB: string,
  zThreshold: number = 2.0,
  lookbackWindow: number = 20,
  minVolume: number = 10,
  minOi: number = 20,
  minDte: number = 3,
  brokeragePct: number = 0.00015,
  slippageBps: number = 2.5
): Promise<AnomalyFinding[]> {
  const params = new URLSearchParams({
    symbol_a: symbolA,
    symbol_b: symbolB,
    z_threshold: zThreshold.toString(),
    lookback_window: lookbackWindow.toString(),
    min_volume: minVolume.toString(),
    min_open_interest: minOi.toString(),
    min_days_to_expiry: minDte.toString(),
    brokerage_pct: brokeragePct.toString(),
    slippage_bps: slippageBps.toString(),
  });
  const res = await fetch(`${BASE_URL}/anomalies/scan?${params.toString()}`);
  if (!res.ok) throw new Error('Failed to scan anomalies');
  return res.json();
}

export interface BacktestParams {
  symbol_a: string;
  symbol_b: string;
  start_date?: string;
  end_date?: string;
  lookback_window: number;
  entry_z_score: number;
  exit_z_score: number;
  stop_loss_z_score: number;
  max_holding_days: number;
  capital_allocation_inr: number;
  min_volume: number;
  min_days_to_expiry: number;
  costs: CostModelSettings;
}

export async function runBacktest(params: BacktestParams): Promise<BacktestResultResponse> {
  const res = await fetch(`${BASE_URL}/backtest/run`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: 'Backtest failed' }));
    throw new Error(err.detail || 'Backtest failed');
  }
  return res.json();
}

export async function fetchMethodologySummary(): Promise<any> {
  const res = await fetch(`${BASE_URL}/methodology/summary`);
  if (!res.ok) throw new Error('Failed to fetch methodology');
  return res.json();
}
