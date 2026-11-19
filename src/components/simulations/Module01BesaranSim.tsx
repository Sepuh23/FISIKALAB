import React, { useEffect, useRef, useState } from 'react';
import { Play, Pause, RotateCcw, Flag, ArrowRightLeft } from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from 'recharts';
import { SimId } from '../../types/physics';
import {
  BESARAN_POKOK,
  BESARAN_TURUNAN,
  UNIT_CONVERSIONS,
  UnitCategory,
  convertUnitValue,
} from '../../engine/physicsEngine';
import { MathDisplay } from '../MathDisplay';

interface Props {
  simId: SimId;
}

const SAMPLE_MATERIALS = [
  { name: 'Balok Kayu Pinus', density: 520, color: '#8C685C', defaultMassG: 185.4 },
  { name: 'Kubus Aluminium', density: 2700, color: '#8FB5AE', defaultMassG: 432.0 },
  { name: 'Silinder Tembaga', density: 8960, color: '#E26D62', defaultMassG: 716.8 },
  { name: 'Bola Kaca Laboratorium', density: 2500, color: '#95B3A6', defaultMassG: 265.2 },
];

export const Module01BesaranSim: React.FC<Props> = ({ simId }) => {
  // === Simulator Pengukuran States ===
  const [activeInstrument, setActiveInstrument] = useState<'mistar' | 'neraca' | 'stopwatch'>('mistar');
  const [objectLengthCm, setObjectLengthCm] = useState<number>(12.4);
  const [rulerUnit, setRulerUnit] = useState<'cm' | 'mm' | 'm'>('cm');
  const [selectedMaterialIdx, setSelectedMaterialIdx] = useState<number>(0);
  const [massGrams, setMassGrams] = useState<number>(SAMPLE_MATERIALS[0].defaultMassG);
  const [massUnit, setMassUnit] = useState<'g' | 'kg' | 'mg'>('g');

  // Stopwatch state
  const [swRunning, setSwRunning] = useState(false);
  const [swElapsedMs, setSwElapsedMs] = useState(0);
  const [swLaps, setSwLaps] = useState<number[]>([]);
  const lastTickRef = useRef<number | null>(null);

  useEffect(() => {
    if (!swRunning) {
      lastTickRef.current = null;
      return;
    }
    let rafId = 0;
    const tick = (now: number) => {
      if (lastTickRef.current !== null) {
        const dt = now - lastTickRef.current;
        setSwElapsedMs((prev) => prev + dt);
      }
      lastTickRef.current = now;
      rafId = requestAnimationFrame(tick);
    };
    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, [swRunning]);

  const formatStopwatch = (ms: number) => {
    const totalSec = ms / 1000;
    const mins = Math.floor(totalSec / 60);
    const secs = Math.floor(totalSec % 60);
    const centis = Math.floor((ms % 1000) / 10);
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}.${String(centis).padStart(2, '0')}`;
  };

  // === Konversi Satuan States ===
  const [convCategory, setConvCategory] = useState<UnitCategory>('panjang');
  const [convInputVal, setConvInputVal] = useState<number>(100);
  const [fromUnit, setFromUnit] = useState<string>('cm');
  const [toUnit, setToUnit] = useState<string>('m');

  const handleCategoryChange = (cat: UnitCategory) => {
    setConvCategory(cat);
    const units = UNIT_CONVERSIONS[cat].units;
    setFromUnit(units[0].id);
    setToUnit(units[1]?.id || units[0].id);
  };

  const safeConvInput = Number.isFinite(convInputVal) ? convInputVal : 0;
  const convertedValue = convertUnitValue(convCategory, safeConvInput, fromUnit, toUnit);
  const formatConvNum = (val: number) => {
    if (!Number.isFinite(val)) return '—';
    if (val !== 0 && (Math.abs(val) < 0.0001 || Math.abs(val) >= 1e7)) {
      return val.toExponential(4);
    }
    return String(Number(val.toFixed(6)));
  };

  // Dragging handler for interactive SVG ruler
  const rulerSvgRef = useRef<SVGSVGElement | null>(null);
  const [isDraggingRuler, setIsDraggingRuler] = useState(false);

  const updateLengthFromPointer = (clientX: number) => {
    const svg = rulerSvgRef.current;
    if (!svg) return;
    const rect = svg.getBoundingClientRect();
    const viewX = ((clientX - rect.left) / rect.width) * 640;
    const cm = Math.max(1, Math.min(20, (viewX - 20) / 28));
    setObjectLengthCm(Number(cm.toFixed(1)));
  };

  // === Analisis Dimensi States ===
  const [selectedDerivedIdx, setSelectedDerivedIdx] = useState<number>(5); // Gaya
  const [expM, setExpM] = useState<number>(1);
  const [expL, setExpL] = useState<number>(1);
  const [expT, setExpT] = useState<number>(-2);

  const targetDerived = BESARAN_TURUNAN[selectedDerivedIdx];
  const isDimensionMatch =
    expM === targetDerived.m && expL === targetDerived.l && expT === targetDerived.t;

  // Displayed length & mass values in chosen unit
  const displayedLength =
    rulerUnit === 'cm'
      ? objectLengthCm
      : rulerUnit === 'mm'
      ? objectLengthCm * 10
      : objectLengthCm / 100;

  const displayedMass =
    massUnit === 'g'
      ? massGrams
      : massUnit === 'kg'
      ? massGrams / 1000
      : massGrams * 1000;

  if (simId === 'konversi') {
    const categoryDef = UNIT_CONVERSIONS[convCategory];
    const allUnitsTable = categoryDef.units.map((u) => ({
      satuan: `${u.label} (${u.symbol})`,
      simbol: u.symbol,
      nilai: convertUnitValue(convCategory, safeConvInput, fromUnit, u.id),
    }));

    return (
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-5 items-start">
        {/* LEFT PANEL */}
        <aside className="xl:col-span-3 bg-white rounded-2xl p-5 shadow-sm border border-[#8FB5AE]/25 flex flex-col gap-4">
          <div>
            <p className="text-xs font-medium text-[#4F6A66]">Modul 01 · Konversi Satuan</p>
            <h2 className="font-display text-xl font-bold text-[#1D3532] mt-0.5">
              Konverter Satuan SI
            </h2>
          </div>

          <div className="bg-[#EFF5F4] rounded-xl p-3">
            <p className="text-xs font-medium text-[#4F6A66] mb-1">Prinsip Konversi</p>
            <MathDisplay latex="X_{\text{tujuan}} = f^{-1}\!\big(f(X_{\text{asal}})\big)" block />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#1D3532] mb-2">
              Kategori Besaran
            </label>
            <div className="grid grid-cols-2 gap-1.5">
              {(Object.keys(UNIT_CONVERSIONS) as UnitCategory[]).map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => handleCategoryChange(cat)}
                  className={`px-3 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                    convCategory === cat
                      ? 'bg-[#1D3532] text-white'
                      : 'bg-[#EFF5F4] text-[#4F6A66] hover:bg-[#CBE2DD]'
                  }`}
                >
                  {UNIT_CONVERSIONS[cat].label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label htmlFor="conv-val" className="block text-xs font-semibold text-[#1D3532] mb-1.5">
              Nilai Masukan
            </label>
            <input
              id="conv-val"
              type="number"
              value={Number.isNaN(convInputVal) ? '' : convInputVal}
              onChange={(e) => setConvInputVal(e.target.value === '' ? NaN : Number(e.target.value))}
              className="w-full px-3 py-2 rounded-xl bg-[#EFF5F4] border border-[#8FB5AE]/40 font-mono-tabular text-sm font-semibold text-[#1D3532] focus:outline-none focus:border-[#E26D62]"
            />
          </div>

          <div className="grid grid-cols-1 gap-3">
            <div>
              <label htmlFor="from-unit" className="block text-xs font-semibold text-[#1D3532] mb-1">
                Dari Satuan
              </label>
              <select
                id="from-unit"
                value={fromUnit}
                onChange={(e) => setFromUnit(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-[#EFF5F4] border border-[#8FB5AE]/40 text-sm text-[#1D3532]"
              >
                {categoryDef.units.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.label} ({u.symbol})
                  </option>
                ))}
              </select>
            </div>

            <button
              type="button"
              onClick={() => {
                const prev = fromUnit;
                setFromUnit(toUnit);
                setToUnit(prev);
              }}
              className="self-center px-3 py-1.5 rounded-xl bg-[#CBE2DD] text-[#1D3532] text-xs font-semibold flex items-center gap-1.5 hover:bg-[#8FB5AE]/50 cursor-pointer"
            >
              <ArrowRightLeft className="w-3.5 h-3.5" />
              Tukar Satuan
            </button>

            <div>
              <label htmlFor="to-unit" className="block text-xs font-semibold text-[#1D3532] mb-1">
                Ke Satuan
              </label>
              <select
                id="to-unit"
                value={toUnit}
                onChange={(e) => setToUnit(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-[#EFF5F4] border border-[#8FB5AE]/40 text-sm text-[#1D3532]"
              >
                {categoryDef.units.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.label} ({u.symbol})
                  </option>
                ))}
              </select>
            </div>
          </div>
        </aside>

        {/* CENTER PANEL */}
        <section className="xl:col-span-6 bg-white rounded-2xl p-6 shadow-sm border border-[#8FB5AE]/25 flex flex-col gap-5">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-display text-lg font-bold text-[#1D3532]">
                Tabel Kesetaraan Satuan {categoryDef.label}
              </h3>
              <p className="text-xs text-[#4F6A66]">
                Semua hasil dikonversi melalui basis SI ({categoryDef.baseUnit}).
              </p>
            </div>
          </div>

          <div className="bg-[#EFF5F4] rounded-2xl p-5 flex flex-col sm:flex-row items-center justify-between gap-4 border border-[#8FB5AE]/30">
            <div>
              <span className="text-xs text-[#4F6A66] block">Nilai Asal</span>
              <span className="font-mono-tabular text-2xl font-bold text-[#1D3532]">
                {safeConvInput}{' '}
                <span className="text-sm font-medium text-[#4F6A66]">
                  {categoryDef.units.find((u) => u.id === fromUnit)?.symbol}
                </span>
              </span>
            </div>
            <ArrowRightLeft className="w-6 h-6 text-[#E26D62] shrink-0" />
            <div className="sm:text-right">
              <span className="text-xs text-[#4F6A66] block">Hasil Konversi</span>
              <span className="font-mono-tabular text-2xl font-bold text-[#E26D62]">
                {formatConvNum(convertedValue)}{' '}
                <span className="text-sm font-medium text-[#1D3532]">
                  {categoryDef.units.find((u) => u.id === toUnit)?.symbol}
                </span>
              </span>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="bg-[#EFF5F4] text-[#1D3532]">
                  <th className="py-2.5 px-3 rounded-l-lg font-semibold">Nama Satuan</th>
                  <th className="py-2.5 px-3 font-semibold">Simbol</th>
                  <th className="py-2.5 px-3 rounded-r-lg font-semibold text-right">Nilai Setara</th>
                </tr>
              </thead>
              <tbody>
                {allUnitsTable.map((row) => (
                  <tr key={row.simbol} className="border-b border-[#CBE2DD]/60">
                    <td className="py-2.5 px-3 text-[#1D3532]">{row.satuan}</td>
                    <td className="py-2.5 px-3 font-mono-tabular text-[#4F6A66]">{row.simbol}</td>
                    <td className="py-2.5 px-3 font-mono-tabular font-semibold text-[#1D3532] text-right">
                      {formatConvNum(row.nilai)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* RIGHT PANEL */}
        <aside className="xl:col-span-3 bg-white rounded-2xl p-5 shadow-sm border border-[#8FB5AE]/25 flex flex-col gap-4">
          <h3 className="font-display text-lg font-bold text-[#1D3532]">Ringkasan Konversi</h3>
          <div className="bg-[#EFF5F4] rounded-xl p-4">
            <p className="text-xs text-[#4F6A66]">Hasil Utama</p>
            <p className="font-mono-tabular text-2xl font-bold text-[#E26D62] mt-1">
              {formatConvNum(convertedValue)}{' '}
              <span className="text-sm text-[#1D3532]">
                {categoryDef.units.find((u) => u.id === toUnit)?.symbol}
              </span>
            </p>
          </div>
          <div className="bg-[#EFF5F4] rounded-xl p-4 text-xs text-[#4F6A66] leading-relaxed">
            <p className="font-semibold text-[#1D3532] mb-1">Penjelasan Ilmiah</p>
            <p>
              Standar Satuan Internasional (SI) menjaga konsistensi perhitungan fisika di seluruh dunia. Untuk suhu, konversi melibatkan pergeseran titik nol mutlak (273,15 K) dan faktor skala.
            </p>
          </div>
        </aside>
      </div>
    );
  }

  if (simId === 'dimensi') {
    const userDimLatex = `\\text{M}^{${expM}} \\text{L}^{${expL}} \\text{T}^{${expT}}`;
    const targetDimLatex = `\\text{M}^{${targetDerived.m}} \\text{L}^{${targetDerived.l}} \\text{T}^{${targetDerived.t}}`;

    return (
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-5 items-start">
        <aside className="xl:col-span-3 bg-white rounded-2xl p-5 shadow-sm border border-[#8FB5AE]/25 flex flex-col gap-4">
          <div>
            <p className="text-xs font-medium text-[#4F6A66]">Modul 01 · Analisis Dimensi</p>
            <h2 className="font-display text-xl font-bold text-[#1D3532] mt-0.5">
              Besaran & Dimensi SI
            </h2>
          </div>

          <div>
            <label htmlFor="derived-select" className="block text-xs font-semibold text-[#1D3532] mb-1.5">
              Uji Besaran Turunan
            </label>
            <select
              id="derived-select"
              value={selectedDerivedIdx}
              onChange={(e) => setSelectedDerivedIdx(Number(e.target.value))}
              className="w-full px-3 py-2 rounded-xl bg-[#EFF5F4] border border-[#8FB5AE]/40 text-sm text-[#1D3532]"
            >
              {BESARAN_TURUNAN.map((b, idx) => (
                <option key={b.nama} value={idx}>
                  {b.nama} ({b.rumus})
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-3 pt-1">
            <div>
              <div className="flex justify-between text-xs font-medium text-[#1D3532] mb-1">
                <span>Eksponen Massa [M]</span>
                <span className="font-mono-tabular font-bold">{expM}</span>
              </div>
              <input
                type="range"
                min={-3}
                max={3}
                step={1}
                value={expM}
                onChange={(e) => setExpM(Number(e.target.value))}
                className="w-full physilab-slider"
              />
            </div>
            <div>
              <div className="flex justify-between text-xs font-medium text-[#1D3532] mb-1">
                <span>Eksponen Panjang [L]</span>
                <span className="font-mono-tabular font-bold">{expL}</span>
              </div>
              <input
                type="range"
                min={-3}
                max={3}
                step={1}
                value={expL}
                onChange={(e) => setExpL(Number(e.target.value))}
                className="w-full physilab-slider"
              />
            </div>
            <div>
              <div className="flex justify-between text-xs font-medium text-[#1D3532] mb-1">
                <span>Eksponen Waktu [T]</span>
                <span className="font-mono-tabular font-bold">{expT}</span>
              </div>
              <input
                type="range"
                min={-3}
                max={3}
                step={1}
                value={expT}
                onChange={(e) => setExpT(Number(e.target.value))}
                className="w-full physilab-slider"
              />
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              setExpM(targetDerived.m);
              setExpL(targetDerived.l);
              setExpT(targetDerived.t);
            }}
            className="w-full py-2 px-3 rounded-xl bg-[#CBE2DD] text-[#1D3532] text-xs font-semibold hover:bg-[#8FB5AE]/50 cursor-pointer"
          >
            Cocokkan Otomatis Dimensi
          </button>
        </aside>

        <section className="xl:col-span-6 bg-white rounded-2xl p-6 shadow-sm border border-[#8FB5AE]/25 flex flex-col gap-5">
          <div>
            <h3 className="font-display text-lg font-bold text-[#1D3532]">
              Laboratorium Verifikasi Dimensi
            </h3>
            <p className="text-xs text-[#4F6A66]">
              Susun pangkat dimensi massa [M], panjang [L], dan waktu [T] agar sesuai dengan {targetDerived.nama}.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="bg-[#EFF5F4] rounded-2xl p-4">
              <span className="text-xs text-[#4F6A66]">Dimensi Susunan Anda</span>
              <div className="mt-2 text-lg text-[#1D3532]">
                <MathDisplay latex={userDimLatex} block />
              </div>
            </div>
            <div className="bg-[#EFF5F4] rounded-2xl p-4">
              <span className="text-xs text-[#4F6A66]">Dimensi Target ({targetDerived.nama})</span>
              <div className="mt-2 text-lg text-[#1D3532]">
                <MathDisplay latex={targetDimLatex} block />
              </div>
            </div>
          </div>

          <div
            className={`p-4 rounded-xl text-sm font-medium ${
              isDimensionMatch
                ? 'bg-[#CBE2DD]/60 text-[#1D3532]'
                : 'bg-[#E26D62]/15 text-[#1D3532]'
            }`}
          >
            {isDimensionMatch
              ? `Sesuai! Dimensi ${targetDerived.nama} (${targetDerived.rumus}) tepat memiliki dimensi ${targetDerived.dimensi} dan satuan ${targetDerived.satuan}.`
              : `Belum cocok. Sesuaikan pangkat [M], [L], dan [T] agar sama dengan ${targetDerived.dimensi}.`}
          </div>

          <div>
            <h4 className="font-display text-sm font-bold text-[#1D3532] mb-2">
              7 Besaran Pokok Satuan Internasional (SI)
            </h4>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-[#EFF5F4] text-[#1D3532]">
                    <th className="py-2 px-3 rounded-l-lg">Besaran Pokok</th>
                    <th className="py-2 px-3">Satuan SI</th>
                    <th className="py-2 px-3">Dimensi</th>
                    <th className="py-2 px-3 rounded-r-lg">Alat Ukur</th>
                  </tr>
                </thead>
                <tbody>
                  {BESARAN_POKOK.map((bp) => (
                    <tr key={bp.nama} className="border-b border-[#CBE2DD]/60">
                      <td className="py-2 px-3 font-semibold text-[#1D3532]">{bp.nama}</td>
                      <td className="py-2 px-3 font-mono-tabular text-[#4F6A66]">
                        {bp.satuan} ({bp.simbol})
                      </td>
                      <td className="py-2 px-3 font-mono-tabular font-bold text-[#E26D62]">{bp.dimensi}</td>
                      <td className="py-2 px-3 text-[#4F6A66]">{bp.alat}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        <aside className="xl:col-span-3 bg-white rounded-2xl p-5 shadow-sm border border-[#8FB5AE]/25 flex flex-col gap-4">
          <h3 className="font-display text-lg font-bold text-[#1D3532]">Detail Besaran Terpilih</h3>
          <div className="bg-[#EFF5F4] rounded-xl p-4 space-y-2 text-xs">
            <div>
              <span className="text-[#4F6A66]">Nama Besaran:</span>
              <p className="font-semibold text-sm text-[#1D3532]">{targetDerived.nama}</p>
            </div>
            <div>
              <span className="text-[#4F6A66]">Definisi Matematis:</span>
              <p className="font-mono-tabular font-semibold text-[#1D3532]">{targetDerived.rumus}</p>
            </div>
            <div>
              <span className="text-[#4F6A66]">Satuan SI:</span>
              <p className="font-mono-tabular font-semibold text-[#E26D62]">{targetDerived.satuan}</p>
            </div>
          </div>
          <div className="bg-[#EFF5F4] rounded-xl p-4 text-xs text-[#4F6A66] leading-relaxed">
            <p className="font-semibold text-[#1D3532] mb-1">Mengapa Analisis Dimensi Penting?</p>
            <p>
              Analisis dimensi memastikan setiap persamaan fisika konsisten secara fisis: ruas kiri dan ruas kanan suatu persamaan harus selalu memiliki dimensi yang identik.
            </p>
          </div>
        </aside>
      </div>
    );
  }

  // Default: 'pengukuran' Simulator Pengukuran (Mistar Digital, Neraca Digital, Stopwatch)
  const selectedMat = SAMPLE_MATERIALS[selectedMaterialIdx];
  const volumeCm3 = (objectLengthCm * 4 * 3); // Balok 4cm x 3cm x L
  const computedDensity = (massGrams / 1000) / (volumeCm3 * 1e-6);

  const lapChartData = swLaps.map((lapMs, idx) => ({
    putaran: `Lap ${idx + 1}`,
    detik: Number((lapMs / 1000).toFixed(2)),
  }));

  return (
    <div className="grid grid-cols-1 xl:grid-cols-12 gap-5 items-start">
      {/* LEFT PANEL */}
      <aside className="xl:col-span-3 bg-white rounded-2xl p-5 shadow-sm border border-[#8FB5AE]/25 flex flex-col gap-4">
        <div>
          <p className="text-xs font-medium text-[#4F6A66]">Modul 01 · Pengukuran</p>
          <h2 className="font-display text-xl font-bold text-[#1D3532] mt-0.5">
            Simulator Alat Ukur Lab
          </h2>
        </div>

        <div className="grid grid-cols-3 gap-1.5 bg-[#EFF5F4] p-1 rounded-xl">
          {[
            { id: 'mistar', label: 'Mistar' },
            { id: 'neraca', label: 'Neraca' },
            { id: 'stopwatch', label: 'Stopwatch' },
          ].map((inst) => (
            <button
              key={inst.id}
              type="button"
              onClick={() => setActiveInstrument(inst.id as 'mistar' | 'neraca' | 'stopwatch')}
              className={`py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                activeInstrument === inst.id
                  ? 'bg-white text-[#1D3532] shadow-sm'
                  : 'text-[#4F6A66] hover:text-[#1D3532]'
              }`}
            >
              {inst.label}
            </button>
          ))}
        </div>

        {activeInstrument === 'mistar' && (
          <div className="space-y-4">
            <div className="bg-[#EFF5F4] rounded-xl p-3">
              <p className="text-xs text-[#4F6A66] mb-1">Ketelitian Mistar</p>
              <MathDisplay latex="\Delta x = \frac{1}{2} \times 1\text{ mm} = 0.05\text{ cm}" block />
            </div>
            <div>
              <div className="flex justify-between text-xs font-semibold text-[#1D3532] mb-1">
                <span>Panjang Benda Uji</span>
                <span className="font-mono-tabular text-[#E26D62]">{objectLengthCm.toFixed(1)} cm</span>
              </div>
              <input
                type="range"
                min={1}
                max={20}
                step={0.1}
                value={objectLengthCm}
                onChange={(e) => setObjectLengthCm(Number(e.target.value))}
                className="w-full physilab-slider"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#1D3532] mb-1">
                Satuan Tampilan
              </label>
              <div className="grid grid-cols-3 gap-1.5">
                {(['cm', 'mm', 'm'] as const).map((u) => (
                  <button
                    key={u}
                    type="button"
                    onClick={() => setRulerUnit(u)}
                    className={`py-1.5 rounded-lg text-xs font-mono-tabular font-semibold cursor-pointer ${
                      rulerUnit === u ? 'bg-[#1D3532] text-white' : 'bg-[#EFF5F4] text-[#4F6A66]'
                    }`}
                  >
                    {u}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeInstrument === 'neraca' && (
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-[#1D3532] mb-1.5">
                Pilih Benda Uji
              </label>
              <div className="flex flex-col gap-1.5">
                {SAMPLE_MATERIALS.map((mat, idx) => (
                  <button
                    key={mat.name}
                    type="button"
                    onClick={() => {
                      setSelectedMaterialIdx(idx);
                      setMassGrams(mat.defaultMassG);
                    }}
                    className={`px-3 py-2 rounded-xl text-left text-xs font-medium transition-colors cursor-pointer ${
                      selectedMaterialIdx === idx
                        ? 'bg-[#1D3532] text-white'
                        : 'bg-[#EFF5F4] text-[#1D3532] hover:bg-[#CBE2DD]'
                    }`}
                  >
                    {mat.name}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <div className="flex justify-between text-xs font-semibold text-[#1D3532] mb-1">
                <span>Massa Tambahan</span>
                <span className="font-mono-tabular text-[#E26D62]">{massGrams.toFixed(1)} g</span>
              </div>
              <input
                type="range"
                min={10}
                max={2000}
                step={0.5}
                value={massGrams}
                onChange={(e) => setMassGrams(Number(e.target.value))}
                className="w-full physilab-slider"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#1D3532] mb-1">
                Satuan Neraca
              </label>
              <div className="grid grid-cols-3 gap-1.5">
                {(['g', 'kg', 'mg'] as const).map((u) => (
                  <button
                    key={u}
                    type="button"
                    onClick={() => setMassUnit(u)}
                    className={`py-1.5 rounded-lg text-xs font-mono-tabular font-semibold cursor-pointer ${
                      massUnit === u ? 'bg-[#1D3532] text-white' : 'bg-[#EFF5F4] text-[#4F6A66]'
                    }`}
                  >
                    {u}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeInstrument === 'stopwatch' && (
          <div className="space-y-4">
            <div className="bg-[#EFF5F4] rounded-xl p-3">
              <p className="text-xs text-[#4F6A66] mb-1">Pengukuran Selang Waktu</p>
              <MathDisplay latex="\Delta t = t_{\text{akhir}} - t_{\text{awal}}" block />
            </div>
            <p className="text-xs text-[#4F6A66] leading-relaxed">
              Gunakan tombol Mulai, Jeda, Catat Lap, dan Reset pada kanvas tengah untuk mengukur waktu reaksi atau periode ayunan eksperimen Anda.
            </p>
          </div>
        )}
      </aside>

      {/* CENTER PANEL */}
      <section className="xl:col-span-6 bg-white rounded-2xl p-6 shadow-sm border border-[#8FB5AE]/25 flex flex-col gap-5">
        <div className="flex items-center justify-between">
          <h3 className="font-display text-lg font-bold text-[#1D3532]">
            {activeInstrument === 'mistar' && 'Mistar Digital Presisi (0 – 20 cm)'}
            {activeInstrument === 'neraca' && 'Neraca Digital Laboratorium'}
            {activeInstrument === 'stopwatch' && 'Stopwatch Digital Presisi'}
          </h3>
          <span className="text-xs font-mono-tabular text-[#4F6A66]">
            Standar Kalibrasi SI
          </span>
        </div>

        {/* Interactive Stage */}
        <div className="bg-[#EFF5F4] rounded-2xl p-6 min-h-[340px] flex flex-col items-center justify-center border border-[#8FB5AE]/30">
          {activeInstrument === 'mistar' && (
            <div className="w-full max-w-xl space-y-6">
              {/* Digital Readout */}
              <div className="bg-[#1D3532] text-[#EFF5F4] rounded-xl p-4 flex items-center justify-between">
                <span className="text-xs uppercase tracking-wider text-[#95B3A6]">
                  Pembacaan Mistar Digital
                </span>
                <span className="font-mono-tabular text-3xl font-bold text-[#EFF5F4]">
                  {rulerUnit === 'm'
                    ? displayedLength.toFixed(4)
                    : rulerUnit === 'mm'
                    ? displayedLength.toFixed(1)
                    : displayedLength.toFixed(2)}{' '}
                  <span className="text-base text-[#E26D62]">{rulerUnit}</span>
                </span>
              </div>

              {/* Visual Object + Interactive Draggable SVG Ruler */}
              <div className="bg-white rounded-xl p-4 border border-[#8FB5AE]/30 overflow-x-auto">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[11px] text-[#4F6A66]">
                    Klik atau seret langsung pada mistar untuk mengatur panjang benda
                  </span>
                  <div className="flex gap-1">
                    {[5, 10, 15].map((cm) => (
                      <button
                        key={cm}
                        type="button"
                        onClick={() => setObjectLengthCm(cm)}
                        className="px-2 py-0.5 rounded bg-[#EFF5F4] hover:bg-[#CBE2DD] text-[10px] font-mono-tabular font-semibold text-[#1D3532] cursor-pointer"
                      >
                        {cm} cm
                      </button>
                    ))}
                  </div>
                </div>
                <svg
                  ref={rulerSvgRef}
                  viewBox="0 0 640 160"
                  className="w-full min-w-[460px] h-auto cursor-ew-resize select-none touch-none"
                  onPointerDown={(e) => {
                    setIsDraggingRuler(true);
                    updateLengthFromPointer(e.clientX);
                  }}
                  onPointerMove={(e) => {
                    if (isDraggingRuler) updateLengthFromPointer(e.clientX);
                  }}
                  onPointerUp={() => setIsDraggingRuler(false)}
                  onPointerLeave={() => setIsDraggingRuler(false)}
                >
                  {/* Object being measured */}
                  <rect
                    x="20"
                    y="22"
                    width={objectLengthCm * 28}
                    height="46"
                    rx="6"
                    fill="#E26D62"
                    opacity="0.88"
                  />
                  <text
                    x={20 + (objectLengthCm * 28) / 2}
                    y="49"
                    textAnchor="middle"
                    fill="#FFFFFF"
                    fontSize="12"
                    fontFamily="JetBrains Mono"
                    fontWeight="bold"
                  >
                    {objectLengthCm.toFixed(1)} cm
                  </text>

                  {/* Guide dashed line */}
                  <line
                    x1={20 + objectLengthCm * 28}
                    y1="20"
                    x2={20 + objectLengthCm * 28}
                    y2="130"
                    stroke="#1D3532"
                    strokeWidth="1.5"
                    strokeDasharray="4 3"
                  />

                  {/* Ruler body */}
                  <rect x="10" y="78" width="600" height="58" rx="6" fill="#CBE2DD" stroke="#4F6A66" strokeWidth="1.5" />

                  {/* Ticks 0..20 cm */}
                  {Array.from({ length: 201 }).map((_, mmIdx) => {
                    const xPos = 20 + mmIdx * 2.8;
                    const isCm = mmIdx % 10 === 0;
                    const isHalf = mmIdx % 5 === 0 && !isCm;
                    const tickH = isCm ? 22 : isHalf ? 15 : 9;
                    return (
                      <g key={mmIdx}>
                        <line
                          x1={xPos}
                          y1="78"
                          x2={xPos}
                          y2={78 + tickH}
                          stroke="#1D3532"
                          strokeWidth={isCm ? 1.5 : 0.8}
                        />
                        {isCm && (
                          <text
                            x={xPos}
                            y="118"
                            textAnchor="middle"
                            fill="#1D3532"
                            fontSize="11"
                            fontFamily="JetBrains Mono"
                          >
                            {mmIdx / 10}
                          </text>
                        )}
                      </g>
                    );
                  })}
                </svg>
              </div>
            </div>
          )}

          {activeInstrument === 'neraca' && (
            <div className="w-full max-w-md flex flex-col items-center gap-5">
              {/* Sample Block on Pan */}
              <div className="flex flex-col items-center">
                <div
                  className="rounded-xl shadow-md flex items-center justify-center text-white font-semibold text-xs px-4 py-6 transition-all"
                  style={{
                    backgroundColor: selectedMat.color,
                    width: `${Math.min(190, 90 + massGrams * 0.06)}px`,
                    height: `${Math.min(110, 56 + massGrams * 0.03)}px`,
                  }}
                >
                  {selectedMat.name}
                </div>
                <div className="w-56 h-3 bg-[#8FB5AE] rounded-t-lg mt-1" />
                <div className="w-24 h-3 bg-[#4F6A66]" />
              </div>

              {/* Digital Scale Base */}
              <div className="w-full bg-[#1D3532] rounded-2xl p-5 shadow-md text-[#EFF5F4]">
                <div className="flex items-center justify-between text-xs text-[#95B3A6] mb-2">
                  <span>NERACA ANALITIK DIGITAL</span>
                  <span>STABIL</span>
                </div>
                <div className="bg-[#0F1F1D] rounded-xl p-4 text-right font-mono-tabular text-3xl font-bold text-[#CBE2DD]">
                  {massUnit === 'kg'
                    ? displayedMass.toFixed(4)
                    : massUnit === 'mg'
                    ? displayedMass.toFixed(0)
                    : displayedMass.toFixed(2)}{' '}
                  <span className="text-base text-[#E26D62]">{massUnit}</span>
                </div>
              </div>
            </div>
          )}

          {activeInstrument === 'stopwatch' && (
            <div className="w-full max-w-md flex flex-col items-center gap-5">
              <div className="w-full bg-[#1D3532] rounded-2xl p-6 text-center shadow-md">
                <p className="text-xs text-[#95B3A6] uppercase tracking-wider mb-2">
                  Timer Kronometer Digital
                </p>
                <p className="font-mono-tabular text-5xl font-bold text-[#EFF5F4]">
                  {formatStopwatch(swElapsedMs)}
                </p>
              </div>

              <div className="flex flex-wrap items-center justify-center gap-3">
                <button
                  type="button"
                  onClick={() => setSwRunning((r) => !r)}
                  className="px-5 py-2.5 rounded-xl bg-[#E26D62] hover:bg-[#cf5e53] text-white text-sm font-semibold flex items-center gap-2 cursor-pointer"
                >
                  {swRunning ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                  {swRunning ? 'Jeda' : swElapsedMs > 0 ? 'Lanjutkan' : 'Mulai'}
                </button>
                <button
                  type="button"
                  onClick={() => setSwLaps((prev) => [...prev, swElapsedMs])}
                  disabled={swElapsedMs === 0}
                  className="px-4 py-2.5 rounded-xl bg-[#CBE2DD] text-[#1D3532] text-sm font-semibold flex items-center gap-2 disabled:opacity-40 cursor-pointer"
                >
                  <Flag className="w-4 h-4" />
                  Catat Lap
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setSwRunning(false);
                    setSwElapsedMs(0);
                    setSwLaps([]);
                  }}
                  className="px-4 py-2.5 rounded-xl bg-white border border-[#8FB5AE]/40 text-[#1D3532] text-sm font-semibold flex items-center gap-2 cursor-pointer"
                >
                  <RotateCcw className="w-4 h-4" />
                  Reset
                </button>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* RIGHT PANEL */}
      <aside className="xl:col-span-3 bg-white rounded-2xl p-5 shadow-sm border border-[#8FB5AE]/25 flex flex-col gap-4">
        <h3 className="font-display text-lg font-bold text-[#1D3532]">Hasil Pengukuran</h3>

        <div className="grid grid-cols-1 gap-2.5">
          <div className="bg-[#EFF5F4] rounded-xl p-3.5">
            <span className="text-xs text-[#4F6A66]">Panjang Terukur</span>
            <p className="font-mono-tabular text-xl font-bold text-[#1D3532] mt-0.5">
              {objectLengthCm.toFixed(2)} ± 0.05 cm
            </p>
            <span className="text-xs font-mono-tabular text-[#4F6A66]">
              = {(objectLengthCm / 100).toFixed(4)} m
            </span>
          </div>

          <div className="bg-[#EFF5F4] rounded-xl p-3.5">
            <span className="text-xs text-[#4F6A66]">Massa Terukur</span>
            <p className="font-mono-tabular text-xl font-bold text-[#E26D62] mt-0.5">
              {massGrams.toFixed(1)} g
            </p>
            <span className="text-xs font-mono-tabular text-[#4F6A66]">
              = {(massGrams / 1000).toFixed(4)} kg
            </span>
          </div>

          <div className="bg-[#EFF5F4] rounded-xl p-3.5">
            <span className="text-xs text-[#4F6A66]">Estimasi Massa Jenis Balok</span>
            <p className="font-mono-tabular text-lg font-bold text-[#1D3532] mt-0.5">
              {computedDensity.toFixed(1)} kg/m³
            </p>
          </div>
        </div>

        {activeInstrument === 'stopwatch' && lapChartData.length > 0 && (
          <div className="space-y-3">
            <div className="h-36 w-full">
              <p className="text-xs font-semibold text-[#1D3532] mb-1">Grafik Catatan Waktu Lap</p>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={lapChartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#CBE2DD" />
                  <XAxis dataKey="putaran" tick={{ fontSize: 10, fill: '#4F6A66' }} />
                  <YAxis tick={{ fontSize: 10, fill: '#4F6A66' }} unit=" s" />
                  <Tooltip />
                  <Bar dataKey="detik" fill="#E26D62" radius={[4, 4, 0, 0]} name="Waktu (s)" />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="max-h-32 overflow-y-auto bg-[#EFF5F4] rounded-xl p-2.5 text-xs">
              <table className="w-full text-left font-mono-tabular">
                <thead>
                  <tr className="text-[#4F6A66] border-b border-[#CBE2DD]">
                    <th className="py-1">Lap</th>
                    <th className="py-1">Selang (Δt)</th>
                    <th className="py-1 text-right">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {swLaps.map((lapMs, idx) => {
                    const splitMs = idx === 0 ? lapMs : lapMs - swLaps[idx - 1];
                    return (
                      <tr key={idx} className="border-b border-[#CBE2DD]/40">
                        <td className="py-1 text-[#1D3532]">#{idx + 1}</td>
                        <td className="py-1 text-[#4F6A66]">+{(splitMs / 1000).toFixed(2)}s</td>
                        <td className="py-1 text-right font-semibold text-[#E26D62]">
                          {formatStopwatch(lapMs)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        <div className="bg-[#EFF5F4] rounded-xl p-3.5 text-xs text-[#4F6A66] leading-relaxed">
          <p className="font-semibold text-[#1D3532] mb-1">Catatan Ketelitian</p>
          <p>
            Setiap alat ukur memiliki batas ketidakpastian. Pada mistar berskala 1 mm, ketidakpastian pengukuran tunggal adalah setengah skala terkecil (±0,05 cm).
          </p>
        </div>
      </aside>
    </div>
  );
};
