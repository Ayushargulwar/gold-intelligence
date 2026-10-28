import React, { useState, useEffect } from 'react';
import { Sidebar } from './components/layout/Sidebar';
import type { NavTab } from './components/layout/Sidebar';
import { TopBar } from './components/layout/TopBar';
import { fetchDatasetSummary, loadDemoData } from './api/client';
import type { DatasetSummary } from './types';

// Pages
import { Overview } from './pages/Overview';
import { ContractExplorer } from './pages/ContractExplorer';
import { RelativeValue } from './pages/RelativeValue';
import { AnomalyScanner } from './pages/AnomalyScanner';
import { BacktestingLab } from './pages/BacktestingLab';
import { DataCenter } from './pages/DataCenter';
import { Methodology } from './pages/Methodology';

export function App() {
  const [activeTab, setActiveTab] = useState<NavTab>('overview');
  const [summary, setSummary] = useState<DatasetSummary | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [backtestPair, setBacktestPair] = useState<{ symbolA: string; symbolB: string }>({
    symbolA: 'GOLDM',
    symbolB: 'GOLDPETAL',
  });

  // Handle URL deeplinks
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const tabParam = params.get('tab') as NavTab | null;
    if (tabParam && ['overview', 'contracts', 'relative-value', 'anomalies', 'backtest', 'datacenter', 'methodology'].includes(tabParam)) {
      setActiveTab(tabParam);
    }
    const pairParam = params.get('pair');
    if (pairParam && pairParam.includes('-')) {
      const [pA, pB] = pairParam.split('-');
      setBacktestPair({ symbolA: pA, symbolB: pB });
    }
  }, []);

  // Fetch telemetry on startup
  useEffect(() => {
    handleRefresh();
  }, []);

  const handleRefresh = async () => {
    try {
      setLoading(true);
      const res = await fetchDatasetSummary();
      setSummary(res);

      if (res.total_observations === 0) {
        await loadDemoData();
        const updated = await fetchDatasetSummary();
        setSummary(updated);
      }
    } catch (err) {
      console.error('Failed to load dataset telemetry:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleLoadDemo = async () => {
    try {
      setLoading(true);
      await loadDemoData();
      await handleRefresh();
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectPairForBacktest = (symA: string, symB: string) => {
    setBacktestPair({ symbolA: symA, symbolB: symB });
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#F4F6F9] text-[#172538] antialiased font-sans select-none">
      {/* Persistent Institutional Navigation Rail */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={(tab) => {
          setActiveTab(tab);
          const url = new URL(window.location.href);
          url.searchParams.set('tab', tab);
          window.history.replaceState({}, '', url.toString());
        }}
        datasetSummary={summary}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden min-w-0">
        {/* Top Control Bar */}
        <TopBar
          summary={summary}
          loading={loading}
          onRefresh={handleRefresh}
          onLoadDemo={handleLoadDemo}
        />

        {/* Scrollable Page Body */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 bg-[#F4F6F9] select-text">
          {activeTab === 'overview' && (
            <Overview
              onNavigate={setActiveTab}
              onSelectPairForBacktest={handleSelectPairForBacktest}
            />
          )}

          {activeTab === 'contracts' && <ContractExplorer />}

          {activeTab === 'relative-value' && <RelativeValue />}

          {activeTab === 'anomalies' && (
            <AnomalyScanner
              onSelectPairForBacktest={handleSelectPairForBacktest}
              onNavigate={setActiveTab}
            />
          )}

          {activeTab === 'backtest' && (
            <BacktestingLab initialPair={backtestPair} />
          )}

          {activeTab === 'datacenter' && <DataCenter />}

          {activeTab === 'methodology' && <Methodology />}
        </main>
      </div>
    </div>
  );
}

export default App;
