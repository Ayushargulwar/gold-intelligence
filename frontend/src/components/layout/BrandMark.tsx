import React from 'react';

interface BrandMarkProps {
  compact?: boolean;
}

export const BrandMark: React.FC<BrandMarkProps> = ({ compact = false }) => {
  return (
    <div className="flex items-center gap-2.5">
      {/* Precision Geometric Relative-Value Mark */}
      <div className="w-8 h-8 rounded bg-[#14243A] flex items-center justify-center shrink-0 border border-[#14243A]/20">
        <svg
          className="w-4 h-4 text-[#FFFFFF]"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          {/* Dual-bar / relative spread geometric glyph */}
          <polygon points="12 2 21 8.5 21 15.5 12 22 3 15.5 3 8.5 12 2" stroke="currentColor" fill="none" />
          <line x1="12" y1="2" x2="12" y2="22" stroke="#245BDB" strokeWidth="2.5" />
          <line x1="6" y1="12" x2="18" y2="12" stroke="#FFFFFF" strokeWidth="1.5" />
        </svg>
      </div>

      {!compact && (
        <div className="flex flex-col">
          <div className="flex items-center gap-1.5 leading-none">
            <span className="font-bold tracking-tight text-sm text-[#14243A] uppercase">
              Gold<span className="text-[#245BDB] font-extrabold ml-0.5">Intelligence</span>
            </span>
            <span className="text-[9px] font-mono px-1 py-0.5 rounded bg-[#F4F6F9] text-[#687587] border border-[#DCE2EA] font-semibold tracking-normal">
              MCX RV
            </span>
          </div>
          <span className="text-[10px] text-[#687587] font-mono tracking-tight mt-1">
            Relative-Value Workstation
          </span>
        </div>
      )}
    </div>
  );
};
