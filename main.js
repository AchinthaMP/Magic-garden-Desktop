process.noDeprecation = true;

const path = require('path');
const fs = require('fs');
const { app, BrowserWindow, dialog, ipcMain } = require('electron');
const rpc = require('./qpm/rpc');
const updater = require('./qpm/updater');

process.on('uncaughtException', function(err) {
  try {
    dialog.showErrorBox('Magic Garden - Error', err.stack || err.message || String(err));
  } catch (_) {}
});

process.on('unhandledRejection', function(err) {
  try {
    dialog.showErrorBox('Magic Garden - Error', err.stack || err.message || String(err));
  } catch (_) {}
});

let mainWindow = null;
let overlayWin = null;

const createWindow = () => {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 850,
    minWidth: 1024,
    minHeight: 600,
    backgroundColor: '#0c1116',
    title: 'Magic Garden',
    useContentSize: true,
    resizable: true,
    maximizable: true,
    autoHideMenuBar: true,
    webPreferences: {
      contextIsolation: false,
      nodeIntegration: false,
      webSecurity: false,
      preload: path.join(__dirname, 'qpm', 'preload.js'),
    },
  });

  mainWindow.setMenuBarVisibility(false);

  mainWindow.webContents.session.webRequest.onHeadersReceived((details, callback) => {
    const headers = { ...details.responseHeaders };
    delete headers['Content-Security-Policy'];
    delete headers['content-security-policy'];
    callback({ responseHeaders: headers });
  });

  var qpm;
  try {
    qpm = fs.readFileSync(path.join(__dirname, 'assets', 'QPM.user.js'), 'utf8');
  } catch (e) {
    dialog.showErrorBox('Magic Garden - Missing File', 'Could not load assets/QPM.user.js\n' + e.message);
    return;
  }

  // Sprite fallback: finds __PIXI_APP__ after __PIXI_APP_INIT__ is set by the preload hook
  const spriteFallback = `
(function() {
  var _check = setInterval(function() {
    if (window.__PIXI_APP_INIT__ && window.__PIXI_APP__) { clearInterval(_check); return; }
    try {
      if (!window.__PIXI_APP__) {
        var canvas = document.querySelector('canvas');
        if (canvas) {
          if (canvas.__pixi) window.__PIXI_APP__ = canvas.__pixi;
          if (!window.__PIXI_APP__) window.__PIXI_APP__ = canvas;
        }
        if (!window.__PIXI_APP__ && window.game && window.game.app) window.__PIXI_APP__ = window.game.app;
        if (!window.__PIXI_APP__ && window.app) window.__PIXI_APP__ = window.app;
      }
      if (window.__PIXI_APP_INIT__ && window.__PIXI_APP__) {
        clearInterval(_check);
        window.dispatchEvent(new Event('__PIXI_APP_INIT__'));
      }
    } catch(e) {}
  }, 300);
  setTimeout(function() {
    clearInterval(_check);
    if (!window.__PIXI_APP_INIT__) window.__PIXI_APP_INIT__ = true;
    if (!window.__PIXI_APP__) window.__PIXI_APP__ = document.querySelector('canvas') || {};
    window.dispatchEvent(new Event('__PIXI_APP_INIT__'));
  }, 20000);
})();
`;

  mainWindow.webContents.on('dom-ready', () => {
    mainWindow.webContents.executeJavaScript(qpm + '\n' + spriteFallback).catch(function(err) {
      console.error('[QPM] Injection error:', err.message);
    });
  });

  mainWindow.loadURL('https://magicgarden.gg/');

  updater.init(mainWindow);

  // Check for updates automatically on startup and periodically
  setTimeout(() => {
    updater.check().catch(err => console.error('[MG] Auto-update check failed:', err));
  }, 5000);
  
  setInterval(() => {
    updater.check().catch(err => console.error('[MG] Periodic auto-update check failed:', err));
  }, 4 * 60 * 60 * 1000); // 4 hours

  createOverlay();
  initOverlayEvents();

  mainWindow.webContents.on('console-message', (event, level, message, line, sourceId) => {
    console.log(`[Renderer] ${message} (${sourceId}:${line})`);
  });

  mainWindow.on('closed', () => {
    if (overlayWin && !overlayWin.isDestroyed()) overlayWin.close();
    mainWindow = null;
  });
};

function createOverlay() {
  overlayWin = new BrowserWindow({
    width: 60,
    height: 60,
    frame: false,
    transparent: true,
    resizable: false,
    parent: mainWindow,
    skipTaskbar: true,
    show: false,
    webPreferences: {
      contextIsolation: false,
      nodeIntegration: false,
      preload: path.join(__dirname, 'qpm', 'overlay-preload.js'),
    },
  });

  overlayWin.setIgnoreMouseEvents(false);
  
  const gearIcon = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path></svg>`;

  overlayWin.loadURL('data:text/html;charset=utf-8,' + encodeURIComponent(`
    <!DOCTYPE html><html><head><style>
    *{margin:0;padding:0;box-sizing:border-box}
    body{width:60px;height:60px;background:transparent;display:flex;align-items:center;justify-content:center;overflow:hidden;}
    button{
      width:44px;height:44px;border-radius:14px;border:1px solid #1f2226;
      background:#0f1114;color:#8b8e94;cursor:pointer;display:flex;align-items:center;
      justify-content:center;box-shadow:0 8px 24px rgba(0,0,0,0.6);
      transition:all .2s cubic-bezier(0.4, 0, 0.2, 1);outline:none;position:relative;
    }
    button:hover{border-color:#d4b88c;color:#d4b88c;transform:translateY(-2px);background:#1a1d21;}
    button:active{transform:translateY(0);}
    svg{width:22px;height:22px;}
    .badge{
      display:none;position:absolute;top:-4px;right:-4px;width:12px;height:12px;
      background:#ff4d4d;border-radius:50%;border:2px solid #0f1114;
      box-shadow:0 0 10px rgba(255, 77, 77, 0.5);
    }
    </style></head><body>
      <button id="btn" onclick="window.__overlay.onClick()">
        ${gearIcon}
        <span id="badge" class="badge"></span>
      </button>
    </body></html>
  `));

  overlayWin.once('ready-to-show', () => {
    positionOverlay();
    overlayWin.show();
  });

  overlayWin.on('closed', () => { overlayWin = null; });
}

function positionOverlay() {
  if (!mainWindow || !overlayWin) return;
  var size = mainWindow.getContentSize();
  var pos = mainWindow.getPosition();
  overlayWin.setPosition(
    pos[0] + size[0] - 60 - 20,
    pos[1] + size[1] - 60 - 20
  );
}

function initOverlayEvents() {
  if (!mainWindow) return;
  mainWindow.on('resize', positionOverlay);
  mainWindow.on('move', positionOverlay);
  mainWindow.on('enter-full-screen', () => overlayWin?.hide());
  mainWindow.on('leave-full-screen', () => {
    positionOverlay();
    overlayWin?.show();
  });
}

ipcMain.handle('mg:check-update', () => {
  return updater.check();
});

ipcMain.handle('mg:download-update', () => {
  updater.download();
  return true;
});

ipcMain.handle('mg:install-update', () => {
  updater.install();
  return true;
});

ipcMain.handle('mg:get-version', () => {
  return updater.getVersion();
});

ipcMain.handle('mg:get-release-notes', async () => {
  try {
    const res = await fetch('https://api.github.com/repos/AchinthaMP/Magic-garden-Desktop/releases/latest');
    if (!res.ok) return { error: 'Failed to fetch release notes' };
    const data = await res.json();
    return { version: data.tag_name, body: data.body || '' };
  } catch (e) {
    return { error: e.message };
  }
});

ipcMain.on('overlay:btn-click', () => {
  console.log('[MG] Gear icon clicked, injecting UI...');
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.webContents.send('mg:show-modal');
  }
});

const onShowBadge = () => {
  if (overlayWin && !overlayWin.isDestroyed()) {
    overlayWin.webContents.executeJavaScript(
      'document.getElementById("badge").style.display=""'
    ).catch(() => {});
  }
};

const onHideBadge = () => {
  if (overlayWin && !overlayWin.isDestroyed()) {
    overlayWin.webContents.executeJavaScript(
      'document.getElementById("badge").style.display="none"'
    ).catch(() => {});
  }
};

ipcMain.on('overlay:show-badge', onShowBadge);
ipcMain.on('overlay:hide-badge', onHideBadge);

app.whenReady().then(() => {
  app.setAppUserModelId('com.magicgarden.desktop');
  app.setName('Magic Garden');
  createWindow();
  rpc.connect();
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow();
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

app.on('before-quit', () => {
  rpc.disconnect();
});
