import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Play, Pause, RotateCcw, Download } from 'lucide-react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
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

export const Module03DinamikaSim: React.FC<Props> = ({ simId }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [simTime, setSimTime] = useState(0);

  // Newton II & Gesek params
  const [mass, setMass] = useState(5);
  const [appliedForce, setAppliedForce] = useState(30);
  const [muS, setMuS] = useState(0.45);
  const [muK, setMuK] = useState(0.25);

  // Bidang Miring params
  const [inclineAngle, setInclineAngle] = useState(30);
  const [inclineMuK, setInclineMuK] = useState(0.2);

  // FBD params
  const [fRight, setFRight] = useState(40);
  const [fLeft, setFLeft] = useState(15);
  const [fUp, setFUp] = useState(30);
  const [fDown, setFDown] = useState(30);

  const g = 9.8;
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    setIsPlaying(false);
    setSimTime(0);
  }, [simId]);

  // Physics calculations for current simulation
  const calc = useMemo(() => {
    const N_flat = mass * g;
    if (simId === 'newton2') {
      const a = appliedForce / Math.max(0.1, mass);
      const disp = 0.5 * a * simTime * simTime;
      const vel = a * simTime;
      return { a, disp, vel, N: N_flat, fsMax: 0, fk: 0, netForce: appliedForce, moving: appliedForce !== 0 };
    }
    if (simId === 'gesek') {
      const fsMax = muS * N_flat;
      const fk = muK * N_flat;
      const absF = Math.abs(appliedForce);
      const moving = absF > fsMax;
      const dir = appliedForce >= 0 ? 1 : -1;
      const frictionForce = moving ? fk : absF;
      const netForce = moving ? dir * (absF - fk) : 0;
      const a = netForce / Math.max(0.1, mass);
      const disp = 0.5 * a * simTime * simTime;
      const vel = a * simTime;
      return { a, disp, vel, N: N_flat, fsMax, fk, frictionForce, netForce, moving };
    }
    if (simId === 'bidang-miring') {
      const rad = (inclineAngle * Math.PI) / 180;
      const w = mass * g;
      const N = w * Math.cos(rad);
      const fParallel = w * Math.sin(rad);
      const fk = inclineMuK * N;
      const moving = fParallel > fk;
      const netForce = moving ? fParallel - fk : 0;
      const a = netForce / Math.max(0.1, mass);
      const disp = 0.5 * a * simTime * simTime;
      const vel = a * simTime;
      return { w, N, fParallel, fk, netForce, a, disp, vel, moving };
    }
    // FBD
    const fx = fRight - fLeft;
    const fy = fUp - fDown;
    const netForce = Math.sqrt(fx * fx + fy * fy);
    const angleDeg = (Math.atan2(fy, fx) * 180) / Math.PI;
    const a = netForce / Math.max(0.1, mass);
    const dispX = 0.5 * (fx / mass) * simTime * simTime;
    const dispY = 0.5 * (fy / mass) * simTime * simTime;
    return { fx, fy, netForce, angleDeg, a, dispX, dispY, vel: a * simTime, N: N_flat, moving: netForce > 0 };
  }, [simId, mass, appliedForce, muS, muK, inclineAngle, inclineMuK, fRight, fLeft, fUp, fDown, simTime]);

  const maxTime = 6;

  useEffect(() => {
    if (!isPlaying) return;
    let last = performance.now();
    let raf = 0;
    const step = (now: number) => {
      const dt = (now - last) / 1000;
      last = now;
      setSimTime((prev) => {
        const next = prev + dt;
        if (next >= maxTime) {
          setIsPlaying(false);
          return maxTime;
        }
        return next;
      });
      raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [isPlaying]);

  // Graph data: F vs a or time series
  const chartData = useMemo(() => {
    const pts: { x: number; y: number }[] = [];
    if (simId === 'newton2' || simId === 'gesek') {
      for (let f = 0; f <= 100; f += 10) {
        const fsMax = muS * mass * g;
        const fk = muK * mass * g;
        const aVal =
          simId === 'newton2'
            ? f / mass
            : f > fsMax
            ? (f - fk) / mass
            : 0;
        pts.push({ x: f, y: Number(aVal.toFixed(2)) });
      }
      return pts;
    }
    for (let t = 0; t <= maxTime; t += 0.5) {
      const v = calc.a * t;
      pts.push({ x: t, y: Number(v.toFixed(2)) });
    }
    return pts;
  }, [simId, mass, muS, muK, calc.a]);

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

    const drawArrow = (x1: number, y1: number, x2: number, y2: number, color: string, label: string) => {
      const dx = x2 - x1;
      const dy = y2 - y1;
      const len = Math.sqrt(dx * dx + dy * dy);
      if (len < 3) return;
      const angle = Math.atan2(dy, dx);
      ctx.save();
      ctx.strokeStyle = color;
      ctx.fillStyle = color;
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.stroke();

      const head = 8;
      ctx.beginPath();
      ctx.moveTo(x2, y2);
      ctx.lineTo(x2 - head * Math.cos(angle - Math.PI / 6), y2 - head * Math.sin(angle - Math.PI / 6));
      ctx.lineTo(x2 - head * Math.cos(angle + Math.PI / 6), y2 - head * Math.sin(angle + Math.PI / 6));
      ctx.closePath();
      ctx.fill();

      ctx.font = '11px "JetBrains Mono", monospace';
      ctx.fillText(label, x2 + 6, y2 - 4);
      ctx.restore();
    };

    if (simId === 'newton2' || simId === 'gesek') {
      const groundY = h * 0.68;
      ctx.fillStyle = '#CBE2DD';
      ctx.fillRect(0, groundY, w, h - groundY);
      ctx.strokeStyle = '#1D3532';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(20, groundY);
      ctx.lineTo(w - 20, groundY);
      ctx.stroke();

      // Block position wrapped smoothly inside track
      const disp = (calc.disp ?? 0) * 6;
      const blockX = Math.max(70, Math.min(w - 70, 120 + disp));
      const size = Math.min(72, 42 + mass * 1.4);

      ctx.fillStyle = '#8C685C';
      ctx.beginPath();
      ctx.roundRect(blockX - size / 2, groundY - size, size, size, 8);
      ctx.fill();

      ctx.fillStyle = '#FFFFFF';
      ctx.font = 'bold 12px "JetBrains Mono", monospace';
      ctx.textAlign = 'center';
      ctx.fillText(`${mass} kg`, blockX, groundY - size / 2 + 4);
      ctx.textAlign = 'left';

      // Applied Force Arrow
      drawArrow(
        blockX + size / 2,
        groundY - size / 2,
        blockX + size / 2 + Math.min(110, appliedForce * 1.3),
        groundY - size / 2,
        '#E26D62',
        `F=${appliedForce}N`
      );

      // Friction Arrow
      if (simId === 'gesek' && (calc.frictionForce ?? 0) > 0.2) {
        drawArrow(
          blockX - size / 2,
          groundY - 10,
          blockX - size / 2 - Math.min(95, (calc.frictionForce ?? 0) * 1.3),
          groundY - 10,
          '#1D3532',
          `f=${(calc.frictionForce ?? 0).toFixed(1)}N`
        );
      }

      // Weight & Normal arrows
      drawArrow(blockX, groundY - size, blockX, groundY - size - 48, '#4F6A66', `N=${calc.N.toFixed(0)}N`);
      drawArrow(blockX, groundY, blockX, groundY + 46, '#4F6A66', `w=${(mass * g).toFixed(0)}N`);
      return;
    }

    if (simId === 'bidang-miring') {
      const rad = (inclineAngle * Math.PI) / 180;
      const baseLeftX = 80;
      const baseY = h - 46;
      const maxW = Math.min(w - 160, 420);
      const maxH = h - 90;
      const rampH = Math.min(maxH, maxW * Math.tan(rad));
      const rampW = rampH / Math.max(0.05, Math.tan(rad));
      const topX = baseLeftX;
      const topY = baseY - rampH;
      const rightX = baseLeftX + rampW;

      // Draw wedge
      ctx.fillStyle = '#CBE2DD';
      ctx.strokeStyle = '#1D3532';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(topX, baseY);
      ctx.lineTo(rightX, baseY);
      ctx.lineTo(topX, topY);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Angle label
      ctx.fillStyle = '#1D3532';
      ctx.font = '12px "JetBrains Mono", monospace';
      ctx.fillText(`θ = ${inclineAngle}°`, rightX - 75, baseY - 12);

      // Slide distance along hypotenuse
      const hyp = Math.hypot(rightX - topX, baseY - topY);
      const slidePx = Math.min(hyp - 60, 40 + (calc.disp ?? 0) * 12);
      const ux = (rightX - topX) / hyp;
      const uy = (baseY - topY) / hyp;
      const nx = uy; // outward normal x
      const ny = -ux; // outward normal y

      const bx = topX + ux * slidePx + nx * 22;
      const by = topY + uy * slidePx + ny * 22;

      ctx.save();
      ctx.translate(bx, by);
      ctx.rotate(Math.atan2(uy, ux));
      ctx.fillStyle = '#8C685C';
      ctx.fillRect(-20, -20, 40, 40);
      ctx.fillStyle = '#FFFFFF';
      ctx.font = 'bold 11px "JetBrains Mono", monospace';
      ctx.textAlign = 'center';
      ctx.fillText(`${mass}kg`, 0, 4);
      ctx.restore();

      // Vectors from block center
      drawArrow(bx, by, bx, by + 62, '#1D3532', `w=${(calc.w ?? 0).toFixed(0)}N`);
      drawArrow(bx, by, bx + nx * 55, by + ny * 55, '#4F6A66', `N=${calc.N.toFixed(0)}N`);
      drawArrow(bx, by, bx - ux * 44, by - uy * 44, '#E26D62', `fk=${(calc.fk ?? 0).toFixed(1)}N`);
      return;
    }

    // FBD
    const cx = w / 2 + Math.max(-140, Math.min(140, (calc.dispX ?? 0) * 4));
    const cy = h / 2 - Math.max(-100, Math.min(100, (calc.dispY ?? 0) * 4));

    ctx.fillStyle = '#8C685C';
    ctx.beginPath();
    ctx.roundRect(cx - 26, cy - 26, 52, 52, 10);
    ctx.fill();
    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 12px "JetBrains Mono", monospace';
    ctx.textAlign = 'center';
    ctx.fillText(`${mass}kg`, cx, cy + 4);
    ctx.textAlign = 'left';

    const scaleF = 0.85;
    drawArrow(cx + 26, cy, cx + 26 + Math.min(85, fRight * scaleF), cy, '#4F6A66', `${fRight}N`);
    drawArrow(cx - 26, cy, cx - 26 - Math.min(85, fLeft * scaleF), cy, '#4F6A66', `${fLeft}N`);
    drawArrow(cx, cy - 26, cx, cy - 26 - Math.min(75, fUp * scaleF), '#4F6A66', `${fUp}N`);
    drawArrow(cx, cy + 26, cx, cy + 26 + Math.min(75, fDown * scaleF), '#4F6A66', `${fDown}N`);

    if (calc.netForce > 0.5) {
      drawArrow(
        cx,
        cy,
        cx + Math.max(-95, Math.min(95, (calc.fx ?? 0) * scaleF)),
        cy - Math.max(-85, Math.min(85, (calc.fy ?? 0) * scaleF)),
        '#E26D62',
        `ΣF=${calc.netForce.toFixed(1)}N`
      );
    }
  }, [simId, mass, appliedForce, inclineAngle, fRight, fLeft, fUp, fDown, calc]);

  return (
    <div className="grid grid-cols-1 xl:grid-cols-12 gap-5 items-start">
      {/* LEFT PANEL */}
      <aside className="xl:col-span-3 bg-white rounded-2xl p-5 shadow-sm border border-[#8FB5AE]/25 flex flex-col gap-4">
        <div>
          <p className="text-xs font-medium text-[#4F6A66]">Modul 03 · Dinamika</p>
          <h2 className="font-display text-xl font-bold text-[#1D3532] mt-0.5">
            {simId === 'newton2' && 'Hukum Newton II'}
            {simId === 'gesek' && 'Gaya Gesek Statis & Kinetis'}
            {simId === 'bidang-miring' && 'Dinamika Bidang Miring'}
            {simId === 'fbd' && 'Diagram Benda Bebas'}
          </h2>
        </div>

        <div className="bg-[#EFF5F4] rounded-xl p-3">
          {simId === 'newton2' && <MathDisplay latex="\Sigma F = m \cdot a, \quad w = mg" block />}
          {simId === 'gesek' && <MathDisplay latex="f_s \le \mu_s N, \quad f_k = \mu_k N" block />}
          {simId === 'bidang-miring' && <MathDisplay latex="N = mg\cos\theta, \quad F_{\parallel} = mg\sin\theta" block />}
          {simId === 'fbd' && <MathDisplay latex="\Sigma \vec{F} = (\Sigma F_x)\hat{i} + (\Sigma F_y)\hat{j}" block />}
        </div>

        <div className="space-y-3.5">
          <div>
            <div className="flex justify-between text-xs font-semibold text-[#1D3532] mb-1">
              <span>Massa Benda (m)</span>
              <span className="font-mono-tabular">{mass} kg</span>
            </div>
            <input type="range" min={1} max={25} step={1} value={mass} onChange={(e) => setMass(Number(e.target.value))} className="w-full physilab-slider" />
          </div>

          {(simId === 'newton2' || simId === 'gesek') && (
            <div>
              <div className="flex justify-between text-xs font-semibold text-[#1D3532] mb-1">
                <span>Gaya Dorong (F)</span>
                <span className="font-mono-tabular text-[#E26D62]">{appliedForce} N</span>
              </div>
              <input type="range" min={0} max={100} step={1} value={appliedForce} onChange={(e) => setAppliedForce(Number(e.target.value))} className="w-full physilab-slider" />
            </div>
          )}

          {simId === 'gesek' && (
            <>
              <div>
                <div className="flex justify-between text-xs font-semibold text-[#1D3532] mb-1">
                  <span>Koefisien Gesek Statis (μₛ)</span>
                  <span className="font-mono-tabular">{muS.toFixed(2)}</span>
                </div>
                <input type="range" min={0.1} max={1.0} step={0.05} value={muS} onChange={(e) => setMuS(Number(e.target.value))} className="w-full physilab-slider" />
              </div>
              <div>
                <div className="flex justify-between text-xs font-semibold text-[#1D3532] mb-1">
                  <span>Koefisien Gesek Kinetis (μₖ)</span>
                  <span className="font-mono-tabular">{muK.toFixed(2)}</span>
                </div>
                <input type="range" min={0.05} max={muS} step={0.05} value={muK} onChange={(e) => setMuK(Number(e.target.value))} className="w-full physilab-slider" />
              </div>
            </>
          )}

          {simId === 'bidang-miring' && (
            <>
              <div>
                <div className="flex justify-between text-xs font-semibold text-[#1D3532] mb-1">
                  <span>Sudut Kemiringan (θ)</span>
                  <span className="font-mono-tabular text-[#E26D62]">{inclineAngle}°</span>
                </div>
                <input type="range" min={5} max={60} step={1} value={inclineAngle} onChange={(e) => setInclineAngle(Number(e.target.value))} className="w-full physilab-slider" />
              </div>
              <div>
                <div className="flex justify-between text-xs font-semibold text-[#1D3532] mb-1">
                  <span>Koefisien Gesek (μₖ)</span>
                  <span className="font-mono-tabular">{inclineMuK.toFixed(2)}</span>
                </div>
                <input type="range" min={0} max={0.8} step={0.05} value={inclineMuK} onChange={(e) => setInclineMuK(Number(e.target.value))} className="w-full physilab-slider" />
              </div>
            </>
          )}

          {simId === 'fbd' && (
            <div className="space-y-2.5">
              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="text-[11px] font-semibold text-[#1D3532]">Kanan (N)</label>
                  <input type="number" min={0} max={200} value={fRight} onChange={(e) => setFRight(Math.max(0, Number(e.target.value)))} className="w-full mt-1 px-2.5 py-1.5 rounded-lg bg-[#EFF5F4] font-mono-tabular text-xs" />
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-[#1D3532]">Kiri (N)</label>
                  <input type="number" min={0} max={200} value={fLeft} onChange={(e) => setFLeft(Math.max(0, Number(e.target.value)))} className="w-full mt-1 px-2.5 py-1.5 rounded-lg bg-[#EFF5F4] font-mono-tabular text-xs" />
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-[#1D3532]">Atas (N)</label>
                  <input type="number" min={0} max={200} value={fUp} onChange={(e) => setFUp(Math.max(0, Number(e.target.value)))} className="w-full mt-1 px-2.5 py-1.5 rounded-lg bg-[#EFF5F4] font-mono-tabular text-xs" />
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-[#1D3532]">Bawah (N)</label>
                  <input type="number" min={0} max={200} value={fDown} onChange={(e) => setFDown(Math.max(0, Number(e.target.value)))} className="w-full mt-1 px-2.5 py-1.5 rounded-lg bg-[#EFF5F4] font-mono-tabular text-xs" />
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setFRight(40);
                  setFLeft(15);
                  setFUp(30);
                  setFDown(30);
                }}
                className="w-full py-1.5 rounded-lg bg-[#CBE2DD]/70 hover:bg-[#CBE2DD] text-[11px] font-semibold text-[#1D3532] cursor-pointer"
              >
                Reset Vektor Gaya
              </button>
            </div>
          )}
        </div>
      </aside>

      {/* CENTER PANEL */}
      <section className="xl:col-span-6 bg-white rounded-2xl p-5 shadow-sm border border-[#8FB5AE]/25 flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h3 className="font-display text-lg font-bold text-[#1D3532]">Visualisasi Gaya & Gerak</h3>
          <span className="text-xs font-mono-tabular font-semibold text-[#E26D62]">
            {calc.moving ? 'Benda Bergerak' : 'Benda Diam (Setimbang)'}
          </span>
        </div>

        <div className="relative w-full h-[350px] bg-[#EFF5F4] rounded-2xl overflow-hidden border border-[#8FB5AE]/30">
          <canvas ref={canvasRef} className="w-full h-full block" />
        </div>

        <div className="bg-[#EFF5F4] rounded-xl p-4 flex flex-col gap-3">
          <div className="flex justify-between text-xs font-mono-tabular text-[#4F6A66]">
            <span>Waktu t = {simTime.toFixed(2)} s</span>
            <span>Maks: {maxTime.toFixed(1)} s</span>
          </div>
          <input
            type="range"
            min={0}
            max={maxTime}
            step={0.05}
            value={simTime}
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
                onClick={() => {
                  if (simTime >= maxTime) setSimTime(0);
                  setIsPlaying((p) => !p);
                }}
                className="px-4 py-2 rounded-xl bg-[#E26D62] text-white text-sm font-semibold flex items-center gap-1.5 cursor-pointer"
              >
                {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                {isPlaying ? 'Jeda' : simTime > 0 && simTime < maxTime ? 'Lanjutkan' : 'Jalankan'}
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
            <span className="text-xs font-mono-tabular text-[#4F6A66]">
              a = {calc.a.toFixed(2)} m/s²
            </span>
          </div>
        </div>
      </section>

      {/* RIGHT PANEL */}
      <aside className="xl:col-span-3 bg-white rounded-2xl p-5 shadow-sm border border-[#8FB5AE]/25 flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h3 className="font-display text-lg font-bold text-[#1D3532]">Hasil Perhitungan</h3>
          <button
            type="button"
            onClick={() =>
              exportDataToCsv(
                `physilab_dinamika_${simId}.csv`,
                [simId === 'newton2' || simId === 'gesek' ? 'F(N)' : 't(s)', simId === 'newton2' || simId === 'gesek' ? 'a(m/s2)' : 'v(m/s)'],
                chartData.map((p) => [p.x, p.y])
              )
            }
            className="text-xs font-semibold text-[#1D3532] hover:text-[#E26D62] flex items-center gap-1 cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" /> CSV
          </button>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div className="bg-[#EFF5F4] rounded-xl p-3">
            <span className="text-[11px] text-[#4F6A66]">Gaya Resultan</span>
            <p className="font-mono-tabular text-base font-bold text-[#E26D62]">
              {calc.netForce.toFixed(2)} N
            </p>
          </div>
          <div className="bg-[#EFF5F4] rounded-xl p-3">
            <span className="text-[11px] text-[#4F6A66]">Percepatan (a)</span>
            <p className="font-mono-tabular text-base font-bold text-[#1D3532]">
              {calc.a.toFixed(2)} m/s²
            </p>
          </div>
          {simId === 'gesek' && (
            <>
              <div className="bg-[#EFF5F4] rounded-xl p-3">
                <span className="text-[11px] text-[#4F6A66]">Gesek Statis Maks</span>
                <p className="font-mono-tabular text-sm font-bold text-[#1D3532]">
                  {(calc.fsMax ?? 0).toFixed(2)} N
                </p>
              </div>
              <div className="bg-[#EFF5F4] rounded-xl p-3">
                <span className="text-[11px] text-[#4F6A66]">Gesek Kinetis</span>
                <p className="font-mono-tabular text-sm font-bold text-[#1D3532]">
                  {(calc.fk ?? 0).toFixed(2)} N
                </p>
              </div>
            </>
          )}
          {simId === 'bidang-miring' && (
            <>
              <div className="bg-[#EFF5F4] rounded-xl p-3">
                <span className="text-[11px] text-[#4F6A66]">Gaya Normal (N)</span>
                <p className="font-mono-tabular text-sm font-bold text-[#1D3532]">
                  {calc.N.toFixed(2)} N
                </p>
              </div>
              <div className="bg-[#EFF5F4] rounded-xl p-3">
                <span className="text-[11px] text-[#4F6A66]">Komponen Sejajar</span>
                <p className="font-mono-tabular text-sm font-bold text-[#1D3532]">
                  {(calc.fParallel ?? 0).toFixed(2)} N
                </p>
              </div>
            </>
          )}
          {simId === 'fbd' && (
            <div className="col-span-2 bg-[#EFF5F4] rounded-xl p-3">
              <span className="text-[11px] text-[#4F6A66]">Arah Resultan</span>
              <p className="font-mono-tabular text-sm font-bold text-[#1D3532]">
                {(calc.angleDeg ?? 0).toFixed(1)}° terhadap sumbu +X
              </p>
            </div>
          )}
        </div>

        <div className="h-44 w-full bg-[#EFF5F4]/60 rounded-xl p-2">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#CBE2DD" />
              <XAxis
                dataKey="x"
                tick={{ fontSize: 10, fill: '#4F6A66' }}
                unit={simId === 'newton2' || simId === 'gesek' ? 'N' : 's'}
              />
              <YAxis tick={{ fontSize: 10, fill: '#4F6A66' }} />
              <Tooltip />
              <Legend wrapperStyle={{ fontSize: '11px' }} />
              <Line
                type="monotone"
                dataKey="y"
                name={simId === 'newton2' || simId === 'gesek' ? 'Percepatan a (m/s²)' : 'Kecepatan v (m/s)'}
                stroke="#E26D62"
                strokeWidth={2.5}
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-[#EFF5F4] rounded-xl p-3.5 text-xs text-[#4F6A66] leading-relaxed">
          <p className="font-semibold text-[#1D3532] mb-1">Penjelasan Dinamika</p>
          <p>
            {simId === 'gesek'
              ? 'Selama gaya dorong lebih kecil atau sama dengan gaya gesek statis maksimum (fs_max), benda tetap diam (Hukum Newton I).'
              : 'Percepatan benda berbanding lurus dengan gaya resultan dan berbanding terbalik dengan massanya (a = ΣF/m).'}
          </p>
        </div>
      </aside>
    </div>
  );
};
