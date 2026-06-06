const path = require('path');
const fs = require('fs');
const { app, BrowserWindow } = require('electron');

let mainWindow = null;

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

  const qpm = fs.readFileSync(path.join(__dirname, 'assets', 'QPM.user.js'), 'utf8');

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

  mainWindow.on('closed', () => { mainWindow = null; });
};

app.whenReady().then(() => {
  app.setAppUserModelId('com.magicgarden.desktop');
  app.setName('Magic Garden');
  createWindow();
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow();
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
