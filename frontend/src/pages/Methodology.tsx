import React, { useState, useEffect } from 'react';
import {
  BookOpen,
  ShieldCheck,
  Scale,
  Calculator,
  Percent,
  Clock,
  Info,
} from 'lucide-react';
import { fetchMethodologySummary } from '../api/client';

export const Methodology: React.FC = () => {
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    fetchMethodologySummary().then(setData).catch(console.error);
  }, []);

  return (
    <div className="space-y-5 max-w-5xl mx-auto font-sans">
      {/* Title Header */}
      <div className="bg-[#FFFFFF] border border-[#DCE2EA] rounded-md p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-[#F4F6F9] text-[#14243A] border border-[#DCE2EA] font-semibold uppercase">
              Quantitative Methodology
            </span>
            <span className="text-xs text-[#687587] font-mono">Academic & Empirical Basis</span>
          </div>
          <h2 className="text-base font-bold text-[#14243A] mt-1">Methodology & Mathematical Framework</h2>
          <p className="text-xs text-[#687587] mt-0.5">
            Transparent documentation of contract normalization, lookahead-free rolling deviation modeling, and regulatory friction hurdles.
          </p>
        </div>
      </div>

      {/* Core Axiom Card */}
      <div className="p-4 rounded-md bg-[#FFFFFF] border border-[#DCE2EA] space-y-2">
        <div className="flex items-center gap-2 text-[#245BDB] font-mono text-xs font-bold uppercase">
          <ShieldCheck className="w-4 h-4" />
          <span>Core Quantitative Axiom</span>
        </div>
        <h3 className="text-sm font-bold text-[#14243A]">
          Relative Value is Not Directional Price Prediction
        </h3>
        <p className="text-xs text-[#687587] leading-relaxed">
          The central research question of Gold Intelligence is not whether gold will appreciate or depreciate in rupee terms.
          Rather, it assesses whether one MCX contract is mispriced relative to another economically equivalent gold contract,
          and whether that dislocation represents a statistically viable mean-reverting opportunity after deducting
          exchange fees, statutory levies (CTT, stamp duty, GST), bid-ask slippage, and delivery period constraints.
        </p>
      </div>

      {/* Section 1: Price Normalization */}
      <div className="bg-[#FFFFFF] border border-[#DCE2EA] rounded-md p-4 space-y-3">
        <div className="flex items-center gap-2 text-[#245BDB] font-mono text-xs font-bold uppercase">
          <Calculator className="w-3.5 h-3.5" />
          <span>1. The Mechanics of Price Normalization</span>
        </div>

        <h3 className="text-xs font-bold text-[#14243A]">
          Why Raw Quoted Prices Cannot Be Compared Directly
        </h3>
        <p className="text-xs text-[#687587] leading-relaxed">
          On the Multi Commodity Exchange of India (MCX), gold contracts are quoted under differing unit conventions and fineness ratings:
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 font-mono text-xs">
          <div className="p-2.5 rounded bg-[#F4F6F9] border border-[#DCE2EA]">
            <span className="font-bold text-[#245BDB]">GOLDM (Mini):</span>
            <div className="text-[#687587] mt-0.5 text-[11px]">
              Quoted in INR for 10 grams of 995 fineness gold (99.5% pure). One quoted unit contains exactly 9.95g of fine gold.
            </div>
          </div>

          <div className="p-2.5 rounded bg-[#F4F6F9] border border-[#DCE2EA]">
            <span className="font-bold text-[#14243A]">GOLDPETAL:</span>
            <div className="text-[#687587] mt-0.5 text-[11px]">
              Quoted in INR for 1 gram of 999 fineness gold (99.9% pure). One quoted unit contains 0.999g of fine gold.
            </div>
          </div>

          <div className="p-2.5 rounded bg-[#F4F6F9] border border-[#DCE2EA]">
            <span className="font-bold text-[#13834A]">GOLDGUINEA:</span>
            <div className="text-[#687587] mt-0.5 text-[11px]">
              Quoted in INR for 8 grams (sovereign) of 999 fineness gold. One quoted unit represents 7.992g of fine gold.
            </div>
          </div>

          <div className="p-2.5 rounded bg-[#F4F6F9] border border-[#DCE2EA]">
            <span className="font-bold text-[#245BDB]">GOLDTEN:</span>
            <div className="text-[#687587] mt-0.5 text-[11px]">
              Quoted in INR for 10 grams of 999 fineness gold. One quoted unit represents 9.99g of fine gold.
            </div>
          </div>
        </div>

        <div className="p-3 rounded bg-[#F4F6F9] border border-[#DCE2EA] font-mono text-xs space-y-1">
          <div className="text-[#687587] text-[10px]">Canonical INR / Fine Gram Equation:</div>
          <div className="text-[#245BDB] font-bold">
            P_fine_gram = P_quoted ÷ [Quote_Unit_Grams × (Stated_Purity ÷ 1000)]
          </div>
          <div className="text-[#687587] text-[10px] pt-1">Standard Physical Benchmark (10g of 999 Gold):</div>
          <div className="text-[#13834A] font-bold">
            P_10g_999 = P_fine_gram × 9.99
          </div>
        </div>
      </div>

      {/* Section 2: Relative Spread & Lookahead-Free Statistics */}
      <div className="bg-[#FFFFFF] border border-[#DCE2EA] rounded-md p-4 space-y-3">
        <div className="flex items-center gap-2 text-[#245BDB] font-mono text-xs font-bold uppercase">
          <Scale className="w-3.5 h-3.5" />
          <span>2. Spread Formulations & Lookahead Prevention</span>
        </div>

        <h3 className="text-xs font-bold text-[#14243A]">
          Strict Historical-Only Rolling Statistics (No Information Leakage)
        </h3>
        <p className="text-xs text-[#687587] leading-relaxed">
          The relative spread between two normalized contract series is measured in basis points:
        </p>

        <div className="p-3 rounded bg-[#F4F6F9] border border-[#DCE2EA] font-mono text-xs space-y-1.5">
          <div className="text-[#14243A] font-bold">
            Relative_Spread_t = (P_A_fine,t ÷ P_B_fine,t) - 1.0
          </div>
          <div className="text-[#245BDB] font-bold">
            Spread_BPS_t = Relative_Spread_t × 10,000
          </div>
        </div>

        <p className="text-xs text-[#687587] leading-relaxed">
          To measure how unusual an observation is without introducing look-ahead bias, the rolling mean μ_t
          and sample standard deviation σ_t are computed strictly over the prior W trading days: [t-W ... t-1].
          The observation at time t is never included in its own historical baseline.
        </p>

        <div className="p-3 rounded bg-[#F4F6F9] border border-[#DCE2EA] font-mono text-xs">
          <div className="text-[#13834A] font-bold">
            Z_t = (Spread_t - μ_prior) ÷ σ_prior
          </div>
        </div>
      </div>

      {/* Section 3: Cost Model & Indian Regulatory Fees */}
      <div className="bg-[#FFFFFF] border border-[#DCE2EA] rounded-md p-4 space-y-3">
        <div className="flex items-center gap-2 text-[#245BDB] font-mono text-xs font-bold uppercase">
          <Percent className="w-3.5 h-3.5" />
          <span>3. Indian Commodity Regulatory Cost Model</span>
        </div>

        <h3 className="text-xs font-bold text-[#14243A]">
          Why Statistical Anomalies Are Not Automatic Arbitrage
        </h3>
        <p className="text-xs text-[#687587] leading-relaxed">
          Executing a relative-value pair requires simultaneous positions on two legs. The platform models
          the complete fee schedule mandated by SEBI and MCX:
        </p>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-2.5 font-mono text-xs">
          <div className="p-2.5 rounded bg-[#F4F6F9] border border-[#DCE2EA]">
            <span className="text-[#687587]">CTT (Commodity Tax):</span>
            <div className="text-xs font-bold text-[#245BDB] mt-0.5">0.01% on Sell</div>
            <div className="text-[10px] text-[#8E9BAE]">Levied on sell turnover only</div>
          </div>

          <div className="p-2.5 rounded bg-[#F4F6F9] border border-[#DCE2EA]">
            <span className="text-[#687587]">Stamp Duty:</span>
            <div className="text-xs font-bold text-[#245BDB] mt-0.5">0.002% on Buy</div>
            <div className="text-[10px] text-[#8E9BAE]">Levied on buy turnover only</div>
          </div>

          <div className="p-2.5 rounded bg-[#F4F6F9] border border-[#DCE2EA]">
            <span className="text-[#687587]">MCX Turnover Fee:</span>
            <div className="text-xs font-bold text-[#14243A] mt-0.5">0.0021% Turnover</div>
            <div className="text-[10px] text-[#8E9BAE]">Exchange processing fee</div>
          </div>

          <div className="p-2.5 rounded bg-[#F4F6F9] border border-[#DCE2EA]">
            <span className="text-[#687587]">Brokerage Proxy:</span>
            <div className="text-xs font-bold text-[#14243A] mt-0.5">0.015% or ₹20/order</div>
            <div className="text-[10px] text-[#8E9BAE]">Standard discount broker</div>
          </div>

          <div className="p-2.5 rounded bg-[#F4F6F9] border border-[#DCE2EA]">
            <span className="text-[#687587]">GST:</span>
            <div className="text-xs font-bold text-[#14243A] mt-0.5">18% on Fees</div>
            <div className="text-[10px] text-[#8E9BAE]">On Brokerage + Exchange</div>
          </div>

          <div className="p-2.5 rounded bg-[#F4F6F9] border border-[#DCE2EA]">
            <span className="text-[#687587]">Bid-Ask Slippage:</span>
            <div className="text-xs font-bold text-[#D64550] mt-0.5">2.5 bps per leg</div>
            <div className="text-[10px] text-[#8E9BAE]">Microstructure friction</div>
          </div>
        </div>
      </div>

      {/* Section 4: Walk-Forward Backtesting Rules */}
      <div className="bg-[#FFFFFF] border border-[#DCE2EA] rounded-md p-4 space-y-3">
        <div className="flex items-center gap-2 text-[#245BDB] font-mono text-xs font-bold uppercase">
          <Clock className="w-3.5 h-3.5" />
          <span>4. Walk-Forward Simulation Protocol</span>
        </div>

        <h3 className="text-xs font-bold text-[#14243A]">
          Next-Bar Execution & Tender Period Safety Exits
        </h3>
        <ul className="text-xs text-[#687587] space-y-1.5 list-disc pl-4 leading-relaxed font-mono">
          <li>
            <strong className="text-[#14243A]">Next-Bar Execution (t+1):</strong> When a closing bar on day t generates an entry signal (|Z_t| ≥ 2.0σ),
            execution is strictly simulated at day t+1 observation prices.
          </li>
          <li>
            <strong className="text-[#14243A]">Equal Fine-Gram Sizing:</strong> Both legs are sized to equal pure-gold notional values, ensuring market-neutrality
            with respect to directional gold price moves.
          </li>
          <li>
            <strong className="text-[#14243A]">Tender Period Cutoff:</strong> Contracts approaching expiration (DTE ≤ 2 days) are automatically exited
            to prevent physical settlement notice assignment.
          </li>
        </ul>
      </div>

      {/* Section 5: Financial Glossary */}
      <div className="bg-[#FFFFFF] border border-[#DCE2EA] rounded-md p-4 space-y-3">
        <div className="flex items-center gap-2 text-[#245BDB] font-mono text-xs font-bold uppercase">
          <BookOpen className="w-3.5 h-3.5" />
          <span>5. Institutional Financial Glossary</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 font-mono text-xs">
          {data?.glossary?.map((item: any, idx: number) => (
            <div key={idx} className="p-2.5 rounded bg-[#F4F6F9] border border-[#DCE2EA]">
              <span className="font-bold text-[#245BDB]">{item.term}</span>
              <p className="text-[11px] text-[#687587] mt-0.5 leading-normal">{item.definition}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
