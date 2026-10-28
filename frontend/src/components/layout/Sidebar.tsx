import React from 'react';
import {
  LayoutDashboard,
  Coins,
  GitCompare,
  Radar,
  FlaskConical,
  Database,
  BookOpen,
} from 'lucide-react';
import { BrandMark } from './BrandMark';
import type { DatasetSummary } from '../../types';

export type NavTab = 
  | 'overview' 
  | 'contracts' 
  | 'relative-value' 
  | 'anomalies' 
  | 'backtest' 
  | 'datacenter' 
  | 'methodology';

interface SidebarProps {
  activeTab: NavTab;
  setActiveTab: (tab: NavTab) => void;
  datasetSummary?: DatasetSummary | null;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  datasetSummary,
}) => {
  const navItems: Array<{ id: NavTab; label: string; icon: React.ReactNode; badge?: string }> = [
    { id: 'overview', label: 'Overview', icon: <LayoutDashboard className="w-4 h-4" /> },
    { id: 'contracts', label: 'Contract Explorer', icon: <Coins className="w-4 h-4" /> },
    { id: 'relative-value', label: 'Relative Value', icon: <GitCompare className="w-4 h-4" /> },
    { id: 'anomalies', label: 'Anomaly Scanner', icon: <Radar className="w-4 h-4" /> },
    { id: 'backtest', label: 'Backtesting Lab', icon: <FlaskConical className="w-4 h-4" /> },
    { id: 'datacenter', label: 'Data Center', icon: <Database className="w-4 h-4" /> },
    { id: 'methodology', label: 'Methodology', icon: <BookOpen className="w-4 h-4" /> },
  ];

  return (
    <aside className="w-60 border-r border-[#DCE2EA] bg-[#FFFFFF] flex flex-col h-screen select-none shrink-0 z-20">
      {/* Brand Header */}
      <div className="h-12 px-4 border-b border-[#DCE2EA] flex items-center">
        <BrandMark />
      </div>

      {/* Navigation Rail */}
      <div className="flex-1 py-3 px-2 space-y-0.5 overflow-y-auto">
        <div className="px-2.5 pb-2 pt-1 text-[10px] font-mono font-semibold tracking-wider text-[#687587] uppercase">
          Research Modules
        </div>

        {navItems.map((item) => {
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center justify-between px-2.5 py-2 rounded text-xs font-medium transition-colors cursor-pointer text-left ${
                isActive
                  ? 'bg-[#F4F6F9] text-[#14243A] font-semibold border-l-2 border-l-[#245BDB] pl-[8px]'
                  : 'text-[#687587] hover:text-[#172538] hover:bg-[#F8FAFC]'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <span className={isActive ? 'text-[#245BDB]' : 'text-[#8E9BAE]'}>
                  {item.icon}
                </span>
                <span>{item.label}</span>
              </div>
              {item.badge && (
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-[#F4F6F9] text-[#172538] border border-[#DCE2EA]">
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Institutional Platform Attribution Footer */}
      <div className="p-3 border-t border-[#DCE2EA] bg-[#F4F6F9] text-[11px] font-mono space-y-2">
        <div className="flex items-center justify-between text-[#687587]">
          <span>Coverage</span>
          <span className="font-semibold text-[#172538] tabular-nums">
            {datasetSummary?.total_observations ? `${datasetSummary.total_observations} records` : 'Standby'}
          </span>
        </div>

        <div className="pt-2 border-t border-[#DCE2EA] text-[#687587] space-y-0.5">
          <div className="font-semibold text-[#14243A]">Hack in Hills '26</div>
          <div className="text-[10px] text-[#8E9BAE]">Problem 03 • Team LNX</div>
        </div>
      </div>
    </aside>
  );
};
