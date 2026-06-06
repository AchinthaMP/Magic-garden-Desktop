process.noDeprecation = true;

import * as path from 'path';
import * as fs from 'fs';
import { app, BrowserWindow, dialog } from 'electron';
import * as rpc from './qpm/rpc';
import { init as initUpdater, checkForUpdates } from './qpm/updater';

const getAppResourcesPath = (): string => {
  if (app.isPackaged) {
    return path.join(path.dirname(app.getAppPath()), '..', 'resources', 'app');
  } else {
    return app.getAppPath();
  }
};

const APP_RESOURCES = getAppResourcesPath();

const errorLog = (message: string, err: unknown): void => {
  const errorMsg = `[ERROR] ${message}\n${err instanceof Error ? (err.stack || err.message) : String(err)}`;
  console.error(errorMsg);
  try {
    dialog.showErrorBox('Magic Garden - Error', `${message}\n\n${err instanceof Error ? err.message : String(err)}`);
  } catch {
    console.error('Failed to show error dialog');
  }
};

process.on('uncaughtException', (err: Error) => {
  errorLog('Uncaught Exception', err);
});

process.on('unhandledRejection', (reason: unknown) => {
  errorLog('Unhandled Rejection', reason);
});

let mainWindow: BrowserWindow | null = null;

const createWindow = (): void => {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 850,
    minWidth: 1024,
    minHeight: 600,
    backgroundColor: '#0c1116',
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

  let qpm: string;
  try {
    const qpmPath = path.join(APP_RESOURCES, 'assets', 'QPM.user.js');
    console.log('[MG] Loading QPM from:', qpmPath);
    qpm = fs.readFileSync(qpmPath, 'utf8');
  } catch (e) {
    errorLog('Could not load assets/QPM.user.js', e);
    return;
  }

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
    mainWindow!.webContents.executeJavaScript(qpm + '\n' + spriteFallback).catch((err: Error) => {
      console.error('[QPM] Injection error:', err.message);
    });
  });

  mainWindow.loadURL('https://magicgarden.gg/');

  initUpdater(mainWindow);

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
};

app.whenReady().then(() => {
  try {
    console.log('[MG] App starting...');
    console.log('[MG] App is packaged:', app.isPackaged);
    console.log('[MG] App resources path:', APP_RESOURCES);
    app.setAppUserModelId('com.magicgarden.desktop');
    app.setName('Magic Garden');
    createWindow();
    rpc.connect();
    console.log('[MG] App started successfully');
    checkForUpdates();
  } catch (err) {
    errorLog('Failed to start app', err);
    app.quit();
  }
}).catch((err: Error) => {
  errorLog('App.whenReady() failed', err);
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
