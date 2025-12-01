# Star Battle 10×10 · 2★ Logic Solver

Front-end only Star Battle helper built with Vite + Vue 3 + TypeScript. The goal is to provide **purely logical**, step-by-step hints for 10×10, 2-star puzzles, following techniques from “A Star Battle Guide” by Kris De Asis (sections 1–4).

## Getting started

```bash
cd web
npm install
npm run dev
```

Open the printed local URL in your browser.

## Modes

- **Editor mode**: assign each cell to a region (1–10). You must cover all 100 cells and use every region id at least once before switching to Play mode.
- **Play mode**: place stars and crosses manually, request hints, and apply them.

## Scripts

- `npm run dev` – start Vite dev server.
- `npm run build` – build static assets for deployment (e.g. GitHub Pages).
- `npm run preview` – preview the production build locally.
- `npm run test` – run Vitest unit tests for helpers and basic techniques.

### GitHub Pages

If you deploy under a GitHub Pages subpath, set `base` in `vite.config.ts` to your repository name, for example:

```ts
export default defineConfig({
  base: '/star-battle-solver/',
  plugins: [vue()],
});
```


