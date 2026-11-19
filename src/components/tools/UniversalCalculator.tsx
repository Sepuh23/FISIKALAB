import React, { useEffect, useMemo, useState } from 'react';
import { Calculator, AlertCircle, CheckCircle2, Copy, Check } from 'lucide-react';
import { CALCULATOR_FORMULAS, MODULES } from '../../engine/physicsEngine';
import { ModuleId } from '../../types/physics';
import { MathDisplay } from '../MathDisplay';

interface Props {
  initialModule?: ModuleId;
}

export const UniversalCalculator: React.FC<Props> = ({ initialModule = 'dinamika' }) => {
  const [selectedModule, setSelectedModule] = useState<ModuleId>(initialModule);

  const moduleFormulas = useMemo(
    () => CALCULATOR_FORMULAS.filter((f) => f.moduleId === selectedModule),
    [selectedModule]
  );

  const [selectedFormulaId, setSelectedFormulaId] = useState<string>(
    moduleFormulas[0]?.id || CALCULATOR_FORMULAS[0].id
  );

  const activeFormula = useMemo(
    () =>
      CALCULATOR_FORMULAS.find((f) => f.id === selectedFormulaId) ||
      moduleFormulas[0] ||
      CALCULATOR_FORMULAS[0],
    [selectedFormulaId, moduleFormulas]
  );

  const [inputValues, setInputValues] = useState<Record<string, number>>(() => {
    const init: Record<string, number> = {};
    CALCULATOR_FORMULAS.forEach((f) => {
      f.inputs.forEach((inp) => {
        init[`${f.id}:${inp.key}`] = inp.defaultValue;
      });
    });
    return init;
  });

  const [copied, setCopied] = useState(false);

  useEffect(() => {
    setSelectedModule(initialModule);
    const first = CALCULATOR_FORMULAS.find((f) => f.moduleId === initialModule);
    if (first) setSelectedFormulaId(first.id);
  }, [initialModule]);

  const handleModuleChange = (modId: ModuleId) => {
    setSelectedModule(modId);
    const first = CALCULATOR_FORMULAS.find((f) => f.moduleId === modId);
    if (first) setSelectedFormulaId(first.id);
  };

  const currentScope = useMemo(() => {
    const scope: Record<string, number> = {};
    activeFormula.inputs.forEach((inp) => {
      const val = inputValues[`${activeFormula.id}:${inp.key}`];
      scope[inp.key] = Number.isFinite(val) ? val : inp.defaultValue;
    });
    return scope;
  }, [activeFormula, inputValues]);

  // Validation
  const validationError = useMemo(() => {
    for (const inp of activeFormula.inputs) {
      const val = currentScope[inp.key];
      if (!Number.isFinite(val)) {
        return `Nilai "${inp.label}" harus berupa angka yang valid.`;
      }
      if (inp.mustBePositive && val <= 0) {
        return `Nilai "${inp.label}" (${inp.symbol}) harus lebih besar dari 0 ${inp.unit}.`;
      }
      if (inp.min !== undefined && val < inp.min) {
        return `Nilai "${inp.label}" minimal ${inp.min} ${inp.unit}.`;
      }
      if (inp.max !== undefined && val > inp.max) {
        return `Nilai "${inp.label}" maksimal ${inp.max} ${inp.unit}.`;
      }
    }
    return null;
  }, [activeFormula, currentScope]);

  const solution = useMemo(() => {
    if (validationError) return null;
    return activeFormula.solve(currentScope);
  }, [activeFormula, currentScope, validationError]);

  return (
    <div className="grid grid-cols-1 xl:grid-cols-12 gap-5 items-start">
      {/* LEFT: Module & Formula Selector */}
      <aside className="xl:col-span-4 bg-white rounded-2xl p-5 shadow-sm border border-[#8FB5AE]/25 flex flex-col gap-4">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-[#CBE2DD] text-[#1D3532] flex items-center justify-center">
            <Calculator className="w-5 h-5" />
          </div>
          <div>
            <h2 className="font-display text-lg font-bold text-[#1D3532]">
              Kalkulator Fisika Universal
            </h2>
            <p className="text-xs text-[#4F6A66]">Mendukung semua 5 modul kurikulum SI</p>
          </div>
        </div>

        <div>
          <p className="text-xs font-semibold text-[#1D3532] mb-2">1. Pilih Topik Fisika</p>
          <div className="flex flex-wrap gap-1.5">
            {MODULES.map((m) => (
              <button
                key={m.id}
                type="button"
                onClick={() => handleModuleChange(m.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors cursor-pointer ${
                  selectedModule === m.id
                    ? 'bg-[#1D3532] text-white'
                    : 'bg-[#EFF5F4] text-[#4F6A66] hover:bg-[#CBE2DD]'
                }`}
              >
                {m.number}. {m.shortTitle}
              </button>
            ))}
          </div>
        </div>

        <div>
          <p className="text-xs font-semibold text-[#1D3532] mb-2">2. Pilih Rumus Fisika</p>
          <div className="flex flex-col gap-2">
            {moduleFormulas.map((f) => (
              <button
                key={f.id}
                type="button"
                onClick={() => setSelectedFormulaId(f.id)}
                className={`p-3 rounded-xl text-left border transition-all cursor-pointer ${
                  activeFormula.id === f.id
                    ? 'bg-[#EFF5F4] border-[#E26D62] text-[#1D3532]'
                    : 'bg-white border-[#CBE2DD] text-[#4F6A66] hover:bg-[#EFF5F4]/60'
                }`}
              >
                <p className="text-xs font-bold text-[#1D3532]">{f.name}</p>
                <div className="mt-1 text-xs">
                  <MathDisplay latex={f.formulaLatex} />
                </div>
              </button>
            ))}
          </div>
        </div>
      </aside>

      {/* CENTER: Variable Inputs */}
      <section className="xl:col-span-4 bg-white rounded-2xl p-6 shadow-sm border border-[#8FB5AE]/25 flex flex-col gap-5">
        <div>
          <span className="text-xs font-medium text-[#4F6A66]">3. Masukkan Nilai Variabel</span>
          <h3 className="font-display text-xl font-bold text-[#1D3532] mt-0.5">
            {activeFormula.name}
          </h3>
        </div>

        <div className="bg-[#EFF5F4] rounded-xl p-4 text-center">
          <MathDisplay latex={activeFormula.formulaLatex} block />
        </div>

        <div className="space-y-4">
          {activeFormula.inputs.map((inp) => {
            const val = inputValues[`${activeFormula.id}:${inp.key}`] ?? inp.defaultValue;
            return (
              <div key={inp.key} className="bg-[#EFF5F4]/70 rounded-xl p-3.5 border border-[#CBE2DD]">
                <div className="flex items-center justify-between mb-1.5">
                  <label
                    htmlFor={`calc-inp-${inp.key}`}
                    className="text-xs font-semibold text-[#1D3532]"
                  >
                    {inp.label} ({inp.symbol})
                  </label>
                  <span className="text-xs font-mono-tabular font-semibold text-[#4F6A66]">
                    Satuan SI: {inp.unit}
                  </span>
                </div>
                <input
                  id={`calc-inp-${inp.key}`}
                  type="number"
                  step={inp.step ?? 0.1}
                  value={Number.isNaN(val) ? '' : val}
                  onChange={(e) => {
                    const parsed = e.target.value === '' ? NaN : Number(e.target.value);
                    setInputValues((prev) => ({
                      ...prev,
                      [`${activeFormula.id}:${inp.key}`]: parsed,
                    }));
                  }}
                  className="w-full px-3 py-2 rounded-lg bg-white border border-[#8FB5AE]/50 font-mono-tabular text-sm font-semibold text-[#1D3532] focus:outline-none focus:border-[#E26D62]"
                />
              </div>
            );
          })}
        </div>

        <button
          type="button"
          onClick={() => {
            setInputValues((prev) => {
              const next = { ...prev };
              activeFormula.inputs.forEach((inp) => {
                next[`${activeFormula.id}:${inp.key}`] = inp.defaultValue;
              });
              return next;
            });
          }}
          className="py-2 px-4 rounded-xl bg-[#CBE2DD] text-[#1D3532] text-xs font-semibold hover:bg-[#8FB5AE]/50 cursor-pointer self-start"
        >
          Reset Nilai Default
        </button>
      </section>

      {/* RIGHT: Step-by-Step Solution & Validation */}
      <aside className="xl:col-span-4 bg-white rounded-2xl p-6 shadow-sm border border-[#8FB5AE]/25 flex flex-col gap-4">
        <h3 className="font-display text-lg font-bold text-[#1D3532]">
          4. Proses & Hasil Perhitungan
        </h3>

        {validationError || solution?.error ? (
          <div className="p-4 rounded-xl bg-[#E26D62]/15 border border-[#E26D62]/40 flex items-start gap-2.5 text-sm text-[#1D3532]">
            <AlertCircle className="w-5 h-5 text-[#E26D62] shrink-0 mt-0.5" />
            <div>
              <p className="font-bold">Validasi Numerik Gagal</p>
              <p className="text-xs mt-1 text-[#4F6A66]">{validationError || solution?.error}</p>
            </div>
          </div>
        ) : (
          solution && (
            <>
              <div className="bg-[#1D3532] text-white rounded-2xl p-5">
                <div className="flex items-center justify-between gap-2 mb-1">
                  <div className="flex items-center gap-1.5 text-xs text-[#95B3A6]">
                    <CheckCircle2 className="w-4 h-4 text-[#8FB5AE]" />
                    <span>Hasil Akhir ({activeFormula.outputLabel})</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      const text = `${activeFormula.name}: ${activeFormula.outputSymbol} = ${Number(solution.result.toFixed(4))} ${activeFormula.outputUnit}`;
                      navigator.clipboard?.writeText(text);
                      setCopied(true);
                      setTimeout(() => setCopied(false), 1800);
                    }}
                    className="px-2 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-[11px] font-semibold text-[#EFF5F4] flex items-center gap-1 cursor-pointer"
                  >
                    {copied ? <Check className="w-3 h-3 text-[#8FB5AE]" /> : <Copy className="w-3 h-3" />}
                    {copied ? 'Tersalin' : 'Salin'}
                  </button>
                </div>
                <p className="font-mono-tabular text-3xl font-bold text-[#EFF5F4]">
                  {Math.abs(solution.result) < 0.001 && solution.result !== 0
                    ? solution.result.toExponential(3)
                    : Number(solution.result.toFixed(4))}{' '}
                  <span className="text-lg text-[#E26D62]">{activeFormula.outputUnit}</span>
                </p>
              </div>

              <div className="bg-[#EFF5F4] rounded-xl p-4 space-y-2.5">
                <p className="text-xs font-bold text-[#1D3532]">Langkah Penyelesaian Matematis</p>
                {solution.stepsLatex.map((step, idx) => (
                  <div
                    key={idx}
                    className="bg-white rounded-lg px-3 py-2 border border-[#CBE2DD] overflow-x-auto"
                  >
                    <MathDisplay latex={step} />
                  </div>
                ))}
              </div>

              <div className="bg-[#EFF5F4] rounded-xl p-4 text-xs text-[#4F6A66] leading-relaxed">
                <p className="font-bold text-[#1D3532] mb-1">Penjelasan Hasil</p>
                <p>{solution.explanation}</p>
              </div>
            </>
          )
        )}
      </aside>
    </div>
  );
};
