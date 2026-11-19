import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Play,
  Pause,
  RotateCcw,
  Upload,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  Download,
  SlidersHorizontal,
  Image as ImageIcon,
} from 'lucide-react';
import * as pdfjsLib from 'pdfjs-dist';
import pdfWorkerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url';
import Tesseract from 'tesseract.js';
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
import {
  evaluateSafeExpression,
  normalizeExtractedFormulaText,
  parseSafePhysicsFormula,
} from '../../engine/formulaParser';
import { exportDataToCsv } from '../../engine/physicsEngine';
import { CustomSeedPayload, CustomVariableConfig, ModuleId } from '../../types/physics';
import { MathDisplay } from '../MathDisplay';

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorkerUrl;

interface Props {
  moduleId: ModuleId;
  initialSeed?: CustomSeedPayload | null;
}

const MODULE_STARTER_FORMULAS: Record<
  ModuleId,
  {
    formula: string;
    depUnit: string;
    indep: string;
    vars: Record<string, Partial<CustomVariableConfig>>;
    presets: { label: string; formula: string; unit: string; indep: string }[];
  }
> = {
  besaran: {
    formula: 'rho = m / (p * l * t)',
    depUnit: 'kg/m³',
    indep: 'm',
    vars: {
      m: { description: 'Massa benda', unit: 'kg', initialValue: 5, minValue: 1, maxValue: 25, stepSize: 1 },
      p: { description: 'Panjang', unit: 'm', initialValue: 0.5, minValue: 0.1, maxValue: 2, stepSize: 0.1 },
      l: { description: 'Lebar', unit: 'm', initialValue: 0.4, minValue: 0.1, maxValue: 2, stepSize: 0.1 },
      t: { description: 'Tinggi', unit: 'm', initialValue: 0.25, minValue: 0.1, maxValue: 2, stepSize: 0.05 },
    },
    presets: [
      { label: 'Massa Jenis Balok', formula: 'rho = m / (p * l * t)', unit: 'kg/m³', indep: 'm' },
      { label: 'Volume Bola', formula: 'V = (4 / 3) * pi * r^3', unit: 'm³', indep: 'r' },
      { label: 'Konversi Celcius ke Kelvin', formula: 'K = C + 273.15', unit: 'K', indep: 'C' },
    ],
  },
  kinematika: {
    formula: 's = v0 * t + 0.5 * a * t^2',
    depUnit: 'm',
    indep: 't',
    vars: {
      v0: { description: 'Kecepatan awal', unit: 'm/s', initialValue: 4, minValue: 0, maxValue: 30, stepSize: 1 },
      t: { description: 'Waktu tempuh', unit: 's', initialValue: 5, minValue: 0, maxValue: 12, stepSize: 0.5 },
      a: { description: 'Percepatan', unit: 'm/s²', initialValue: 2, minValue: -5, maxValue: 10, stepSize: 0.5 },
    },
    presets: [
      { label: 'Jarak GLBB', formula: 's = v0 * t + 0.5 * a * t^2', unit: 'm', indep: 't' },
      { label: 'Tinggi Proyektil', formula: 'y = v0 * sin(theta * pi / 180) * t - 0.5 * 9.8 * t^2', unit: 'm', indep: 't' },
      { label: 'Jarak GLB', formula: 'x = x0 + v * t', unit: 'm', indep: 't' },
    ],
  },
  dinamika: {
    formula: 'F = m * a',
    depUnit: 'N',
    indep: 'a',
    vars: {
      m: { description: 'Massa benda', unit: 'kg', initialValue: 5, minValue: 1, maxValue: 50, stepSize: 1 },
      a: { description: 'Percepatan', unit: 'm/s²', initialValue: 3, minValue: 0, maxValue: 20, stepSize: 0.5 },
    },
    presets: [
      { label: 'Hukum Newton II', formula: 'F = m * a', unit: 'N', indep: 'a' },
      { label: 'Gaya Gesek Kinetis', formula: 'fk = mu * m * 9.8 * cos(theta * pi / 180)', unit: 'N', indep: 'theta' },
      { label: 'Gravitasi Universal', formula: 'F = 6.674e-11 * m1 * m2 / r^2', unit: 'N', indep: 'r' },
    ],
  },
  energi: {
    formula: 'Ek = 0.5 * m * v^2',
    depUnit: 'J',
    indep: 'v',
    vars: {
      m: { description: 'Massa benda', unit: 'kg', initialValue: 4, minValue: 0.5, maxValue: 20, stepSize: 0.5 },
      v: { description: 'Kecepatan', unit: 'm/s', initialValue: 10, minValue: 0, maxValue: 30, stepSize: 1 },
    },
    presets: [
      { label: 'Energi Kinetik', formula: 'Ek = 0.5 * m * v^2', unit: 'J', indep: 'v' },
      { label: 'Energi Pegas', formula: 'Ee = 0.5 * k * x^2', unit: 'J', indep: 'x' },
      { label: 'Energi Potensial', formula: 'Ep = m * 9.8 * h', unit: 'J', indep: 'h' },
    ],
  },
  termodinamika: {
    formula: 'P = n * 8.314 * T / V',
    depUnit: 'kPa',
    indep: 'V',
    vars: {
      n: { description: 'Jumlah mol', unit: 'mol', initialValue: 1, minValue: 0.5, maxValue: 5, stepSize: 0.5 },
      T: { description: 'Suhu mutlak', unit: 'K', initialValue: 300, minValue: 150, maxValue: 600, stepSize: 25 },
      V: { description: 'Volume gas', unit: 'L', initialValue: 10, minValue: 2, maxValue: 30, stepSize: 1 },
    },
    presets: [
      { label: 'Tekanan Gas Ideal', formula: 'P = n * 8.314 * T / V', unit: 'kPa', indep: 'V' },
      { label: 'Kalor Sensibel', formula: 'Q = m * c * (T2 - T1)', unit: 'J', indep: 'T2' },
      { label: 'Hukum I Termodinamika', formula: 'dU = Q - P * dV', unit: 'J', indep: 'Q' },
    ],
  },
};

export const CustomFormulaSimulator: React.FC<Props> = ({
  moduleId,
  initialSeed,
}) => {
  const starter = MODULE_STARTER_FORMULAS[moduleId];

  const [inputMode, setInputMode] = useState<'manual' | 'upload'>('manual');
  const [formulaText, setFormulaText] = useState<string>(initialSeed?.formula || starter.formula);
  const [dependentUnit, setDependentUnit] = useState<string>(initialSeed?.unit || starter.depUnit);
  const [independentVar, setIndependentVar] = useState<string>(initialSeed?.independentVar || starter.indep);
  const [needsOcrConfirm, setNeedsOcrConfirm] = useState<boolean>(false);
  const [ocrConfirmed, setOcrConfirmed] = useState<boolean>(true);
  const [extractMsg, setExtractMsg] = useState<string>('');
  const [extractError, setExtractError] = useState<string>('');
  const [isExtracting, setIsExtracting] = useState<boolean>(false);
  const [showVarSettings, setShowVarSettings] = useState<boolean>(false);

  const [variablesConfig, setVariablesConfig] = useState<Record<string, CustomVariableConfig>>(() => {
    const parsed = parseSafePhysicsFormula(initialSeed?.formula || starter.formula);
    const init: Record<string, CustomVariableConfig> = {};
    parsed.variables.forEach((v) => {
      const seeded = initialSeed?.variablesConfig?.[v];
      const s = starter.vars[v];
      init[v] = {
        name: v,
        description: seeded?.description ?? s?.description ?? `Variabel ${v}`,
        unit: seeded?.unit ?? s?.unit ?? 'SI',
        initialValue: seeded?.initialValue ?? s?.initialValue ?? 2,
        minValue: seeded?.minValue ?? s?.minValue ?? 0,
        maxValue: seeded?.maxValue ?? s?.maxValue ?? 20,
        stepSize: seeded?.stepSize ?? s?.stepSize ?? 0.5,
      };
    });
    return init;
  });

  // Animation state along independentVar
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [animProgress, setAnimProgress] = useState<number>(0.5); // [0..1] across [min, max]
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const chartWrapperRef = useRef<HTMLDivElement | null>(null);

  // Sync when switching modules or receiving initialSeed from Unggah Rumus
  useEffect(() => {
    const nextStarter = MODULE_STARTER_FORMULAS[moduleId];
    const targetFormula = initialSeed?.formula || nextStarter.formula;
    setFormulaText(targetFormula);
    setDependentUnit(initialSeed?.unit || nextStarter.depUnit);
    setNeedsOcrConfirm(false);
    setOcrConfirmed(true);
    setExtractMsg('');
    setExtractError('');

    const parsed = parseSafePhysicsFormula(targetFormula);
    if (parsed.valid) {
      const nextVars: Record<string, CustomVariableConfig> = {};
      parsed.variables.forEach((v) => {
        const seeded = initialSeed?.variablesConfig?.[v];
        const s = nextStarter.vars[v];
        nextVars[v] = {
          name: v,
          description: seeded?.description ?? s?.description ?? `Variabel ${v}`,
          unit: seeded?.unit ?? s?.unit ?? 'SI',
          initialValue: seeded?.initialValue ?? s?.initialValue ?? 2,
          minValue: seeded?.minValue ?? s?.minValue ?? 0,
          maxValue: seeded?.maxValue ?? s?.maxValue ?? 20,
          stepSize: seeded?.stepSize ?? s?.stepSize ?? 0.5,
        };
      });
      setVariablesConfig(nextVars);
      if (initialSeed?.independentVar && parsed.variables.includes(initialSeed.independentVar)) {
        setIndependentVar(initialSeed.independentVar);
      } else if (parsed.variables.includes(nextStarter.indep)) {
        setIndependentVar(nextStarter.indep);
      } else if (parsed.variables.length > 0) {
        setIndependentVar(parsed.variables[parsed.variables.length - 1]);
      }
    }
    setIsPlaying(false);
    setAnimProgress(0.4);
  }, [moduleId, initialSeed]);

  const parsedFormula = useMemo(() => parseSafePhysicsFormula(formulaText), [formulaText]);

  const syncDetectedVars = (
    vars: string[],
    overrides?: Record<string, Partial<CustomVariableConfig>>,
    preferredIndep?: string
  ) => {
    setVariablesConfig((prev) => {
      const next: Record<string, CustomVariableConfig> = {};
      vars.forEach((v) => {
        const ex = prev[v];
        const ov = overrides?.[v];
        next[v] = {
          name: v,
          description: ov?.description ?? ex?.description ?? `Variabel ${v}`,
          unit: ov?.unit ?? ex?.unit ?? 'SI',
          initialValue: ov?.initialValue ?? ex?.initialValue ?? 2,
          minValue: ov?.minValue ?? ex?.minValue ?? 0,
          maxValue: ov?.maxValue ?? ex?.maxValue ?? 20,
          stepSize: ov?.stepSize ?? ex?.stepSize ?? 0.5,
        };
      });
      return next;
    });
    if (preferredIndep && vars.includes(preferredIndep)) {
      setIndependentVar(preferredIndep);
    } else if (vars.length > 0 && !vars.includes(independentVar)) {
      setIndependentVar(vars[vars.length - 1]);
    }
  };

  const handleFormulaEdit = (text: string, fromUpload = false) => {
    setFormulaText(text);
    if (fromUpload) {
      setNeedsOcrConfirm(true);
      setOcrConfirmed(false);
    }
    const parsed = parseSafePhysicsFormula(text);
    if (parsed.valid) {
      syncDetectedVars(parsed.variables);
    }
  };

  const handleFileUpload = async (file: File) => {
    setIsExtracting(true);
    setExtractError('');
    setExtractMsg(`Membaca ${file.name}...`);
    setNeedsOcrConfirm(true);
    setOcrConfirmed(false);

    const ext = file.name.split('.').pop()?.toLowerCase() || '';
    try {
      if (ext === 'txt') {
        const txt = (await file.text()).trim();
        const line = txt.split('\n').find((l) => l.includes('=')) || txt.split('\n')[0] || txt;
        const norm = normalizeExtractedFormulaText(line);
        handleFormulaEdit(norm, true);
        setExtractMsg(`Diekstrak dari ${file.name}. Silakan tinjau lalu centang konfirmasi.`);
        setIsExtracting(false);
        return;
      }

      if (ext === 'pdf') {
        const buf = await file.arrayBuffer();
        const pdf = await pdfjsLib.getDocument({ data: buf }).promise;
        let combined = '';
        for (let p = 1; p <= Math.min(pdf.numPages, 4); p++) {
          const page = await pdf.getPage(p);
          const content = await page.getTextContent();
          combined += content.items.map((it) => ('str' in it ? it.str : '')).join(' ') + '\n';
        }
        const cleaned = combined.trim();
        if (!cleaned) {
          setExtractError('PDF tidak memiliki teks terbaca. Gunakan gambar PNG/JPG atau ketik rumus secara manual.');
          setIsExtracting(false);
          return;
        }
        const line = cleaned.split('\n').find((l) => l.includes('=')) || cleaned.slice(0, 100);
        const norm = normalizeExtractedFormulaText(line);
        handleFormulaEdit(norm, true);
        setExtractMsg(`Teks diekstrak dari ${file.name}. Periksa notasi sebelum menghitung.`);
        setIsExtracting(false);
        return;
      }

      if (ext === 'png' || ext === 'jpg' || ext === 'jpeg') {
        setExtractMsg('Menjalankan OCR Tesseract pada gambar...');
        const res = await Tesseract.recognize(file, 'eng', {
          logger: (m) => {
            if (m.status === 'recognizing text') {
              setExtractMsg(`OCR: ${Math.round((m.progress || 0) * 100)}%`);
            }
          },
        });
        const ocrText = (res.data?.text || '').trim();
        if (!ocrText) {
          setExtractError('OCR tidak menemukan teks rumus pada gambar. Ketik rumus secara manual di kotak editor.');
          setIsExtracting(false);
          return;
        }
        const line = ocrText.split('\n').find((l) => l.includes('=')) || ocrText.split('\n')[0];
        const norm = normalizeExtractedFormulaText(line);
        handleFormulaEdit(norm, true);
        setExtractMsg(`OCR selesai dari ${file.name}. Pastikan simbol sudah sesuai sebelum mengonfirmasi.`);
        setIsExtracting(false);
        return;
      }

      setExtractError('Format tidak didukung. Pilih file PNG, JPG, PDF, atau TXT.');
    } catch (err) {
      setExtractError(err instanceof Error ? err.message : 'Gagal mengekstrak berkas.');
    } finally {
      setIsExtracting(false);
    }
  };

  // Animation loop
  useEffect(() => {
    if (!isPlaying) return;
    let last = performance.now();
    let raf = 0;
    const tick = (now: number) => {
      const dt = (now - last) / 1000;
      last = now;
      setAnimProgress((prev) => {
        const next = prev + dt * 0.22;
        if (next >= 1) {
          setIsPlaying(false);
          return 1;
        }
        return next;
      });
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [isPlaying]);

  // Active sweep variable config
  const activeSweepVar = parsedFormula.variables.includes(independentVar)
    ? independentVar
    : parsedFormula.variables[0] || '';
  const sweepCfg = variablesConfig[activeSweepVar] || {
    name: activeSweepVar,
    description: '',
    unit: 'SI',
    initialValue: 2,
    minValue: 0,
    maxValue: 20,
    stepSize: 0.5,
  };

  const currentSweepValue =
    sweepCfg.minValue + animProgress * Math.max(0.01, sweepCfg.maxValue - sweepCfg.minValue);

  // Evaluate graph points & current value
  const evaluation = useMemo(() => {
    if (!parsedFormula.valid || (needsOcrConfirm && !ocrConfirmed)) {
      return { valid: false, error: null as string | null, currentY: null as number | null, points: [] as { x: number; y: number }[] };
    }

    const baseScope: Record<string, number> = {};
    parsedFormula.variables.forEach((v) => {
      baseScope[v] = variablesConfig[v]?.initialValue ?? 1;
    });

    if (activeSweepVar) {
      baseScope[activeSweepVar] = currentSweepValue;
    }

    const currEval = evaluateSafeExpression(parsedFormula.rhsExpression, baseScope);
    const pts: { x: number; y: number }[] = [];

    if (!activeSweepVar) {
      if (currEval.error || currEval.value === null) {
        return { valid: false, error: currEval.error || 'Error evaluasi', currentY: null, points: [] };
      }
      return { valid: true, error: null, currentY: currEval.value, points: [{ x: 0, y: Number(currEval.value.toFixed(4)) }] };
    }

    const minV = sweepCfg.minValue;
    const maxV = Math.max(minV + 0.05, sweepCfg.maxValue);
    const step = Math.max(0.01, sweepCfg.stepSize);
    let count = 0;

    for (let x = minV; x <= maxV + 1e-9 && count < 180; x += step) {
      const scope = { ...baseScope, [activeSweepVar]: x };
      const res = evaluateSafeExpression(parsedFormula.rhsExpression, scope);
      if (res.value !== null && Number.isFinite(res.value)) {
        pts.push({ x: Number(x.toFixed(3)), y: Number(res.value.toFixed(4)) });
      }
      count++;
    }

    if (pts.length === 0) {
      return {
        valid: false,
        error: currEval.error || 'Tidak ada nilai terdefinisi pada rentang variabel yang dipilih.',
        currentY: null,
        points: [],
      };
    }

    return {
      valid: true,
      error: currEval.error || null,
      currentY: currEval.value,
      points: pts,
    };
  }, [parsedFormula, needsOcrConfirm, ocrConfirmed, variablesConfig, activeSweepVar, currentSweepValue, sweepCfg]);

  // Draw interactive Canvas simulation for the custom formula
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

    // Grid
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

    if (!evaluation.valid || evaluation.points.length === 0) {
      ctx.fillStyle = '#4F6A66';
      ctx.font = '13px "DM Sans", sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(
        needsOcrConfirm && !ocrConfirmed
          ? 'Konfirmasikan hasil ekstraksi rumus pada panel kiri untuk memulai simulasi.'
          : 'Masukkan rumus fisika yang valid untuk melihat simulasi.',
        w / 2,
        h / 2
      );
      ctx.textAlign = 'left';
      return;
    }

    const padL = 56;
    const padR = 36;
    const padT = 36;
    const padB = 72;

    const xs = evaluation.points.map((p) => p.x);
    const ys = evaluation.points.map((p) => p.y);
    const minX = Math.min(...xs);
    const maxX = Math.max(...xs, minX + 1);
    const minY = Math.min(...ys, 0);
    const maxY = Math.max(...ys, minY + 1);
    const spanY = Math.max(0.001, maxY - minY);

    const toSX = (x: number) => padL + ((x - minX) / (maxX - minX)) * (w - padL - padR);
    const toSY = (y: number) => h - padB - ((y - minY) / spanY) * (h - padT - padB);

    // Axes
    ctx.strokeStyle = '#1D3532';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(padL, padT - 10);
    ctx.lineTo(padL, h - padB);
    ctx.lineTo(w - padR + 10, h - padB);
    ctx.stroke();

    // Curve
    ctx.strokeStyle = '#4F6A66';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    evaluation.points.forEach((pt, idx) => {
      const sx = toSX(pt.x);
      const sy = toSY(pt.y);
      if (idx === 0) ctx.moveTo(sx, sy);
      else ctx.lineTo(sx, sy);
    });
    ctx.stroke();

    // Current animated probe on curve
    if (evaluation.currentY !== null) {
      const px = toSX(currentSweepValue);
      const py = toSY(evaluation.currentY);

      // Vertical & horizontal guide
      ctx.strokeStyle = '#E26D62';
      ctx.setLineDash([4, 3]);
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.moveTo(px, h - padB);
      ctx.lineTo(px, py);
      ctx.lineTo(padL, py);
      ctx.stroke();
      ctx.setLineDash([]);

      // Moving coral probe
      ctx.fillStyle = '#E26D62';
      ctx.beginPath();
      ctx.arc(px, py, 7.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#FFFFFF';
      ctx.lineWidth = 2;
      ctx.stroke();

      // Proportional linear physical track at bottom
      const trackY = h - 26;
      ctx.fillStyle = '#CBE2DD';
      ctx.fillRect(padL, trackY - 4, w - padL - padR, 8);
      ctx.fillStyle = '#1D3532';
      ctx.beginPath();
      ctx.roundRect(px - 12, trackY - 10, 24, 20, 5);
      ctx.fill();

      ctx.fillStyle = '#1D3532';
      ctx.font = 'bold 11px "JetBrains Mono", monospace';
      ctx.fillText(
        `${activeSweepVar}=${currentSweepValue.toFixed(2)} ${sweepCfg.unit} → ${parsedFormula.dependentVar}=${evaluation.currentY.toFixed(2)} ${dependentUnit}`,
        padL,
        20
      );
    }
  }, [evaluation, currentSweepValue, activeSweepVar, sweepCfg.unit, parsedFormula.dependentVar, dependentUnit, needsOcrConfirm, ocrConfirmed]);

  return (
    <div className="grid grid-cols-1 xl:grid-cols-12 gap-5 items-start">
      {/* LEFT PANEL: Manual / Upload + Variables */}
      <aside className="xl:col-span-3 bg-white rounded-2xl p-5 shadow-sm border border-[#8FB5AE]/25 flex flex-col gap-4">
        <div>
          <p className="text-xs font-medium text-[#4F6A66]">Simulasi Rumus Kustom</p>
          <h2 className="font-display text-xl font-bold text-[#1D3532] mt-0.5">
            Masukan Manual & Unggah
          </h2>
        </div>

        {/* Mode Switcher */}
        <div className="grid grid-cols-2 gap-1 bg-[#EFF5F4] p-1 rounded-xl">
          <button
            type="button"
            onClick={() => setInputMode('manual')}
            className={`py-1.5 rounded-lg text-xs font-semibold cursor-pointer ${
              inputMode === 'manual' ? 'bg-white text-[#1D3532] shadow-sm' : 'text-[#4F6A66]'
            }`}
          >
            Ketik Manual
          </button>
          <button
            type="button"
            onClick={() => setInputMode('upload')}
            className={`py-1.5 rounded-lg text-xs font-semibold cursor-pointer ${
              inputMode === 'upload' ? 'bg-white text-[#1D3532] shadow-sm' : 'text-[#4F6A66]'
            }`}
          >
            Unggah File
          </button>
        </div>

        {inputMode === 'upload' && (
          <div className="space-y-2">
            <input
              ref={fileInputRef}
              type="file"
              accept=".png,.jpg,.jpeg,.pdf,.txt"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) handleFileUpload(f);
              }}
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={isExtracting}
              className="w-full py-3 px-3 rounded-xl border-2 border-dashed border-[#8FB5AE] bg-[#EFF5F4] hover:bg-[#CBE2DD]/50 text-xs font-semibold text-[#1D3532] flex items-center justify-center gap-2 cursor-pointer"
            >
              <Upload className="w-4 h-4 text-[#E26D62]" />
              <span>{isExtracting ? 'Memproses...' : 'Pilih PNG, JPG, PDF, atau TXT'}</span>
            </button>
            {extractMsg && <p className="text-[11px] text-[#4F6A66]">{extractMsg}</p>}
            {extractError && <p className="text-[11px] text-[#E26D62] font-semibold">{extractError}</p>}
          </div>
        )}

        {/* Formula Input Box */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <label htmlFor="sim-custom-formula" className="text-xs font-semibold text-[#1D3532]">
              Persamaan Fisika
            </label>
            {parsedFormula.valid ? (
              <span className="text-[11px] text-[#4F6A66] flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-[#8FB5AE]" /> Valid
              </span>
            ) : (
              <span className="text-[11px] text-[#E26D62] flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5" /> Error
              </span>
            )}
          </div>
          <input
            id="sim-custom-formula"
            type="text"
            value={formulaText}
            onChange={(e) => handleFormulaEdit(e.target.value, false)}
            placeholder="Misal: F = m * a"
            className="w-full px-3 py-2 rounded-xl bg-[#EFF5F4] border border-[#8FB5AE]/50 font-mono-tabular text-xs font-semibold text-[#1D3532] focus:outline-none focus:border-[#E26D62]"
          />
          {!parsedFormula.valid && (
            <p className="text-[11px] text-[#E26D62] mt-1">{parsedFormula.error}</p>
          )}
        </div>

        {/* KaTeX Preview */}
        {parsedFormula.valid && (
          <div className="bg-[#EFF5F4] rounded-xl p-2.5 text-center overflow-x-auto">
            <MathDisplay latex={parsedFormula.latexPreview} />
          </div>
        )}

        {needsOcrConfirm && (
          <label className="flex items-start gap-2 p-2.5 rounded-xl bg-[#CBE2DD]/45 text-[11px] text-[#1D3532] cursor-pointer">
            <input
              type="checkbox"
              checked={ocrConfirmed}
              onChange={(e) => setOcrConfirmed(e.target.checked)}
              className="mt-0.5 accent-[#E26D62]"
            />
            <span>Konfirmasi hasil ekstraksi rumus sudah benar sebelum dijalankan.</span>
          </label>
        )}

        {/* Quick presets for active module */}
        <div>
          <p className="text-[11px] font-semibold text-[#4F6A66] mb-1.5">Contoh Cepat Modul Ini:</p>
          <div className="flex flex-wrap gap-1">
            {starter.presets.map((p) => (
              <button
                key={p.label}
                type="button"
                onClick={() => {
                  setFormulaText(p.formula);
                  setDependentUnit(p.unit);
                  setNeedsOcrConfirm(false);
                  setOcrConfirmed(true);
                  const parsed = parseSafePhysicsFormula(p.formula);
                  if (parsed.valid) {
                    syncDetectedVars(parsed.variables, starter.vars, p.indep);
                  }
                }}
                className="px-2 py-1 rounded-lg bg-[#EFF5F4] hover:bg-[#CBE2DD] text-[11px] font-medium text-[#1D3532] cursor-pointer"
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>

        {/* Variable Controls */}
        {parsedFormula.valid && (
          <div className="space-y-3 pt-1 border-t border-[#CBE2DD]/60">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-[#1D3532]">Parameter Variabel</span>
              <button
                type="button"
                onClick={() => setShowVarSettings((s) => !s)}
                className="text-[11px] font-semibold text-[#E26D62] flex items-center gap-1 cursor-pointer"
              >
                <SlidersHorizontal className="w-3 h-3" />
                {showVarSettings ? 'Tutup Batas' : 'Atur Batas & Satuan'}
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[11px] text-[#4F6A66] mb-0.5">
                  Satuan {parsedFormula.dependentVar}
                </label>
                <input
                  type="text"
                  value={dependentUnit}
                  onChange={(e) => setDependentUnit(e.target.value)}
                  className="w-full px-2.5 py-1 rounded-lg bg-[#EFF5F4] font-mono-tabular text-xs text-[#1D3532]"
                />
              </div>
              <div>
                <label className="block text-[11px] text-[#4F6A66] mb-0.5">Variabel Sumbu X</label>
                <select
                  value={activeSweepVar}
                  onChange={(e) => setIndependentVar(e.target.value)}
                  className="w-full px-2 py-1 rounded-lg bg-[#EFF5F4] text-xs font-semibold text-[#1D3532]"
                >
                  {parsedFormula.variables.map((v) => (
                    <option key={v} value={v}>
                      {v}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {parsedFormula.variables.map((vName) => {
              const cfg = variablesConfig[vName] || {
                name: vName,
                description: vName,
                unit: 'SI',
                initialValue: 2,
                minValue: 0,
                maxValue: 20,
                stepSize: 0.5,
              };
              const isSweep = vName === activeSweepVar;
              const displayedVal = isSweep ? currentSweepValue : cfg.initialValue;

              return (
                <div key={vName} className="bg-[#EFF5F4]/70 rounded-xl p-2.5 space-y-1.5">
                  <div className="flex justify-between items-center gap-2 text-xs">
                    <span className="font-semibold text-[#1D3532] truncate" title={cfg.description}>
                      {vName} {isSweep && <span className="text-[10px] text-[#E26D62]">(Sumbu X)</span>}
                    </span>
                    <div className="flex items-center gap-1 shrink-0">
                      <input
                        type="number"
                        step={Math.max(0.01, cfg.stepSize)}
                        value={Number(displayedVal.toFixed(3))}
                        onChange={(e) => {
                          const v = Number(e.target.value);
                          if (!Number.isFinite(v)) return;
                          if (isSweep) {
                            setIsPlaying(false);
                            const span = Math.max(0.01, cfg.maxValue - cfg.minValue);
                            const ratio = (v - cfg.minValue) / span;
                            setAnimProgress(Math.max(0, Math.min(1, ratio)));
                          } else {
                            setVariablesConfig((prev) => ({
                              ...prev,
                              [vName]: { ...cfg, initialValue: v },
                            }));
                          }
                        }}
                        className="w-16 px-1.5 py-0.5 rounded bg-white border border-[#8FB5AE]/40 font-mono-tabular text-[11px] font-bold text-[#1D3532] text-right"
                      />
                      <span className="font-mono-tabular text-[11px] text-[#4F6A66]">{cfg.unit}</span>
                    </div>
                  </div>
                  <input
                    type="range"
                    min={cfg.minValue}
                    max={Math.max(cfg.minValue + 0.1, cfg.maxValue)}
                    step={Math.max(0.01, cfg.stepSize)}
                    value={Math.min(Math.max(cfg.minValue + 0.1, cfg.maxValue), Math.max(cfg.minValue, displayedVal))}
                    onChange={(e) => {
                      const v = Number(e.target.value);
                      if (isSweep) {
                        setIsPlaying(false);
                        const ratio = (v - cfg.minValue) / Math.max(0.01, cfg.maxValue - cfg.minValue);
                        setAnimProgress(Math.max(0, Math.min(1, ratio)));
                      } else {
                        setVariablesConfig((prev) => ({
                          ...prev,
                          [vName]: { ...cfg, initialValue: v },
                        }));
                      }
                    }}
                    className="w-full physilab-slider"
                  />

                  {showVarSettings && (
                    <div className="grid grid-cols-4 gap-1 pt-1">
                      <input
                        type="text"
                        value={cfg.unit}
                        title="Satuan"
                        onChange={(e) =>
                          setVariablesConfig((prev) => ({
                            ...prev,
                            [vName]: { ...cfg, unit: e.target.value },
                          }))
                        }
                        className="px-1.5 py-1 rounded bg-white text-[10px] font-mono-tabular"
                        placeholder="Unit"
                      />
                      <input
                        type="number"
                        value={cfg.minValue}
                        title="Min"
                        onChange={(e) =>
                          setVariablesConfig((prev) => ({
                            ...prev,
                            [vName]: { ...cfg, minValue: Number(e.target.value) },
                          }))
                        }
                        className="px-1.5 py-1 rounded bg-white text-[10px] font-mono-tabular"
                      />
                      <input
                        type="number"
                        value={cfg.maxValue}
                        title="Maks"
                        onChange={(e) =>
                          setVariablesConfig((prev) => ({
                            ...prev,
                            [vName]: { ...cfg, maxValue: Number(e.target.value) },
                          }))
                        }
                        className="px-1.5 py-1 rounded bg-white text-[10px] font-mono-tabular"
                      />
                      <input
                        type="number"
                        min={0.01}
                        step={0.1}
                        value={cfg.stepSize}
                        title="Step"
                        onChange={(e) =>
                          setVariablesConfig((prev) => ({
                            ...prev,
                            [vName]: { ...cfg, stepSize: Number(e.target.value) },
                          }))
                        }
                        className="px-1.5 py-1 rounded bg-white text-[10px] font-mono-tabular"
                      />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </aside>

      {/* CENTER PANEL: Live Animated Custom Canvas */}
      <section className="xl:col-span-6 bg-white rounded-2xl p-5 shadow-sm border border-[#8FB5AE]/25 flex flex-col gap-4">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div>
            <h3 className="font-display text-lg font-bold text-[#1D3532]">
              Kanvas Simulasi Rumus Kustom
            </h3>
            <p className="text-xs text-[#4F6A66]">
              Animasi lintasan perubahan {parsedFormula.dependentVar} terhadap {activeSweepVar || 'parameter'} secara real-time.
            </p>
          </div>
        </div>

        {needsOcrConfirm && !ocrConfirmed && (
          <div className="bg-[#CBE2DD]/40 rounded-xl p-3 flex items-center gap-2 text-xs text-[#1D3532]">
            <AlertTriangle className="w-4 h-4 text-[#8C685C] shrink-0" />
            <span>Centang konfirmasi hasil ekstraksi pada panel kiri sebelum simulasi dievaluasi.</span>
          </div>
        )}

        <div className="relative w-full h-[350px] bg-[#EFF5F4] rounded-2xl overflow-hidden border border-[#8FB5AE]/30">
          <canvas ref={canvasRef} className="w-full h-full block" />
        </div>

        {/* Controls */}
        <div className="bg-[#EFF5F4] rounded-xl p-4 flex flex-col gap-3">
          <div className="flex justify-between text-xs font-mono-tabular text-[#4F6A66]">
            <span>
              {activeSweepVar}: {currentSweepValue.toFixed(2)} {sweepCfg.unit}
            </span>
            <span>
              Rentang: {sweepCfg.minValue} – {sweepCfg.maxValue} {sweepCfg.unit}
            </span>
          </div>
          <input
            type="range"
            min={0}
            max={1}
            step={0.01}
            value={animProgress}
            onChange={(e) => {
              setIsPlaying(false);
              setAnimProgress(Number(e.target.value));
            }}
            className="w-full physilab-slider"
          />
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              disabled={!evaluation.valid}
              onClick={() => {
                if (animProgress >= 1) setAnimProgress(0);
                setIsPlaying((p) => !p);
              }}
              className="px-4 py-2 rounded-xl bg-[#E26D62] disabled:opacity-45 text-white text-sm font-semibold flex items-center gap-1.5 cursor-pointer"
            >
              {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
              {isPlaying ? 'Jeda' : animProgress > 0 && animProgress < 1 ? 'Lanjutkan' : 'Jalankan'}
            </button>
            <button
              type="button"
              onClick={() => {
                setIsPlaying(false);
                setAnimProgress(0);
              }}
              className="px-4 py-2 rounded-xl bg-white border border-[#8FB5AE]/40 text-[#1D3532] text-sm font-semibold flex items-center gap-1.5 cursor-pointer"
            >
              <RotateCcw className="w-4 h-4" />
              Reset
            </button>
          </div>
        </div>
      </section>

      {/* RIGHT PANEL: Calculated Output & Dynamic Recharts Graph */}
      <aside className="xl:col-span-3 bg-white rounded-2xl p-5 shadow-sm border border-[#8FB5AE]/25 flex flex-col gap-4">
        <div className="flex items-center justify-between gap-2">
          <h3 className="font-display text-lg font-bold text-[#1D3532]">Hasil & Grafik</h3>
          {evaluation.valid && (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  const container = chartWrapperRef.current;
                  if (!container) return;
                  const svg = container.querySelector('svg');
                  if (!svg) return;
                  const svgStr = new XMLSerializer().serializeToString(svg);
                  const url = URL.createObjectURL(new Blob([svgStr], { type: 'image/svg+xml;charset=utf-8' }));
                  const img = new Image();
                  img.onload = () => {
                    const canvas = document.createElement('canvas');
                    canvas.width = svg.clientWidth * 2 || 900;
                    canvas.height = svg.clientHeight * 2 || 500;
                    const ctx = canvas.getContext('2d');
                    if (ctx) {
                      ctx.fillStyle = '#FFFFFF';
                      ctx.fillRect(0, 0, canvas.width, canvas.height);
                      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
                      const link = document.createElement('a');
                      link.href = canvas.toDataURL('image/png');
                      link.download = `physilab_custom_${parsedFormula.dependentVar}.png`;
                      document.body.appendChild(link);
                      link.click();
                      document.body.removeChild(link);
                    }
                    URL.revokeObjectURL(url);
                  };
                  img.src = url;
                }}
                className="text-xs font-semibold text-[#1D3532] hover:text-[#E26D62] flex items-center gap-1 cursor-pointer"
              >
                <ImageIcon className="w-3.5 h-3.5" /> PNG
              </button>
              <button
                type="button"
                onClick={() =>
                  exportDataToCsv(
                    `physilab_custom_${parsedFormula.dependentVar}.csv`,
                    [`${activeSweepVar}(${sweepCfg.unit})`, `${parsedFormula.dependentVar}(${dependentUnit})`],
                    evaluation.points.map((p) => [p.x, p.y])
                  )
                }
                className="text-xs font-semibold text-[#1D3532] hover:text-[#E26D62] flex items-center gap-1 cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" /> CSV
              </button>
            </div>
          )}
        </div>

        {evaluation.error ? (
          <div className="bg-[#E26D62]/15 border border-[#E26D62]/40 rounded-xl p-3 text-xs text-[#1D3532]">
            <p className="font-bold text-[#E26D62]">Kesalahan Evaluasi</p>
            <p className="mt-1">{evaluation.error}</p>
          </div>
        ) : evaluation.valid && evaluation.currentY !== null ? (
          <>
            <div className="bg-[#1D3532] text-white rounded-xl p-4">
              <span className="text-[11px] text-[#95B3A6]">
                Hasil {parsedFormula.dependentVar} saat ini
              </span>
              <p className="font-mono-tabular text-2xl font-bold mt-0.5">
                {Math.abs(evaluation.currentY) < 0.001 && evaluation.currentY !== 0
                  ? evaluation.currentY.toExponential(3)
                  : Number(evaluation.currentY.toFixed(4))}{' '}
                <span className="text-sm text-[#E26D62]">{dependentUnit}</span>
              </p>
            </div>

            <div ref={chartWrapperRef} className="h-48 w-full bg-[#EFF5F4]/60 rounded-xl p-2">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={evaluation.points}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#CBE2DD" />
                  <XAxis dataKey="x" tick={{ fontSize: 10, fill: '#4F6A66' }} />
                  <YAxis tick={{ fontSize: 10, fill: '#4F6A66' }} />
                  <Tooltip />
                  <Legend wrapperStyle={{ fontSize: '10px' }} />
                  <Line
                    type="monotone"
                    dataKey="y"
                    name={`${parsedFormula.dependentVar} (${dependentUnit})`}
                    stroke="#E26D62"
                    strokeWidth={2.5}
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </>
        ) : null}

        <div className="bg-[#EFF5F4] rounded-xl p-3.5 text-xs text-[#4F6A66] leading-relaxed">
          <p className="font-semibold text-[#1D3532] mb-1">Rumus Kustom Terpadu</p>
          <p>
            Anda dapat menulis persamaan apa pun dengan operator standar (+, -, *, /, ^) serta fungsi sin, cos, tan, sqrt, log, exp, dan abs untuk disimulasikan langsung di modul ini.
          </p>
        </div>
      </aside>
    </div>
  );
};
