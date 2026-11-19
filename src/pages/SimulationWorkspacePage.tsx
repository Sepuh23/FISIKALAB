import React from 'react';
import { Calculator, LineChart as LineChartIcon, FlaskConical, Sparkles } from 'lucide-react';
import { MODULES, SIMULATIONS } from '../engine/physicsEngine';
import { CustomSeedPayload, ModuleId, SimId, WorkspaceTab } from '../types/physics';
import { Module01BesaranSim } from '../components/simulations/Module01BesaranSim';
import { Module02KinematikaSim } from '../components/simulations/Module02KinematikaSim';
import { Module03DinamikaSim } from '../components/simulations/Module03DinamikaSim';
import { Module04EnergiSim } from '../components/simulations/Module04EnergiSim';
import { Module05TermodinamikaSim } from '../components/simulations/Module05TermodinamikaSim';
import { CustomFormulaSimulator } from '../components/simulations/CustomFormulaSimulator';
import { UniversalCalculator } from '../components/tools/UniversalCalculator';
import { DynamicGraphGenerator } from '../components/tools/DynamicGraphGenerator';

interface SimulationWorkspacePageProps {
  activeModule: ModuleId;
  activeSim: SimId;
  activeTab: WorkspaceTab;
  customSeed?: CustomSeedPayload | null;
  onSelectModule: (moduleId: ModuleId) => void;
  onSelectSim: (simId: SimId) => void;
  onSelectTab: (tab: WorkspaceTab) => void;
}

export const SimulationWorkspacePage: React.FC<SimulationWorkspacePageProps> = ({
  activeModule,
  activeSim,
  activeTab,
  customSeed,
  onSelectModule,
  onSelectSim,
  onSelectTab,
}) => {
  const moduleSims = SIMULATIONS.filter((s) => s.moduleId === activeModule);

  return (
    <div className="max-w-[1440px] mx-auto px-4 sm:px-8 py-6 space-y-5">
      {/* Top Workspace Selector Bar */}
      <div className="bg-white rounded-2xl p-4 shadow-sm border border-[#8FB5AE]/25 flex flex-col gap-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          {/* 5 Module Switcher */}
          <div className="flex flex-wrap items-center gap-1.5">
            {MODULES.map((mod) => (
              <button
                key={mod.id}
                type="button"
                onClick={() => onSelectModule(mod.id)}
                className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
                  activeModule === mod.id && activeTab === 'simulasi'
                    ? 'bg-[#1D3532] text-white shadow-sm'
                    : 'bg-[#EFF5F4] text-[#4F6A66] hover:bg-[#CBE2DD] hover:text-[#1D3532]'
                }`}
              >
                {mod.number}. {mod.shortTitle}
              </button>
            ))}
          </div>

          {/* Mode Tabs: Simulasi | Kalkulator | Grafik */}
          <div className="flex items-center gap-1 bg-[#EFF5F4] p-1 rounded-xl self-start lg:self-auto">
            <button
              type="button"
              onClick={() => onSelectTab('simulasi')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-all whitespace-nowrap ${
                activeTab === 'simulasi'
                  ? 'bg-white text-[#1D3532] shadow-sm'
                  : 'text-[#4F6A66] hover:text-[#1D3532]'
              }`}
            >
              <FlaskConical className="w-3.5 h-3.5 text-[#E26D62]" />
              Simulasi
            </button>
            <button
              type="button"
              onClick={() => onSelectTab('kalkulator')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-all whitespace-nowrap ${
                activeTab === 'kalkulator'
                  ? 'bg-white text-[#1D3532] shadow-sm'
                  : 'text-[#4F6A66] hover:text-[#1D3532]'
              }`}
            >
              <Calculator className="w-3.5 h-3.5 text-[#E26D62]" />
              Kalkulator Universal
            </button>
            <button
              type="button"
              onClick={() => onSelectTab('grafik')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-all whitespace-nowrap ${
                activeTab === 'grafik'
                  ? 'bg-white text-[#1D3532] shadow-sm'
                  : 'text-[#4F6A66] hover:text-[#1D3532]'
              }`}
            >
              <LineChartIcon className="w-3.5 h-3.5 text-[#E26D62]" />
              Generator Grafik
            </button>
          </div>
        </div>

        {/* Sub-simulation switcher for active module + Custom Formula entry */}
        {activeTab === 'simulasi' && (
          <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-[#CBE2DD]/60">
            <span className="text-xs font-medium text-[#4F6A66] mr-1">Eksperimen:</span>
            {moduleSims.map((sim) => (
              <button
                key={sim.id}
                type="button"
                onClick={() => onSelectSim(sim.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap ${
                  activeSim === sim.id
                    ? 'bg-[#E26D62] text-white'
                    : 'bg-[#EFF5F4] text-[#1D3532] hover:bg-[#CBE2DD]'
                }`}
              >
                {sim.title}
              </button>
            ))}
            <button
              type="button"
              onClick={() => onSelectSim('kustom')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                activeSim === 'kustom'
                  ? 'bg-[#1D3532] text-white'
                  : 'bg-[#CBE2DD]/70 text-[#1D3532] hover:bg-[#CBE2DD]'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-[#E26D62]" />
              Rumus Kustom (Manual / Unggah)
            </button>
          </div>
        )}
      </div>

      {/* Main Content Body */}
      {activeTab === 'simulasi' && activeSim === 'kustom' && (
        <CustomFormulaSimulator
          moduleId={activeModule}
          initialSeed={customSeed}
        />
      )}

      {activeTab === 'simulasi' && activeSim !== 'kustom' && (
        <>
          {activeModule === 'besaran' && <Module01BesaranSim simId={activeSim} />}
          {activeModule === 'kinematika' && <Module02KinematikaSim simId={activeSim} />}
          {activeModule === 'dinamika' && <Module03DinamikaSim simId={activeSim} />}
          {activeModule === 'energi' && <Module04EnergiSim simId={activeSim} />}
          {activeModule === 'termodinamika' && <Module05TermodinamikaSim simId={activeSim} />}
        </>
      )}

      {activeTab === 'kalkulator' && <UniversalCalculator initialModule={activeModule} />}

      {activeTab === 'grafik' && <DynamicGraphGenerator />}
    </div>
  );
};
