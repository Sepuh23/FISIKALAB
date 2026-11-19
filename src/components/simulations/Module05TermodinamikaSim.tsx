import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Play, Pause, RotateCcw, Download } from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';
import { SimId } from '../../types/physics';
import { PHYSICS_CONSTANTS, exportDataToCsv } from '../../engine/physicsEngine';
import { MathDisplay } from '../MathDisplay';

interface Props {
  simId: SimId;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
}

export const Module05TermodinamikaSim: React.FC<Props> = ({ simId }) => {
  const [isPlaying, setIsPlaying] = useState(true);

  // Kalor params
  const [heatMass, setHeatMass] = useState(2.0);
  const [specificHeat, setSpecificHeat] = useState(4186); // Air
  const [tempInitial, setTempInitial] = useState(25);
  const [tempFinal, setTempFinal] = useState(85);

  // Gas Ideal params
  const [gasMoles, setGasMoles] = useState(1.0);
  const [gasTempK, setGasTempK] = useState(300);
  const [gasVolumeL, setGasVolumeL] = useState(25);

  // Piston params (Isobaric)
  const [pistonHeatQ, setPistonHeatQ] = useState(1500); // J
  const [pistonPressureKPa, setPistonPressureKPa] = useState(101.3);
  const [pistonV0L, setPistonV0L] = useState(10);

  // P-V Diagram params
  const [pvProcess, setPvProcess] = useState<'isotermal' | 'isobarik' | 'isokhorik'>('isotermal');
  const [pvV1, setPvV1] = useState(2);
  const [pvV2, setPvV2] = useState(8);
  const [pvTemp, setPvTemp] = useState(350);
  const [pvPressureKPa, setPvPressureKPa] = useState(150);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const particlesRef = useRef<Particle[]>([]);

  // Initialize gas particles
  useEffect(() => {
    const arr: Particle[] = [];
    for (let i = 0; i < 36; i++) {
      const angle = Math.random() * Math.PI * 2;
      arr.push({
        x: 30 + Math.random() * 200,
        y: 30 + Math.random() * 200,
        vx: Math.cos(angle),
        vy: Math.sin(angle),
      });
    }
    particlesRef.current = arr;
  }, [simId]);

  // Calculations
  const thermoCalc = useMemo(() => {
    const R = PHYSICS_CONSTANTS.R;
    // Kalor
    const dT = tempFinal - tempInitial;
    const Q_kalor = heatMass * specificHeat * dT;

    // Gas Ideal: V in m^3 = gasVolumeL / 1000
    const V_m3 = gasVolumeL / 1000;
    const P_pa = (gasMoles * R * gasTempK) / Math.max(0.001, V_m3);

    // Piston (monoatomic ideal gas: Cv = 1.5 R, Cp = 2.5 R => W = 0.4 Q, dU = 0.6 Q)
    const W_piston = pistonHeatQ * 0.4;
    const dU_piston = pistonHeatQ - W_piston;
    const dV_m3 = W_piston / (pistonPressureKPa * 1000);
    const V_final_L = Math.max(2, pistonV0L + dV_m3 * 1000);

    // P-V Diagram (signed work: positive for expansion V2 > V1, negative for compression V2 < V1)
    let W_pv = 0;
    if (pvProcess === 'isotermal') {
      const safeV1 = Math.max(0.5, pvV1);
      const safeV2 = Math.max(0.5, pvV2);
      W_pv = gasMoles * R * pvTemp * Math.log(safeV2 / safeV1);
    } else if (pvProcess === 'isobarik') {
      W_pv = pvPressureKPa * 1000 * ((pvV2 - pvV1) / 1000);
    } else {
      W_pv = 0; // Isokhorik: dV = 0
    }

    return {
      dT,
      Q_kalor,
      P_pa,
      P_kPa: P_pa / 1000,
      W_piston,
      dU_piston,
      V_final_L,
      W_pv,
    };
  }, [
    heatMass,
    specificHeat,
    tempInitial,
    tempFinal,
    gasMoles,
    gasTempK,
    gasVolumeL,
    pistonHeatQ,
    pistonPressureKPa,
    pistonV0L,
    pvProcess,
    pvV1,
    pvV2,
    pvTemp,
    pvPressureKPa,
  ]);

  // Chart Data
  const chartData = useMemo(() => {
    const R = PHYSICS_CONSTANTS.R;
    const pts: { x: number; y: number }[] = [];
    if (simId === 'kalor') {
      const minT = Math.min(tempInitial, tempFinal);
      const maxT = Math.max(tempInitial, tempFinal, minT + 10);
      for (let i = 0; i <= 10; i++) {
        const T = minT + (i / 10) * (maxT - minT);
        const QkJ = (heatMass * specificHeat * (T - tempInitial)) / 1000;
        pts.push({ x: Number(T.toFixed(1)), y: Number(QkJ.toFixed(2)) });
      }
      return pts;
    }

    if (simId === 'gas-ideal') {
      for (let V = 5; V <= 50; V += 5) {
        const P = (gasMoles * R * gasTempK) / V; // kPa since V in L
        pts.push({ x: V, y: Number(P.toFixed(1)) });
      }
      return pts;
    }

    if (simId === 'piston') {
      for (let q = 0; q <= 5000; q += 500) {
        const w = q * 0.4;
        pts.push({ x: q, y: Number(w.toFixed(1)) });
      }
      return pts;
    }

    // Diagram P-V
    if (pvProcess === 'isotermal') {
      const steps = 20;
      const vStart = Math.min(pvV1, pvV2);
      const vEnd = Math.max(pvV1, pvV2, vStart + 0.5);
      for (let i = 0; i <= steps; i++) {
        const V = vStart + (i / steps) * (vEnd - vStart);
        const P = (gasMoles * R * pvTemp) / V;
        pts.push({ x: Number(V.toFixed(2)), y: Number(P.toFixed(1)) });
      }
    } else if (pvProcess === 'isobarik') {
      const vStart = Math.min(pvV1, pvV2);
      const vEnd = Math.max(pvV1, pvV2, vStart + 0.5);
      for (let i = 0; i <= 10; i++) {
        const V = vStart + (i / 10) * (vEnd - vStart);
        pts.push({ x: Number(V.toFixed(2)), y: pvPressureKPa });
      }
    } else {
      // Isokhorik: V constant, P rises
      for (let P = 50; P <= 300; P += 25) {
        pts.push({ x: pvV1, y: P });
      }
    }
    return pts;
  }, [simId, heatMass, specificHeat, tempInitial, tempFinal, gasMoles, gasTempK, pvProcess, pvV1, pvV2, pvTemp, pvPressureKPa]);

  // Animated Canvas for Gas Ideal, Piston, & Kalor
  useEffect(() => {
    if (simId === 'diagram-pv') return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let raf = 0;
    const render = () => {
      const dpr = window.devicePixelRatio || 1;
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      const w = rect.width;
      const h = rect.height;
      ctx.clearRect(0, 0, w, h);

      if (simId === 'kalor') {
        // Draw calorimeter beaker + thermometer
        const beakerX = w * 0.25;
        const beakerW = w * 0.42;
        const beakerY = 70;
        const beakerH = h - 130;

        // Water color interpolates from cool seafoam to warm coral
        const tNorm = Math.max(0, Math.min(1, tempFinal / 100));
        ctx.fillStyle = tNorm > 0.5 ? `rgba(226, 109, 98, ${0.25 + tNorm * 0.45})` : `rgba(143, 181, 174, 0.55)`;
        ctx.fillRect(beakerX, beakerY + 25, beakerW, beakerH - 25);

        ctx.strokeStyle = '#1D3532';
        ctx.lineWidth = 3;
        ctx.strokeRect(beakerX, beakerY, beakerW, beakerH);

        // Flame or cooling indicator underneath
        if (thermoCalc.dT > 0) {
          ctx.fillStyle = '#E26D62';
          ctx.beginPath();
          ctx.arc(beakerX + beakerW / 2, beakerY + beakerH + 22, 14, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = '#1D3532';
          ctx.font = '12px "JetBrains Mono", monospace';
          ctx.textAlign = 'center';
          ctx.fillText(`+Q = ${(thermoCalc.Q_kalor / 1000).toFixed(1)} kJ`, beakerX + beakerW / 2, beakerY + beakerH + 46);
        }

        // Thermometer on right
        const thermX = w * 0.78;
        ctx.fillStyle = '#FFFFFF';
        ctx.strokeStyle = '#1D3532';
        ctx.lineWidth = 2;
        ctx.fillRect(thermX - 8, 60, 16, beakerH);
        ctx.strokeRect(thermX - 8, 60, 16, beakerH);

        const fillH = Math.max(10, Math.min(beakerH - 10, (tempFinal / 120) * beakerH));
        ctx.fillStyle = '#E26D62';
        ctx.fillRect(thermX - 5, 60 + beakerH - fillH, 10, fillH);
        ctx.beginPath();
        ctx.arc(thermX, 60 + beakerH + 8, 14, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#1D3532';
        ctx.font = 'bold 13px "JetBrains Mono", monospace';
        ctx.textAlign = 'center';
        ctx.fillText(`${tempFinal}°C`, thermX, 45);
        const matName =
          specificHeat === 4186 ? 'Air' : specificHeat === 900 ? 'Aluminium' : specificHeat === 450 ? 'Besi' : 'Tembaga';
        ctx.font = '12px "DM Sans", sans-serif';
        ctx.fillText(`${matName} (${heatMass.toFixed(1)} kg)`, beakerX + beakerW / 2, beakerY - 12);
        ctx.textAlign = 'left';
        return;
      }

      // Gas Ideal or Piston container
      const boxLeft = 56;
      const boxTop = 44;
      const boxH = h - 92;
      const ratio =
        simId === 'gas-ideal'
          ? Math.max(0.25, Math.min(1, gasVolumeL / 50))
          : Math.max(0.25, Math.min(1, thermoCalc.V_final_L / 40));
      const boxW = Math.max(120, (w - 112) * ratio);

      // Cylinder background
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(boxLeft, boxTop, w - 112, boxH);
      ctx.strokeStyle = '#1D3532';
      ctx.lineWidth = 3;
      ctx.strokeRect(boxLeft, boxTop, w - 112, boxH);

      // Gas region
      ctx.fillStyle = '#CBE2DD';
      ctx.fillRect(boxLeft + 2, boxTop + 2, boxW - 2, boxH - 4);

      // Movable piston wall
      ctx.fillStyle = '#8C685C';
      ctx.fillRect(boxLeft + boxW - 10, boxTop + 2, 14, boxH - 4);

      // Update & draw particles
      const speedMult = Math.sqrt(Math.max(100, gasTempK) / 300) * 2.4;
      ctx.fillStyle = '#E26D62';
      for (const p of particlesRef.current) {
        if (isPlaying) {
          p.x += p.vx * speedMult;
          p.y += p.vy * speedMult;
        }
        if (p.x < boxLeft + 8) {
          p.x = boxLeft + 8;
          p.vx = Math.abs(p.vx);
        }
        if (p.x > boxLeft + boxW - 16) {
          p.x = boxLeft + boxW - 16;
          p.vx = -Math.abs(p.vx);
        }
        if (p.y < boxTop + 8) {
          p.y = boxTop + 8;
          p.vy = Math.abs(p.vy);
        }
        if (p.y > boxTop + boxH - 8) {
          p.y = boxTop + boxH - 8;
          p.vy = -Math.abs(p.vy);
        }
        ctx.beginPath();
        ctx.arc(p.x, p.y, 4.5, 0, Math.PI * 2);
        ctx.fill();
      }

      if (isPlaying) {
        raf = requestAnimationFrame(render);
      }
    };

    render();
    return () => cancelAnimationFrame(raf);
  }, [simId, isPlaying, gasVolumeL, gasTempK, tempFinal, thermoCalc]);

  return (
    <div className="grid grid-cols-1 xl:grid-cols-12 gap-5 items-start">
      {/* LEFT PANEL */}
      <aside className="xl:col-span-3 bg-white rounded-2xl p-5 shadow-sm border border-[#8FB5AE]/25 flex flex-col gap-4">
        <div>
          <p className="text-xs font-medium text-[#4F6A66]">Modul 05 · Termodinamika</p>
          <h2 className="font-display text-xl font-bold text-[#1D3532] mt-0.5">
            {simId === 'kalor' && 'Perpindahan Kalor'}
            {simId === 'gas-ideal' && 'Simulasi Gas Ideal'}
            {simId === 'piston' && 'Piston Hukum I Termo'}
            {simId === 'diagram-pv' && 'Diagram P-V Proses'}
          </h2>
        </div>

        <div className="bg-[#EFF5F4] rounded-xl p-3">
          {simId === 'kalor' && <MathDisplay latex="Q = m \cdot c \cdot \Delta T" block />}
          {simId === 'gas-ideal' && <MathDisplay latex="PV = nRT" block />}
          {simId === 'piston' && <MathDisplay latex="\Delta U = Q - W, \quad W = P\Delta V" block />}
          {simId === 'diagram-pv' && <MathDisplay latex="W = \int_{V_1}^{V_2} P\,dV" block />}
        </div>

        {simId === 'kalor' && (
          <div className="space-y-3">
            <div>
              <div className="flex justify-between text-xs font-semibold text-[#1D3532] mb-1">
                <span>Massa Zat (m)</span>
                <span className="font-mono-tabular">{heatMass.toFixed(1)} kg</span>
              </div>
              <input type="range" min={0.5} max={10} step={0.5} value={heatMass} onChange={(e) => setHeatMass(Number(e.target.value))} className="w-full physilab-slider" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#1D3532] mb-1">Kalor Jenis Bahan (c)</label>
              <select
                value={specificHeat}
                onChange={(e) => setSpecificHeat(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-xl bg-[#EFF5F4] text-xs text-[#1D3532]"
              >
                <option value={4186}>Air (4.186 J/kg·K)</option>
                <option value={900}>Aluminium (900 J/kg·K)</option>
                <option value={450}>Besi (450 J/kg·K)</option>
                <option value={385}>Tembaga (385 J/kg·K)</option>
              </select>
            </div>
            <div>
              <div className="flex justify-between text-xs font-semibold text-[#1D3532] mb-1">
                <span>Suhu Awal (T₁)</span>
                <span className="font-mono-tabular">{tempInitial}°C</span>
              </div>
              <input type="range" min={0} max={100} step={1} value={tempInitial} onChange={(e) => setTempInitial(Number(e.target.value))} className="w-full physilab-slider" />
            </div>
            <div>
              <div className="flex justify-between text-xs font-semibold text-[#1D3532] mb-1">
                <span>Suhu Akhir (T₂)</span>
                <span className="font-mono-tabular text-[#E26D62]">{tempFinal}°C</span>
              </div>
              <input type="range" min={0} max={120} step={1} value={tempFinal} onChange={(e) => setTempFinal(Number(e.target.value))} className="w-full physilab-slider" />
            </div>
          </div>
        )}

        {simId === 'gas-ideal' && (
          <div className="space-y-3.5">
            <div>
              <div className="flex justify-between text-xs font-semibold text-[#1D3532] mb-1">
                <span>Suhu Mutlak (T)</span>
                <span className="font-mono-tabular text-[#E26D62]">{gasTempK} K</span>
              </div>
              <input type="range" min={100} max={800} step={10} value={gasTempK} onChange={(e) => setGasTempK(Number(e.target.value))} className="w-full physilab-slider" />
            </div>
            <div>
              <div className="flex justify-between text-xs font-semibold text-[#1D3532] mb-1">
                <span>Volume Wadah (V)</span>
                <span className="font-mono-tabular">{gasVolumeL} L</span>
              </div>
              <input type="range" min={10} max={50} step={1} value={gasVolumeL} onChange={(e) => setGasVolumeL(Number(e.target.value))} className="w-full physilab-slider" />
            </div>
            <div>
              <div className="flex justify-between text-xs font-semibold text-[#1D3532] mb-1">
                <span>Jumlah Mol (n)</span>
                <span className="font-mono-tabular">{gasMoles.toFixed(1)} mol</span>
              </div>
              <input type="range" min={0.5} max={5} step={0.5} value={gasMoles} onChange={(e) => setGasMoles(Number(e.target.value))} className="w-full physilab-slider" />
            </div>
          </div>
        )}

        {simId === 'piston' && (
          <div className="space-y-3.5">
            <div>
              <div className="flex justify-between text-xs font-semibold text-[#1D3532] mb-1">
                <span>Kalor Masuk (Q)</span>
                <span className="font-mono-tabular text-[#E26D62]">{pistonHeatQ} J</span>
              </div>
              <input type="range" min={0} max={5000} step={100} value={pistonHeatQ} onChange={(e) => setPistonHeatQ(Number(e.target.value))} className="w-full physilab-slider" />
            </div>
            <div>
              <div className="flex justify-between text-xs font-semibold text-[#1D3532] mb-1">
                <span>Tekanan Konstan (P)</span>
                <span className="font-mono-tabular">{pistonPressureKPa} kPa</span>
              </div>
              <input type="range" min={50} max={250} step={5} value={pistonPressureKPa} onChange={(e) => setPistonPressureKPa(Number(e.target.value))} className="w-full physilab-slider" />
            </div>
            <div>
              <div className="flex justify-between text-xs font-semibold text-[#1D3532] mb-1">
                <span>Volume Awal (V₀)</span>
                <span className="font-mono-tabular">{pistonV0L} L</span>
              </div>
              <input type="range" min={5} max={25} step={1} value={pistonV0L} onChange={(e) => setPistonV0L(Number(e.target.value))} className="w-full physilab-slider" />
            </div>
          </div>
        )}

        {simId === 'diagram-pv' && (
          <div className="space-y-3.5">
            <div>
              <label className="block text-xs font-semibold text-[#1D3532] mb-1.5">Jenis Proses</label>
              <div className="grid grid-cols-3 gap-1 bg-[#EFF5F4] p-1 rounded-xl">
                {[
                  { id: 'isotermal', label: 'Isotermal' },
                  { id: 'isobarik', label: 'Isobarik' },
                  { id: 'isokhorik', label: 'Isokhorik' },
                ].map((proc) => (
                  <button
                    key={proc.id}
                    type="button"
                    onClick={() => setPvProcess(proc.id as 'isotermal' | 'isobarik' | 'isokhorik')}
                    className={`py-1.5 rounded-lg text-[11px] font-semibold cursor-pointer ${
                      pvProcess === proc.id ? 'bg-white text-[#1D3532] shadow-sm' : 'text-[#4F6A66]'
                    }`}
                  >
                    {proc.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs font-semibold text-[#1D3532] mb-1">
                <span>Volume Awal (V₁)</span>
                <span className="font-mono-tabular">{pvV1} L</span>
              </div>
              <input type="range" min={1} max={10} step={0.5} value={pvV1} onChange={(e) => setPvV1(Number(e.target.value))} className="w-full physilab-slider" />
            </div>
            {pvProcess !== 'isokhorik' && (
              <div>
                <div className="flex justify-between text-xs font-semibold text-[#1D3532] mb-1">
                  <span>Volume Akhir (V₂)</span>
                  <span className="font-mono-tabular text-[#E26D62]">{pvV2} L</span>
                </div>
                <input type="range" min={2} max={15} step={0.5} value={pvV2} onChange={(e) => setPvV2(Number(e.target.value))} className="w-full physilab-slider" />
              </div>
            )}
            {pvProcess === 'isotermal' && (
              <div>
                <div className="flex justify-between text-xs font-semibold text-[#1D3532] mb-1">
                  <span>Suhu Konstan (T)</span>
                  <span className="font-mono-tabular">{pvTemp} K</span>
                </div>
                <input type="range" min={200} max={600} step={25} value={pvTemp} onChange={(e) => setPvTemp(Number(e.target.value))} className="w-full physilab-slider" />
              </div>
            )}
            {pvProcess === 'isobarik' && (
              <div>
                <div className="flex justify-between text-xs font-semibold text-[#1D3532] mb-1">
                  <span>Tekanan Konstan (P)</span>
                  <span className="font-mono-tabular">{pvPressureKPa} kPa</span>
                </div>
                <input type="range" min={50} max={300} step={10} value={pvPressureKPa} onChange={(e) => setPvPressureKPa(Number(e.target.value))} className="w-full physilab-slider" />
              </div>
            )}
          </div>
        )}
      </aside>

      {/* CENTER PANEL */}
      <section className="xl:col-span-6 bg-white rounded-2xl p-5 shadow-sm border border-[#8FB5AE]/25 flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h3 className="font-display text-lg font-bold text-[#1D3532]">
            {simId === 'diagram-pv' ? 'Visualisasi Kurva & Kerja Sistem (P-V)' : 'Ruang Eksperimen Termodinamika'}
          </h3>
          {simId === 'gas-ideal' && (
            <span className="text-xs font-mono-tabular font-semibold text-[#E26D62]">
              P = {thermoCalc.P_kPa.toFixed(1)} kPa
            </span>
          )}
        </div>

        {simId === 'diagram-pv' ? (
          <div className="w-full h-[350px] bg-[#EFF5F4] rounded-2xl p-4 border border-[#8FB5AE]/30">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#CBE2DD" />
                <XAxis dataKey="x" tick={{ fontSize: 11, fill: '#4F6A66' }} unit=" L" />
                <YAxis tick={{ fontSize: 11, fill: '#4F6A66' }} unit=" kPa" />
                <Tooltip />
                <Legend />
                <Area
                  type="monotone"
                  dataKey="y"
                  name="Tekanan P (kPa) — Area Arsir = Usaha W"
                  stroke="#E26D62"
                  fill="#8FB5AE"
                  fillOpacity={0.45}
                  strokeWidth={3}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="relative w-full h-[350px] bg-[#EFF5F4] rounded-2xl overflow-hidden border border-[#8FB5AE]/30">
            <canvas ref={canvasRef} className="w-full h-full block" />
          </div>
        )}

        {(simId === 'gas-ideal' || simId === 'piston') && (
          <div className="bg-[#EFF5F4] rounded-xl p-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setIsPlaying((p) => !p)}
                className="px-4 py-2 rounded-xl bg-[#E26D62] text-white text-sm font-semibold flex items-center gap-1.5 cursor-pointer"
              >
                {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                {isPlaying ? 'Jeda Partikel' : 'Jalankan Partikel'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setGasTempK(300);
                  setGasVolumeL(25);
                  setPistonHeatQ(1500);
                  setIsPlaying(true);
                }}
                className="px-4 py-2 rounded-xl bg-white border border-[#8FB5AE]/40 text-[#1D3532] text-sm font-semibold flex items-center gap-1.5 cursor-pointer"
              >
                <RotateCcw className="w-4 h-4" />
                Reset
              </button>
            </div>
            <span className="text-xs font-mono-tabular text-[#4F6A66]">
              v_rms ∝ √T
            </span>
          </div>
        )}
      </section>

      {/* RIGHT PANEL */}
      <aside className="xl:col-span-3 bg-white rounded-2xl p-5 shadow-sm border border-[#8FB5AE]/25 flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h3 className="font-display text-lg font-bold text-[#1D3532]">Hasil & Grafik</h3>
          <button
            type="button"
            onClick={() =>
              exportDataToCsv(
                `physilab_termo_${simId}.csv`,
                [
                  simId === 'kalor' ? 'T(C)' : simId === 'piston' ? 'Q(J)' : 'V(L)',
                  simId === 'kalor' ? 'Q(kJ)' : simId === 'piston' ? 'W(J)' : 'P(kPa)',
                ],
                chartData.map((p) => [p.x, p.y])
              )
            }
            className="text-xs font-semibold text-[#1D3532] hover:text-[#E26D62] flex items-center gap-1 cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" /> CSV
          </button>
        </div>

        {simId === 'kalor' && (
          <div className="grid grid-cols-1 gap-2">
            <div className="bg-[#EFF5F4] rounded-xl p-3">
              <span className="text-[11px] text-[#4F6A66]">Perubahan Suhu (ΔT)</span>
              <p className="font-mono-tabular text-lg font-bold text-[#1D3532]">
                {thermoCalc.dT > 0 ? `+${thermoCalc.dT}` : thermoCalc.dT} °C ({thermoCalc.dT} K)
              </p>
            </div>
            <div className="bg-[#EFF5F4] rounded-xl p-3">
              <span className="text-[11px] text-[#4F6A66]">Energi Kalor (Q)</span>
              <p className="font-mono-tabular text-xl font-bold text-[#E26D62]">
                {(thermoCalc.Q_kalor / 1000).toFixed(2)} kJ
              </p>
              <span className="text-xs font-mono-tabular text-[#4F6A66]">
                = {thermoCalc.Q_kalor.toFixed(0)} J
              </span>
            </div>
          </div>
        )}

        {simId === 'gas-ideal' && (
          <div className="grid grid-cols-1 gap-2">
            <div className="bg-[#EFF5F4] rounded-xl p-3">
              <span className="text-[11px] text-[#4F6A66]">Tekanan Gas (P)</span>
              <p className="font-mono-tabular text-xl font-bold text-[#E26D62]">
                {thermoCalc.P_kPa.toFixed(2)} kPa
              </p>
              <span className="text-xs font-mono-tabular text-[#4F6A66]">
                = {(thermoCalc.P_pa / 101325).toFixed(2)} atm
              </span>
            </div>
          </div>
        )}

        {simId === 'piston' && (
          <div className="grid grid-cols-2 gap-2">
            <div className="bg-[#EFF5F4] rounded-xl p-3">
              <span className="text-[11px] text-[#4F6A66]">Usaha Sistem (W)</span>
              <p className="font-mono-tabular text-base font-bold text-[#E26D62]">
                {thermoCalc.W_piston.toFixed(1)} J
              </p>
            </div>
            <div className="bg-[#EFF5F4] rounded-xl p-3">
              <span className="text-[11px] text-[#4F6A66]">Energi Dalam (ΔU)</span>
              <p className="font-mono-tabular text-base font-bold text-[#1D3532]">
                {thermoCalc.dU_piston.toFixed(1)} J
              </p>
            </div>
            <div className="col-span-2 bg-[#EFF5F4] rounded-xl p-3">
              <span className="text-[11px] text-[#4F6A66]">Volume Akhir Piston</span>
              <p className="font-mono-tabular text-base font-bold text-[#1D3532]">
                {thermoCalc.V_final_L.toFixed(2)} Liter
              </p>
            </div>
          </div>
        )}

        {simId === 'diagram-pv' && (
          <div className="bg-[#EFF5F4] rounded-xl p-3">
            <span className="text-[11px] text-[#4F6A66]">Usaha Dilakukan Sistem (W)</span>
            <p className="font-mono-tabular text-xl font-bold text-[#E26D62]">
              {thermoCalc.W_pv.toFixed(1)} J
            </p>
            <span className="text-xs text-[#4F6A66]">
              {pvProcess === 'isokhorik'
                ? 'Volume tetap (ΔV = 0), usaha W = 0 J.'
                : thermoCalc.W_pv > 0
                ? 'Ekspansi gas (W > 0): sistem melakukan kerja.'
                : thermoCalc.W_pv < 0
                ? 'Kompresi gas (W < 0): kerja diberikan pada sistem.'
                : 'Tidak ada perubahan volume (W = 0 J).'}
            </span>
          </div>
        )}

        <div className="h-44 w-full bg-[#EFF5F4]/60 rounded-xl p-2">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#CBE2DD" />
              <XAxis
                dataKey="x"
                tick={{ fontSize: 10, fill: '#4F6A66' }}
                unit={simId === 'kalor' ? '°C' : simId === 'piston' ? 'J' : 'L'}
              />
              <YAxis tick={{ fontSize: 10, fill: '#4F6A66' }} />
              <Tooltip />
              <Legend wrapperStyle={{ fontSize: '10px' }} />
              <Line
                type="monotone"
                dataKey="y"
                name={
                  simId === 'kalor'
                    ? 'Kalor Q (kJ)'
                    : simId === 'piston'
                    ? 'Usaha W (J)'
                    : 'Tekanan P (kPa)'
                }
                stroke="#E26D62"
                strokeWidth={2.5}
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-[#EFF5F4] rounded-xl p-3.5 text-xs text-[#4F6A66] leading-relaxed">
          <p className="font-semibold text-[#1D3532] mb-1">Konvensi Termodinamika</p>
          <p>
            Pada PHYSILAB, W menyatakan usaha yang dilakukan oleh sistem terhadap lingkungan (ΔU = Q − W). Jika gas memuai, W bernilai positif.
          </p>
        </div>
      </aside>
    </div>
  );
};
