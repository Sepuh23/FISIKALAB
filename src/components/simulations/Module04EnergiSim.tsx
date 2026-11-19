import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Play, Pause, RotateCcw, Download } from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';
import { SimId } from '../../types/physics';
import { exportDataToCsv } from '../../engine/physicsEngine';
import { MathDisplay } from '../MathDisplay';

interface Props {
  simId: SimId;
}

export const Module04EnergiSim: React.FC<Props> = ({ simId }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [simTime, setSimTime] = useState(0);
  const [withFriction, setWithFriction] = useState(false);

  // Roller coaster params
  const [rcHeight0, setRcHeight0] = useState(25);
  const [rcMass, setRcMass] = useState(50);

  // Pendulum params
  const [pendLength, setPendLength] = useState(2.0);
  const [pendAngle0, setPendAngle0] = useState(35);
  const [pendMass, setPendMass] = useState(2);

  // Pegas params
  const [springK, setSpringK] = useState(120);
  const [springMass, setSpringMass] = useState(2);
  const [springAmp, setSpringAmp] = useState(0.5);

  const g = 9.8;
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    setIsPlaying(false);
    setSimTime(0);
  }, [simId]);

  useEffect(() => {
    if (!isPlaying) return;
    let last = performance.now();
    let raf = 0;
    const step = (now: number) => {
      const dt = (now - last) / 1000;
      last = now;
      setSimTime((prev) => prev + dt);
      raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [isPlaying]);

  // Roller Coaster track height profile y(s) for normalized progress u in [0, 1]
  const rcTrackHeight = (u: number) => {
    // Starts at rcHeight0, dips to 2m valley, rises to 0.65*rcHeight0 hill, drops to 3m
    const h0 = rcHeight0;
    const dip = Math.exp(-Math.pow((u - 0.32) / 0.16, 2)) * (h0 * 0.88);
    const hill = Math.exp(-Math.pow((u - 0.62) / 0.14, 2)) * (h0 * 0.35);
    const base = h0 * (1 - u * 0.72);
    return Math.max(1, base - dip + hill);
  };

  // Current physical state
  const state = useMemo(() => {
    if (simId === 'roller-coaster') {
      const period = 6.0;
      const u = (simTime % period) / period;
      const hCurr = rcTrackHeight(u);
      const eStart = rcMass * g * rcHeight0;
      const lossRatio = withFriction ? Math.min(0.45, u * 0.35) : 0;
      const em = eStart * (1 - lossRatio);
      const ep = Math.min(em, rcMass * g * hCurr);
      const ek = Math.max(0, em - ep);
      const v = Math.sqrt((2 * ek) / Math.max(0.1, rcMass));
      const eLoss = eStart - em;
      return { u, hCurr, v, ek, ep, em, eLoss };
    }

    if (simId === 'pendulum') {
      const omega = Math.sqrt(g / Math.max(0.2, pendLength));
      const damp = withFriction ? 0.12 : 0;
      const theta0Rad = (pendAngle0 * Math.PI) / 180;
      const theta = theta0Rad * Math.exp(-damp * simTime) * Math.cos(omega * simTime);
      const thetaDot =
        -theta0Rad *
        Math.exp(-damp * simTime) *
        (damp * Math.cos(omega * simTime) + omega * Math.sin(omega * simTime));
      const hCurr = pendLength * (1 - Math.cos(theta));
      const v = Math.abs(pendLength * thetaDot);
      const ep = pendMass * g * hCurr;
      const ek = 0.5 * pendMass * v * v;
      const em = ep + ek;
      const eStart = pendMass * g * pendLength * (1 - Math.cos(theta0Rad));
      return { theta, hCurr, v, ek, ep, em, eLoss: Math.max(0, eStart - em), period: (2 * Math.PI) / omega };
    }

    // Pegas
    const omega = Math.sqrt(springK / Math.max(0.1, springMass));
    const damp = withFriction ? 0.15 : 0;
    const x = springAmp * Math.exp(-damp * simTime) * Math.cos(omega * simTime);
    const v =
      -springAmp *
      Math.exp(-damp * simTime) *
      (damp * Math.cos(omega * simTime) + omega * Math.sin(omega * simTime));
    const ee = 0.5 * springK * x * x;
    const ek = 0.5 * springMass * v * v;
    const em = ee + ek;
    const eStart = 0.5 * springK * springAmp * springAmp;
    return { x, v, ek, ep: ee, em, eLoss: Math.max(0, eStart - em), period: (2 * Math.PI) / omega };
  }, [simId, simTime, withFriction, rcHeight0, rcMass, pendLength, pendAngle0, pendMass, springK, springMass, springAmp]);

  // Dynamic Recharts Energy Chart Data
  const energyChartData = useMemo(() => {
    const pts = [];
    if (simId === 'roller-coaster') {
      const eStart = rcMass * g * rcHeight0;
      for (let i = 0; i <= 24; i++) {
        const u = i / 24;
        const hCurr = rcTrackHeight(u);
        const em = eStart * (1 - (withFriction ? u * 0.35 : 0));
        const ep = Math.min(em, rcMass * g * hCurr);
        const ek = Math.max(0, em - ep);
        pts.push({
          step: `${Math.round(u * 100)}%`,
          Ek: Number(ek.toFixed(0)),
          Ep: Number(ep.toFixed(0)),
          Em: Number(em.toFixed(0)),
        });
      }
      return pts;
    }

    if (simId === 'pendulum') {
      const omega = Math.sqrt(g / Math.max(0.2, pendLength));
      const damp = withFriction ? 0.12 : 0;
      const theta0Rad = (pendAngle0 * Math.PI) / 180;
      for (let t = 0; t <= 6; t += 0.25) {
        const theta = theta0Rad * Math.exp(-damp * t) * Math.cos(omega * t);
        const thetaDot =
          -theta0Rad * Math.exp(-damp * t) * (damp * Math.cos(omega * t) + omega * Math.sin(omega * t));
        const ep = pendMass * g * pendLength * (1 - Math.cos(theta));
        const ek = 0.5 * pendMass * Math.pow(pendLength * thetaDot, 2);
        pts.push({
          step: `${t.toFixed(1)}s`,
          Ek: Number(ek.toFixed(2)),
          Ep: Number(ep.toFixed(2)),
          Em: Number((ek + ep).toFixed(2)),
        });
      }
      return pts;
    }

    // Pegas
    const omega = Math.sqrt(springK / Math.max(0.1, springMass));
    const damp = withFriction ? 0.15 : 0;
    for (let t = 0; t <= 4; t += 0.2) {
      const x = springAmp * Math.exp(-damp * t) * Math.cos(omega * t);
      const v = -springAmp * Math.exp(-damp * t) * (damp * Math.cos(omega * t) + omega * Math.sin(omega * t));
      const ep = 0.5 * springK * x * x;
      const ek = 0.5 * springMass * v * v;
      pts.push({
        step: `${t.toFixed(1)}s`,
        Ek: Number(ek.toFixed(2)),
        Ep: Number(ep.toFixed(2)),
        Em: Number((ek + ep).toFixed(2)),
      });
    }
    return pts;
  }, [simId, withFriction, rcHeight0, rcMass, pendLength, pendAngle0, pendMass, springK, springMass, springAmp]);

  // Draw Canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const w = rect.width;
    const h = rect.height;
    ctx.clearRect(0, 0, w, h);

    if (simId === 'roller-coaster') {
      const padX = 40;
      const groundY = h - 40;
      const maxH = Math.max(30, rcHeight0 * 1.15);
      const toSY = (hVal: number) => groundY - (hVal / maxH) * (h - 90);

      // Ground
      ctx.fillStyle = '#CBE2DD';
      ctx.fillRect(0, groundY, w, h - groundY);

      // Track supports
      ctx.strokeStyle = '#8FB5AE';
      ctx.lineWidth = 2;
      for (let i = 0; i <= 10; i++) {
        const u = i / 10;
        const sx = padX + u * (w - padX * 2);
        const sy = toSY(rcTrackHeight(u));
        ctx.beginPath();
        ctx.moveTo(sx, sy);
        ctx.lineTo(sx, groundY);
        ctx.stroke();
      }

      // Track rail
      ctx.strokeStyle = '#1D3532';
      ctx.lineWidth = 4;
      ctx.beginPath();
      for (let i = 0; i <= 80; i++) {
        const u = i / 80;
        const sx = padX + u * (w - padX * 2);
        const sy = toSY(rcTrackHeight(u));
        if (i === 0) ctx.moveTo(sx, sy);
        else ctx.lineTo(sx, sy);
      }
      ctx.stroke();

      // Cart chassis & wheels
      const uCurr = state.u ?? 0;
      const cx = padX + uCurr * (w - padX * 2);
      const cy = toSY(state.hCurr ?? rcHeight0);
      ctx.fillStyle = '#E26D62';
      ctx.beginPath();
      ctx.roundRect(cx - 14, cy - 20, 28, 14, 5);
      ctx.fill();
      ctx.fillStyle = '#1D3532';
      ctx.beginPath();
      ctx.arc(cx - 8, cy - 4, 4, 0, Math.PI * 2);
      ctx.arc(cx + 8, cy - 4, 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.font = 'bold 11px "JetBrains Mono", monospace';
      ctx.textAlign = 'center';
      ctx.fillText(`h=${(state.hCurr ?? 0).toFixed(1)}m`, cx, cy - 26);
      ctx.textAlign = 'left';
      return;
    }

    if (simId === 'pendulum') {
      const pivotX = w / 2;
      const pivotY = 42;
      const lenPx = Math.min(h - 95, 75 + pendLength * 45);
      const theta = state.theta ?? 0;
      const bobX = pivotX + lenPx * Math.sin(theta);
      const bobY = pivotY + lenPx * Math.cos(theta);

      // Equilibrium line
      ctx.strokeStyle = '#8FB5AE';
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.moveTo(pivotX, pivotY);
      ctx.lineTo(pivotX, pivotY + lenPx + 20);
      ctx.stroke();
      ctx.setLineDash([]);

      // Pivot bar
      ctx.fillStyle = '#1D3532';
      ctx.fillRect(pivotX - 40, pivotY - 8, 80, 8);

      // Rod
      ctx.strokeStyle = '#4F6A66';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(pivotX, pivotY);
      ctx.lineTo(bobX, bobY);
      ctx.stroke();

      // Bob
      ctx.fillStyle = '#E26D62';
      ctx.beginPath();
      ctx.arc(bobX, bobY, 14 + pendMass * 1.2, 0, Math.PI * 2);
      ctx.fill();
      return;
    }

    // Spring-mass horizontal oscillator
    const wallX = 48;
    const eqX = w * 0.52;
    const massY = h * 0.52;
    const xPx = (state.x ?? 0) * 160;
    const blockX = eqX + xPx;

    // Floor & wall
    ctx.fillStyle = '#CBE2DD';
    ctx.fillRect(0, massY + 26, w, h - (massY + 26));
    ctx.fillStyle = '#1D3532';
    ctx.fillRect(wallX - 12, massY - 50, 12, 76);

    // Equilibrium tick
    ctx.strokeStyle = '#8FB5AE';
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.moveTo(eqX, massY - 55);
    ctx.lineTo(eqX, massY + 45);
    ctx.stroke();
    ctx.setLineDash([]);

    // Zigzag Spring
    const coils = 12;
    const springEnd = blockX - 26;
    const span = Math.max(24, springEnd - wallX);
    ctx.strokeStyle = '#1D3532';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(wallX, massY);
    for (let i = 1; i < coils; i++) {
      const sx = wallX + (i / coils) * span;
      const sy = massY + (i % 2 === 0 ? -14 : 14);
      ctx.lineTo(sx, sy);
    }
    ctx.lineTo(springEnd, massY);
    ctx.stroke();

    // Block
    ctx.fillStyle = '#E26D62';
    ctx.beginPath();
    ctx.roundRect(blockX - 26, massY - 26, 52, 52, 8);
    ctx.fill();
    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 11px "JetBrains Mono", monospace';
    ctx.textAlign = 'center';
    ctx.fillText(`${springMass}kg`, blockX, massY + 4);
    ctx.textAlign = 'left';
  }, [simId, state, rcHeight0, pendLength, pendMass, springMass]);

  return (
    <div className="grid grid-cols-1 xl:grid-cols-12 gap-5 items-start">
      {/* LEFT PANEL */}
      <aside className="xl:col-span-3 bg-white rounded-2xl p-5 shadow-sm border border-[#8FB5AE]/25 flex flex-col gap-4">
        <div>
          <p className="text-xs font-medium text-[#4F6A66]">Modul 04 · Energi</p>
          <h2 className="font-display text-xl font-bold text-[#1D3532] mt-0.5">
            {simId === 'roller-coaster' && 'Roller Coaster & Energi'}
            {simId === 'pendulum' && 'Bandul Matematis'}
            {simId === 'pegas' && 'Osilasi Pegas Elastis'}
          </h2>
        </div>

        <div className="bg-[#EFF5F4] rounded-xl p-3">
          {simId === 'roller-coaster' && <MathDisplay latex="E_m = E_k + E_p = \frac{1}{2}mv^2 + mgh" block />}
          {simId === 'pendulum' && <MathDisplay latex="T = 2\pi\sqrt{\frac{L}{g}}, \; E_m = E_k + E_p" block />}
          {simId === 'pegas' && <MathDisplay latex="E_e = \frac{1}{2}kx^2, \; E_m = E_k + E_e" block />}
        </div>

        <div className="space-y-3.5">
          {simId === 'roller-coaster' && (
            <>
              <div>
                <div className="flex justify-between text-xs font-semibold text-[#1D3532] mb-1">
                  <span>Ketinggian Awal (h₀)</span>
                  <span className="font-mono-tabular text-[#E26D62]">{rcHeight0} m</span>
                </div>
                <input type="range" min={10} max={50} step={1} value={rcHeight0} onChange={(e) => setRcHeight0(Number(e.target.value))} className="w-full physilab-slider" />
              </div>
              <div>
                <div className="flex justify-between text-xs font-semibold text-[#1D3532] mb-1">
                  <span>Massa Kereta (m)</span>
                  <span className="font-mono-tabular">{rcMass} kg</span>
                </div>
                <input type="range" min={10} max={200} step={5} value={rcMass} onChange={(e) => setRcMass(Number(e.target.value))} className="w-full physilab-slider" />
              </div>
            </>
          )}

          {simId === 'pendulum' && (
            <>
              <div>
                <div className="flex justify-between text-xs font-semibold text-[#1D3532] mb-1">
                  <span>Panjang Tali (L)</span>
                  <span className="font-mono-tabular text-[#E26D62]">{pendLength.toFixed(1)} m</span>
                </div>
                <input type="range" min={0.5} max={4.0} step={0.1} value={pendLength} onChange={(e) => setPendLength(Number(e.target.value))} className="w-full physilab-slider" />
              </div>
              <div>
                <div className="flex justify-between text-xs font-semibold text-[#1D3532] mb-1">
                  <span>Sudut Awal (θ₀)</span>
                  <span className="font-mono-tabular">{pendAngle0}°</span>
                </div>
                <input type="range" min={5} max={60} step={1} value={pendAngle0} onChange={(e) => setPendAngle0(Number(e.target.value))} className="w-full physilab-slider" />
              </div>
              <div>
                <div className="flex justify-between text-xs font-semibold text-[#1D3532] mb-1">
                  <span>Massa Bandul (m)</span>
                  <span className="font-mono-tabular">{pendMass} kg</span>
                </div>
                <input type="range" min={0.5} max={10} step={0.5} value={pendMass} onChange={(e) => setPendMass(Number(e.target.value))} className="w-full physilab-slider" />
              </div>
            </>
          )}

          {simId === 'pegas' && (
            <>
              <div>
                <div className="flex justify-between text-xs font-semibold text-[#1D3532] mb-1">
                  <span>Konstanta Pegas (k)</span>
                  <span className="font-mono-tabular text-[#E26D62]">{springK} N/m</span>
                </div>
                <input type="range" min={20} max={400} step={10} value={springK} onChange={(e) => setSpringK(Number(e.target.value))} className="w-full physilab-slider" />
              </div>
              <div>
                <div className="flex justify-between text-xs font-semibold text-[#1D3532] mb-1">
                  <span>Massa Beban (m)</span>
                  <span className="font-mono-tabular">{springMass} kg</span>
                </div>
                <input type="range" min={0.5} max={10} step={0.5} value={springMass} onChange={(e) => setSpringMass(Number(e.target.value))} className="w-full physilab-slider" />
              </div>
              <div>
                <div className="flex justify-between text-xs font-semibold text-[#1D3532] mb-1">
                  <span>Simpangan Awal (x₀)</span>
                  <span className="font-mono-tabular">{springAmp.toFixed(2)} m</span>
                </div>
                <input type="range" min={0.1} max={0.8} step={0.05} value={springAmp} onChange={(e) => setSpringAmp(Number(e.target.value))} className="w-full physilab-slider" />
              </div>
            </>
          )}

          <label className="flex items-center gap-2 text-xs font-medium text-[#1D3532] cursor-pointer pt-1">
            <input
              type="checkbox"
              checked={withFriction}
              onChange={(e) => setWithFriction(e.target.checked)}
              className="accent-[#E26D62] w-4 h-4"
            />
            Aktifkan Gesekan (Energi Hilang)
          </label>
        </div>
      </aside>

      {/* CENTER PANEL */}
      <section className="xl:col-span-6 bg-white rounded-2xl p-5 shadow-sm border border-[#8FB5AE]/25 flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h3 className="font-display text-lg font-bold text-[#1D3532]">Simulasi Konservasi Energi</h3>
          <span className="text-xs font-mono-tabular text-[#4F6A66]">
            {withFriction ? 'Sistem Non-Konservatif (Ada Gesekan)' : 'Sistem Ideal (Em Konstan)'}
          </span>
        </div>

        <div className="relative w-full h-[350px] bg-[#EFF5F4] rounded-2xl overflow-hidden border border-[#8FB5AE]/30">
          <canvas ref={canvasRef} className="w-full h-full block" />
        </div>

        <div className="bg-[#EFF5F4] rounded-xl p-4 flex flex-col gap-3">
          <div className="flex justify-between text-xs font-mono-tabular text-[#4F6A66]">
            <span>
              {simId === 'roller-coaster'
                ? `Lintasan: ${Math.round((state.u ?? 0) * 100)}%`
                : `Waktu t = ${simTime.toFixed(2)} s`}
            </span>
            <span>v = {state.v.toFixed(2)} m/s</span>
          </div>
          <input
            type="range"
            min={0}
            max={simId === 'roller-coaster' ? 6 : 10}
            step={0.05}
            value={simId === 'roller-coaster' ? (simTime % 6) : Math.min(10, simTime)}
            onChange={(e) => {
              setIsPlaying(false);
              setSimTime(Number(e.target.value));
            }}
            className="w-full physilab-slider"
          />
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setIsPlaying((p) => !p)}
                className="px-4 py-2 rounded-xl bg-[#E26D62] text-white text-sm font-semibold flex items-center gap-1.5 cursor-pointer"
              >
                {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                {isPlaying ? 'Jeda' : simTime > 0 ? 'Lanjutkan' : 'Mulai'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsPlaying(false);
                  setSimTime(0);
                }}
                className="px-4 py-2 rounded-xl bg-white border border-[#8FB5AE]/40 text-[#1D3532] text-sm font-semibold flex items-center gap-1.5 cursor-pointer"
              >
                <RotateCcw className="w-4 h-4" />
                Reset
              </button>
            </div>
            {(simId === 'pendulum' || simId === 'pegas') && state.period && (
              <span className="text-xs font-mono-tabular text-[#1D3532] font-semibold">
                T = {state.period.toFixed(2)} s
              </span>
            )}
          </div>
        </div>
      </section>

      {/* RIGHT PANEL */}
      <aside className="xl:col-span-3 bg-white rounded-2xl p-5 shadow-sm border border-[#8FB5AE]/25 flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h3 className="font-display text-lg font-bold text-[#1D3532]">Transformasi Energi</h3>
          <button
            type="button"
            onClick={() =>
              exportDataToCsv(
                `physilab_energi_${simId}.csv`,
                ['Titik', 'Ek(J)', 'Ep(J)', 'Em(J)'],
                energyChartData.map((p) => [p.step, p.Ek, p.Ep, p.Em])
              )
            }
            className="text-xs font-semibold text-[#1D3532] hover:text-[#E26D62] flex items-center gap-1 cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" /> CSV
          </button>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div className="bg-[#EFF5F4] rounded-xl p-3">
            <span className="text-[11px] text-[#4F6A66]">Energi Kinetik (Ek)</span>
            <p className="font-mono-tabular text-base font-bold text-[#E26D62]">
              {state.ek.toFixed(1)} J
            </p>
          </div>
          <div className="bg-[#EFF5F4] rounded-xl p-3">
            <span className="text-[11px] text-[#4F6A66]">
              {simId === 'pegas' ? 'Potensial Pegas (Ee)' : 'Potensial (Ep)'}
            </span>
            <p className="font-mono-tabular text-base font-bold text-[#1D3532]">
              {state.ep.toFixed(1)} J
            </p>
          </div>
          <div className="bg-[#EFF5F4] rounded-xl p-3">
            <span className="text-[11px] text-[#4F6A66]">Energi Mekanik (Em)</span>
            <p className="font-mono-tabular text-base font-bold text-[#1D3532]">
              {state.em.toFixed(1)} J
            </p>
          </div>
          <div className="bg-[#EFF5F4] rounded-xl p-3">
            <span className="text-[11px] text-[#4F6A66]">Energi Hilang (Q)</span>
            <p className="font-mono-tabular text-base font-bold text-[#8C685C]">
              {state.eLoss.toFixed(1)} J
            </p>
          </div>
        </div>

        <div className="h-44 w-full bg-[#EFF5F4]/60 rounded-xl p-2">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={energyChartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#CBE2DD" />
              <XAxis dataKey="step" tick={{ fontSize: 10, fill: '#4F6A66' }} />
              <YAxis tick={{ fontSize: 10, fill: '#4F6A66' }} unit="J" />
              <Tooltip />
              <Legend wrapperStyle={{ fontSize: '10px' }} />
              <Area type="monotone" dataKey="Ek" stroke="#E26D62" fill="#E26D62" fillOpacity={0.25} />
              <Area type="monotone" dataKey="Ep" stroke="#1D3532" fill="#8FB5AE" fillOpacity={0.35} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-[#EFF5F4] rounded-xl p-3.5 text-xs text-[#4F6A66] leading-relaxed">
          <p className="font-semibold text-[#1D3532] mb-1">Hukum Kekekalan Energi</p>
          <p>
            {withFriction
              ? 'Ketika gesekan aktif, sebagian energi mekanik berubah menjadi energi panas (kalor) sehingga amplitudo atau laju berkurang secara bertahap.'
              : 'Tanpa gesekan, jumlah energi kinetik dan potensial (Em) selalu tetap meskipun keduanya saling bertukar.'}
          </p>
        </div>
      </aside>
    </div>
  );
};
