export type PageId = 'beranda' | 'topik' | 'simulasi' | 'unggah-rumus' | 'tentang';

export type ModuleId = 'besaran' | 'kinematika' | 'dinamika' | 'energi' | 'termodinamika';

export type SimId =
  | 'pengukuran'
  | 'konversi'
  | 'dimensi'
  | 'glb'
  | 'glbb'
  | 'parabola'
  | 'newton2'
  | 'gesek'
  | 'bidang-miring'
  | 'fbd'
  | 'roller-coaster'
  | 'pendulum'
  | 'pegas'
  | 'kalor'
  | 'gas-ideal'
  | 'piston'
  | 'diagram-pv'
  | 'kustom';

export type WorkspaceTab = 'simulasi' | 'kalkulator' | 'grafik';

export interface SimulationMeta {
  id: SimId;
  moduleId: ModuleId;
  title: string;
  subtitle: string;
  formulaLatex: string;
  description: string;
}

export interface ModuleMeta {
  id: ModuleId;
  number: string;
  title: string;
  shortTitle: string;
  description: string;
  concepts: string[];
  formulasLatex: string[];
  defaultSimId: SimId;
}

export interface CalculatorInputField {
  key: string;
  label: string;
  symbol: string;
  unit: string;
  defaultValue: number;
  min?: number;
  max?: number;
  step?: number;
  allowZero?: boolean;
  mustBePositive?: boolean;
}

export interface CalculatorFormulaDef {
  id: string;
  moduleId: ModuleId;
  name: string;
  formulaLatex: string;
  outputSymbol: string;
  outputLabel: string;
  outputUnit: string;
  inputs: CalculatorInputField[];
  solve: (values: Record<string, number>) => {
    result: number;
    stepsLatex: string[];
    explanation: string;
    error?: string;
  };
}

export interface GraphVariableDef {
  key: string;
  label: string;
  unit: string;
  defaultMin: number;
  defaultMax: number;
  defaultStep: number;
}

export interface GraphPresetDef {
  id: string;
  moduleId: ModuleId;
  title: string;
  xKey: string;
  yKey: string;
  xMin: number;
  xMax: number;
  step: number;
  fixedParams: Record<string, number>;
  paramLabels: Record<string, { label: string; unit: string; min: number; max: number; step: number }>;
  computeY: (x: number, params: Record<string, number>) => number;
  formulaLatex: string;
  explanation: string;
}

export interface CustomVariableConfig {
  name: string;
  description: string;
  unit: string;
  initialValue: number;
  minValue: number;
  maxValue: number;
  stepSize: number;
}

export interface CustomSeedPayload {
  formula: string;
  unit: string;
  independentVar?: string;
  variablesConfig?: Record<string, CustomVariableConfig>;
}
