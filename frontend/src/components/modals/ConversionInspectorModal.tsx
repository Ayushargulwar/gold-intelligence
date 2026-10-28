import React, { useState, useEffect } from 'react';
import { X, Calculator, ShieldCheck } from 'lucide-react';
import { inspectNormalization } from '../../api/client';
import type { NormalizedPriceResult } from '../../types';

interface ConversionInspectorModalProps {
  symbol: string;
  initialPrice?: number;
  isOpen: boolean;
  onClose: () => void;
}

export const ConversionInspectorModal: React.FC<ConversionInspectorModalProps> = ({
  symbol,
  initialPrice = 74500,
  isOpen,
  onClose,
}) => {
  const [inputPrice, setInputPrice] = useState<number>(initialPrice);
  const [result, setResult] = useState<NormalizedPriceResult | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setInputPrice(initialPrice);
  }, [initialPrice]);

  useEffect(() => {
    if (isOpen) {
      handleInspect();
    }
  }, [isOpen, symbol, inputPrice]);

  const handleInspect = async () => {
    if (!inputPrice || inputPrice <= 0) return;
    try {
      setLoading(true);
      setError(null);
      const res = await inspectNormalization(symbol, inputPrice);
      setResult(res);
    } catch (err: any) {
      setError(err.message || 'Inspection failed');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#14243A]/50 backdrop-blur-xs p-4">
      <div className="bg-[#FFFFFF] border border-[#DCE2EA] rounded-md w-full max-w-2xl max-h-[90vh] flex flex-col shadow-xl overflow-hidden font-sans">
        {/* Header */}
        <div className="px-5 py-3.5 border-b border-[#DCE2EA] flex items-center justify-between bg-[#F4F6F9]">
          <div className="flex items-center gap-3">
            <div className="p-1.5 rounded bg-[#EEF3FD] text-[#245BDB] border border-[#BFDBFE]">
              <Calculator className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-xs font-bold text-[#14243A] uppercase tracking-wide">
                Price Normalization Audit: {symbol}
              </h3>
              <p className="text-[11px] text-[#687587] font-mono">
                Step-by-step conversion from quoted unit to fine-gram parity
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded text-[#687587] hover:text-[#172538] hover:bg-[#EDF1F7] transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Price Input Controls */}
        <div className="p-4 border-b border-[#DCE2EA] bg-[#F4F6F9] flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <label className="text-xs font-mono font-semibold text-[#14243A]">Quoted Price (₹):</label>
            <input
              type="number"
              value={inputPrice}
              onChange={(e) => setInputPrice(parseFloat(e.target.value) || 0)}
              className="bg-[#FFFFFF] border border-[#DCE2EA] rounded px-2.5 py-1 text-xs font-mono text-[#14243A] font-semibold w-32 focus:outline-hidden focus:border-[#245BDB]"
            />
          </div>

          {result && (
            <div className="flex items-center gap-3">
              <div className="px-3 py-1 rounded bg-[#FFFFFF] border border-[#DCE2EA]">
                <div className="text-[9px] text-[#687587] font-mono uppercase">INR / Fine Gram</div>
                <div className="text-xs font-bold text-[#13834A] font-mono tabular-nums">
                  ₹{result.normalized_price_per_fine_gram.toFixed(4)}/g
                </div>
              </div>
              <div className="px-3 py-1 rounded bg-[#FFFFFF] border border-[#DCE2EA]">
                <div className="text-[9px] text-[#687587] font-mono uppercase">10g 999 Benchmark</div>
                <div className="text-xs font-bold text-[#245BDB] font-mono tabular-nums">
                  ₹{result.normalized_price_per_10g_999.toFixed(2)}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Step-by-Step Audit Trail */}
        <div className="flex-1 overflow-y-auto p-5 space-y-3">
          {error && (
            <div className="p-2.5 rounded bg-[#FEF2F2] border border-[#FECACA] text-[#D64550] text-xs font-semibold">
              {error}
            </div>
          )}

          {result && (
            <div className="space-y-2.5">
              <div className="text-[10px] font-mono text-[#687587] uppercase tracking-wider mb-1 flex items-center gap-1.5 font-bold">
                <ShieldCheck className="w-3.5 h-3.5 text-[#13834A]" />
                <span>Deterministic Normalization Steps ({result.metadata_version})</span>
              </div>

              {result.audit_trail.map((step) => (
                <div
                  key={step.step_number}
                  className="p-3 rounded bg-[#F4F6F9] border border-[#DCE2EA]"
                >
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <span className="w-4 h-4 rounded bg-[#14243A] text-[#FFFFFF] text-[10px] font-mono font-bold flex items-center justify-center">
                        {step.step_number}
                      </span>
                      <span className="text-xs font-bold text-[#14243A]">{step.title}</span>
                    </div>
                    <code className="text-[10px] font-mono text-[#245BDB] px-1.5 py-0.5 rounded bg-[#FFFFFF] border border-[#DCE2EA]">
                      {step.formula}
                    </code>
                  </div>

                  <p className="text-[11px] text-[#687587] ml-6 leading-relaxed">{step.explanation}</p>

                  <div className="ml-6 mt-1.5 pt-1.5 border-t border-[#DCE2EA] flex items-center justify-between text-[10px] font-mono text-[#687587]">
                    <div className="flex gap-2">
                      {Object.entries(step.input_values).map(([k, v]) => (
                        <span key={k}>
                          {k}: <span className="text-[#14243A] font-medium">{typeof v === 'number' ? v.toLocaleString() : String(v)}</span>
                        </span>
                      ))}
                    </div>
                    <div className="text-[#245BDB] font-semibold flex items-center gap-1">
                      <span>Result:</span>
                      <span>{step.output_value.toLocaleString()}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-2.5 border-t border-[#DCE2EA] bg-[#F4F6F9] flex justify-between items-center text-xs text-[#687587]">
          <span className="font-mono text-[10px] text-[#8E9BAE]">
            Formula: Canonical Price = Raw Quoted Price ÷ (Quote Unit Grams × Fineness Fraction)
          </span>
          <button
            onClick={onClose}
            className="px-3 py-1 rounded bg-[#FFFFFF] hover:bg-[#EDF1F7] border border-[#DCE2EA] text-[#14243A] text-xs font-semibold transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
