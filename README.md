# Magic Garden Desktop

A standalone desktop client for [Magic Garden](https://magicgarden.gg/) with built-in [QPM-GR](https://github.com/mg-tokyo/QPM-GR) mod integration.

## Features

- **No browser needed** — runs Magic Garden in its own dedicated Electron window
- **QPM-GR pre-loaded** — crop size indicators, value display, harvest locker, and more
- **CSP-free** — no content security policy blocking injected mods
- **Single portable EXE** — download, run, no installation required

## Download

Grab the latest portable EXE from the [Releases](https://github.com/AchinthaMP/Magic-garden-Desktop/releases) page. No installation needed — just run it.

## Build from source

```bash
git clone https://github.com/AchinthaMP/Magic-garden-Desktop.git
cd Magic-garden-Desktop
npm install
npm start        # run in development
npm run dist     # build portable EXE
```

## How it works

The app loads `https://magicgarden.gg/` in an Electron `BrowserWindow` and injects the QPM-GR userscript at `dom-ready` via `executeJavaScript`. A sprite fallback patch unblocks QPM's PIXI initialization so the full QPM panel appears.

## License

MIT
