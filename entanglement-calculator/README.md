# Entanglement pattern calculator

This folder contains a standalone Node.js/TypeScript utility for enumerating entanglement-style rectangles that arise from placing `z` non-touching stars on an `x * x` grid. It enforces the usual Star Battle adjacency rule (no orthogonal or diagonal touching) and the requested `y` limit of stars per row/column.

## Build

```
pnpm exec tsc -p entanglement-calculator/tsconfig.json
```

## Usage

Run the compiled script and provide the grid parameters:

```
node entanglement-calculator/dist/index.js --gridSize=10 --starsPerLine=2 --entangledStars=2 --output=entanglement-calculator/output/10x10-2star-entanglements.json
```

Short aliases are supported (`--n`, `--y`, `--z`) along with an optional `--maxPatterns` limit to keep output files small. The script writes a JSON payload describing every pattern it found to the provided output path (creating parent directories when needed).
