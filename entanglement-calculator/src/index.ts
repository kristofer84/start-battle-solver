import { writeFileSync, mkdirSync } from "fs";
import { dirname, resolve } from "path";

interface Coordinate {
  row: number;
  col: number;
}

interface Rectangle {
  top: number;
  left: number;
  bottom: number;
  right: number;
}

interface EntanglementPattern {
  id: number;
  stars: Coordinate[];
  forbiddenCells: Coordinate[];
  rectangle: Rectangle;
  coverage: {
    rectangleArea: number;
    forbiddenCount: number;
  };
}

interface CalculatorArgs {
  gridSize: number;
  starsPerLine: number;
  entangledStars: number;
  outputPath: string;
  maxPatterns?: number;
}

function parseArgs(argv: string[]): CalculatorArgs {
  const args: Partial<CalculatorArgs> = {};

  for (const raw of argv.slice(2)) {
    const [key, value] = raw.replace(/^--/, "").split("=");
    if (!value) continue;
    const numeric = Number(value);
    switch (key) {
      case "gridSize":
      case "n":
        args.gridSize = numeric;
        break;
      case "starsPerLine":
      case "y":
        args.starsPerLine = numeric;
        break;
      case "entangledStars":
      case "z":
        args.entangledStars = numeric;
        break;
      case "output":
        args.outputPath = value;
        break;
      case "maxPatterns":
        args.maxPatterns = numeric;
        break;
      default:
        console.warn(`Unknown argument ignored: ${raw}`);
    }
  }

  if (!args.gridSize || !args.starsPerLine || !args.entangledStars) {
    throw new Error(
      "Missing required arguments. Usage: node dist/index.js --gridSize=10 --starsPerLine=2 --entangledStars=2 --output=path/to/file.json [--maxPatterns=500]",
    );
  }

  args.outputPath = resolve(args.outputPath || "entanglement-calculator/output/entanglement-patterns.json");

  return args as CalculatorArgs;
}

function toKey({ row, col }: Coordinate): string {
  return `${row},${col}`;
}

function canPlace(star: Coordinate, starSet: Set<string>, n: number, rowCounts: number[], colCounts: number[], maxPerLine: number): boolean {
  if (rowCounts[star.row] >= maxPerLine || colCounts[star.col] >= maxPerLine) {
    return false;
  }
  for (let dr = -1; dr <= 1; dr++) {
    for (let dc = -1; dc <= 1; dc++) {
      const key = toKey({ row: star.row + dr, col: star.col + dc });
      if (starSet.has(key)) return false;
    }
  }
  return star.row >= 0 && star.row < n && star.col >= 0 && star.col < n;
}

function computeForbiddenCells(n: number, stars: Coordinate[]): Set<string> {
  const forbidden = new Set<string>();
  for (const { row, col } of stars) {
    for (let dr = -1; dr <= 1; dr++) {
      for (let dc = -1; dc <= 1; dc++) {
        const nr = row + dr;
        const nc = col + dc;
        if (nr < 0 || nr >= n || nc < 0 || nc >= n) continue;
        const key = toKey({ row: nr, col: nc });
        forbidden.add(key);
      }
    }
  }
  return forbidden;
}

function computeRectangle(n: number, stars: Coordinate[]): Rectangle {
  const rows = stars.map((s) => s.row);
  const cols = stars.map((s) => s.col);
  const top = Math.max(Math.min(...rows) - 1, 0);
  const left = Math.max(Math.min(...cols) - 1, 0);
  const bottom = Math.min(Math.max(...rows) + 1, n - 1);
  const right = Math.min(Math.max(...cols) + 1, n - 1);
  return { top, left, bottom, right };
}

function enumeratePatterns(args: CalculatorArgs): EntanglementPattern[] {
  const { gridSize: n, entangledStars: z, starsPerLine: maxPerLine, maxPatterns } = args;
  const patterns: EntanglementPattern[] = [];
  const starSet = new Set<string>();
  const stars: Coordinate[] = [];
  const rowCounts = Array(n).fill(0);
  const colCounts = Array(n).fill(0);
  const totalCells = n * n;

  const remainingCells = (index: number) => totalCells - index;

  function backtrack(startIndex: number) {
    if (stars.length === z) {
      const forbidden = computeForbiddenCells(n, stars);
      const rectangle = computeRectangle(n, stars);
      patterns.push({
        id: patterns.length + 1,
        stars: [...stars],
        forbiddenCells: [...forbidden].map((key) => {
          const [row, col] = key.split(",").map(Number);
          return { row, col };
        }).sort((a, b) => (a.row - b.row) || (a.col - b.col)),
        rectangle,
        coverage: {
          rectangleArea: (rectangle.bottom - rectangle.top + 1) * (rectangle.right - rectangle.left + 1),
          forbiddenCount: forbidden.size,
        },
      });
      return;
    }

    if (maxPatterns !== undefined && patterns.length >= maxPatterns) {
      return;
    }

    const slotsRemaining = z - stars.length;
    for (let idx = startIndex; idx < totalCells; idx++) {
      if (remainingCells(idx) < slotsRemaining) break;
      const row = Math.floor(idx / n);
      const col = idx % n;
      const candidate: Coordinate = { row, col };
      if (!canPlace(candidate, starSet, n, rowCounts, colCounts, maxPerLine)) continue;

      starSet.add(toKey(candidate));
      stars.push(candidate);
      rowCounts[row] += 1;
      colCounts[col] += 1;

      backtrack(idx + 1);

      starSet.delete(toKey(candidate));
      stars.pop();
      rowCounts[row] -= 1;
      colCounts[col] -= 1;

      if (maxPatterns !== undefined && patterns.length >= maxPatterns) {
        break;
      }
    }
  }

  backtrack(0);
  return patterns;
}

function run(): void {
  const args = parseArgs(process.argv);
  const patterns = enumeratePatterns(args);
  const payload = {
    metadata: {
      gridSize: args.gridSize,
      starsPerLine: args.starsPerLine,
      entangledStars: args.entangledStars,
      maxPatterns: args.maxPatterns ?? null,
      generatedAt: new Date().toISOString(),
      description:
        "Automatically enumerated entanglement zones for non-touching star placements. Each pattern marks forbidden cells resulting from the adjacency rule and a bounding rectangle expanded by one cell around the stars.",
    },
    patternCount: patterns.length,
    patterns,
  };

  const outputPath = args.outputPath;
  mkdirSync(dirname(outputPath), { recursive: true });
  writeFileSync(outputPath, JSON.stringify(payload, null, 2), "utf8");
  console.log(`Wrote ${patterns.length} entanglement pattern(s) to ${outputPath}`);
}

if (require.main === module) {
  try {
    run();
  } catch (error) {
    console.error((error as Error).message);
    process.exit(1);
  }
}

