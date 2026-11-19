import React, { useEffect, useRef, useState } from 'react';
import { motion } from 'motion/react';
import { ArrowRight, Calculator, LineChart as LineChartIcon, Upload, RotateCcw } from 'lucide-react';
import { ModuleId, PageId, SimId, WorkspaceTab } from '../types/physics';
import { MODULES } from '../engine/physicsEngine';
import { MathDisplay } from '../components/MathDisplay';
import { PixelLabBanner, PixelModuleIllustration } from '../components/PixelIllustrations';

interface HomePageProps {
  onNavigate: (page: PageId) => void;
  onOpenSimulation: (moduleId: ModuleId, simId?: SimId, tab?: WorkspaceTab) => void;
}

export const HomePage: React.FC<HomePageProps> = ({ onNavigate, onOpenSimulation }) => {
  // Interactive Hero Micro-Sandbox (Osilasi Teredam)
  const [mass, setMass] = useState(2.5);
  const [damping, setDamping] = useState(0.12);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const historyRef = useRef<number[]>([]);
  const timeRef = useRef(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let raf = 0;
    const k = 20;

    const render = () => {
      const dpr = window.devicePixelRatio || 1;
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      const w = rect.width;
      const h = rect.height;
      const centerY = h / 2;

      ctx.clearRect(0, 0, w, h);

      // Subtle lab grid
      ctx.strokeStyle = '#CBE2DD';
      ctx.lineWidth = 0.7;
      for (let gx = 24; gx < w; gx += 24) {
        ctx.beginPath();
        ctx.moveTo(gx, 0);
        ctx.lineTo(gx, h);
        ctx.stroke();
      }
      ctx.strokeStyle = '#8FB5AE';
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.moveTo(0, centerY);
      ctx.lineTo(w, centerY);
      ctx.stroke();
      ctx.setLineDash([]);

      timeRef.current += 0.035;
      const tMod = timeRef.current % 9;
      const gamma = damping / (2 * mass);
      const omega = Math.sqrt(Math.max(0.1, k / mass - gamma * gamma));
      const amp = h * 0.34 * Math.exp(-gamma * tMod);
      const currY = centerY - amp * Math.cos(omega * tMod);

      historyRef.current.push(currY);
      if (historyRef.current.length > 160) historyRef.current.shift();

      ctx.strokeStyle = '#E26D62';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      historyRef.current.forEach((yVal, i) => {
        const xVal = w - (historyRef.current.length - i) * (w / 160);
        if (i === 0) ctx.moveTo(xVal, yVal);
        else ctx.lineTo(xVal, yVal);
      });
      ctx.stroke();

      // Pixel-inspired square probe
      ctx.fillStyle = '#1D3532';
      ctx.fillRect(w - 16, currY - 6, 12, 12);
      ctx.fillStyle = '#EFF5F4';
      ctx.fillRect(w - 12, currY - 2, 4, 4);

      raf = requestAnimationFrame(render);
    };

    raf = requestAnimationFrame(render);
    return () => cancelAnimationFrame(raf);
  }, [mass, damping]);

  const omegaPreview = Math.sqrt(Math.max(0.1, 20 / mass));

  return (
    <div className="w-full">
      {/* HERO SECTION */}
      <section className="max-w-[1440px] mx-auto px-4 sm:px-8 pt-10 pb-14">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
          {/* Left Hero Copy */}
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35 }}
            className="lg:col-span-6 flex flex-col gap-5"
          >
            <div className="flex items-center gap-2.5 text-xs font-medium text-[#4F6A66]">
              <PixelLabBanner className="w-8 h-8 shrink-0" />
              <span>Laboratorium Simulasi Fisika Interaktif</span>
              <span aria-hidden="true">·</span>
              <span>Bebas Akses Tanpa Login</span>
            </div>

            <h1 className="font-display text-4xl sm:text-5xl font-extrabold text-[#1D3532] leading-[1.12] tracking-tight">
              Pahami Hukum Fisika Melalui{' '}
              <span className="text-[#E26D62]">Simulasi Langsung.</span>
            </h1>

            <p className="text-base sm:text-lg text-[#4F6A66] max-w-xl leading-relaxed">
              Eksperimen variabel secara real-time, hitung langkah demi langkah dalam Satuan Internasional (SI), buat grafik ilmiah, dan unggah rumus Anda sendiri.
            </p>

            <div className="flex flex-wrap items-center gap-3 pt-1">
              <button
                type="button"
                onClick={() => onOpenSimulation('kinematika', 'parabola', 'simulasi')}
                className="px-6 py-3 rounded-xl bg-[#E26D62] hover:bg-[#cf5e53] text-white text-sm font-semibold shadow-sm flex items-center gap-2 transition-all cursor-pointer active:scale-[0.98]"
              >
                <span>Buka Ruang Simulasi</span>
                <ArrowRight className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => onNavigate('unggah-rumus')}
                className="px-5 py-3 rounded-xl bg-white hover:bg-[#CBE2DD]/60 text-[#1D3532] text-sm font-semibold border border-[#8FB5AE]/40 flex items-center gap-2 transition-all cursor-pointer"
              >
                <Upload className="w-4 h-4 text-[#E26D62]" />
                <span>Unggah Rumus Kustom</span>
              </button>
            </div>

            <div className="pt-2 flex flex-wrap items-center gap-x-5 gap-y-1 text-xs font-mono-tabular text-[#4F6A66]">
              <span>g = 9,806 m/s²</span>
              <span aria-hidden="true">·</span>
              <span>R = 8,314 J/(mol·K)</span>
              <span aria-hidden="true">·</span>
              <span>G = 6,674×10⁻¹¹ N·m²/kg²</span>
            </div>
          </motion.div>

          {/* Right Hero Live Sandbox */}
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.08 }}
            className="lg:col-span-6 bg-white rounded-3xl p-5 sm:p-6 shadow-sm border border-[#8FB5AE]/30 flex flex-col gap-4"
          >
            <div className="flex items-center justify-between">
              <div>
                <h2 className="font-display text-base font-bold text-[#1D3532]">
                  Pratinjau Langsung: Osilasi Harmonik Teredam
                </h2>
                <p className="text-xs text-[#4F6A66]">
                  Ubah massa dan redaman untuk mengamati perubahan gelombang secara instan.
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setMass(2.5);
                  setDamping(0.12);
                  timeRef.current = 0;
                  historyRef.current = [];
                }}
                className="p-2 rounded-xl bg-[#EFF5F4] text-[#1D3532] hover:bg-[#CBE2DD] transition-colors cursor-pointer"
                title="Reset pratinjau"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            </div>

            <div className="bg-[#EFF5F4] rounded-2xl p-3 flex items-center justify-between flex-wrap gap-2">
              <MathDisplay latex="y(t) = A e^{-\gamma t} \cos(\omega t)" />
              <span className="font-mono-tabular text-xs font-semibold text-[#E26D62]">
                ω = {omegaPreview.toFixed(2)} rad/s
              </span>
            </div>

            <div className="w-full h-48 bg-[#EFF5F4] rounded-2xl overflow-hidden border border-[#8FB5AE]/25">
              <canvas ref={canvasRef} className="w-full h-full block" />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <div className="flex justify-between text-xs font-semibold text-[#1D3532] mb-1">
                  <span>Massa (m)</span>
                  <span className="font-mono-tabular text-[#1D3532]">{mass.toFixed(1)} kg</span>
                </div>
                <input
                  type="range"
                  min={0.5}
                  max={5.0}
                  step={0.1}
                  value={mass}
                  onChange={(e) => setMass(Number(e.target.value))}
                  className="w-full physilab-slider"
                />
              </div>
              <div>
                <div className="flex justify-between text-xs font-semibold text-[#1D3532] mb-1">
                  <span>Koefisien Redaman (b)</span>
                  <span className="font-mono-tabular text-[#E26D62]">{damping.toFixed(2)} Ns/m</span>
                </div>
                <input
                  type="range"
                  min={0.01}
                  max={0.6}
                  step={0.01}
                  value={damping}
                  onChange={(e) => setDamping(Number(e.target.value))}
                  className="w-full physilab-slider"
                />
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* 5 PHYSICS MODULES GRID */}
      <section className="w-full bg-[#CBE2DD]/55 border-y border-[#8FB5AE]/30 py-14">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-8">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
            <div>
              <p className="text-xs font-semibold text-[#4F6A66] tracking-wide">
                Lima Modul Utama
              </p>
              <h2 className="font-display text-2xl sm:text-3xl font-bold text-[#1D3532] mt-1">
                Pilih Topik untuk Memulai Eksperimen
              </h2>
            </div>
            <button
              type="button"
              onClick={() => onNavigate('topik')}
              className="text-sm font-semibold text-[#1D3532] hover:text-[#E26D62] flex items-center gap-1.5 cursor-pointer self-start md:self-auto"
            >
              <span>Lihat seluruh silabus & rumus</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {MODULES.map((mod, idx) => (
              <div
                key={mod.id}
                className={`bg-white rounded-2xl p-6 shadow-sm border border-[#8FB5AE]/25 flex flex-col justify-between gap-4 transition-transform hover:-translate-y-0.5 ${
                  idx === 4 ? 'md:col-span-2 lg:col-span-2' : ''
                }`}
              >
                <div>
                  <div className="flex items-start justify-between gap-4 mb-3">
                    <div>
                      <span className="text-xs font-mono-tabular font-semibold text-[#4F6A66]">
                        Modul {mod.number}
                      </span>
                      <h3 className="font-display text-xl font-bold text-[#1D3532] mt-0.5">
                        {mod.title}
                      </h3>
                    </div>
                    <PixelModuleIllustration moduleId={mod.id} className="w-11 h-11 shrink-0" />
                  </div>

                  <p className="text-sm text-[#4F6A66] leading-relaxed mb-4">
                    {mod.description}
                  </p>

                  <div className="bg-[#EFF5F4] rounded-xl p-3 overflow-x-auto">
                    <MathDisplay latex={mod.formulasLatex[0]} />
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2">
                  <span className="text-xs text-[#4F6A66]">
                    {mod.concepts.length} sub-materi
                  </span>
                  <button
                    type="button"
                    onClick={() => onOpenSimulation(mod.id, mod.defaultSimId, 'simulasi')}
                    className="px-4 py-2 rounded-xl bg-[#CBE2DD] hover:bg-[#E26D62] hover:text-white text-[#1D3532] text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <span>Buka Simulasi</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* QUICK WORKBENCH TOOLS */}
      <section className="max-w-[1440px] mx-auto px-4 sm:px-8 py-14">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <div className="bg-white rounded-2xl p-6 border border-[#8FB5AE]/25 shadow-sm flex flex-col justify-between gap-4">
            <div>
              <Calculator className="w-6 h-6 text-[#E26D62] mb-3" />
              <h3 className="font-display text-lg font-bold text-[#1D3532]">
                Kalkulator Fisika Universal
              </h3>
              <p className="text-sm text-[#4F6A66] mt-1">
                Hitung persamaan dari kelima modul lengkap dengan substitusi langkah demi langkah dan validasi satuan SI.
              </p>
            </div>
            <button
              type="button"
              onClick={() => onOpenSimulation('dinamika', 'newton2', 'kalkulator')}
              className="text-sm font-semibold text-[#E26D62] hover:underline flex items-center gap-1 cursor-pointer"
            >
              <span>Buka Kalkulator</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          <div className="bg-white rounded-2xl p-6 border border-[#8FB5AE]/25 shadow-sm flex flex-col justify-between gap-4">
            <div>
              <LineChartIcon className="w-6 h-6 text-[#1D3532] mb-3" />
              <h3 className="font-display text-lg font-bold text-[#1D3532]">
                Generator Grafik Dinamis
              </h3>
              <p className="text-sm text-[#4F6A66] mt-1">
                Buat grafik hubungan antar variabel fisika dengan rentang, langkah, dan ekspor ke format PNG maupun CSV.
              </p>
            </div>
            <button
              type="button"
              onClick={() => onOpenSimulation('kinematika', 'parabola', 'grafik')}
              className="text-sm font-semibold text-[#1D3532] hover:text-[#E26D62] flex items-center gap-1 cursor-pointer"
            >
              <span>Buat Grafik</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          <div className="bg-white rounded-2xl p-6 border border-[#8FB5AE]/25 shadow-sm flex flex-col justify-between gap-4">
            <div>
              <Upload className="w-6 h-6 text-[#8C685C] mb-3" />
              <h3 className="font-display text-lg font-bold text-[#1D3532]">
                Unggah & Ekstrak Rumus
              </h3>
              <p className="text-sm text-[#4F6A66] mt-1">
                Unggah gambar (OCR), PDF, atau TXT berisi persamaan fisika, tinjau hasilnya, lalu visualisasikan dalam grafik.
              </p>
            </div>
            <button
              type="button"
              onClick={() => onNavigate('unggah-rumus')}
              className="text-sm font-semibold text-[#8C685C] hover:text-[#E26D62] flex items-center gap-1 cursor-pointer"
            >
              <span>Unggah Rumus Sekarang</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </section>
    </div>
  );
};
