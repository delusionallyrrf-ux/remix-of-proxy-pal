## Brotato self-host: verify and ship

All required files are now in `public/brotato/`:

- `index.html`, `brotato.js`, `brotato.audio.worklet.js`
- `brotato.wasm` (25.7 MB, single file)
- `brotato.pck.part.00/01/02` (41.9 + 41.9 + 22.1 MB)
- icons + `bg.png` + `logo.png`

The loader in `public/brotato/index.html` already fetches the three `.pck` parts in parallel, concatenates them into a Blob URL, and hands that to Godot's `Engine` as `mainPack`. The `wasm` is a single file Godot fetches itself via `executable: 'brotato'`. The route at `src/routes/api/public/brotato/$.ts` proxies `/brotato/*` with the right MIME types and the COOP/COEP headers Godot's threaded build needs.

So the wiring should be complete. The plan is to verify, not change code.

### Steps

1. **Smoke test** `/api/public/brotato` in the preview:
   - Confirm `index.html` loads, the loader bar fills as the three `.pck` parts stream in, then jumps to 95–100% while Godot fetches `brotato.wasm`.
   - Confirm the canvas takes over and the game boots.
2. **Network check**: ensure each of `brotato.pck.part.00/01/02`, `brotato.wasm`, `brotato.js`, `brotato.audio.worklet.js` returns 200 with the correct `Content-Type` and the COOP/COEP/CORP headers.
3. **Console check**: no `SharedArrayBuffer is not defined`, no MIME-type errors on the `.wasm`, no 404s.
4. **Only if something fails**, make a minimal fix:
   - Wrong MIME on a part → adjust `mimeFor` in `src/routes/api/public/brotato/$.ts`.
   - Godot can't find the wasm → set `executable` to a blob/URL override in `index.html`.
   - COOP/COEP missing on a sub-asset → ensure all responses go through the route, not raw `/brotato/*`.

### Open item

Nothing blocking — ready to verify.
