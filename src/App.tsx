import { useState } from 'react';
import { MODULES } from './engine/physicsEngine';
import { CustomSeedPayload, ModuleId, PageId, SimId, WorkspaceTab } from './types/physics';
import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { HomePage } from './pages/HomePage';
import { TopicsPage } from './pages/TopicsPage';
import { SimulationWorkspacePage } from './pages/SimulationWorkspacePage';
import { FormulaUploadPage } from './pages/FormulaUploadPage';
import { AboutPage } from './pages/AboutPage';

export default function App() {
  const [currentPage, setCurrentPage] = useState<PageId>('beranda');
  const [activeModule, setActiveModule] = useState<ModuleId>('kinematika');
  const [activeSim, setActiveSim] = useState<SimId>('parabola');
  const [activeTab, setActiveTab] = useState<WorkspaceTab>('simulasi');
  const [customSeed, setCustomSeed] = useState<CustomSeedPayload | null>(null);

  const handleNavigate = (page: PageId) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleOpenSimulation = (
    moduleId: ModuleId,
    simId?: SimId,
    tab: WorkspaceTab = 'simulasi'
  ) => {
    const mod = MODULES.find((m) => m.id === moduleId);
    setActiveModule(moduleId);
    setActiveSim(simId || mod?.defaultSimId || 'parabola');
    setActiveTab(tab);
    setCurrentPage('simulasi');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSelectModule = (moduleId: ModuleId) => {
    const mod = MODULES.find((m) => m.id === moduleId);
    setActiveModule(moduleId);
    setCustomSeed(null);
    if (activeSim !== 'kustom' && mod) {
      setActiveSim(mod.defaultSimId);
    }
    setActiveTab('simulasi');
  };

  const handleLaunchCustomInSimulator = (seed: CustomSeedPayload) => {
    setCustomSeed(seed);
    setActiveSim('kustom');
    setActiveTab('simulasi');
    setCurrentPage('simulasi');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#EFF5F4] text-[#1D3532]">
      <Header currentPage={currentPage} onNavigate={handleNavigate} />

      <main className="flex-1 w-full">
        {currentPage === 'beranda' && (
          <HomePage
            onNavigate={handleNavigate}
            onOpenSimulation={handleOpenSimulation}
          />
        )}
        {currentPage === 'topik' && (
          <TopicsPage onOpenSimulation={handleOpenSimulation} />
        )}
        {currentPage === 'simulasi' && (
          <SimulationWorkspacePage
            activeModule={activeModule}
            activeSim={activeSim}
            activeTab={activeTab}
            customSeed={customSeed}
            onSelectModule={handleSelectModule}
            onSelectSim={(sim) => {
              if (sim !== 'kustom') setCustomSeed(null);
              setActiveSim(sim);
            }}
            onSelectTab={setActiveTab}
          />
        )}
        {currentPage === 'unggah-rumus' && (
          <FormulaUploadPage onLaunchInSimulator={handleLaunchCustomInSimulator} />
        )}
        {currentPage === 'tentang' && <AboutPage onNavigate={handleNavigate} />}
      </main>

      <Footer onNavigate={handleNavigate} />
    </div>
  );
}
