import {
  CalculatorFormulaDef,
  GraphPresetDef,
  ModuleMeta,
  SimulationMeta,
} from '../types/physics';

export const PHYSICS_CONSTANTS = {
  g: 9.80665, // m/s^2
  G: 6.6743e-11, // N m^2 / kg^2
  R: 8.314462618, // J / (mol K)
  c: 299792458, // m/s
};

export const MODULES: ModuleMeta[] = [
  {
    id: 'besaran',
    number: '01',
    title: 'Besaran Fisika dan Satuan',
    shortTitle: 'Besaran & Satuan',
    description:
      'Memahami besaran pokok, besaran turunan, standar Satuan Internasional (SI), analisis dimensi, konversi satuan presisi, dan simulator instrumen pengukuran.',
    concepts: [
      'Besaran pokok',
      'Besaran turunan',
      'Satuan SI',
      'Analisis dimensi',
      'Konversi satuan',
      'Pengukuran',
    ],
    formulasLatex: [
      'v = \\frac{\\Delta x}{\\Delta t} \\; [\\text{L}\\text{T}^{-1}]',
      'F = m \\cdot a \\; [\\text{M}\\text{L}\\text{T}^{-2}]',
      'E = \\frac{1}{2}mv^2 \\; [\\text{M}\\text{L}^2\\text{T}^{-2}]',
    ],
    defaultSimId: 'pengukuran',
  },
  {
    id: 'kinematika',
    number: '02',
    title: 'Kinematika',
    shortTitle: 'Kinematika',
    description:
      'Analisis gerak benda tanpa meninjau penyebabnya: jarak & perpindahan, GLB, GLBB, gerak jatuh bebas, hingga gerak parabola dengan grafik real-time.',
    concepts: [
      'Jarak dan perpindahan',
      'Kelajuan dan kecepatan',
      'Percepatan',
      'Gerak Lurus Beraturan (GLB)',
      'Gerak Lurus Berubah Beraturan (GLBB)',
      'Gerak jatuh bebas',
      'Gerak parabola',
    ],
    formulasLatex: [
      'v = \\frac{\\Delta x}{\\Delta t}, \\quad x = x_0 + vt',
      'v = v_0 + at, \\quad s = v_0 t + \\frac{1}{2}at^2',
      'x = v_0\\cos(\\theta)t, \\quad y = v_0\\sin(\\theta)t - \\frac{1}{2}gt^2',
    ],
    defaultSimId: 'parabola',
  },
  {
    id: 'dinamika',
    number: '03',
    title: 'Dinamika',
    shortTitle: 'Dinamika',
    description:
      'Menyelidiki hubungan gaya dan gerak melalui Hukum Newton I–III, gravitasi universal, gaya normal, gaya gesek statis/kinetis, bidang miring, dan diagram benda bebas.',
    concepts: [
      'Hukum Newton I, II, III',
      'Gaya gravitasi',
      'Gaya normal',
      'Gaya gesek statis & kinetis',
      'Bidang miring',
      'Diagram benda bebas',
    ],
    formulasLatex: [
      '\\Sigma F = ma, \\quad w = mg',
      'f_s \\le \\mu_s N, \\quad f_k = \\mu_k N, \\quad N = mg\\cos(\\theta)',
      'F = G\\frac{m_1 m_2}{r^2}',
    ],
    defaultSimId: 'newton2',
  },
  {
    id: 'energi',
    number: '04',
    title: 'Energi, Usaha, dan Daya',
    shortTitle: 'Energi',
    description:
      'Eksplorasi usaha mekanik, energi kinetik, potensial gravitasi, potensial pegas, hukum kekekalan energi mekanik pada roller coaster & pendulum, serta daya.',
    concepts: [
      'Usaha mekanik',
      'Energi kinetik',
      'Energi potensial gravitasi',
      'Energi potensial pegas',
      'Energi mekanik',
      'Kekekalan energi',
      'Daya',
    ],
    formulasLatex: [
      'W = Fs\\cos(\\theta), \\quad P = \\frac{W}{t}',
      'E_k = \\frac{1}{2}mv^2, \\quad E_p = mgh',
      'E_e = \\frac{1}{2}kx^2, \\quad E_m = E_k + E_p',
    ],
    defaultSimId: 'roller-coaster',
  },
  {
    id: 'termodinamika',
    number: '05',
    title: 'Termodinamika',
    shortTitle: 'Termodinamika',
    description:
      'Pelajari suhu, kalor, kapasitas kalor, hukum gas ideal dengan simulasi partikel, Hukum I Termodinamika pada piston, serta diagram P-V isotermal, isobarik, dan isokhorik.',
    concepts: [
      'Suhu dan kalor',
      'Kapasitas kalor',
      'Gas ideal',
      'Hukum I Termodinamika',
      'Proses Isotermal',
      'Proses Isobarik',
      'Proses Isokhorik',
    ],
    formulasLatex: [
      'Q = mc\\Delta T, \\quad PV = nRT',
      '\\Delta U = Q - W, \\quad \\Delta U = nC_v\\Delta T',
      'W = P\\Delta V',
    ],
    defaultSimId: 'gas-ideal',
  },
];

export const SIMULATIONS: SimulationMeta[] = [
  // Module 01
  {
    id: 'pengukuran',
    moduleId: 'besaran',
    title: 'Simulator Pengukuran Lab',
    subtitle: 'Mistar Digital, Neraca Digital, & Stopwatch',
    formulaLatex: '\\text{Hasil} = x \\pm \\Delta x',
    description: 'Ukur panjang balok dengan mistar, timbang massa benda di neraca digital, dan catat selang waktu dengan stopwatch presisi.',
  },
  {
    id: 'konversi',
    moduleId: 'besaran',
    title: 'Konverter Satuan SI',
    subtitle: 'Panjang, Massa, Waktu, Suhu, Kecepatan, Luas & Volume',
    formulaLatex: 'X_{\\text{SI}} = k \\cdot X_{\\text{asal}}',
    description: 'Konversi akurat antar satuan metrik, imperial, dan skala termometrik (C, K, F, R).',
  },
  {
    id: 'dimensi',
    moduleId: 'besaran',
    title: 'Analisis Dimensi & Besaran',
    subtitle: 'Besaran Pokok, Turunan, & Pemeriksa Dimensi',
    formulaLatex: '[Q] = \\text{M}^a\\text{L}^b\\text{T}^c\\Theta^d',
    description: 'Telusuri 7 besaran pokok SI dan buktikan kesetaraan dimensi besaran turunan.',
  },
  // Module 02
  {
    id: 'glb',
    moduleId: 'kinematika',
    title: 'Gerak Lurus Beraturan (GLB)',
    subtitle: 'Kecepatan Konstan pada Lintasan Lurus',
    formulaLatex: 'x(t) = x_0 + v \\cdot t',
    description: 'Amati gerak benda berkecepatan tetap dengan grafik posisi-waktu linier.',
  },
  {
    id: 'glbb',
    moduleId: 'kinematika',
    title: 'GLBB & Gerak Jatuh Bebas',
    subtitle: 'Percepatan Konstan 1D & Vertikal',
    formulaLatex: 'v = v_0 + at, \\quad s = v_0 t + \\frac{1}{2}at^2',
    description: 'Simulasi gerak dipercepat beraturan mendatar maupun jatuh bebas vertikal akibat gravitasi.',
  },
  {
    id: 'parabola',
    moduleId: 'kinematika',
    title: 'Gerak Parabola (Proyektil)',
    subtitle: 'Lintasan 2D dengan Vektor Kecepatan',
    formulaLatex: 'x = v_0\\cos(\\theta)t, \\quad y = v_0\\sin(\\theta)t - \\frac{1}{2}gt^2',
    description: 'Ubah laju awal, sudut tembak, dan gravitasi untuk mengamati tinggi maksimum dan jangkauan.',
  },
  // Module 03
  {
    id: 'newton2',
    moduleId: 'dinamika',
    title: 'Hukum Newton II',
    subtitle: 'Hubungan Gaya Netto, Massa, & Percepatan',
    formulaLatex: '\\Sigma F = m \\cdot a',
    description: 'Berikan gaya dorong pada balok bermassa m dan amati percepatan real-time.',
  },
  {
    id: 'gesek',
    moduleId: 'dinamika',
    title: 'Gaya Gesek Statis & Kinetis',
    subtitle: 'Ambang Gerak & Koefisien Gesek',
    formulaLatex: 'f_s \\le \\mu_s N, \\quad f_k = \\mu_k N',
    description: 'Bandingkan gaya dorong terhadap gaya gesek statis maksimum hingga benda mulai meluncur.',
  },
  {
    id: 'bidang-miring',
    moduleId: 'dinamika',
    title: 'Dinamika Bidang Miring',
    subtitle: 'Dekomposisi Berat, Normal, & Gesekan',
    formulaLatex: 'N = mg\\cos(\\theta), \\quad F_{\\parallel} = mg\\sin(\\theta)',
    description: 'Visualisasi vektor gaya berat, normal, dan gesekan pada kemiringan sudut tertentu.',
  },
  {
    id: 'fbd',
    moduleId: 'dinamika',
    title: 'Diagram Benda Bebas (FBD)',
    subtitle: 'Komposisi Vektor Gaya 2D & Resultan',
    formulaLatex: '\\vec{F}_{\\text{net}} = \\Sigma \\vec{F}_i',
    description: 'Atur komponen gaya dari empat arah dan amati vektor resultan serta percepatannya.',
  },
  // Module 04
  {
    id: 'roller-coaster',
    moduleId: 'energi',
    title: 'Simulasi Roller Coaster',
    subtitle: 'Kekekalan Energi Mekanik & Rugi Gesekan',
    formulaLatex: 'E_m = E_k + E_p = \\frac{1}{2}mv^2 + mgh',
    description: 'Lacak transformasi energi potensial dan kinetik sepanjang lintasan berbukit.',
  },
  {
    id: 'pendulum',
    moduleId: 'energi',
    title: 'Bandul Matematis (Pendulum)',
    subtitle: 'Osilasi & Pertukaran Ek ↔ Ep',
    formulaLatex: 'T = 2\\pi\\sqrt{\\frac{L}{g}}, \\quad E_m = E_k + E_p',
    description: 'Atur panjang tali dan sudut awal untuk mengamati ayunan serta diagram energinya.',
  },
  {
    id: 'pegas',
    moduleId: 'energi',
    title: 'Sistem Pegas Elastis',
    subtitle: 'Hukum Hooke & Energi Potensial Pegas',
    formulaLatex: 'F = -kx, \\quad E_e = \\frac{1}{2}kx^2',
    description: 'Simulasi osilasi pegas-massa dengan konstanta pegas dan simpangan yang dapat diatur.',
  },
  // Module 05
  {
    id: 'kalor',
    moduleId: 'termodinamika',
    title: 'Perpindahan Kalor',
    subtitle: 'Kalor Jenis & Perubahan Suhu Benda',
    formulaLatex: 'Q = m \\cdot c \\cdot \\Delta T',
    description: 'Hitung energi kalor yang dibutuhkan untuk memanaskan atau mendinginkan suatu zat.',
  },
  {
    id: 'gas-ideal',
    moduleId: 'termodinamika',
    title: 'Ruang Partikel Gas Ideal',
    subtitle: 'Teori Kinetik Gas & Tekanan Wadah',
    formulaLatex: 'PV = nRT',
    description: 'Amati tumbukan partikel gas yang kecepatannya bergantung pada suhu dan tekanannya.',
  },
  {
    id: 'piston',
    moduleId: 'termodinamika',
    title: 'Simulasi Piston Termodinamika',
    subtitle: 'Hukum I Termodinamika (ΔU = Q - W)',
    formulaLatex: '\\Delta U = Q - W, \\quad W = P\\Delta V',
    description: 'Berikan kalor Q pada silinder piston isobarik untuk melihat kerja luar dan perubahan energi dalam.',
  },
  {
    id: 'diagram-pv',
    moduleId: 'termodinamika',
    title: 'Diagram P-V Proses Gas',
    subtitle: 'Isotermal, Isobarik, & Isokhorik',
    formulaLatex: 'W = \\int_{V_1}^{V_2} P\\,dV',
    description: 'Visualisasi kurva tekanan terhadap volume beserta luas area usaha sistem.',
  },
];

// ==========================================
// 1. KONVERSI SATUAN AKURAT (MODUL 01)
// ==========================================
export type UnitCategory = 'panjang' | 'massa' | 'waktu' | 'suhu' | 'kecepatan' | 'luas' | 'volume';

export interface UnitDefinition {
  id: string;
  label: string;
  symbol: string;
  toBase: (val: number) => number;
  fromBase: (base: number) => number;
}

export const UNIT_CONVERSIONS: Record<
  UnitCategory,
  { label: string; baseUnit: string; units: UnitDefinition[] }
> = {
  panjang: {
    label: 'Panjang',
    baseUnit: 'm',
    units: [
      { id: 'km', label: 'Kilometer', symbol: 'km', toBase: (v) => v * 1000, fromBase: (v) => v / 1000 },
      { id: 'm', label: 'Meter (SI)', symbol: 'm', toBase: (v) => v, fromBase: (v) => v },
      { id: 'cm', label: 'Sentimeter', symbol: 'cm', toBase: (v) => v * 0.01, fromBase: (v) => v / 0.01 },
      { id: 'mm', label: 'Milimeter', symbol: 'mm', toBase: (v) => v * 0.001, fromBase: (v) => v / 0.001 },
      { id: 'um', label: 'Mikrometer', symbol: 'μm', toBase: (v) => v * 1e-6, fromBase: (v) => v / 1e-6 },
      { id: 'in', label: 'Inci', symbol: 'in', toBase: (v) => v * 0.0254, fromBase: (v) => v / 0.0254 },
      { id: 'ft', label: 'Kaki (Foot)', symbol: 'ft', toBase: (v) => v * 0.3048, fromBase: (v) => v / 0.3048 },
      { id: 'mi', label: 'Mil', symbol: 'mi', toBase: (v) => v * 1609.344, fromBase: (v) => v / 1609.344 },
    ],
  },
  massa: {
    label: 'Massa',
    baseUnit: 'kg',
    units: [
      { id: 'ton', label: 'Ton Metrik', symbol: 't', toBase: (v) => v * 1000, fromBase: (v) => v / 1000 },
      { id: 'kg', label: 'Kilogram (SI)', symbol: 'kg', toBase: (v) => v, fromBase: (v) => v },
      { id: 'g', label: 'Gram', symbol: 'g', toBase: (v) => v * 0.001, fromBase: (v) => v / 0.001 },
      { id: 'mg', label: 'Miligram', symbol: 'mg', toBase: (v) => v * 1e-6, fromBase: (v) => v / 1e-6 },
      { id: 'lb', label: 'Pon (Pound)', symbol: 'lb', toBase: (v) => v * 0.45359237, fromBase: (v) => v / 0.45359237 },
      { id: 'oz', label: 'Ons (Ounce)', symbol: 'oz', toBase: (v) => v * 0.028349523125, fromBase: (v) => v / 0.028349523125 },
    ],
  },
  waktu: {
    label: 'Waktu',
    baseUnit: 's',
    units: [
      { id: 'ms', label: 'Milidetik', symbol: 'ms', toBase: (v) => v * 0.001, fromBase: (v) => v / 0.001 },
      { id: 's', label: 'Detik / Sekon (SI)', symbol: 's', toBase: (v) => v, fromBase: (v) => v },
      { id: 'min', label: 'Menit', symbol: 'menit', toBase: (v) => v * 60, fromBase: (v) => v / 60 },
      { id: 'jam', label: 'Jam', symbol: 'jam', toBase: (v) => v * 3600, fromBase: (v) => v / 3600 },
      { id: 'hari', label: 'Hari', symbol: 'hari', toBase: (v) => v * 86400, fromBase: (v) => v / 86400 },
    ],
  },
  suhu: {
    label: 'Suhu',
    baseUnit: 'K',
    units: [
      { id: 'C', label: 'Celcius', symbol: '°C', toBase: (v) => v + 273.15, fromBase: (v) => v - 273.15 },
      { id: 'K', label: 'Kelvin (SI)', symbol: 'K', toBase: (v) => v, fromBase: (v) => v },
      { id: 'F', label: 'Fahrenheit', symbol: '°F', toBase: (v) => ((v - 32) * 5) / 9 + 273.15, fromBase: (v) => ((v - 273.15) * 9) / 5 + 32 },
      { id: 'R', label: 'Reamur', symbol: '°R', toBase: (v) => (v * 5) / 4 + 273.15, fromBase: (v) => ((v - 273.15) * 4) / 5 },
    ],
  },
  kecepatan: {
    label: 'Kecepatan',
    baseUnit: 'm/s',
    units: [
      { id: 'ms', label: 'Meter per detik (SI)', symbol: 'm/s', toBase: (v) => v, fromBase: (v) => v },
      { id: 'kmh', label: 'Kilometer per jam', symbol: 'km/jam', toBase: (v) => v / 3.6, fromBase: (v) => v * 3.6 },
      { id: 'cms', label: 'Sentimeter per detik', symbol: 'cm/s', toBase: (v) => v * 0.01, fromBase: (v) => v * 100 },
      { id: 'mph', label: 'Mil per jam', symbol: 'mph', toBase: (v) => v * 0.44704, fromBase: (v) => v / 0.44704 },
      { id: 'knot', label: 'Knot', symbol: 'kn', toBase: (v) => v * 0.514444, fromBase: (v) => v / 0.514444 },
    ],
  },
  luas: {
    label: 'Luas',
    baseUnit: 'm²',
    units: [
      { id: 'km2', label: 'Kilometer persegi', symbol: 'km²', toBase: (v) => v * 1e6, fromBase: (v) => v / 1e6 },
      { id: 'ha', label: 'Hektar', symbol: 'ha', toBase: (v) => v * 1e4, fromBase: (v) => v / 1e4 },
      { id: 'm2', label: 'Meter persegi (SI)', symbol: 'm²', toBase: (v) => v, fromBase: (v) => v },
      { id: 'cm2', label: 'Sentimeter persegi', symbol: 'cm²', toBase: (v) => v * 1e-4, fromBase: (v) => v * 1e4 },
      { id: 'mm2', label: 'Milimeter persegi', symbol: 'mm²', toBase: (v) => v * 1e-6, fromBase: (v) => v * 1e6 },
    ],
  },
  volume: {
    label: 'Volume',
    baseUnit: 'm³',
    units: [
      { id: 'm3', label: 'Meter kubik (SI)', symbol: 'm³', toBase: (v) => v, fromBase: (v) => v },
      { id: 'L', label: 'Liter (dm³)', symbol: 'L', toBase: (v) => v * 0.001, fromBase: (v) => v * 1000 },
      { id: 'mL', label: 'Mililiter (cm³)', symbol: 'mL', toBase: (v) => v * 1e-6, fromBase: (v) => v * 1e6 },
      { id: 'gal', label: 'Galon (US)', symbol: 'gal', toBase: (v) => v * 0.003785411784, fromBase: (v) => v / 0.003785411784 },
    ],
  },
};

export function convertUnitValue(
  category: UnitCategory,
  value: number,
  fromUnitId: string,
  toUnitId: string
): number {
  const cat = UNIT_CONVERSIONS[category];
  const fromDef = cat.units.find((u) => u.id === fromUnitId);
  const toDef = cat.units.find((u) => u.id === toUnitId);
  if (!fromDef || !toDef) return value;
  const base = fromDef.toBase(value);
  return toDef.fromBase(base);
}

export const BESARAN_POKOK = [
  { nama: 'Panjang', satuan: 'meter', simbol: 'm', dimensi: '[L]', alat: 'Mistar, Jangka Sorong, Mikrometer Sekrup' },
  { nama: 'Massa', satuan: 'kilogram', simbol: 'kg', dimensi: '[M]', alat: 'Neraca Ohaus, Neraca Digital' },
  { nama: 'Waktu', satuan: 'sekon (detik)', simbol: 's', dimensi: '[T]', alat: 'Stopwatch, Jam Atom' },
  { nama: 'Suhu', satuan: 'kelvin', simbol: 'K', dimensi: '[Θ]', alat: 'Termometer' },
  { nama: 'Kuat Arus Listrik', satuan: 'ampere', simbol: 'A', dimensi: '[I]', alat: 'Amperemeter' },
  { nama: 'Intensitas Cahaya', satuan: 'kandela', simbol: 'cd', dimensi: '[J]', alat: 'Luxmeter / Fotometer' },
  { nama: 'Jumlah Zat', satuan: 'mol', simbol: 'mol', dimensi: '[N]', alat: 'Pengukuran Massa Molar' },
];

export const BESARAN_TURUNAN = [
  { nama: 'Luas', rumus: 'p × l', satuan: 'm²', dimensi: '[L]²', m: 0, l: 2, t: 0 },
  { nama: 'Volume', rumus: 'p × l × t', satuan: 'm³', dimensi: '[L]³', m: 0, l: 3, t: 0 },
  { nama: 'Massa Jenis', rumus: 'm / V', satuan: 'kg/m³', dimensi: '[M][L]⁻³', m: 1, l: -3, t: 0 },
  { nama: 'Kecepatan', rumus: 'Δx / Δt', satuan: 'm/s', dimensi: '[L][T]⁻¹', m: 0, l: 1, t: -1 },
  { nama: 'Percepatan', rumus: 'Δv / Δt', satuan: 'm/s²', dimensi: '[L][T]⁻²', m: 0, l: 1, t: -2 },
  { nama: 'Gaya', rumus: 'm × a', satuan: 'Newton (kg·m/s²)', dimensi: '[M][L][T]⁻²', m: 1, l: 1, t: -2 },
  { nama: 'Usaha & Energi', rumus: 'F × s', satuan: 'Joule (kg·m²/s²)', dimensi: '[M][L]²[T]⁻²', m: 1, l: 2, t: -2 },
  { nama: 'Daya', rumus: 'W / t', satuan: 'Watt (kg·m²/s³)', dimensi: '[M][L]²[T]⁻³', m: 1, l: 2, t: -3 },
  { nama: 'Tekanan', rumus: 'F / A', satuan: 'Pascal (kg/(m·s²))', dimensi: '[M][L]⁻¹[T]⁻²', m: 1, l: -1, t: -2 },
];

// ==========================================
// 2. KALKULATOR FISIKA UNIVERSAL (SEMUA 5 MODUL)
// ==========================================
export const CALCULATOR_FORMULAS: CalculatorFormulaDef[] = [
  // Modul 01
  {
    id: 'calc-massa-jenis',
    moduleId: 'besaran',
    name: 'Massa Jenis Zat (ρ = m / V)',
    formulaLatex: '\\rho = \\frac{m}{V}',
    outputSymbol: 'ρ',
    outputLabel: 'Massa Jenis',
    outputUnit: 'kg/m³',
    inputs: [
      { key: 'm', label: 'Massa benda', symbol: 'm', unit: 'kg', defaultValue: 5, min: 0.01, step: 0.1, mustBePositive: true },
      { key: 'V', label: 'Volume benda', symbol: 'V', unit: 'm³', defaultValue: 0.002, min: 0.0001, step: 0.001, mustBePositive: true },
    ],
    solve: ({ m, V }) => {
      if (V <= 0) return { result: 0, stepsLatex: [], explanation: '', error: 'Volume harus lebih besar dari 0 m³.' };
      const rho = m / V;
      return {
        result: rho,
        stepsLatex: [
          `\\rho = \\frac{m}{V}`,
          `\\rho = \\frac{${m}}{${V}}`,
          `\\rho = ${rho.toFixed(2)}\\text{ kg/m}^3`,
        ],
        explanation: `Dengan massa ${m} kg yang menempati ruang ${V} m³, kerapatan massa zat tersebut adalah ${rho.toFixed(2)} kg/m³.`,
      };
    },
  },
  // Modul 02 Kinematika
  {
    id: 'calc-kecepatan-rata',
    moduleId: 'kinematika',
    name: 'Kecepatan Rata-Rata (v = Δx / Δt)',
    formulaLatex: 'v = \\frac{\\Delta x}{\\Delta t}',
    outputSymbol: 'v',
    outputLabel: 'Kecepatan',
    outputUnit: 'm/s',
    inputs: [
      { key: 'dx', label: 'Perpindahan', symbol: 'Δx', unit: 'm', defaultValue: 120, step: 1 },
      { key: 'dt', label: 'Selang waktu', symbol: 'Δt', unit: 's', defaultValue: 8, min: 0.01, step: 0.5, mustBePositive: true },
    ],
    solve: ({ dx, dt }) => {
      if (dt <= 0) return { result: 0, stepsLatex: [], explanation: '', error: 'Selang waktu (Δt) harus bernilai positif.' };
      const v = dx / dt;
      return {
        result: v,
        stepsLatex: [
          `v = \\frac{\\Delta x}{\\Delta t}`,
          `v = \\frac{${dx}}{${dt}}`,
          `v = ${v.toFixed(3)}\\text{ m/s}`,
        ],
        explanation: `Benda menempuh perpindahan ${dx} meter dalam waktu ${dt} sekon sehingga kecepatan rata-ratanya ${v.toFixed(3)} m/s.`,
      };
    },
  },
  {
    id: 'calc-glbb-jarak',
    moduleId: 'kinematika',
    name: 'Jarak Tempuh GLBB (s = v₀t + ½at²)',
    formulaLatex: 's = v_0 t + \\frac{1}{2}at^2',
    outputSymbol: 's',
    outputLabel: 'Jarak Tempuh',
    outputUnit: 'm',
    inputs: [
      { key: 'v0', label: 'Kecepatan awal', symbol: 'v₀', unit: 'm/s', defaultValue: 4, step: 0.5 },
      { key: 'a', label: 'Percepatan', symbol: 'a', unit: 'm/s²', defaultValue: 2, step: 0.5 },
      { key: 't', label: 'Waktu tempuh', symbol: 't', unit: 's', defaultValue: 5, min: 0, step: 0.5 },
    ],
    solve: ({ v0, a, t }) => {
      if (t < 0) return { result: 0, stepsLatex: [], explanation: '', error: 'Waktu (t) tidak boleh negatif.' };
      const s = v0 * t + 0.5 * a * t * t;
      const vFinal = v0 + a * t;
      return {
        result: s,
        stepsLatex: [
          `s = v_0 t + \\frac{1}{2}at^2`,
          `s = (${v0} \\times ${t}) + 0.5 \\times ${a} \\times ${t}^2`,
          `s = ${(v0 * t).toFixed(2)} + ${(0.5 * a * t * t).toFixed(2)} = ${s.toFixed(2)}\\text{ m}`,
        ],
        explanation: `Selama ${t} detik, benda menempuh jarak ${s.toFixed(2)} m dan mencapai kecepatan akhir v = ${vFinal.toFixed(2)} m/s.`,
      };
    },
  },
  {
    id: 'calc-parabola-jangkauan',
    moduleId: 'kinematika',
    name: 'Jangkauan Gerak Parabola (X_max)',
    formulaLatex: 'X_{\\text{max}} = \\frac{v_0^2 \\sin(2\\theta)}{g}',
    outputSymbol: 'X_max',
    outputLabel: 'Jangkauan Horizontal',
    outputUnit: 'm',
    inputs: [
      { key: 'v0', label: 'Kecepatan awal', symbol: 'v₀', unit: 'm/s', defaultValue: 25, min: 0, step: 1 },
      { key: 'theta', label: 'Sudut elevasi', symbol: 'θ', unit: '°', defaultValue: 45, min: 0, max: 90, step: 1 },
      { key: 'g', label: 'Percepatan gravitasi', symbol: 'g', unit: 'm/s²', defaultValue: 9.8, min: 0.1, step: 0.1, mustBePositive: true },
    ],
    solve: ({ v0, theta, g }) => {
      if (g <= 0) return { result: 0, stepsLatex: [], explanation: '', error: 'Gravitasi (g) harus lebih besar dari 0.' };
      const rad = (theta * Math.PI) / 180;
      const xmax = (v0 * v0 * Math.sin(2 * rad)) / g;
      const hmax = (v0 * v0 * Math.pow(Math.sin(rad), 2)) / (2 * g);
      return {
        result: xmax,
        stepsLatex: [
          `X_{\\text{max}} = \\frac{v_0^2 \\sin(2\\theta)}{g}`,
          `X_{\\text{max}} = \\frac{${v0}^2 \\cdot \\sin(${2 * theta}^\\circ)}{${g}}`,
          `X_{\\text{max}} = ${xmax.toFixed(2)}\\text{ m} \\quad (H_{\\text{max}} = ${hmax.toFixed(2)}\\text{ m})`,
        ],
        explanation: `Proyektil mencapai jarak horizontal maksimum ${xmax.toFixed(2)} m dengan ketinggian puncak ${hmax.toFixed(2)} m.`,
      };
    },
  },
  // Modul 03 Dinamika
  {
    id: 'calc-newton2',
    moduleId: 'dinamika',
    name: 'Hukum Newton II (F = m·a)',
    formulaLatex: 'F = m \\cdot a',
    outputSymbol: 'F',
    outputLabel: 'Gaya Netto',
    outputUnit: 'N',
    inputs: [
      { key: 'm', label: 'Massa benda', symbol: 'm', unit: 'kg', defaultValue: 5, min: 0.01, step: 0.5, mustBePositive: true },
      { key: 'a', label: 'Percepatan', symbol: 'a', unit: 'm/s²', defaultValue: 2, step: 0.5 },
    ],
    solve: ({ m, a }) => {
      if (m <= 0) return { result: 0, stepsLatex: [], explanation: '', error: 'Massa benda harus bernilai positif.' };
      const f = m * a;
      return {
        result: f,
        stepsLatex: [`F = m \\cdot a`, `F = ${m} \\times ${a}`, `F = ${f.toFixed(2)}\\text{ N}`],
        explanation: `Untuk mempercepat benda bermassa ${m} kg sebesar ${a} m/s², dibutuhkan gaya total sebesar ${f.toFixed(2)} Newton.`,
      };
    },
  },
  {
    id: 'calc-gesek-kinetis',
    moduleId: 'dinamika',
    name: 'Gaya Gesek Kinetis Bidang Miring (f_k)',
    formulaLatex: 'f_k = \\mu_k \\cdot m g \\cos(\\theta)',
    outputSymbol: 'f_k',
    outputLabel: 'Gaya Gesek Kinetis',
    outputUnit: 'N',
    inputs: [
      { key: 'muk', label: 'Koefisien gesek kinetis', symbol: 'μₖ', unit: '-', defaultValue: 0.25, min: 0, max: 1.5, step: 0.05 },
      { key: 'm', label: 'Massa benda', symbol: 'm', unit: 'kg', defaultValue: 10, min: 0.1, step: 0.5, mustBePositive: true },
      { key: 'theta', label: 'Sudut kemiringan', symbol: 'θ', unit: '°', defaultValue: 30, min: 0, max: 89, step: 1 },
      { key: 'g', label: 'Gravitasi', symbol: 'g', unit: 'm/s²', defaultValue: 9.8, min: 0.1, step: 0.1, mustBePositive: true },
    ],
    solve: ({ muk, m, theta, g }) => {
      const rad = (theta * Math.PI) / 180;
      const N = m * g * Math.cos(rad);
      const fk = muk * N;
      return {
        result: fk,
        stepsLatex: [
          `N = mg\\cos(\\theta) = ${m} \\times ${g} \\times \\cos(${theta}^\\circ) = ${N.toFixed(2)}\\text{ N}`,
          `f_k = \\mu_k N = ${muk} \\times ${N.toFixed(2)}`,
          `f_k = ${fk.toFixed(2)}\\text{ N}`,
        ],
        explanation: `Pada bidang miring ${theta}°, gaya normal N = ${N.toFixed(2)} N sehingga gaya gesek kinetis yang menghambat gerak adalah ${fk.toFixed(2)} N.`,
      };
    },
  },
  {
    id: 'calc-gravitasi-universal',
    moduleId: 'dinamika',
    name: 'Gaya Gravitasi Universal (F = G·m₁m₂/r²)',
    formulaLatex: 'F = G \\frac{m_1 m_2}{r^2}',
    outputSymbol: 'F',
    outputLabel: 'Gaya Gravitasi',
    outputUnit: 'N',
    inputs: [
      { key: 'm1', label: 'Massa benda 1', symbol: 'm₁', unit: 'kg', defaultValue: 1000, min: 0.1, step: 100, mustBePositive: true },
      { key: 'm2', label: 'Massa benda 2', symbol: 'm₂', unit: 'kg', defaultValue: 500, min: 0.1, step: 50, mustBePositive: true },
      { key: 'r', label: 'Jarak pusat massa', symbol: 'r', unit: 'm', defaultValue: 2, min: 0.1, step: 0.5, mustBePositive: true },
    ],
    solve: ({ m1, m2, r }) => {
      if (r <= 0) return { result: 0, stepsLatex: [], explanation: '', error: 'Jarak (r) harus lebih besar dari 0.' };
      const F = (PHYSICS_CONSTANTS.G * m1 * m2) / (r * r);
      return {
        result: F,
        stepsLatex: [
          `F = G \\frac{m_1 m_2}{r^2}`,
          `F = (6.674 \\times 10^{-11}) \\times \\frac{${m1} \\times ${m2}}{${r}^2}`,
          `F = ${F.toExponential(3)}\\text{ N}`,
        ],
        explanation: `Gaya tarik gravitasi antara kedua massa yang terpisah sejauh ${r} m adalah ${F.toExponential(3)} Newton.`,
      };
    },
  },
  // Modul 04 Energi
  {
    id: 'calc-energi-kinetik',
    moduleId: 'energi',
    name: 'Energi Kinetik (Ek = ½mv²)',
    formulaLatex: 'E_k = \\frac{1}{2} m v^2',
    outputSymbol: 'Ek',
    outputLabel: 'Energi Kinetik',
    outputUnit: 'J',
    inputs: [
      { key: 'm', label: 'Massa benda', symbol: 'm', unit: 'kg', defaultValue: 4, min: 0.1, step: 0.5, mustBePositive: true },
      { key: 'v', label: 'Kecepatan benda', symbol: 'v', unit: 'm/s', defaultValue: 10, step: 0.5 },
    ],
    solve: ({ m, v }) => {
      const ek = 0.5 * m * v * v;
      return {
        result: ek,
        stepsLatex: [
          `E_k = \\frac{1}{2}mv^2`,
          `E_k = 0.5 \\times ${m} \\times ${v}^2`,
          `E_k = ${ek.toFixed(2)}\\text{ J}`,
        ],
        explanation: `Energi gerak benda bermassa ${m} kg pada kelajuan ${v} m/s adalah ${ek.toFixed(2)} Joule.`,
      };
    },
  },
  {
    id: 'calc-energi-pegas',
    moduleId: 'energi',
    name: 'Energi Potensial Pegas (Ee = ½kx²)',
    formulaLatex: 'E_e = \\frac{1}{2} k x^2',
    outputSymbol: 'Ee',
    outputLabel: 'Energi Potensial Pegas',
    outputUnit: 'J',
    inputs: [
      { key: 'k', label: 'Konstanta pegas', symbol: 'k', unit: 'N/m', defaultValue: 200, min: 1, step: 10, mustBePositive: true },
      { key: 'x', label: 'Pertambahan panjang', symbol: 'x', unit: 'm', defaultValue: 0.15, step: 0.01 },
    ],
    solve: ({ k, x }) => {
      const ee = 0.5 * k * x * x;
      return {
        result: ee,
        stepsLatex: [
          `E_e = \\frac{1}{2}kx^2`,
          `E_e = 0.5 \\times ${k} \\times (${x})^2`,
          `E_e = ${ee.toFixed(3)}\\text{ J}`,
        ],
        explanation: `Energi elastis yang tersimpan dalam pegas berkonstanta ${k} N/m saat teregang/tertekan sejauh ${x} m adalah ${ee.toFixed(3)} Joule.`,
      };
    },
  },
  {
    id: 'calc-daya',
    moduleId: 'energi',
    name: 'Usaha dan Daya (P = Fs·cos(θ) / t)',
    formulaLatex: 'P = \\frac{F \\cdot s \\cdot \\cos(\\theta)}{t}',
    outputSymbol: 'P',
    outputLabel: 'Daya Mekanik',
    outputUnit: 'W',
    inputs: [
      { key: 'F', label: 'Gaya dorong', symbol: 'F', unit: 'N', defaultValue: 50, step: 5 },
      { key: 's', label: 'Perpindahan', symbol: 's', unit: 'm', defaultValue: 12, step: 1 },
      { key: 'theta', label: 'Sudut gaya', symbol: 'θ', unit: '°', defaultValue: 0, min: 0, max: 90, step: 5 },
      { key: 't', label: 'Selang waktu', symbol: 't', unit: 's', defaultValue: 4, min: 0.1, step: 0.5, mustBePositive: true },
    ],
    solve: ({ F, s, theta, t }) => {
      if (t <= 0) return { result: 0, stepsLatex: [], explanation: '', error: 'Waktu (t) harus lebih besar dari 0 s.' };
      const W = F * s * Math.cos((theta * Math.PI) / 180);
      const P = W / t;
      return {
        result: P,
        stepsLatex: [
          `W = F \\cdot s \\cos(\\theta) = ${F} \\times ${s} \\times \\cos(${theta}^\\circ) = ${W.toFixed(2)}\\text{ J}`,
          `P = \\frac{W}{t} = \\frac{${W.toFixed(2)}}{${t}} = ${P.toFixed(2)}\\text{ W}`,
        ],
        explanation: `Usaha sebesar ${W.toFixed(2)} J dilakukan selama ${t} s sehingga laju energi (daya) adalah ${P.toFixed(2)} Watt.`,
      };
    },
  },
  // Modul 05 Termodinamika
  {
    id: 'calc-kalor',
    moduleId: 'termodinamika',
    name: 'Kalor Sensibel (Q = m·c·ΔT)',
    formulaLatex: 'Q = m \\cdot c \\cdot (T_2 - T_1)',
    outputSymbol: 'Q',
    outputLabel: 'Kalor',
    outputUnit: 'J',
    inputs: [
      { key: 'm', label: 'Massa zat', symbol: 'm', unit: 'kg', defaultValue: 2, min: 0.01, step: 0.1, mustBePositive: true },
      { key: 'c', label: 'Kalor jenis', symbol: 'c', unit: 'J/(kg·K)', defaultValue: 4186, min: 10, step: 100, mustBePositive: true },
      { key: 'T1', label: 'Suhu awal', symbol: 'T₁', unit: '°C', defaultValue: 25, step: 1 },
      { key: 'T2', label: 'Suhu akhir', symbol: 'T₂', unit: '°C', defaultValue: 85, step: 1 },
    ],
    solve: ({ m, c, T1, T2 }) => {
      const dT = T2 - T1;
      const Q = m * c * dT;
      return {
        result: Q,
        stepsLatex: [
          `\\Delta T = T_2 - T_1 = ${T2} - ${T1} = ${dT.toFixed(2)}\\text{ K}`,
          `Q = m \\cdot c \\cdot \\Delta T = ${m} \\times ${c} \\times ${dT.toFixed(2)}`,
          `Q = ${Q.toFixed(1)}\\text{ J} \\; (${(Q / 1000).toFixed(2)}\\text{ kJ})`,
        ],
        explanation:
          Q >= 0
            ? `Sistem menyerap kalor sebesar ${Q.toFixed(1)} J (${(Q / 1000).toFixed(2)} kJ) untuk menaikkan suhu sebesar ${dT.toFixed(1)} °C.`
            : `Sistem melepas kalor sebesar ${Math.abs(Q).toFixed(1)} J karena mengalami penurunan suhu.`,
      };
    },
  },
  {
    id: 'calc-gas-ideal',
    moduleId: 'termodinamika',
    name: 'Hukum Gas Ideal (P = nRT / V)',
    formulaLatex: 'P = \\frac{n R T}{V}',
    outputSymbol: 'P',
    outputLabel: 'Tekanan Gas',
    outputUnit: 'Pa',
    inputs: [
      { key: 'n', label: 'Jumlah mol gas', symbol: 'n', unit: 'mol', defaultValue: 1, min: 0.1, step: 0.1, mustBePositive: true },
      { key: 'T', label: 'Suhu mutlak', symbol: 'T', unit: 'K', defaultValue: 300, min: 1, step: 10, mustBePositive: true },
      { key: 'V', label: 'Volume wadah', symbol: 'V', unit: 'm³', defaultValue: 0.025, min: 0.001, step: 0.005, mustBePositive: true },
    ],
    solve: ({ n, T, V }) => {
      if (V <= 0 || T <= 0) {
        return { result: 0, stepsLatex: [], explanation: '', error: 'Volume dan Suhu Kelvin harus bernilai positif.' };
      }
      const P = (n * PHYSICS_CONSTANTS.R * T) / V;
      return {
        result: P,
        stepsLatex: [
          `P = \\frac{nRT}{V}`,
          `P = \\frac{${n} \\times 8.314 \\times ${T}}{${V}}`,
          `P = ${P.toFixed(1)}\\text{ Pa} \\; (${(P / 1000).toFixed(2)}\\text{ kPa})`,
        ],
        explanation: `Gas ideal sejumlah ${n} mol pada suhu ${T} K di dalam volume ${V} m³ menghasilkan tekanan ${P.toFixed(1)} Pascal (${(P / 101325).toFixed(2)} atm).`,
      };
    },
  },
];

// ==========================================
// 3. GENERATOR GRAFIK DINAMIS PRESETS
// ==========================================
export const GRAPH_PRESETS: GraphPresetDef[] = [
  // Kinematika
  {
    id: 'kin-xt',
    moduleId: 'kinematika',
    title: 'Posisi vs Waktu (GLBB)',
    xKey: 'Waktu t (s)',
    yKey: 'Posisi x (m)',
    xMin: 0,
    xMax: 10,
    step: 0.5,
    fixedParams: { x0: 0, v0: 4, a: 2 },
    paramLabels: {
      x0: { label: 'Posisi Awal (x₀)', unit: 'm', min: 0, max: 50, step: 1 },
      v0: { label: 'Kecepatan Awal (v₀)', unit: 'm/s', min: 0, max: 30, step: 1 },
      a: { label: 'Percepatan (a)', unit: 'm/s²', min: -10, max: 15, step: 0.5 },
    },
    computeY: (t, p) => p.x0 + p.v0 * t + 0.5 * p.a * t * t,
    formulaLatex: 'x(t) = x_0 + v_0 t + \\frac{1}{2}at^2',
    explanation: 'Kurva kuadratik menunjukkan pertambahan posisi semakin cepat bila percepatan positif.',
  },
  {
    id: 'kin-vt',
    moduleId: 'kinematika',
    title: 'Kecepatan vs Waktu',
    xKey: 'Waktu t (s)',
    yKey: 'Kecepatan v (m/s)',
    xMin: 0,
    xMax: 10,
    step: 0.5,
    fixedParams: { v0: 5, a: 3 },
    paramLabels: {
      v0: { label: 'Kecepatan Awal (v₀)', unit: 'm/s', min: -20, max: 40, step: 1 },
      a: { label: 'Percepatan (a)', unit: 'm/s²', min: -10, max: 15, step: 0.5 },
    },
    computeY: (t, p) => p.v0 + p.a * t,
    formulaLatex: 'v(t) = v_0 + at',
    explanation: 'Kemiringan garis lurus pada grafik v-t menyatakan besar percepatan benda.',
  },
  {
    id: 'kin-at',
    moduleId: 'kinematika',
    title: 'Percepatan vs Waktu',
    xKey: 'Waktu t (s)',
    yKey: 'Percepatan a (m/s²)',
    xMin: 0,
    xMax: 10,
    step: 0.5,
    fixedParams: { a: 4 },
    paramLabels: {
      a: { label: 'Percepatan Konstan (a)', unit: 'm/s²', min: -15, max: 15, step: 0.5 },
    },
    computeY: (_t, p) => p.a,
    formulaLatex: 'a(t) = \\text{konstan}',
    explanation: 'Pada GLBB ideal, nilai percepatan konstan sepanjang waktu.',
  },
  // Dinamika
  {
    id: 'din-fa',
    moduleId: 'dinamika',
    title: 'Gaya vs Percepatan (Massa Tetap)',
    xKey: 'Gaya F (N)',
    yKey: 'Percepatan a (m/s²)',
    xMin: 0,
    xMax: 100,
    step: 5,
    fixedParams: { m: 5 },
    paramLabels: {
      m: { label: 'Massa Benda (m)', unit: 'kg', min: 1, max: 50, step: 1 },
    },
    computeY: (F, p) => F / Math.max(0.1, p.m),
    formulaLatex: 'a = \\frac{F}{m}',
    explanation: 'Percepatan berbanding lurus dengan gaya netto yang diberikan pada massa konstan.',
  },
  {
    id: 'din-ma',
    moduleId: 'dinamika',
    title: 'Massa vs Percepatan (Gaya Tetap)',
    xKey: 'Massa m (kg)',
    yKey: 'Percepatan a (m/s²)',
    xMin: 1,
    xMax: 25,
    step: 1,
    fixedParams: { F: 50 },
    paramLabels: {
      F: { label: 'Gaya Netto (F)', unit: 'N', min: 5, max: 200, step: 5 },
    },
    computeY: (m, p) => p.F / Math.max(0.1, m),
    formulaLatex: 'a = \\frac{F}{m}',
    explanation: 'Kurva hiperbolik menunjukkan percepatan berbanding terbalik terhadap massa benda.',
  },
  // Energi
  {
    id: 'ene-hep',
    moduleId: 'energi',
    title: 'Ketinggian vs Energi Potensial',
    xKey: 'Ketinggian h (m)',
    yKey: 'Energi Potensial Ep (J)',
    xMin: 0,
    xMax: 30,
    step: 1,
    fixedParams: { m: 2.5, g: 9.8 },
    paramLabels: {
      m: { label: 'Massa (m)', unit: 'kg', min: 0.5, max: 20, step: 0.5 },
      g: { label: 'Gravitasi (g)', unit: 'm/s²', min: 1, max: 20, step: 0.2 },
    },
    computeY: (h, p) => p.m * p.g * h,
    formulaLatex: 'E_p = mgh',
    explanation: 'Energi potensial gravitasi bertambah secara linier seiring kenaikan ketinggian.',
  },
  {
    id: 'ene-vek',
    moduleId: 'energi',
    title: 'Kecepatan vs Energi Kinetik',
    xKey: 'Kecepatan v (m/s)',
    yKey: 'Energi Kinetik Ek (J)',
    xMin: 0,
    xMax: 30,
    step: 1,
    fixedParams: { m: 2 },
    paramLabels: {
      m: { label: 'Massa (m)', unit: 'kg', min: 0.5, max: 20, step: 0.5 },
    },
    computeY: (v, p) => 0.5 * p.m * v * v,
    formulaLatex: 'E_k = \\frac{1}{2}mv^2',
    explanation: 'Energi kinetik naik secara kuadratik terhadap kecepatan (kecepatan 2× lipat menghasilkan energi 4× lipat).',
  },
  {
    id: 'ene-te',
    moduleId: 'energi',
    title: 'Waktu vs Energi (Jatuh Bebas)',
    xKey: 'Waktu t (s)',
    yKey: 'Energi Kinetik Ek (J)',
    xMin: 0,
    xMax: 4,
    step: 0.2,
    fixedParams: { m: 2, g: 9.8 },
    paramLabels: {
      m: { label: 'Massa (m)', unit: 'kg', min: 0.5, max: 20, step: 0.5 },
      g: { label: 'Gravitasi (g)', unit: 'm/s²', min: 1, max: 20, step: 0.2 },
    },
    computeY: (t, p) => 0.5 * p.m * Math.pow(p.g * t, 2),
    formulaLatex: 'E_k(t) = \\frac{1}{2}m(gt)^2',
    explanation: 'Saat jatuh bebas dari keadaan diam, kecepatan bertambah linier sehingga energi kinetik tumbuh kuadratik terhadap waktu.',
  },
  // Termodinamika
  {
    id: 'ter-pv',
    moduleId: 'termodinamika',
    title: 'Tekanan vs Volume (Isotermal)',
    xKey: 'Volume V (L)',
    yKey: 'Tekanan P (kPa)',
    xMin: 1,
    xMax: 10,
    step: 0.5,
    fixedParams: { n: 1, T: 300 },
    paramLabels: {
      n: { label: 'Mol Gas (n)', unit: 'mol', min: 0.5, max: 5, step: 0.5 },
      T: { label: 'Suhu Mutlak (T)', unit: 'K', min: 150, max: 600, step: 25 },
    },
    computeY: (V_L, p) => (p.n * PHYSICS_CONSTANTS.R * p.T) / Math.max(0.1, V_L),
    formulaLatex: 'P(V) = \\frac{nRT}{V}',
    explanation: 'Kurva isoterm menunjukkan Hukum Boyle: pada suhu tetap, tekanan berbanding terbalik terhadap volume.',
  },
  {
    id: 'ter-tq',
    moduleId: 'termodinamika',
    title: 'Perubahan Suhu vs Kalor',
    xKey: 'Kenaikan Suhu ΔT (K)',
    yKey: 'Kalor Q (kJ)',
    xMin: 0,
    xMax: 100,
    step: 5,
    fixedParams: { m: 2, c: 4186 },
    paramLabels: {
      m: { label: 'Massa Zat (m)', unit: 'kg', min: 0.5, max: 10, step: 0.5 },
      c: { label: 'Kalor Jenis (c)', unit: 'J/(kg·K)', min: 400, max: 4500, step: 100 },
    },
    computeY: (dT, p) => (p.m * p.c * dT) / 1000,
    formulaLatex: 'Q = mc\\Delta T',
    explanation: 'Kalor yang diserap sebanding lurus dengan kenaikan suhu dan kapasitas kalor zat.',
  },
  {
    id: 'ter-vt',
    moduleId: 'termodinamika',
    title: 'Volume vs Suhu (Isobarik)',
    xKey: 'Suhu T (K)',
    yKey: 'Volume V (L)',
    xMin: 200,
    xMax: 600,
    step: 20,
    fixedParams: { n: 1, P_kPa: 101.325 },
    paramLabels: {
      n: { label: 'Mol Gas (n)', unit: 'mol', min: 0.5, max: 5, step: 0.5 },
      P_kPa: { label: 'Tekanan Konstan (P)', unit: 'kPa', min: 50, max: 300, step: 10 },
    },
    computeY: (T, p) => (p.n * PHYSICS_CONSTANTS.R * T) / Math.max(1, p.P_kPa),
    formulaLatex: 'V(T) = \\frac{nR}{P}T',
    explanation: 'Hukum Charles: pada tekanan tetap, volume gas ideal berbanding lurus dengan suhu mutlaknya.',
  },
];

export function exportDataToCsv(filename: string, headers: string[], rows: (string | number)[][]) {
  const csvLines = [headers.join(','), ...rows.map((r) => r.join(','))];
  const blob = new Blob([csvLines.join('\n')], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
