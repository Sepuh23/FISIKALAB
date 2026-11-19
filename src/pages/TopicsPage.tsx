import React, { useState } from 'react';
import { ArrowRight, Calculator } from 'lucide-react';
import { MODULES, SIMULATIONS } from '../engine/physicsEngine';
import { ModuleId, SimId, WorkspaceTab } from '../types/physics';
import { MathDisplay } from '../components/MathDisplay';
import { PixelModuleIllustration } from '../components/PixelIllustrations';

interface TopicsPageProps {
  onOpenSimulation: (moduleId: ModuleId, simId?: SimId, tab?: WorkspaceTab) => void;
}

export const TopicsPage: React.FC<TopicsPageProps> = ({ onOpenSimulation }) => {
  const [filterMod, setFilterMod] = useState<ModuleId | 'all'>('all');

  const visibleModules =
    filterMod === 'all' ? MODULES : MODULES.filter((m) => m.id === filterMod);

  return (
    <div className="max-w-[1440px] mx-auto px-4 sm:px-8 py-10 space-y-8">
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4">
        <div>
          <p className="text-xs font-semibold text-[#4F6A66]">Kurikulum Terintegrasi</p>
          <h1 className="font-display text-3xl sm:text-4xl font-bold text-[#1D3532] mt-1">
            Topik Fisika & Persamaan Dasar
          </h1>
          <p className="text-sm sm:text-base text-[#4F6A66] max-w-2xl mt-2">
            Telusuri lima cabang utama fisika beserta rumus baku Satuan Internasional (SI) dan buka langsung simulasinya.
          </p>
        </div>

        {/* Module Filter Tabs */}
        <div className="flex flex-wrap items-center gap-1.5 bg-[#CBE2DD]/60 p-1.5 rounded-xl">
          <button
            type="button"
            onClick={() => setFilterMod('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-colors ${
              filterMod === 'all' ? 'bg-white text-[#1D3532] shadow-sm' : 'text-[#4F6A66]'
            }`}
          >
            Semua Modul
          </button>
          {MODULES.map((m) => (
            <button
              key={m.id}
              type="button"
              onClick={() => setFilterMod(m.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-colors ${
                filterMod === m.id ? 'bg-white text-[#1D3532] shadow-sm' : 'text-[#4F6A66]'
              }`}
            >
              {m.number}. {m.shortTitle}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-6">
        {visibleModules.map((mod) => {
          const modSims = SIMULATIONS.filter((s) => s.moduleId === mod.id);
          return (
            <section
              key={mod.id}
              className="bg-white rounded-2xl p-6 sm:p-8 shadow-sm border border-[#8FB5AE]/25 space-y-6"
            >
              <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                <div className="flex items-start gap-4">
                  <div className="p-2.5 rounded-2xl bg-[#EFF5F4] shrink-0">
                    <PixelModuleIllustration moduleId={mod.id} className="w-12 h-12" />
                  </div>
                  <div>
                    <span className="text-xs font-mono-tabular font-semibold text-[#4F6A66]">
                      Modul {mod.number}
                    </span>
                    <h2 className="font-display text-2xl font-bold text-[#1D3532]">
                      {mod.title}
                    </h2>
                    <p className="text-sm text-[#4F6A66] max-w-2xl mt-1">{mod.description}</p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => onOpenSimulation(mod.id, mod.defaultSimId, 'kalkulator')}
                  className="px-4 py-2 rounded-xl bg-[#EFF5F4] hover:bg-[#CBE2DD] text-[#1D3532] text-xs font-semibold flex items-center gap-1.5 shrink-0 cursor-pointer"
                >
                  <Calculator className="w-4 h-4 text-[#E26D62]" />
                  <span>Kalkulator Modul {mod.number}</span>
                </button>
              </div>

              {/* Concept list & Key Formulas */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
                <div className="lg:col-span-5 bg-[#EFF5F4] rounded-2xl p-5">
                  <h3 className="font-display text-sm font-bold text-[#1D3532] mb-3">
                    Cakupan Konsep
                  </h3>
                  <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-[#1D3532]">
                    {mod.concepts.map((c) => (
                      <li key={c} className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#E26D62] shrink-0" />
                        <span>{c}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="lg:col-span-7 bg-[#EFF5F4] rounded-2xl p-5">
                  <h3 className="font-display text-sm font-bold text-[#1D3532] mb-3">
                    Persamaan Utama
                  </h3>
                  <div className="space-y-2.5">
                    {mod.formulasLatex.map((latex, idx) => (
                      <div
                        key={idx}
                        className="bg-white rounded-xl px-4 py-2.5 border border-[#CBE2DD] overflow-x-auto"
                      >
                        <MathDisplay latex={latex} />
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Available Interactive Simulations */}
              <div>
                <h3 className="font-display text-sm font-bold text-[#1D3532] mb-3">
                  Simulasi Interaktif Tersedia
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                  {modSims.map((sim) => (
                    <button
                      key={sim.id}
                      type="button"
                      onClick={() => onOpenSimulation(mod.id, sim.id, 'simulasi')}
                      className="p-4 rounded-xl bg-[#EFF5F4]/80 hover:bg-[#CBE2DD]/65 border border-[#8FB5AE]/25 text-left flex flex-col justify-between gap-3 transition-colors cursor-pointer group"
                    >
                      <div>
                        <p className="font-display text-sm font-bold text-[#1D3532] group-hover:text-[#E26D62] transition-colors">
                          {sim.title}
                        </p>
                        <p className="text-xs text-[#4F6A66] mt-1">{sim.subtitle}</p>
                      </div>
                      <span className="text-xs font-semibold text-[#1D3532] flex items-center gap-1">
                        Jalankan <ArrowRight className="w-3.5 h-3.5" />
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
};
