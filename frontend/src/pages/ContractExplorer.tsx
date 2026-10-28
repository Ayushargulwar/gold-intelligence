import React, { useState, useEffect } from 'react';
import { Scale, ArrowRight, CheckCircle2, Calculator } from 'lucide-react';
import { fetchContracts, inspectNormalization } from '../api/client';
import type { ContractSpec, NormalizedPriceResult } from '../types';
import { ConversionInspectorModal } from '../components/modals/ConversionInspectorModal';

export const ContractExplorer: React.FC = () => {
  const [contracts, setContracts] = useState<ContractSpec[]>([]);
  const [selectedContract, setSelectedContract] = useState<string>('GOLDM');
  const [inspectPrice, setInspectPrice] = useState<number>(74500);
  const [normResult, setNormResult] = useState<NormalizedPriceResult | null>(null);
  const [modalOpen, setModalOpen] = useState<boolean>(false);

  useEffect(() => {
    loadContracts();
  }, []);

  useEffect(() => {
    if (selectedContract) {
      if (selectedContract === 'GOLDM') setInspectPrice(74500);
      else if (selectedContract === 'GOLDTEN') setInspectPrice(74850);
      else if (selectedContract === 'GOLDGUINEA') setInspectPrice(59880);
      else if (selectedContract === 'GOLDPETAL') setInspectPrice(7485);
    }
  }, [selectedContract]);

  useEffect(() => {
    if (selectedContract && inspectPrice > 0) {
      calculateNormalization();
    }
  }, [selectedContract, inspectPrice]);

  const loadContracts = async () => {
    try {
      const data = await fetchContracts();
      setContracts(data);
    } catch (err) {
      console.error(err);
    }
  };

  const calculateNormalization = async () => {
    try {
      const res = await inspectNormalization(selectedContract, inspectPrice);
      setNormResult(res);
    } catch (err) {
      console.error(err);
    }
  };

  const activeSpec = contracts.find((c) => c.symbol === selectedContract);

  return (
    <div className="space-y-5 max-w-7xl mx-auto font-sans">
      {/* Title Header */}
      <div className="bg-[#FFFFFF] border border-[#DCE2EA] rounded-md p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-[#F4F6F9] text-[#14243A] border border-[#DCE2EA] font-semibold uppercase">
              Official Specifications
            </span>
            <span className="text-xs text-[#687587] font-mono">Multi Commodity Exchange of India (MCX)</span>
          </div>
          <h2 className="text-base font-bold text-[#14243A] mt-1">Contract Explorer & Normalization Engine</h2>
          <p className="text-xs text-[#687587] mt-0.5">
            Raw quotes cannot be compared directly: contracts differ in trading lot size, quotation base, and fineness purity.
          </p>
        </div>
      </div>

      {/* Contract Specification Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
        {contracts.map((c) => {
          const isSelected = selectedContract === c.symbol;
          return (
            <div
              key={c.symbol}
              onClick={() => setSelectedContract(c.symbol)}
              className={`p-3.5 rounded-md border transition-colors cursor-pointer relative ${
                isSelected
                  ? 'bg-[#FFFFFF] border-[#245BDB] ring-1 ring-[#245BDB]'
                  : 'bg-[#FFFFFF] border-[#DCE2EA] hover:border-[#B4C0D0]'
              }`}
            >
              {isSelected && (
                <div className="absolute top-3 right-3 text-[#245BDB]">
                  <CheckCircle2 className="w-4 h-4" />
                </div>
              )}
              <div className="text-xs font-mono font-bold text-[#245BDB]">{c.symbol}</div>
              <div className="text-xs font-semibold text-[#14243A] mt-0.5">{c.name}</div>

              <div className="mt-2.5 pt-2.5 border-t border-[#EDF1F7] space-y-1 text-xs font-mono">
                <div className="flex justify-between text-[#687587]">
                  <span>Trading Unit:</span>
                  <span className="text-[#14243A] font-semibold">{c.contract_size_grams}g</span>
                </div>
                <div className="flex justify-between text-[#687587]">
                  <span>Quoted Base:</span>
                  <span className="text-[#172538]">Per {c.quote_unit_grams}g</span>
                </div>
                <div className="flex justify-between text-[#687587]">
                  <span>Fineness:</span>
                  <span className={c.stated_purity === 999 ? 'text-[#13834A] font-semibold' : 'text-[#245BDB] font-semibold'}>
                    {c.stated_purity}/1000
                  </span>
                </div>
                <div className="flex justify-between text-[#687587]">
                  <span>Pure Gold / Quote:</span>
                  <span className="text-[#14243A] font-semibold">{c.fine_grams_per_quote_unit.toFixed(3)}g</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Comparison Matrix Table */}
      <div className="bg-[#FFFFFF] border border-[#DCE2EA] rounded-md overflow-hidden">
        <div className="px-4 py-3 border-b border-[#DCE2EA] bg-[#F4F6F9] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Scale className="w-3.5 h-3.5 text-[#245BDB]" />
            <h3 className="text-xs font-bold text-[#14243A] uppercase tracking-wide">
              MCX Official Specification Parity Matrix
            </h3>
          </div>
          <span className="text-[10px] font-mono text-[#687587]">Version: MCX-SPEC-2026.1</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead className="bg-[#F4F6F9] text-[#687587] text-[11px] border-b border-[#DCE2EA]">
              <tr>
                <th className="py-2 px-3">Symbol</th>
                <th className="py-2 px-3">Contract Lot</th>
                <th className="py-2 px-3">Quoted Unit</th>
                <th className="py-2 px-3">Stated Purity</th>
                <th className="py-2 px-3 text-right">Fine Grams / Quote</th>
                <th className="py-2 px-3 text-right">Delivery Lot</th>
                <th className="py-2 px-3 text-right">Lot Multiplier</th>
                <th className="py-2 px-3 text-right">Tick Size</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#EDF1F7]">
              {contracts.map((c) => (
                <tr
                  key={c.symbol}
                  className={`hover:bg-[#F4F6F9] transition-colors ${
                    selectedContract === c.symbol ? 'bg-[#EEF3FD]/40' : ''
                  }`}
                >
                  <td className="py-2.5 px-3 font-bold text-[#245BDB]">{c.symbol}</td>
                  <td className="py-2.5 px-3 text-[#14243A]">{c.contract_size_grams}g</td>
                  <td className="py-2.5 px-3 text-[#687587]">Per {c.quote_unit_grams}g</td>
                  <td className="py-2.5 px-3">
                    <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                      c.stated_purity === 999 ? 'bg-[#ECFDF5] text-[#13834A] border border-[#A7F3D0]' : 'bg-[#EEF3FD] text-[#245BDB] border border-[#BFDBFE]'
                    }`}>
                      {c.stated_purity} ({c.stated_purity === 999 ? '99.9%' : '99.5%'})
                    </span>
                  </td>
                  <td className="py-2.5 px-3 text-right font-bold text-[#14243A] tabular-nums">{c.fine_grams_per_quote_unit.toFixed(4)}g</td>
                  <td className="py-2.5 px-3 text-right text-[#687587] tabular-nums">{c.delivery_unit_grams}g</td>
                  <td className="py-2.5 px-3 text-right text-[#14243A] tabular-nums">{c.multiplier}x</td>
                  <td className="py-2.5 px-3 text-right text-[#687587] tabular-nums">₹{c.tick_size_inr.toFixed(1)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Interactive Normalization Inspector */}
      <div className="bg-[#FFFFFF] border border-[#DCE2EA] rounded-md p-4 space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-[#EDF1F7] pb-3">
          <div>
            <div className="flex items-center gap-2">
              <Calculator className="w-3.5 h-3.5 text-[#245BDB]" />
              <h3 className="text-xs font-bold text-[#14243A] uppercase tracking-wide">
                Price Normalization Engine ({selectedContract})
              </h3>
            </div>
            <p className="text-xs text-[#687587] mt-0.5">
              Verify the exact conversion from the raw contract quoted price to fine-gram parity.
            </p>
          </div>

          <button
            onClick={() => setModalOpen(true)}
            className="px-3 py-1 rounded bg-[#FFFFFF] hover:bg-[#F4F6F9] border border-[#DCE2EA] text-xs font-mono text-[#14243A] transition-colors cursor-pointer flex items-center gap-1.5"
          >
            <span>Detailed Audit Modal</span>
            <ArrowRight className="w-3 h-3 text-[#245BDB]" />
          </button>
        </div>

        {/* Input and Results Strip */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {/* Input Box */}
          <div className="p-3 rounded bg-[#F4F6F9] border border-[#DCE2EA] space-y-1.5">
            <label className="text-xs font-mono text-[#687587]">Raw Quoted Price (₹):</label>
            <input
              type="number"
              value={inspectPrice}
              onChange={(e) => setInspectPrice(parseFloat(e.target.value) || 0)}
              className="w-full bg-[#FFFFFF] border border-[#DCE2EA] rounded px-2.5 py-1 text-base font-mono font-bold text-[#245BDB] focus:outline-hidden focus:border-[#245BDB]"
            />
            <div className="text-[10px] text-[#687587] font-mono">
              Quotation basis: {activeSpec?.quote_unit_grams}g of {activeSpec?.stated_purity} gold
            </div>
          </div>

          {/* Canonical Metric */}
          <div className="p-3 rounded bg-[#F4F6F9] border border-[#DCE2EA]">
            <div className="text-[10px] font-mono text-[#687587] uppercase">Canonical Basis (INR / Fine Gram)</div>
            <div className="text-xl font-bold font-mono text-[#13834A] mt-1 tabular-nums">
              ₹{normResult?.normalized_price_per_fine_gram.toFixed(4) ?? '—'}/g
            </div>
            <div className="text-[10px] text-[#8E9BAE] font-mono mt-0.5">
              100% Pure Fine Gold (1000 fineness)
            </div>
          </div>

          {/* Benchmark 10g 999 Metric */}
          <div className="p-3 rounded bg-[#F4F6F9] border border-[#DCE2EA]">
            <div className="text-[10px] font-mono text-[#687587] uppercase">Benchmark Basis (INR / 10g 999)</div>
            <div className="text-xl font-bold font-mono text-[#245BDB] mt-1 tabular-nums">
              ₹{normResult?.normalized_price_per_10g_999.toFixed(2) ?? '—'}
            </div>
            <div className="text-[10px] text-[#8E9BAE] font-mono mt-0.5">
              Physical Market Standard Reference
            </div>
          </div>
        </div>

        {/* Audit Steps Breakdown */}
        {normResult && (
          <div className="space-y-2 pt-2">
            <div className="text-[10px] font-mono text-[#687587] uppercase tracking-wider font-semibold">
              Step-by-Step Conversion Audit Trail
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
              {normResult.audit_trail.slice(0, 4).map((step) => (
                <div
                  key={step.step_number}
                  className="p-2.5 rounded bg-[#F4F6F9] border border-[#DCE2EA] space-y-1"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-[#14243A]">
                      Step {step.step_number}: {step.title}
                    </span>
                    <code className="text-[10px] font-mono text-[#245BDB] bg-[#FFFFFF] px-1.5 py-0.5 rounded border border-[#DCE2EA]">
                      {step.formula}
                    </code>
                  </div>
                  <p className="text-[11px] text-[#687587]">{step.explanation}</p>
                  <div className="text-xs font-mono font-bold text-[#14243A] pt-0.5">
                    Result: {step.output_value.toLocaleString()}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Modal Inspector */}
      <ConversionInspectorModal
        symbol={selectedContract}
        initialPrice={inspectPrice}
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
      />
    </div>
  );
};
