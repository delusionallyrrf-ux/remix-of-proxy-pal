## Self-host Brotato at `/api/public/brotato`

Replace the broken degloved proxy with a locally-hosted version of the Godot Web export you uploaded.

### Steps

1. **Stage assets in `public/brotato/`**
   Copy uploaded files into the project so Vite serves them as static assets:
   - `index.html`, `brotato.js`, `brotato.audio.worklet.js`
   - `logo.png`, `bg.png`, `brotato.png`, `brotato.icon.png`, `brotato.apple-touch-icon.png`
   - (Later) `brotato.pck.part.00/01/02`, `brotato.wasm`, and any other Godot export files you upload next.

2. **Replace the proxy route at `src/routes/api/public/brotato/$.ts`**
   Swap `createProxyHandlers` for a small handler that serves `public/brotato/<splat>` (defaulting to `index.html`) with correct MIME types and the COOP/COEP headers Godot's threaded WASM build needs:
   - `Cross-Origin-Opener-Policy: same-origin`
   - `Cross-Origin-Embedder-Policy: require-corp`
   - `Cross-Origin-Resource-Policy: same-origin`

3. **Verify**
   Once you upload the `.pck` parts + `.wasm`, hit `/api/public/brotato` and confirm the loader bar fills and the game boots.

### Technical notes

- Godot 4 web exports require COOP/COEP for SharedArrayBuffer/threads — without those headers the game silently fails to start. The shared `proxy-route.ts` strips those headers, which is why we need a dedicated handler here, not the proxy.
- Files go in `public/` (not `src/assets/`) so they're served at fixed paths without bundling — important for the multi-MB `.pck` parts and `.wasm`.
- The route stays at `/api/public/brotato` per your choice; `index.html` references like `brotato.js` resolve relative to that path.

### Open item

Waiting on you to upload `brotato.pck.part.00`, `brotato.pck.part.01`, `brotato.pck.part.02`, and `brotato.wasm` (plus any other files referenced by `brotato.js`) before the game will actually run. I'll wire up the route now so it's ready the moment those land.