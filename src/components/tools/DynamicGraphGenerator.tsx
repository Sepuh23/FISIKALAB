import React, { useMemo, useRef, useState } from 'react';
import { Download, RefreshCw, Image as ImageIcon } from 'lucide-react';
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
import { GRAPH_PRESETS, MODULES, exportDataToCsv } from '../../engine/physicsEngine';
import { MathDisplay } from '../MathDisplay';

export const DynamicGraphGenerator: React.FC = () => {
  const [selectedPresetId, setSelectedPresetId] = useState<string>(GRAPH_PRESETS[0].id);

  const preset = useMemo(
    () => GRAPH_PRESETS.find((g) => g.id === selectedPresetId) || GRAPH_PRESETS[0],
    [selectedPresetId]
  );

  const [xMin, setXMin] = useState<number>(preset.xMin);
  const [xMax, setXMax] = useState<number>(preset.xMax);
  const [stepSize, setStepSize] = useState<number>(preset.step);
  const [swapAxes, setSwapAxes] = useState<boolean>(false);
  const [params, setParams] = useState<Record<string, number>>(preset.fixedParams);
  const [renderSeed, setRenderSeed] = useState<number>(0);

  const chartWrapperRef = useRef<HTMLDivElement | null>(null);

  const handleSelectPreset = (id: string) => {
    const found = GRAPH_PRESETS.find((g) => g.id === id);
    if (!found) return;
    setSelectedPresetId(found.id);
    setXMin(found.xMin);
    setXMax(found.xMax);
    setStepSize(found.step);
    setParams({ ...found.fixedParams });
    setSwapAxes(false);
  };

  const chartPoints = useMemo(() => {
    const safeStep = Math.max(0.05, stepSize);
    const safeMax = Math.max(xMin + safeStep, xMax);
    const pts: { x: number; y: number }[] = [];
    const maxCount = 250;
    let count = 0;

    for (let x = xMin; x <= safeMax + 1e-9 && count < maxCount; x += safeStep) {
      const y = preset.computeY(x, params);
      if (Number.isFinite(y)) {
        pts.push({
          x: Number(x.toFixed(3)),
          y: Number(y.toFixed(3)),
        });
      }
      count++;
    }
    return pts;
  }, [preset, xMin, xMax, stepSize, params, renderSeed]);

  const xAxisTitle = swapAxes ? preset.yKey : preset.xKey;
  const yAxisTitle = swapAxes ? preset.xKey : preset.yKey;
  const xDataKey = swapAxes ? 'y' : 'x';
  const yDataKey = swapAxes ? 'x' : 'y';

  const handleDownloadPng = () => {
    const container = chartWrapperRef.current;
    if (!container) return;
    const svg = container.querySelector('svg');
    if (!svg) return;

    const serializer = new XMLSerializer();
    const svgStr = serializer.serializeToString(svg);
    const svgBlob = new Blob([svgStr], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(svgBlob);

    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = svg.clientWidth * 2 || 1200;
      canvas.height = svg.clientHeight * 2 || 700;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        const pngUrl = canvas.toDataURL('image/png');
        const link = document.createElement('a');
        link.href = pngUrl;
        link.download = `physilab_grafik_${preset.id}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
      URL.revokeObjectURL(url);
    };
    img.src = url;
  };

  return (
    <div className="grid grid-cols-1 xl:grid-cols-12 gap-5 items-start">
      {/* LEFT: Graph Configuration */}
      <aside className="xl:col-span-4 bg-white rounded-2xl p-5 shadow-sm border border-[#8FB5AE]/25 flex flex-col gap-4">
        <div>
          <h2 className="font-display text-lg font-bold text-[#1D3532]">
            Generator Grafik Dinamis
          </h2>
          <p className="text-xs text-[#4F6A66]">
            Pilih grafik standar per modul, ubah rentang sumbu, dan ekspor ke PNG atau CSV.
          </p>
        </div>

        <div>
          <label htmlFor="graph-preset-select" className="block text-xs font-semibold text-[#1D3532] mb-1.5">
            Pilih Grafik Fisika
          </label>
          <select
            id="graph-preset-select"
            value={selectedPresetId}
            onChange={(e) => handleSelectPreset(e.target.value)}
            className="w-full px-3 py-2.5 rounded-xl bg-[#EFF5F4] border border-[#8FB5AE]/40 text-sm font-medium text-[#1D3532]"
          >
            {MODULES.filter((m) => m.id !== 'besaran').map((mod) => (
              <optgroup key={mod.id} label={`Modul ${mod.number} — ${mod.shortTitle}`}>
                {GRAPH_PRESETS.filter((g) => g.moduleId === mod.id).map((g) => (
                  <option key={g.id} value={g.id}>
                    {g.title}
                  </option>
                ))}
              </optgroup>
            ))}
          </select>
        </div>

        <div className="bg-[#EFF5F4] rounded-xl p-3">
          <MathDisplay latex={preset.formulaLatex} block />
        </div>

        {/* Axis Swap / Selection */}
        <div className="bg-[#EFF5F4]/80 rounded-xl p-3 space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-[#1D3532]">Sumbu X:</span>
            <span className="font-mono-tabular text-[#4F6A66]">{xAxisTitle}</span>
          </div>
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-[#1D3532]">Sumbu Y:</span>
            <span className="font-mono-tabular text-[#E26D62]">{yAxisTitle}</span>
          </div>
          <button
            type="button"
            onClick={() => setSwapAxes((s) => !s)}
            className="w-full mt-1 py-1.5 rounded-lg bg-white border border-[#8FB5AE]/40 text-xs font-semibold text-[#1D3532] hover:bg-[#CBE2DD]/40 cursor-pointer"
          >
            Tukar Variabel Sumbu X ↔ Y
          </button>
        </div>

        {/* Range & Step */}
        <div className="grid grid-cols-3 gap-2">
          <div>
            <label className="block text-[11px] font-semibold text-[#1D3532] mb-1">Min X</label>
            <input
              type="number"
              value={xMin}
              onChange={(e) => setXMin(Number(e.target.value))}
              className="w-full px-2.5 py-1.5 rounded-lg bg-[#EFF5F4] font-mono-tabular text-xs text-[#1D3532]"
            />
          </div>
          <div>
            <label className="block text-[11px] font-semibold text-[#1D3532] mb-1">Maks X</label>
            <input
              type="number"
              value={xMax}
              onChange={(e) => setXMax(Number(e.target.value))}
              className="w-full px-2.5 py-1.5 rounded-lg bg-[#EFF5F4] font-mono-tabular text-xs text-[#1D3532]"
            />
          </div>
          <div>
            <label className="block text-[11px] font-semibold text-[#1D3532] mb-1">Step</label>
            <input
              type="number"
              min={0.05}
              step={0.1}
              value={stepSize}
              onChange={(e) => setStepSize(Number(e.target.value))}
              className="w-full px-2.5 py-1.5 rounded-lg bg-[#EFF5F4] font-mono-tabular text-xs text-[#1D3532]"
            />
          </div>
        </div>

        {/* Parameter Sliders */}
        <div className="space-y-3 pt-1">
          <p className="text-xs font-semibold text-[#1D3532]">Parameter Tetap</p>
          {Object.entries(preset.paramLabels).map(([key, meta]) => (
            <div key={key}>
              <div className="flex justify-between text-xs text-[#1D3532] mb-1">
                <span>{meta.label}</span>
                <span className="font-mono-tabular font-semibold text-[#E26D62]">
                  {params[key]} {meta.unit}
                </span>
              </div>
              <input
                type="range"
                min={meta.min}
                max={meta.max}
                step={meta.step}
                value={params[key] ?? 0}
                onChange={(e) =>
                  setParams((prev) => ({ ...prev, [key]: Number(e.target.value) }))
                }
                className="w-full physilab-slider"
              />
            </div>
          ))}
        </div>

        <button
          type="button"
          onClick={() => setRenderSeed((s) => s + 1)}
          className="w-full py-2.5 rounded-xl bg-[#E26D62] text-white text-xs font-semibold flex items-center justify-center gap-1.5 hover:bg-[#cf5e53] cursor-pointer"
        >
          <RefreshCw className="w-4 h-4" />
          Buat Ulang Grafik
        </button>
      </aside>

      {/* RIGHT: Recharts Graph Stage & Data Table */}
      <section className="xl:col-span-8 bg-white rounded-2xl p-6 shadow-sm border border-[#8FB5AE]/25 flex flex-col gap-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="font-display text-xl font-bold text-[#1D3532]">{preset.title}</h3>
            <p className="text-xs text-[#4F6A66]">{preset.explanation}</p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleDownloadPng}
              className="px-3.5 py-2 rounded-xl bg-[#EFF5F4] hover:bg-[#CBE2DD] text-[#1D3532] text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
            >
              <ImageIcon className="w-4 h-4" />
              Unduh PNG
            </button>
            <button
              type="button"
              onClick={() =>
                exportDataToCsv(
                  `physilab_grafik_${preset.id}.csv`,
                  [xAxisTitle, yAxisTitle],
                  chartPoints.map((p) => [p[xDataKey], p[yDataKey]])
                )
              }
              className="px-3.5 py-2 rounded-xl bg-[#1D3532] text-white text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
            >
              <Download className="w-4 h-4" />
              Unduh CSV
            </button>
          </div>
        </div>

        <div
          ref={chartWrapperRef}
          className="w-full h-[380px] bg-[#EFF5F4]/60 rounded-2xl p-4 border border-[#8FB5AE]/30"
        >
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartPoints} margin={{ top: 10, right: 20, left: 10, bottom: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#CBE2DD" />
              <XAxis
                dataKey={xDataKey}
                type="number"
                domain={['auto', 'auto']}
                tick={{ fontSize: 11, fill: '#4F6A66' }}
                label={{ value: xAxisTitle, position: 'insideBottom', offset: -10, fontSize: 12, fill: '#1D3532' }}
              />
              <YAxis
                tick={{ fontSize: 11, fill: '#4F6A66' }}
                label={{ value: yAxisTitle, angle: -90, position: 'insideLeft', fontSize: 12, fill: '#1D3532' }}
              />
              <Tooltip />
              <Legend verticalAlign="top" height={32} />
              <Line
                type="monotone"
                dataKey={yDataKey}
                name={yAxisTitle}
                stroke="#E26D62"
                strokeWidth={3}
                dot={{ r: 2.5, fill: '#1D3532' }}
                activeDot={{ r: 5 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Sample Data Table */}
        <div className="overflow-x-auto max-h-56">
          <table className="w-full text-left border-collapse text-xs">
            <thead className="sticky top-0 bg-[#EFF5F4] text-[#1D3532]">
              <tr>
                <th className="py-2 px-3 rounded-l-lg">Titik #</th>
                <th className="py-2 px-3">{xAxisTitle}</th>
                <th className="py-2 px-3 rounded-r-lg">{yAxisTitle}</th>
              </tr>
            </thead>
            <tbody>
              {chartPoints.slice(0, 25).map((pt, i) => (
                <tr key={i} className="border-b border-[#CBE2DD]/50 font-mono-tabular">
                  <td className="py-1.5 px-3 text-[#4F6A66]">{i + 1}</td>
                  <td className="py-1.5 px-3 text-[#1D3532]">{pt[xDataKey]}</td>
                  <td className="py-1.5 px-3 font-semibold text-[#E26D62]">{pt[yDataKey]}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
};
