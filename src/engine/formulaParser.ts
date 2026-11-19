import { create, all, MathNode } from 'mathjs';

// Create a restricted mathjs instance without arbitrary JS execution or unsafe imports
const math = create(all, {});

const ALLOWED_FUNCTIONS = new Set([
  'sin',
  'cos',
  'tan',
  'asin',
  'acos',
  'atan',
  'sqrt',
  'abs',
  'log',
  'log10',
  'exp',
  'pow',
  'floor',
  'ceil',
  'round',
  'min',
  'max',
]);

const BUILTIN_CONSTANTS = new Set(['pi', 'e', 'PI', 'E']);

export interface ParsedEquationResult {
  valid: boolean;
  dependentVar: string;
  rhsExpression: string;
  variables: string[];
  latexPreview: string;
  error?: string;
}

/**
 * Normalizes common OCR / LaTeX / Unicode formula artifacts into mathjs-compatible syntax
 * for user review before evaluation. Never assumes OCR is 100% correct.
 */
export function normalizeExtractedFormulaText(raw: string): string {
  let cleaned = raw
    .replace(/\r?\n/g, ' ')
    .replace(/\$/g, '')
    .replace(/×/g, '*')
    .replace(/·/g, '*')
    .replace(/÷/g, '/')
    .replace(/−/g, '-')
    .replace(/–/g, '-')
    .replace(/π/g, 'pi')
    .replace(/²/g, '^2')
    .replace(/³/g, '^3')
    .replace(/√\(([^)]+)\)/g, 'sqrt($1)')
    .replace(/√([a-zA-Z0-9_]+)/g, 'sqrt($1)')
    .replace(/\\frac\{([^{}]+)\}\{([^{}]+)\}/g, '(($1)/($2))')
    .replace(/\\sqrt\{([^{}]+)\}/g, 'sqrt($1)')
    .replace(/\\(sin|cos|tan|log|exp|sqrt|abs)/g, '$1')
    .replace(/\\cdot|\\times/g, '*')
    .replace(/\\pi/g, 'pi')
    .replace(/\\theta/g, 'theta')
    .replace(/\\Delta\s*([a-zA-Z0-9_]+)/g, 'd$1')
    .replace(/Δ([a-zA-Z0-9_]+)/g, 'd$1')
    .replace(/θ/g, 'theta')
    .replace(/ω/g, 'omega')
    .replace(/μ/g, 'mu')
    .replace(/[{}]/g, '')
    .replace(/\s+/g, ' ')
    .trim();

  // Convert common Physics subscript labels like v_0 or E_k to v0, Ek
  cleaned = cleaned.replace(/([a-zA-Z])_([a-zA-Z0-9]+)/g, '$1$2');

  return cleaned;
}

function validateAstNode(node: MathNode, foundSymbols: Set<string>): string | null {
  const type = node.type;

  if (type === 'ConstantNode') {
    return null;
  }

  if (type === 'SymbolNode') {
    const sym = (node as unknown as { name: string }).name;
    if (!BUILTIN_CONSTANTS.has(sym)) {
      foundSymbols.add(sym);
    }
    return null;
  }

  if (type === 'OperatorNode') {
    const opNode = node as unknown as { op: string; args: MathNode[] };
    const allowedOps = ['+', '-', '*', '/', '^'];
    if (!allowedOps.includes(opNode.op)) {
      return `Operator "${opNode.op}" tidak didukung dalam persamaan fisika ini.`;
    }
    for (const arg of opNode.args) {
      const err = validateAstNode(arg, foundSymbols);
      if (err) return err;
    }
    return null;
  }

  if (type === 'ParenthesisNode') {
    const pNode = node as unknown as { content: MathNode };
    return validateAstNode(pNode.content, foundSymbols);
  }

  if (type === 'FunctionNode') {
    const fnNode = node as unknown as { fn: MathNode; args: MathNode[] };
    const fnName = (fnNode.fn as unknown as { name?: string })?.name;
    if (!fnName || !ALLOWED_FUNCTIONS.has(fnName)) {
      return `Fungsi "${fnName || 'tidak dikenal'}" tidak didukung. Fungsi yang didukung: sin, cos, tan, sqrt, abs, log, exp, pow.`;
    }
    for (const arg of fnNode.args) {
      const err = validateAstNode(arg, foundSymbols);
      if (err) return err;
    }
    return null;
  }

  return `Struktur ekspresi (${type}) tidak didukung oleh parser matematika aman.`;
}

/**
 * Safely parses a formula of the form "Y = expr" or "expr".
 * Validates AST strictly without eval/Function.
 */
export function parseSafePhysicsFormula(input: string): ParsedEquationResult {
  const trimmed = input.trim();
  if (!trimmed) {
    return {
      valid: false,
      dependentVar: 'y',
      rhsExpression: '',
      variables: [],
      latexPreview: '',
      error: 'Rumus tidak boleh kosong.',
    };
  }

  // Reject dangerous keywords or assignment chains
  if (/[;{}\[\]`$]|import|eval|function|window|document|process|=>/i.test(trimmed)) {
    return {
      valid: false,
      dependentVar: 'y',
      rhsExpression: '',
      variables: [],
      latexPreview: '',
      error: 'Karakter atau sintaks tidak diizinkan. Gunakan notasi matematika standar.',
    };
  }

  const eqParts = trimmed.split('=');
  if (eqParts.length > 2) {
    return {
      valid: false,
      dependentVar: 'y',
      rhsExpression: '',
      variables: [],
      latexPreview: '',
      error: 'Persamaan memiliki lebih dari satu tanda sama dengan (=). Gunakan bentuk "VariabelTerikat = Ekspresi".',
    };
  }

  let dependentVar = 'Y';
  let rhsExpression = trimmed;

  if (eqParts.length === 2) {
    const lhs = eqParts[0].trim().replace(/\(.*\)$/, '').trim();
    rhsExpression = eqParts[1].trim();
    if (!/^[a-zA-Z][a-zA-Z0-9_]*$/.test(lhs)) {
      return {
        valid: false,
        dependentVar: 'Y',
        rhsExpression,
        variables: [],
        latexPreview: '',
        error: `Variabel hasil di sisi kiri ("${lhs}") harus berupa nama simbol valid (contoh: F, Ek, v, Y).`,
      };
    }
    dependentVar = lhs;
  }

  if (!rhsExpression) {
    return {
      valid: false,
      dependentVar,
      rhsExpression: '',
      variables: [],
      latexPreview: '',
      error: 'Bagian ekspresi kanan persamaan belum diisi.',
    };
  }

  try {
    const ast = math.parse(rhsExpression);
    const foundSymbols = new Set<string>();
    const validationErr = validateAstNode(ast, foundSymbols);
    if (validationErr) {
      return {
        valid: false,
        dependentVar,
        rhsExpression,
        variables: [],
        latexPreview: '',
        error: validationErr,
      };
    }

    const variables = Array.from(foundSymbols);
    let latexRhs = rhsExpression;
    try {
      latexRhs = ast.toTex();
    } catch {
      latexRhs = rhsExpression;
    }

    return {
      valid: true,
      dependentVar,
      rhsExpression,
      variables,
      latexPreview: `${dependentVar} = ${latexRhs}`,
    };
  } catch (err) {
    return {
      valid: false,
      dependentVar,
      rhsExpression,
      variables: [],
      latexPreview: '',
      error: `Persamaan tidak dapat diproses: ${err instanceof Error ? err.message : 'kesalahan sintaks matematis'}.`,
    };
  }
}

/**
 * Safely evaluates a validated RHS expression for a given scope of numeric variables.
 */
export function evaluateSafeExpression(
  rhsExpression: string,
  scope: Record<string, number>
): { value: number | null; error?: string } {
  try {
    const ast = math.parse(rhsExpression);
    const foundSymbols = new Set<string>();
    const validationErr = validateAstNode(ast, foundSymbols);
    if (validationErr) {
      return { value: null, error: validationErr };
    }

    const compiled = ast.compile();
    const safeScope: Record<string, number> = {
      ...scope,
      pi: Math.PI,
      PI: Math.PI,
      e: Math.E,
      E: Math.E,
    };

    const rawResult = compiled.evaluate(safeScope);
    if (typeof rawResult !== 'number' || !Number.isFinite(rawResult)) {
      return {
        value: null,
        error: 'Hasil evaluasi tidak terdefinisi (NaN / Tak Hingga / Bilangan Kompleks). Periksa pembagian nol atau akar negatif.',
      };
    }

    return { value: rawResult };
  } catch (err) {
    return {
      value: null,
      error: err instanceof Error ? err.message : 'Gagal mengevaluasi rumus.',
    };
  }
}
