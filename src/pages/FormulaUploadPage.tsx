import React, { useMemo, useRef, useState } from 'react';
import {
  Upload,
  FileText,
  Image as ImageIcon,
  CheckCircle2,
  AlertTriangle,
  AlertCircle,
  Play,
  Download,
  RotateCcw,
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
} from '../engine/formulaParser';
import { exportDataToCsv } from '../engine/physicsEngine';
import { CustomSeedPayload, CustomVariableConfig } from '../types/physics';
import { MathDisplay } from '../components/MathDisplay';

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorkerUrl;

const DEMO_FORMULAS: Array<{
  label: string;
  formula: string;
  vars: Record<string, Partial<CustomVariableConfig>>;
  indep: string;
}> = [
  {
    label: 'Energi Kinetik (Ek = 0.5*m*v^2)',
    formula: 'Ek = 0.5 * m * v^2',
    vars: {
      m: { description: 'Massa benda', unit: 'kg', initialValue: 2, minValue: 0.5, maxValue: 20, stepSize: 0.5 },
      v: { description: 'Kecepatan benda', unit: 'm/s', initialValue: 10, minValue: 0, maxValue: 40, stepSize: 2 },
    },
    indep: 'v',
  },
  {
    label: 'Periode Bandul (T = 2*pi*sqrt(L/g))',
    formula: 'T = 2 * pi * sqrt(L / g)',
    vars: {
      L: { description: 'Panjang tali', unit: 'm', initialValue: 1.5, minValue: 0.2, maxValue: 5, stepSize: 0.2 },
      g: { description: 'Percepatan gravitasi', unit: 'm/s²', initialValue: 9.8, minValue: 1, maxValue: 25, stepSize: 0.5 },
    },
    indep: 'L',
  },
  {
    label: 'Gaya Gravitasi (F = G_const*m1*m2/r^2)',
    formula: 'F = 6.674e-11 * m1 * m2 / r^2',
    vars: {
      m1: { description: 'Massa pertama', unit: 'kg', initialValue: 10000, minValue: 1000, maxValue: 50000, stepSize: 1000 },
      m2: { description: 'Massa kedua', unit: 'kg', initialValue: 5000, minValue: 1000, maxValue: 20000, stepSize: 500 },
      r: { description: 'Jarak pusat massa', unit: 'm', initialValue: 2, minValue: 1, maxValue: 10, stepSize: 0.5 },
    },
    indep: 'r',
  },
];

interface FormulaUploadPageProps {
  onLaunchInSimulator?: (seed: CustomSeedPayload) => void;
}

export const FormulaUploadPage: React.FC<FormulaUploadPageProps> = ({ onLaunchInSimulator }) => {
  // STEP 1 & 2: Upload & Extract
  const [entryMode, setEntryMode] = useState<'upload' | 'manual'>('upload');
  const [uploadedFileName, setUploadedFileName] = useState<string | null>(null);
  const [extractStatus, setExtractStatus] = useState<'idle' | 'extracting' | 'done' | 'error'>('idle');
  const [extractProgress, setExtractProgress] = useState<string>('');
  const [extractError, setExtractError] = useState<string>('');
  const [rawExtractedText, setRawExtractedText] = useState<string>('');

  // STEP 3: Review & Confirm
  const [formulaText, setFormulaText] = useState<string>('Ek = 0.5 * m * v^2');
  const [userConfirmed, setUserConfirmed] = useState<boolean>(false);

  // STEP 4 & 5: Variable Definitions & Configuration
  const [variablesConfig, setVariablesConfig] = useState<Record<string, CustomVariableConfig>>({
    m: {
      name: 'm',
      description: 'Massa benda',
      unit: 'kg',
      initialValue: 2,
      minValue: 0.5,
      maxValue: 20,
      stepSize: 0.5,
    },
    v: {
      name: 'v',
      description: 'Kecepatan benda',
      unit: 'm/s',
      initialValue: 10,
      minValue: 0,
      maxValue: 40,
      stepSize: 2,
    },
  });
  const [dependentUnit, setDependentUnit] = useState<string>('J');
  const [independentVar, setIndependentVar] = useState<string>('v');

  // STEP 6 & 7: Calculate & Visualize
  const [hasCalculated, setHasCalculated] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const chartContainerRef = useRef<HTMLDivElement | null>(null);

  const parsedFormula = useMemo(() => parseSafePhysicsFormula(formulaText), [formulaText]);

  // Synchronize detected variables when formula changes
  const syncVariablesFromFormula = (vars: string[], presetOverrides?: Record<string, Partial<CustomVariableConfig>>) => {
    setVariablesConfig((prev) => {
      const next: Record<string, CustomVariableConfig> = {};
      vars.forEach((vName) => {
        const existing = prev[vName];
        const over = presetOverrides?.[vName];
        next[vName] = {
          name: vName,
          description: over?.description ?? existing?.description ?? `Variabel ${vName}`,
          unit: over?.unit ?? existing?.unit ?? 'SI',
          initialValue: over?.initialValue ?? existing?.initialValue ?? 2,
          minValue: over?.minValue ?? existing?.minValue ?? 1,
          maxValue: over?.maxValue ?? existing?.maxValue ?? 10,
          stepSize: over?.stepSize ?? existing?.stepSize ?? 0.5,
        };
      });
      return next;
    });
    if (vars.length > 0 && !vars.includes(independentVar)) {
      setIndependentVar(vars[vars.length - 1]);
    }
  };

  const handleFormulaChange = (newFormula: string) => {
    setFormulaText(newFormula);
    setUserConfirmed(false);
    setHasCalculated(false);
    const parsed = parseSafePhysicsFormula(newFormula);
    if (parsed.valid) {
      syncVariablesFromFormula(parsed.variables);
    }
  };

  const handleFileUpload = async (file: File) => {
    setUploadedFileName(file.name);
    setExtractStatus('extracting');
    setExtractError('');
    setExtractProgress('Memulai proses ekstraksi...');
    setUserConfirmed(false);
    setHasCalculated(false);

    const ext = file.name.split('.').pop()?.toLowerCase() || '';

    try {
      if (ext === 'txt') {
        const text = await file.text();
        setRawExtractedText(text.trim());
        const normalized = normalizeExtractedFormulaText(text.split('\n')[0] || text);
        setFormulaText(normalized);
        const parsed = parseSafePhysicsFormula(normalized);
        if (parsed.valid) syncVariablesFromFormula(parsed.variables);
        setExtractStatus('done');
        setExtractProgress('Teks TXT berhasil diekstrak.');
        return;
      }

      if (ext === 'pdf') {
        setExtractProgress('Membaca halaman dokumen PDF...');
        const buffer = await file.arrayBuffer();
        const pdf = await pdfjsLib.getDocument({ data: buffer }).promise;
        let combined = '';
        const maxPages = Math.min(pdf.numPages, 5);
        for (let p = 1; p <= maxPages; p++) {
          const page = await pdf.getPage(p);
          const content = await page.getTextContent();
          const pageText = content.items
            .map((item) => ('str' in item ? item.str : ''))
            .join(' ');
          combined += pageText + '\n';
        }
        const cleaned = combined.trim();
        setRawExtractedText(cleaned);
        if (!cleaned) {
          setExtractStatus('error');
          setExtractError(
            'PDF tidak mengandung lapisan teks yang dapat dibaca (kemungkinan berupa PDF hasil pindai gambar). Silakan unggah sebagai PNG/JPG atau masukkan rumus secara manual.'
          );
          return;
        }
        // Try to pick line containing "="
        const eqLine =
          cleaned.split(/\n|(?<=[a-zA-Z0-9])\s{3,}/).find((l) => l.includes('=')) ||
          cleaned.slice(0, 120);
        const normalized = normalizeExtractedFormulaText(eqLine);
        setFormulaText(normalized);
        const parsed = parseSafePhysicsFormula(normalized);
        if (parsed.valid) syncVariablesFromFormula(parsed.variables);
        setExtractStatus('done');
        setExtractProgress('Ekstraksi PDF selesai. Mohon tinjau persamaan di bawah.');
        return;
      }

      if (ext === 'png' || ext === 'jpg' || ext === 'jpeg') {
        setExtractProgress('Menjalankan OCR Tesseract pada gambar...');
        const res = await Tesseract.recognize(file, 'eng', {
          logger: (m) => {
            if (m.status === 'recognizing text') {
              setExtractProgress(`Mengenali karakter OCR: ${Math.round((m.progress || 0) * 100)}%`);
            }
          },
        });
        const ocrText = (res.data?.text || '').trim();
        setRawExtractedText(ocrText);
        if (!ocrText) {
          setExtractStatus('error');
          setExtractError(
            'OCR tidak menemukan teks rumus yang terbaca pada gambar. Silakan perbaiki atau ketik persamaan secara manual pada Langkah 3.'
          );
          return;
        }
        const firstEqLine =
          ocrText
            .split('\n')
            .map((l) => l.trim())
            .find((l) => l.includes('=')) || ocrText.split('\n')[0];
        const normalized = normalizeExtractedFormulaText(firstEqLine);
        setFormulaText(normalized);
        const parsed = parseSafePhysicsFormula(normalized);
        if (parsed.valid) syncVariablesFromFormula(parsed.variables);
        setExtractStatus('done');
        setExtractProgress('Ekstraksi OCR selesai. Periksa kembali simbol matematika sebelum menghitung.');
        return;
      }

      setExtractStatus('error');
      setExtractError('Format berkas tidak didukung. Gunakan PNG, JPG, PDF, atau TXT.');
    } catch (err) {
      setExtractStatus('error');
      setExtractError(
        `Gagal mengekstrak berkas: ${err instanceof Error ? err.message : 'kesalahan tidak diketahui'}. Anda tetap dapat mengetik rumus secara manual.`
      );
    }
  };

  // Single point evaluation & sweep series
  const evaluationResult = useMemo(() => {
    if (!userConfirmed || !hasCalculated || !parsedFormula.valid) return null;

    const baseScope: Record<string, number> = {};
    parsedFormula.variables.forEach((vName) => {
      baseScope[vName] = variablesConfig[vName]?.initialValue ?? 1;
    });

    const singleEval = evaluateSafeExpression(parsedFormula.rhsExpression, baseScope);
    if (singleEval.error || singleEval.value === null) {
      return {
        error: singleEval.error || 'Persamaan tidak dapat dievaluasi pada titik nilai awal.',
        singleValue: null,
        points: [] as { x: number; y: number }[],
      };
    }

    const sweepVar = parsedFormula.variables.includes(independentVar)
      ? independentVar
      : parsedFormula.variables[0];

    if (!sweepVar) {
      return {
        error: null,
        singleValue: singleEval.value,
        points: [{ x: 0, y: Number(singleEval.value.toFixed(4)) }],
      };
    }

    const cfg = variablesConfig[sweepVar] || {
      minValue: 0,
      maxValue: 10,
      stepSize: 1,
    };

    const minV = cfg.minValue;
    const maxV = Math.max(minV + 0.01, cfg.maxValue);
    const step = Math.max(0.01, cfg.stepSize);

    const pts: { x: number; y: number }[] = [];
    let count = 0;
    for (let x = minV; x <= maxV + 1e-9 && count < 200; x += step) {
      const scope = { ...baseScope, [sweepVar]: x };
      const res = evaluateSafeExpression(parsedFormula.rhsExpression, scope);
      if (res.value !== null && Number.isFinite(res.value)) {
        pts.push({
          x: Number(x.toFixed(3)),
          y: Number(res.value.toFixed(4)),
        });
      }
      count++;
    }

    if (pts.length === 0) {
      return {
        error: 'Tidak ada titik valid pada rentang variabel yang ditentukan (periksa domain fungsi atau pembagian nol).',
        singleValue: singleEval.value,
        points: [],
      };
    }

    return {
      error: null,
      singleValue: singleEval.value,
      points: pts,
    };
  }, [userConfirmed, hasCalculated, parsedFormula, variablesConfig, independentVar]);

  const handleDownloadPng = () => {
    const container = chartContainerRef.current;
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
        const link = document.createElement('a');
        link.href = canvas.toDataURL('image/png');
        link.download = `physilab_rumus_${parsedFormula.dependentVar}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
      URL.revokeObjectURL(url);
    };
    img.src = url;
  };

  const indepConfig = variablesConfig[independentVar];

  return (
    <div className="max-w-[1440px] mx-auto px-4 sm:px-8 py-8 space-y-6">
      {/* Header & Mode Tabs */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4">
        <div>
          <p className="text-xs font-semibold text-[#4F6A66]">
            Alur 7 Langkah · Ekstraksi & Evaluasi Aman
          </p>
          <h1 className="font-display text-3xl font-bold text-[#1D3532] mt-1">
            Unggah & Visualisasikan Rumus Fisika Kustom
          </h1>
          <p className="text-sm text-[#4F6A66] max-w-2xl mt-1">
            Unggah berkas PNG, JPG, PDF, atau TXT—atau ketik langsung rumus Anda. Semua persamaan wajib ditinjau sebelum dihitung menggunakan parser matematika aman.
          </p>
        </div>

        <div className="flex items-center gap-1 bg-[#CBE2DD]/60 p-1 rounded-xl self-start">
          <button
            type="button"
            onClick={() => setEntryMode('upload')}
            className={`px-3.5 py-2 rounded-lg text-xs font-semibold cursor-pointer ${
              entryMode === 'upload' ? 'bg-white text-[#1D3532] shadow-sm' : 'text-[#4F6A66]'
            }`}
          >
            Unggah Berkas (OCR / PDF / TXT)
          </button>
          <button
            type="button"
            onClick={() => setEntryMode('manual')}
            className={`px-3.5 py-2 rounded-lg text-xs font-semibold cursor-pointer ${
              entryMode === 'manual' ? 'bg-white text-[#1D3532] shadow-sm' : 'text-[#4F6A66]'
            }`}
          >
            Ketik Rumus Manual
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* LEFT COLUMN (Steps 1 - 5) */}
        <div className="lg:col-span-7 space-y-5">
          {/* STEP 1 & 2: Upload & Extract */}
          {entryMode === 'upload' && (
            <section className="bg-white rounded-2xl p-6 shadow-sm border border-[#8FB5AE]/25 space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="font-display text-lg font-bold text-[#1D3532]">
                  Langkah 1 & 2 · Unggah & Ekstrak Berkas Rumus
                </h2>
                <span className="text-xs font-mono-tabular text-[#4F6A66]">
                  PNG · JPG · PDF · TXT
                </span>
              </div>

              <input
                ref={fileInputRef}
                type="file"
                accept=".png,.jpg,.jpeg,.pdf,.txt"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleFileUpload(file);
                }}
              />

              <div
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault();
                  const file = e.dataTransfer.files?.[0];
                  if (file) handleFileUpload(file);
                }}
                onClick={() => fileInputRef.current?.click()}
                className="rounded-2xl border-2 border-dashed border-[#8FB5AE] bg-[#EFF5F4] hover:bg-[#CBE2DD]/45 p-8 text-center cursor-pointer transition-colors"
              >
                <Upload className="w-8 h-8 text-[#E26D62] mx-auto mb-3" />
                <p className="font-display text-base font-bold text-[#1D3532]">
                  Klik atau tarik berkas rumus ke area ini
                </p>
                <p className="text-xs text-[#4F6A66] mt-1">
                  Teks PDF diekstrak dengan PDF.js dan gambar rumus dipindai menggunakan Tesseract OCR.
                </p>
                <div className="flex items-center justify-center gap-4 mt-4 text-xs text-[#4F6A66]">
                  <span className="flex items-center gap-1">
                    <ImageIcon className="w-3.5 h-3.5" /> PNG / JPG
                  </span>
                  <span className="flex items-center gap-1">
                    <FileText className="w-3.5 h-3.5" /> PDF / TXT
                  </span>
                </div>
              </div>

              {uploadedFileName && (
                <div className="bg-[#EFF5F4] rounded-xl p-3.5 text-xs space-y-1">
                  <p className="font-semibold text-[#1D3532]">
                    Berkas: <span className="font-mono-tabular">{uploadedFileName}</span>
                  </p>
                  {extractStatus === 'extracting' && (
                    <p className="text-[#E26D62] font-medium">{extractProgress}</p>
                  )}
                  {extractStatus === 'done' && (
                    <p className="text-[#1D3532]">{extractProgress}</p>
                  )}
                  {extractStatus === 'error' && (
                    <p className="text-[#E26D62] font-semibold">{extractError}</p>
                  )}
                  {rawExtractedText && (
                    <details className="pt-1">
                      <summary className="cursor-pointer text-[#4F6A66] hover:text-[#1D3532]">
                        Lihat teks mentah hasil ekstraksi
                      </summary>
                      <pre className="mt-1.5 p-2 bg-white rounded-lg text-[11px] font-mono-tabular whitespace-pre-wrap text-[#1D3532]">
                        {rawExtractedText}
                      </pre>
                    </details>
                  )}
                </div>
              )}

              {/* Demo presets */}
              <div className="flex flex-wrap items-center gap-2 pt-1">
                <span className="text-xs text-[#4F6A66]">Contoh Cepat:</span>
                {DEMO_FORMULAS.map((demo) => (
                  <button
                    key={demo.label}
                    type="button"
                    onClick={() => {
                      setFormulaText(demo.formula);
                      setUserConfirmed(false);
                      setHasCalculated(false);
                      const parsed = parseSafePhysicsFormula(demo.formula);
                      if (parsed.valid) {
                        syncVariablesFromFormula(parsed.variables, demo.vars);
                        setIndependentVar(demo.indep);
                      }
                    }}
                    className="px-2.5 py-1 rounded-lg bg-[#EFF5F4] hover:bg-[#CBE2DD] text-xs font-medium text-[#1D3532] cursor-pointer"
                  >
                    {demo.label}
                  </button>
                ))}
              </div>
            </section>
          )}

          {/* STEP 3: Review & Confirm */}
          <section className="bg-white rounded-2xl p-6 shadow-sm border border-[#8FB5AE]/25 space-y-4">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <h2 className="font-display text-lg font-bold text-[#1D3532]">
                Langkah 3 · Tinjau & Konfirmasi Persamaan
              </h2>
              {parsedFormula.valid ? (
                <span className="text-xs font-semibold text-[#1D3532] flex items-center gap-1">
                  <CheckCircle2 className="w-4 h-4 text-[#8FB5AE]" /> Sintaks Valid
                </span>
              ) : (
                <span className="text-xs font-semibold text-[#E26D62] flex items-center gap-1">
                  <AlertCircle className="w-4 h-4" /> Persamaan Tidak Didukung
                </span>
              )}
            </div>

            <div className="bg-[#CBE2DD]/35 rounded-xl p-3 flex items-start gap-2.5 text-xs text-[#1D3532]">
              <AlertTriangle className="w-4 h-4 text-[#8C685C] shrink-0 mt-0.5" />
              <p>
                Hasil OCR gambar atau PDF mungkin keliru membaca pangkat, tanda akar, atau huruf Yunani. Mohon periksa dan perbaiki ekspresi di bawah sebelum mengonfirmasi perhitungan.
              </p>
            </div>

            <div>
              <label htmlFor="custom-formula-input" className="block text-xs font-semibold text-[#1D3532] mb-1.5">
                Editor Persamaan (Operator: +, -, *, /, ^, tanda kurung, sin, cos, tan, sqrt, abs, log, exp)
              </label>
              <input
                id="custom-formula-input"
                type="text"
                value={formulaText}
                onChange={(e) => handleFormulaChange(e.target.value)}
                placeholder="Contoh: Ek = 0.5 * m * v^2"
                className="w-full px-4 py-2.5 rounded-xl bg-[#EFF5F4] border border-[#8FB5AE]/50 font-mono-tabular text-sm font-semibold text-[#1D3532] focus:outline-none focus:border-[#E26D62]"
              />
            </div>

            {parsedFormula.valid ? (
              <div className="bg-[#EFF5F4] rounded-xl p-4 text-center overflow-x-auto">
                <p className="text-[11px] text-[#4F6A66] mb-1">Pratinjau Notasi Matematika</p>
                <MathDisplay latex={parsedFormula.latexPreview} block />
              </div>
            ) : (
              <div className="bg-[#E26D62]/15 border border-[#E26D62]/40 rounded-xl p-4 text-xs text-[#1D3532]">
                <p className="font-bold text-[#E26D62]">Persamaan Belum Dapat Diproses</p>
                <p className="mt-1">{parsedFormula.error}</p>
              </div>
            )}

            <label className="flex items-center gap-2.5 p-3 rounded-xl bg-[#EFF5F4] cursor-pointer select-none">
              <input
                type="checkbox"
                checked={userConfirmed}
                disabled={!parsedFormula.valid}
                onChange={(e) => {
                  setUserConfirmed(e.target.checked);
                  if (!e.target.checked) setHasCalculated(false);
                }}
                className="w-4 h-4 accent-[#E26D62]"
              />
              <span className="text-xs font-semibold text-[#1D3532]">
                Saya telah memeriksa persamaan di atas dan mengonfirmasi bahwa penulisannya sudah benar.
              </span>
            </label>
          </section>

          {/* STEP 4 & 5: Define Variables & Configure Formula */}
          <section className="bg-white rounded-2xl p-6 shadow-sm border border-[#8FB5AE]/25 space-y-4">
            <h2 className="font-display text-lg font-bold text-[#1D3532]">
              Langkah 4 & 5 · Definisikan Variabel & Konfigurasi Sumbu
            </h2>

            {parsedFormula.valid ? (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-[#EFF5F4] rounded-xl p-4">
                  <div>
                    <label className="block text-xs font-semibold text-[#1D3532] mb-1">
                      Variabel Terikat (Output Sumbu Y)
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        readOnly
                        value={parsedFormula.dependentVar}
                        className="w-24 px-3 py-1.5 rounded-lg bg-white font-mono-tabular text-xs font-bold text-[#E26D62]"
                      />
                      <input
                        type="text"
                        value={dependentUnit}
                        onChange={(e) => setDependentUnit(e.target.value)}
                        placeholder="Satuan (mis: J)"
                        className="flex-1 px-3 py-1.5 rounded-lg bg-white text-xs text-[#1D3532]"
                      />
                    </div>
                  </div>

                  <div>
                    <label htmlFor="indep-select" className="block text-xs font-semibold text-[#1D3532] mb-1">
                      Variabel Bebas (Sumbu X Grafik)
                    </label>
                    <select
                      id="indep-select"
                      value={independentVar}
                      onChange={(e) => setIndependentVar(e.target.value)}
                      className="w-full px-3 py-1.5 rounded-lg bg-white text-xs font-semibold text-[#1D3532]"
                    >
                      {parsedFormula.variables.length === 0 ? (
                        <option value="">Tidak ada variabel bebas</option>
                      ) : (
                        parsedFormula.variables.map((v) => (
                          <option key={v} value={v}>
                            {v} ({variablesConfig[v]?.unit || 'SI'})
                          </option>
                        ))
                      )}
                    </select>
                  </div>
                </div>

                {parsedFormula.variables.length > 0 && (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="bg-[#EFF5F4] text-[#1D3532]">
                          <th className="py-2 px-2.5 rounded-l-lg">Variabel</th>
                          <th className="py-2 px-2.5">Deskripsi</th>
                          <th className="py-2 px-2.5">Satuan</th>
                          <th className="py-2 px-2.5">Nilai Awal</th>
                          <th className="py-2 px-2.5">Min</th>
                          <th className="py-2 px-2.5">Maks</th>
                          <th className="py-2 px-2.5 rounded-r-lg">Step</th>
                        </tr>
                      </thead>
                      <tbody>
                        {parsedFormula.variables.map((vName) => {
                          const cfg = variablesConfig[vName] || {
                            name: vName,
                            description: `Variabel ${vName}`,
                            unit: 'SI',
                            initialValue: 2,
                            minValue: 1,
                            maxValue: 10,
                            stepSize: 0.5,
                          };
                          const updateField = (field: keyof CustomVariableConfig, val: string | number) => {
                            setVariablesConfig((prev) => ({
                              ...prev,
                              [vName]: { ...cfg, [field]: val },
                            }));
                          };
                          return (
                            <tr key={vName} className="border-b border-[#CBE2DD]/50">
                              <td className="py-2 px-2.5 font-mono-tabular font-bold text-[#1D3532]">
                                {vName}
                              </td>
                              <td className="py-2 px-2.5">
                                <input
                                  type="text"
                                  value={cfg.description}
                                  onChange={(e) => updateField('description', e.target.value)}
                                  className="w-28 px-2 py-1 rounded bg-[#EFF5F4] text-xs"
                                />
                              </td>
                              <td className="py-2 px-2.5">
                                <input
                                  type="text"
                                  value={cfg.unit}
                                  onChange={(e) => updateField('unit', e.target.value)}
                                  className="w-14 px-2 py-1 rounded bg-[#EFF5F4] font-mono-tabular text-xs"
                                />
                              </td>
                              <td className="py-2 px-2.5">
                                <input
                                  type="number"
                                  value={cfg.initialValue}
                                  onChange={(e) => updateField('initialValue', Number(e.target.value))}
                                  className="w-16 px-2 py-1 rounded bg-[#EFF5F4] font-mono-tabular text-xs"
                                />
                              </td>
                              <td className="py-2 px-2.5">
                                <input
                                  type="number"
                                  value={cfg.minValue}
                                  onChange={(e) => updateField('minValue', Number(e.target.value))}
                                  className="w-16 px-2 py-1 rounded bg-[#EFF5F4] font-mono-tabular text-xs"
                                />
                              </td>
                              <td className="py-2 px-2.5">
                                <input
                                  type="number"
                                  value={cfg.maxValue}
                                  onChange={(e) => updateField('maxValue', Number(e.target.value))}
                                  className="w-16 px-2 py-1 rounded bg-[#EFF5F4] font-mono-tabular text-xs"
                                />
                              </td>
                              <td className="py-2 px-2.5">
                                <input
                                  type="number"
                                  min={0.01}
                                  step={0.1}
                                  value={cfg.stepSize}
                                  onChange={(e) => updateField('stepSize', Number(e.target.value))}
                                  className="w-16 px-2 py-1 rounded bg-[#EFF5F4] font-mono-tabular text-xs"
                                />
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}

                <div className="flex flex-wrap gap-3 pt-2">
                  <button
                    type="button"
                    disabled={!userConfirmed || !parsedFormula.valid}
                    onClick={() => setHasCalculated(true)}
                    className="px-5 py-2.5 rounded-xl bg-[#E26D62] hover:bg-[#cf5e53] disabled:opacity-45 text-white text-sm font-semibold flex items-center gap-2 cursor-pointer"
                  >
                    <Play className="w-4 h-4" />
                    Langkah 6 & 7 · Hitung & Buat Grafik
                  </button>
                  {onLaunchInSimulator && (
                    <button
                      type="button"
                      disabled={!userConfirmed || !parsedFormula.valid}
                      onClick={() =>
                        onLaunchInSimulator({
                          formula: formulaText,
                          unit: dependentUnit,
                          independentVar,
                          variablesConfig,
                        })
                      }
                      className="px-4 py-2.5 rounded-xl bg-[#1D3532] hover:bg-[#2a4a46] disabled:opacity-45 text-white text-sm font-semibold cursor-pointer transition-colors"
                    >
                      Buka di Ruang Simulasi
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => {
                      setUserConfirmed(false);
                      setHasCalculated(false);
                    }}
                    className="px-4 py-2.5 rounded-xl bg-[#EFF5F4] text-[#1D3532] text-sm font-semibold flex items-center gap-1.5 cursor-pointer"
                  >
                    <RotateCcw className="w-4 h-4" />
                    Reset
                  </button>
                </div>
              </>
            ) : (
              <p className="text-xs text-[#4F6A66]">
                Perbaiki sintaks persamaan pada Langkah 3 terlebih dahulu untuk mendefinisikan variabel.
              </p>
            )}
          </section>
        </div>

        {/* RIGHT COLUMN (Steps 6 & 7: Calculate & Visualize) */}
        <div className="lg:col-span-5 space-y-5">
          <section className="bg-white rounded-2xl p-6 shadow-sm border border-[#8FB5AE]/25 space-y-5">
            <div className="flex items-center justify-between">
              <h2 className="font-display text-lg font-bold text-[#1D3532]">
                Hasil Evaluasi & Grafik Dinamis
              </h2>
              {evaluationResult && !evaluationResult.error && (
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleDownloadPng}
                    className="px-2.5 py-1.5 rounded-lg bg-[#EFF5F4] text-[#1D3532] text-xs font-semibold flex items-center gap-1 cursor-pointer"
                  >
                    <ImageIcon className="w-3.5 h-3.5" /> PNG
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      exportDataToCsv(
                        `physilab_custom_${parsedFormula.dependentVar}.csv`,
                        [
                          `${independentVar} (${indepConfig?.unit || 'SI'})`,
                          `${parsedFormula.dependentVar} (${dependentUnit})`,
                        ],
                        evaluationResult.points.map((p) => [p.x, p.y])
                      )
                    }
                    className="px-2.5 py-1.5 rounded-lg bg-[#1D3532] text-white text-xs font-semibold flex items-center gap-1 cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5" /> CSV
                  </button>
                </div>
              )}
            </div>

            {!userConfirmed || !hasCalculated ? (
              <div className="bg-[#EFF5F4] rounded-2xl p-8 text-center space-y-2">
                <p className="font-display text-base font-bold text-[#1D3532]">
                  Menunggu Konfirmasi & Perhitungan
                </p>
                <p className="text-xs text-[#4F6A66] max-w-sm mx-auto">
                  Centang kotak konfirmasi pada Langkah 3, atur variabel pada Langkah 4–5, lalu tekan tombol <strong>Hitung & Buat Grafik</strong>.
                </p>
              </div>
            ) : evaluationResult?.error ? (
              <div className="bg-[#E26D62]/15 border border-[#E26D62]/40 rounded-xl p-4 text-xs text-[#1D3532] flex items-start gap-2.5">
                <AlertCircle className="w-5 h-5 text-[#E26D62] shrink-0" />
                <div>
                  <p className="font-bold">Evaluasi Tidak Dapat Dilanjutkan</p>
                  <p className="mt-1">{evaluationResult.error}</p>
                </div>
              </div>
            ) : (
              evaluationResult && (
                <>
                  <div className="bg-[#1D3532] text-white rounded-2xl p-5">
                    <span className="text-xs text-[#95B3A6]">
                      Nilai pada kondisi awal ({parsedFormula.dependentVar})
                    </span>
                    <p className="font-mono-tabular text-3xl font-bold mt-1">
                      {evaluationResult.singleValue !== null
                        ? Math.abs(evaluationResult.singleValue) < 0.001 &&
                          evaluationResult.singleValue !== 0
                          ? evaluationResult.singleValue.toExponential(3)
                          : Number(evaluationResult.singleValue.toFixed(4))
                        : '—'}{' '}
                      <span className="text-base text-[#E26D62]">{dependentUnit}</span>
                    </p>
                  </div>

                  <div
                    ref={chartContainerRef}
                    className="w-full h-72 bg-[#EFF5F4]/60 rounded-2xl p-3 border border-[#8FB5AE]/30"
                  >
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart
                        data={evaluationResult.points}
                        margin={{ top: 10, right: 16, left: 6, bottom: 18 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" stroke="#CBE2DD" />
                        <XAxis
                          dataKey="x"
                          tick={{ fontSize: 10, fill: '#4F6A66' }}
                          label={{
                            value: `${independentVar} (${indepConfig?.unit || 'SI'})`,
                            position: 'insideBottom',
                            offset: -10,
                            fontSize: 11,
                            fill: '#1D3532',
                          }}
                        />
                        <YAxis
                          tick={{ fontSize: 10, fill: '#4F6A66' }}
                          label={{
                            value: `${parsedFormula.dependentVar} (${dependentUnit})`,
                            angle: -90,
                            position: 'insideLeft',
                            fontSize: 11,
                            fill: '#1D3532',
                          }}
                        />
                        <Tooltip />
                        <Legend verticalAlign="top" height={28} />
                        <Line
                          type="monotone"
                          dataKey="y"
                          name={`${parsedFormula.dependentVar} (${dependentUnit})`}
                          stroke="#E26D62"
                          strokeWidth={2.5}
                          dot={{ r: 2.5, fill: '#1D3532' }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>

                  <div className="overflow-x-auto max-h-48">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead className="sticky top-0 bg-[#EFF5F4] text-[#1D3532]">
                        <tr>
                          <th className="py-2 px-3 rounded-l-lg">
                            {independentVar} ({indepConfig?.unit || 'SI'})
                          </th>
                          <th className="py-2 px-3 rounded-r-lg">
                            {parsedFormula.dependentVar} ({dependentUnit})
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {evaluationResult.points.slice(0, 20).map((pt, idx) => (
                          <tr key={idx} className="border-b border-[#CBE2DD]/50 font-mono-tabular">
                            <td className="py-1.5 px-3 text-[#1D3532]">{pt.x}</td>
                            <td className="py-1.5 px-3 font-semibold text-[#E26D62]">{pt.y}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </>
              )
            )}
          </section>
        </div>
      </div>
    </div>
  );
};
