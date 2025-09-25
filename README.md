# Karaoke Electron (Electron + React + PouchDB)

## Prerequisites

- Node.js 18+ and npm
- Windows, macOS, or Linux

## Install

```powershell
# From the project root
npm install
```

## Develop

Starts Vite (renderer) and Electron together.

```powershell
npm run dev
```

- Renderer dev server: http://localhost:5173
- Electron will load the dev server URL automatically.

## Build (renderer only)

Builds the React renderer into `dist/`.

```powershell
npm run build
```

## Package (create desktop installer)

Packages the Electron app using electron-builder. Output goes to `release/`.

```powershell
npm run package
```

On Windows, you'll get an `.exe` installer in `release/`. Distribute that file to users.

## Project Structure

```
.
├─ electron/
│  ├─ main.ts         # Electron main process (TypeScript)
│  ├─ preload.ts      # Preload script (TypeScript)
│  └─ preload-types.ts # Type definitions for Electron API
├─ dist-electron/     # Compiled Electron files (generated)
├─ renderer/
│  ├─ index.html      # Vite entry HTML
│  └─ src/
│     ├─ main.jsx     # React entry
│     ├─ types.ts     # TypeScript type definitions
│     └─ App.jsx      # UI + PouchDB usage (reads name)
├─ dist/              # Built renderer (generated)
├─ release/           # Packaged installers (generated)
├─ tsconfig.json      # TypeScript config for renderer
├─ tsconfig.node.json # TypeScript config for electron main process
├─ vite.config.mjs    # Vite config (root=renderer, outDir=dist)
└─ package.json       # Scripts, deps, electron-builder config
```

## Notes

- Database: Uses `pouchdb-browser` in the renderer. Data is stored locally per-user on the machine.
- Security: `contextIsolation` is enabled, `nodeIntegration` is disabled, and a minimal `preload.js` is provided.
- Customizing the name: update the `user` document in the PouchDB database (e.g., via app UI you add later) to change the greeting.

## Troubleshooting

- If Electron fails to start in dev, ensure port 5173 is free or update the port in `vite.config.mjs` and the `dev` script (it waits on `http://localhost:5173`).
- If packaging fails, try clearing previous build output:
    ```powershell
    rd /s /q dist ; rd /s /q release
    ```
