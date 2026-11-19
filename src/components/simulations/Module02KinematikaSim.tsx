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

export const Module02KinematikaSim: React.FC<Props> = ({ simId }) => {
  // Shared states
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [graphMetric, setGraphMetric] = useState<'xt' | 'vt' | 'at'>('xt');
  const [showVectors, setShowVectors] = useState(true);

  // GLB params
  const [glbX0, setGlbX0] = useState(0);
  const [glbV, setGlbV] = useState(8);
  const [glbTmax, setGlbTmax] = useState(10);

  // GLBB & Jatuh Bebas params
  const [glbbMode, setGlbbMode] = useState<'datar' | 'jatuh-bebas'>('datar');
  const [glbbV0, setGlbbV0] = useState(2);
  const [glbbA, setGlbbA] = useState(3);
  const [glbbTmax, setGlbbTmax] = useState(8);

  // Parabola params
  const [projV0, setProjV0] = useState(28);
  const [projTheta, setProjTheta] = useState(45);
  const [projG, setProjG] = useState(9.8);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Compute max duration & dataset for Recharts & Canvas
  const physicsData = useMemo(() => {
    if (simId === 'glb') {
      const tMax = Math.max(1, glbTmax);
      const pts = [];
      const steps = 60;
      for (let i = 0; i <= steps; i++) {
        const t = (i / steps) * tMax;
        const x = glbX0 + glbV * t;
        pts.push({
          t: Number(t.toFixed(2)),
          x: Number(x.toFixed(2)),
          v: Number(glbV.toFixed(2)),
          a: 0,
        });
      }
      return { tMax, pts };
    }

    if (simId === 'glbb') {
      const aEff = glbbMode === 'jatuh-bebas' ? 9.8 : glbbA;
      const v0Eff = glbbMode === 'jatuh-bebas' ? 0 : glbbV0;
      const tMax = Math.max(1, glbbTmax);
      const pts = [];
      const steps = 60;
      for (let i = 0; i <= steps; i++) {
        const t = (i / steps) * tMax;
        const x = v0Eff * t + 0.5 * aEff * t * t;
        const v = v0Eff + aEff * t;
        pts.push({
          t: Number(t.toFixed(2)),
          x: Number(x.toFixed(2)),
          v: Number(v.toFixed(2)),
          a: Number(aEff.toFixed(2)),
        });
      }
      return { tMax, pts };
    }

    // Parabola
    const rad = (projTheta * Math.PI) / 180;
    const v0x = projV0 * Math.cos(rad);
    const v0y = projV0 * Math.sin(rad);
    const tTotal = Math.max(0.2, (2 * v0y) / Math.max(0.1, projG));
    const pts = [];
    const steps = 80;
    for (let i = 0; i <= steps; i++) {
      const t = (i / steps) * tTotal;
      const x = v0x * t;
      const y = Math.max(0, v0y * t - 0.5 * projG * t * t);
      const vy = v0y - projG * t;
      const v = Math.sqrt(v0x * v0x + vy * vy);
      pts.push({
        t: Number(t.toFixed(2)),
        x: Number(x.toFixed(2)),
        y: Number(y.toFixed(2)),
        vx: Number(v0x.toFixed(2)),
        vy: Number(vy.toFixed(2)),
        v: Number(v.toFixed(2)),
        a: Number((-projG).toFixed(2)),
      });
    }
    return { tMax: tTotal, pts };
  }, [simId, glbX0, glbV, glbTmax, glbbMode, glbbV0, glbbA, glbbTmax, projV0, projTheta, projG]);

  // Reset time when switching sim
  useEffect(() => {
    setIsPlaying(false);
    setCurrentTime(0);
  }, [simId, glbbMode]);

  // Animation loop
  useEffect(() => {
    if (!isPlaying) return;
    let last = performance.now();
    let raf = 0;
    const step = (now: number) => {
      const dt = (now - last) / 1000;
      last = now;
      setCurrentTime((prev) => {
        const next = prev + dt;
        if (next >= physicsData.tMax) {
          setIsPlaying(false);
          return physicsData.tMax;
        }
        return next;
      });
      raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [isPlaying, physicsData.tMax]);

  // Instantaneous values at currentTime
  const currentInstant = useMemo(() => {
    const t = Math.min(currentTime, physicsData.tMax);
    if (simId === 'glb') {
      return {
        t,
        x: glbX0 + glbV * t,
        y: 0,
        v: glbV,
        vx: glbV,
        vy: 0,
        a: 0,
      };
    }
    if (simId === 'glbb') {
      const aEff = glbbMode === 'jatuh-bebas' ? 9.8 : glbbA;
      const v0Eff = glbbMode === 'jatuh-bebas' ? 0 : glbbV0;
      return {
        t,
        x: v0Eff * t + 0.5 * aEff * t * t,
        y: 0,
        v: v0Eff + aEff * t,
        vx: v0Eff + aEff * t,
        vy: 0,
        a: aEff,
      };
    }
    const rad = (projTheta * Math.PI) / 180;
    const v0x = projV0 * Math.cos(rad);
    const v0y = projV0 * Math.sin(rad);
    const x = v0x * t;
    const y = Math.max(0, v0y * t - 0.5 * projG * t * t);
    const vy = v0y - projG * t;
    return {
      t,
      x,
      y,
      vx: v0x,
      vy,
      v: Math.sqrt(v0x * v0x + vy * vy),
      a: -projG,
    };
  }, [currentTime, physicsData.tMax, simId, glbX0, glbV, glbbMode, glbbV0, glbbA, projTheta, projV0, projG]);

  // Parabola key metrics
  const projMetrics = useMemo(() => {
    const rad = (projTheta * Math.PI) / 180;
    const v0y = projV0 * Math.sin(rad);
    const v0x = projV0 * Math.cos(rad);
    const tTotal = (2 * v0y) / Math.max(0.1, projG);
    const hMax = (v0y * v0y) / (2 * Math.max(0.1, projG));
    const xMax = v0x * tTotal;
    return { tTotal, hMax, xMax };
  }, [projV0, projTheta, projG]);

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

    // Subtle background grid
    ctx.strokeStyle = '#CBE2DD';
    ctx.lineWidth = 0.7;
    for (let gx = 40; gx < w; gx += 40) {
      ctx.beginPath();
      ctx.moveTo(gx, 0);
      ctx.lineTo(gx, h);
      ctx.stroke();
    }
    for (let gy = 40; gy < h; gy += 40) {
      ctx.beginPath();
      ctx.moveTo(0, gy);
      ctx.lineTo(w, gy);
      ctx.stroke();
    }

    if (simId === 'glb' || (simId === 'glbb' && glbbMode === 'datar')) {
      const lastPt = physicsData.pts[physicsData.pts.length - 1];
      const minX = Math.min(0, glbX0, lastPt?.x || 0);
      const maxX = Math.max(20, lastPt?.x || 50, glbX0 + 10);
      const span = Math.max(10, maxX - minX);
      const padL = 48;
      const padR = 48;
      const trackY = h * 0.62;

      const toScreenX = (xVal: number) => padL + ((xVal - minX) / span) * (w - padL - padR);

      // Track ground
      ctx.fillStyle = '#CBE2DD';
      ctx.fillRect(0, trackY, w, h - trackY);
      ctx.strokeStyle = '#1D3532';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(20, trackY);
      ctx.lineTo(w - 20, trackY);
      ctx.stroke();

      // Distance ticks
      ctx.fillStyle = '#4F6A66';
      ctx.font = '11px "JetBrains Mono", monospace';
      for (let i = 0; i <= 5; i++) {
        const val = minX + (i / 5) * span;
        const sx = toScreenX(val);
        ctx.beginPath();
        ctx.moveTo(sx, trackY);
        ctx.lineTo(sx, trackY + 7);
        ctx.stroke();
        ctx.fillText(`${val.toFixed(0)}m`, sx - 12, trackY + 22);
      }

      // Cart object
      const cartX = toScreenX(currentInstant.x);
      ctx.fillStyle = '#E26D62';
      ctx.beginPath();
      ctx.roundRect(cartX - 24, trackY - 34, 48, 28, 8);
      ctx.fill();
      // Wheels
      ctx.fillStyle = '#1D3532';
      ctx.beginPath();
      ctx.arc(cartX - 14, trackY - 5, 5, 0, Math.PI * 2);
      ctx.arc(cartX + 14, trackY - 5, 5, 0, Math.PI * 2);
      ctx.fill();

      // Velocity arrow
      if (showVectors && Math.abs(currentInstant.v) > 0.2) {
        const arrowLen = Math.max(-90, Math.min(90, currentInstant.v * 2.5));
        ctx.strokeStyle = '#1D3532';
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.moveTo(cartX, trackY - 50);
        ctx.lineTo(cartX + arrowLen, trackY - 50);
        ctx.stroke();
        ctx.fillStyle = '#1D3532';
        ctx.font = '11px "JetBrains Mono", monospace';
        ctx.fillText(`v = ${currentInstant.v.toFixed(1)} m/s`, cartX - 28, trackY - 60);
      }
      return;
    }

    if (simId === 'glbb' && glbbMode === 'jatuh-bebas') {
      const hTotal = Math.max(10, 0.5 * 9.8 * glbbTmax * glbbTmax);
      const padT = 36;
      const padB = 40;
      const dropX = w * 0.5;
      const groundY = h - padB;
      const toScreenY = (fallDist: number) => padT + (fallDist / hTotal) * (groundY - padT);

      // Tower guide
      ctx.strokeStyle = '#8FB5AE';
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.moveTo(dropX, padT);
      ctx.lineTo(dropX, groundY);
      ctx.stroke();
      ctx.setLineDash([]);

      // Ground
      ctx.fillStyle = '#CBE2DD';
      ctx.fillRect(0, groundY, w, h - groundY);
      ctx.strokeStyle = '#1D3532';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(30, groundY);
      ctx.lineTo(w - 30, groundY);
      ctx.stroke();

      // Falling ball
      const ballY = Math.min(groundY - 12, toScreenY(currentInstant.x));
      ctx.fillStyle = '#E26D62';
      ctx.beginPath();
      ctx.arc(dropX, ballY, 12, 0, Math.PI * 2);
      ctx.fill();

      if (showVectors) {
        ctx.fillStyle = '#1D3532';
        ctx.font = '11px "JetBrains Mono", monospace';
        ctx.fillText(`h turun = ${currentInstant.x.toFixed(1)} m`, dropX + 20, ballY);
        ctx.fillText(`v = ${currentInstant.v.toFixed(1)} m/s`, dropX + 20, ballY + 16);
      }
      return;
    }

    // Parabola 2D Canvas
    const padL = 48;
    const padB = 42;
    const padT = 36;
    const padR = 36;
    const maxSimX = Math.max(projMetrics.xMax * 1.12, 15);
    const maxSimY = Math.max(projMetrics.hMax * 1.25, 10);
    const scale = Math.min((w - padL - padR) / maxSimX, (h - padT - padB) / maxSimY);
    const originX = padL;
    const originY = h - padB;
    const toSX = (x: number) => originX + x * scale;
    const toSY = (y: number) => originY - y * scale;

    // Ground
    ctx.fillStyle = '#CBE2DD';
    ctx.fillRect(0, originY, w, h - originY);
    ctx.strokeStyle = '#1D3532';
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    ctx.moveTo(originX, originY);
    ctx.lineTo(w - 20, originY);
    ctx.moveTo(originX, originY);
    ctx.lineTo(originX, 20);
    ctx.stroke();

    // Dashed full trajectory
    ctx.strokeStyle = '#4F6A66';
    ctx.lineWidth = 2;
    ctx.setLineDash([5, 4]);
    ctx.beginPath();
    physicsData.pts.forEach((pt, idx) => {
      const sx = toSX(pt.x);
      const sy = toSY((pt as { y?: number }).y ?? 0);
      if (idx === 0) ctx.moveTo(sx, sy);
      else ctx.lineTo(sx, sy);
    });
    ctx.stroke();
    ctx.setLineDash([]);

    // Peak marker
    const peakSX = toSX(projMetrics.xMax / 2);
    const peakSY = toSY(projMetrics.hMax);
    ctx.fillStyle = '#8C685C';
    ctx.beginPath();
    ctx.arc(peakSX, peakSY, 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.font = '10px "JetBrains Mono", monospace';
    ctx.fillStyle = '#1D3532';
    ctx.fillText(`H_max=${projMetrics.hMax.toFixed(1)}m`, peakSX - 32, peakSY - 10);

    // Cannon barrel
    const rad = (projTheta * Math.PI) / 180;
    ctx.strokeStyle = '#1D3532';
    ctx.lineWidth = 6;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(originX, originY);
    ctx.lineTo(originX + 24 * Math.cos(rad), originY - 24 * Math.sin(rad));
    ctx.stroke();

    // Projectile
    const currSX = toSX(currentInstant.x);
    const currSY = toSY(currentInstant.y);
    ctx.fillStyle = '#E26D62';
    ctx.beginPath();
    ctx.arc(currSX, currSY, 8, 0, Math.PI * 2);
    ctx.fill();

    // Velocity vector
    if (showVectors) {
      const vScale = 1.6;
      const endX = currSX + currentInstant.vx * vScale;
      const endY = currSY - currentInstant.vy * vScale;
      ctx.strokeStyle = '#1D3532';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(currSX, currSY);
      ctx.lineTo(endX, endY);
      ctx.stroke();
    }
  }, [simId, glbbMode, glbX0, glbbTmax, physicsData, currentInstant, projMetrics, projTheta, showVectors]);

  const activeDataKey = graphMetric === 'xt' ? (simId === 'parabola' ? 'y' : 'x') : graphMetric === 'vt' ? 'v' : 'a';
  const activeGraphLabel =
    graphMetric === 'xt'
      ? simId === 'parabola'
        ? 'Ketinggian y (m)'
        : 'Posisi x (m)'
      : graphMetric === 'vt'
      ? 'Kecepatan v (m/s)'
      : 'Percepatan a (m/s²)';

  return (
    <div className="grid grid-cols-1 xl:grid-cols-12 gap-5 items-start">
      {/* LEFT PANEL */}
      <aside className="xl:col-span-3 bg-white rounded-2xl p-5 shadow-sm border border-[#8FB5AE]/25 flex flex-col gap-4">
        <div>
          <p className="text-xs font-medium text-[#4F6A66]">Modul 02 · Kinematika</p>
          <h2 className="font-display text-xl font-bold text-[#1D3532] mt-0.5">
            {simId === 'glb' && 'Gerak Lurus Beraturan'}
            {simId === 'glbb' && 'GLBB & Jatuh Bebas'}
            {simId === 'parabola' && 'Gerak Parabola'}
          </h2>
        </div>

        <div className="bg-[#EFF5F4] rounded-xl p-3">
          <p className="text-xs font-medium text-[#4F6A66] mb-1">Persamaan Kinematika</p>
          {simId === 'glb' && <MathDisplay latex="x = x_0 + v \cdot t" block />}
          {simId === 'glbb' && (
            <MathDisplay
              latex={
                glbbMode === 'jatuh-bebas'
                  ? 'h = \\frac{1}{2}gt^2, \\quad v = gt'
                  : 'v = v_0 + at, \\quad s = v_0 t + \\frac{1}{2}at^2'
              }
              block
            />
          )}
          {simId === 'parabola' && (
            <MathDisplay
              latex="x = v_0\cos(\theta)t, \; y = v_0\sin(\theta)t - \frac{1}{2}gt^2"
              block
            />
          )}
        </div>

        {simId === 'glb' && (
          <div className="space-y-3.5">
            <div>
              <div className="flex justify-between text-xs font-semibold text-[#1D3532] mb-1">
                <span>Posisi Awal (x₀)</span>
                <span className="font-mono-tabular">{glbX0} m</span>
              </div>
              <input
                type="range"
                min={0}
                max={30}
                step={1}
                value={glbX0}
                onChange={(e) => setGlbX0(Number(e.target.value))}
                className="w-full physilab-slider"
              />
            </div>
            <div>
              <div className="flex justify-between text-xs font-semibold text-[#1D3532] mb-1">
                <span>Kecepatan (v)</span>
                <span className="font-mono-tabular text-[#E26D62]">{glbV} m/s</span>
              </div>
              <input
                type="range"
                min={1}
                max={30}
                step={0.5}
                value={glbV}
                onChange={(e) => setGlbV(Number(e.target.value))}
                className="w-full physilab-slider"
              />
            </div>
            <div>
              <div className="flex justify-between text-xs font-semibold text-[#1D3532] mb-1">
                <span>Durasi Pengamatan (t)</span>
                <span className="font-mono-tabular">{glbTmax} s</span>
              </div>
              <input
                type="range"
                min={2}
                max={20}
                step={1}
                value={glbTmax}
                onChange={(e) => setGlbTmax(Number(e.target.value))}
                className="w-full physilab-slider"
              />
            </div>
          </div>
        )}

        {simId === 'glbb' && (
          <div className="space-y-3.5">
            <div className="grid grid-cols-2 gap-1.5 bg-[#EFF5F4] p-1 rounded-xl">
              <button
                type="button"
                onClick={() => setGlbbMode('datar')}
                className={`py-1.5 rounded-lg text-xs font-semibold cursor-pointer ${
                  glbbMode === 'datar' ? 'bg-white text-[#1D3532] shadow-sm' : 'text-[#4F6A66]'
                }`}
              >
                Lintasan Datar
              </button>
              <button
                type="button"
                onClick={() => setGlbbMode('jatuh-bebas')}
                className={`py-1.5 rounded-lg text-xs font-semibold cursor-pointer ${
                  glbbMode === 'jatuh-bebas' ? 'bg-white text-[#1D3532] shadow-sm' : 'text-[#4F6A66]'
                }`}
              >
                Jatuh Bebas
              </button>
            </div>

            {glbbMode === 'datar' && (
              <>
                <div>
                  <div className="flex justify-between text-xs font-semibold text-[#1D3532] mb-1">
                    <span>Kecepatan Awal (v₀)</span>
                    <span className="font-mono-tabular">{glbbV0} m/s</span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={25}
                    step={0.5}
                    value={glbbV0}
                    onChange={(e) => setGlbbV0(Number(e.target.value))}
                    className="w-full physilab-slider"
                  />
                </div>
                <div>
                  <div className="flex justify-between text-xs font-semibold text-[#1D3532] mb-1">
                    <span>Percepatan (a)</span>
                    <span className="font-mono-tabular text-[#E26D62]">{glbbA} m/s²</span>
                  </div>
                  <input
                    type="range"
                    min={-5}
                    max={10}
                    step={0.5}
                    value={glbbA}
                    onChange={(e) => setGlbbA(Number(e.target.value))}
                    className="w-full physilab-slider"
                  />
                </div>
              </>
            )}

            <div>
              <div className="flex justify-between text-xs font-semibold text-[#1D3532] mb-1">
                <span>Durasi Waktu (t)</span>
                <span className="font-mono-tabular">{glbbTmax} s</span>
              </div>
              <input
                type="range"
                min={2}
                max={12}
                step={0.5}
                value={glbbTmax}
                onChange={(e) => setGlbbTmax(Number(e.target.value))}
                className="w-full physilab-slider"
              />
            </div>
          </div>
        )}

        {simId === 'parabola' && (
          <div className="space-y-3.5">
            <div>
              <div className="flex justify-between text-xs font-semibold text-[#1D3532] mb-1">
                <span>Kecepatan Awal (v₀)</span>
                <span className="font-mono-tabular text-[#E26D62]">{projV0} m/s</span>
              </div>
              <input
                type="range"
                min={5}
                max={60}
                step={1}
                value={projV0}
                onChange={(e) => setProjV0(Number(e.target.value))}
                className="w-full physilab-slider"
              />
            </div>
            <div>
              <div className="flex justify-between text-xs font-semibold text-[#1D3532] mb-1">
                <span>Sudut Elevasi (θ)</span>
                <span className="font-mono-tabular text-[#E26D62]">{projTheta}°</span>
              </div>
              <input
                type="range"
                min={5}
                max={85}
                step={1}
                value={projTheta}
                onChange={(e) => setProjTheta(Number(e.target.value))}
                className="w-full physilab-slider"
              />
            </div>
            <div>
              <div className="flex justify-between text-xs font-semibold text-[#1D3532] mb-1">
                <span>Gravitasi (g)</span>
                <span className="font-mono-tabular">{projG} m/s²</span>
              </div>
              <div className="grid grid-cols-3 gap-1.5">
                {[
                  { label: 'Bumi', val: 9.8 },
                  { label: 'Bulan', val: 1.62 },
                  { label: 'Mars', val: 3.71 },
                ].map((planet) => (
                  <button
                    key={planet.label}
                    type="button"
                    onClick={() => setProjG(planet.val)}
                    className={`py-1.5 rounded-lg text-xs font-semibold cursor-pointer ${
                      projG === planet.val
                        ? 'bg-[#1D3532] text-white'
                        : 'bg-[#EFF5F4] text-[#4F6A66]'
                    }`}
                  >
                    {planet.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        <label className="flex items-center gap-2 text-xs font-medium text-[#1D3532] cursor-pointer pt-1">
          <input
            type="checkbox"
            checked={showVectors}
            onChange={(e) => setShowVectors(e.target.checked)}
            className="accent-[#E26D62] w-4 h-4"
          />
          Tampilkan Vektor Kecepatan
        </label>
      </aside>

      {/* CENTER PANEL */}
      <section className="xl:col-span-6 bg-white rounded-2xl p-5 shadow-sm border border-[#8FB5AE]/25 flex flex-col gap-4">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <h3 className="font-display text-lg font-bold text-[#1D3532]">Kanvas Eksperimen Gerak</h3>
          <div className="flex items-center gap-4 text-xs font-mono-tabular text-[#4F6A66]">
            <span>t = {currentInstant.t.toFixed(2)} s</span>
            <span>x = {currentInstant.x.toFixed(2)} m</span>
            {simId === 'parabola' && <span>y = {currentInstant.y.toFixed(2)} m</span>}
          </div>
        </div>

        <div className="relative w-full h-[360px] bg-[#EFF5F4] rounded-2xl overflow-hidden border border-[#8FB5AE]/30">
          <canvas ref={canvasRef} className="w-full h-full block" />
        </div>

        {/* Controls & Scrubber */}
        <div className="bg-[#EFF5F4] rounded-xl p-4 flex flex-col gap-3">
          <div className="flex items-center justify-between text-xs font-mono-tabular text-[#4F6A66]">
            <span>Waktu: {currentTime.toFixed(2)} s</span>
            <span>Maks: {physicsData.tMax.toFixed(2)} s</span>
          </div>
          <input
            type="range"
            min={0}
            max={physicsData.tMax}
            step={0.02}
            value={currentTime}
            onChange={(e) => {
              setIsPlaying(false);
              setCurrentTime(Number(e.target.value));
            }}
            className="w-full physilab-slider"
          />
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => {
                if (currentTime >= physicsData.tMax) setCurrentTime(0);
                setIsPlaying((p) => !p);
              }}
              className="px-4 py-2 rounded-xl bg-[#E26D62] hover:bg-[#cf5e53] text-white text-sm font-semibold flex items-center gap-1.5 cursor-pointer"
            >
              {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
              {isPlaying ? 'Jeda' : currentTime > 0 && currentTime < physicsData.tMax ? 'Lanjutkan' : 'Mulai'}
            </button>
            <button
              type="button"
              onClick={() => {
                setIsPlaying(false);
                setCurrentTime(0);
              }}
              className="px-4 py-2 rounded-xl bg-white border border-[#8FB5AE]/40 text-[#1D3532] text-sm font-semibold flex items-center gap-1.5 cursor-pointer"
            >
              <RotateCcw className="w-4 h-4" />
              Reset
            </button>
          </div>
        </div>
      </section>

      {/* RIGHT PANEL */}
      <aside className="xl:col-span-3 bg-white rounded-2xl p-5 shadow-sm border border-[#8FB5AE]/25 flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h3 className="font-display text-lg font-bold text-[#1D3532]">Hasil & Grafik</h3>
          <button
            type="button"
            onClick={() =>
              exportDataToCsv(
                `physilab_${simId}.csv`,
                ['t(s)', 'x(m)', 'v(m/s)', 'a(m/s2)'],
                physicsData.pts.map((p) => [p.t, p.x, p.v, p.a])
              )
            }
            className="text-xs font-semibold text-[#1D3532] hover:text-[#E26D62] flex items-center gap-1 cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            CSV
          </button>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div className="bg-[#EFF5F4] rounded-xl p-3">
            <span className="text-[11px] text-[#4F6A66]">Posisi x</span>
            <p className="font-mono-tabular text-base font-bold text-[#1D3532]">
              {currentInstant.x.toFixed(2)} m
            </p>
          </div>
          <div className="bg-[#EFF5F4] rounded-xl p-3">
            <span className="text-[11px] text-[#4F6A66]">Kecepatan v</span>
            <p className="font-mono-tabular text-base font-bold text-[#E26D62]">
              {currentInstant.v.toFixed(2)} m/s
            </p>
          </div>
          {simId === 'parabola' && (
            <>
              <div className="bg-[#EFF5F4] rounded-xl p-3">
                <span className="text-[11px] text-[#4F6A66]">Tinggi Maks</span>
                <p className="font-mono-tabular text-base font-bold text-[#1D3532]">
                  {projMetrics.hMax.toFixed(2)} m
                </p>
              </div>
              <div className="bg-[#EFF5F4] rounded-xl p-3">
                <span className="text-[11px] text-[#4F6A66]">Jangkauan</span>
                <p className="font-mono-tabular text-base font-bold text-[#1D3532]">
                  {projMetrics.xMax.toFixed(2)} m
                </p>
              </div>
            </>
          )}
        </div>

        {/* Dynamic Graph Switcher */}
        <div>
          <div className="grid grid-cols-3 gap-1 bg-[#EFF5F4] p-1 rounded-xl mb-2">
            {[
              { id: 'xt', label: 'Posisi' },
              { id: 'vt', label: 'Kecepatan' },
              { id: 'at', label: 'Percepatan' },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setGraphMetric(tab.id as 'xt' | 'vt' | 'at')}
                className={`py-1.5 rounded-lg text-[11px] font-semibold cursor-pointer ${
                  graphMetric === tab.id ? 'bg-white text-[#1D3532] shadow-sm' : 'text-[#4F6A66]'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="h-48 w-full bg-[#EFF5F4]/60 rounded-xl p-2">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={physicsData.pts}>
                <CartesianGrid strokeDasharray="3 3" stroke="#CBE2DD" />
                <XAxis dataKey="t" tick={{ fontSize: 10, fill: '#4F6A66' }} unit="s" />
                <YAxis tick={{ fontSize: 10, fill: '#4F6A66' }} />
                <Tooltip />
                <Legend wrapperStyle={{ fontSize: '11px' }} />
                <Line
                  type="monotone"
                  dataKey={activeDataKey}
                  name={activeGraphLabel}
                  stroke="#E26D62"
                  strokeWidth={2.5}
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-[#EFF5F4] rounded-xl p-3.5 text-xs text-[#4F6A66] leading-relaxed">
          <p className="font-semibold text-[#1D3532] mb-1">Analisis Fisika</p>
          {simId === 'glb' &&
            'Pada GLB, percepatan bernilai nol sehingga kecepatan benda konstan dan grafik posisi terhadap waktu berupa garis lurus.'}
          {simId === 'glbb' &&
            'Pada GLBB, percepatan tetap menyebabkan kecepatan berubah secara linier dan posisi berubah secara kuadratik terhadap waktu.'}
          {simId === 'parabola' &&
            'Gerak parabola menggabungkan GLB pada sumbu horizontal (vx konstan) dan GLBB pada sumbu vertikal (ay = -g).'}
        </div>
      </aside>
    </div>
  );
};
