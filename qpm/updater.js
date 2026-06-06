const { autoUpdater } = require('electron-updater');
const { app, ipcMain } = require('electron');

let mainWindow = null;
let updateInfo = null;
let updateDownloaded = false;

// Configure autoUpdater
autoUpdater.autoDownload = false;
autoUpdater.autoInstallOnAppQuit = false;

function init(win) {
  mainWindow = win;

  autoUpdater.on('update-available', (info) => {
    updateInfo = info;
    updateDownloaded = false;
    sendToUI('mg:update-available', {
      version: info.version,
      releaseDate: info.releaseDate,
    });
    notifyBadge(true);
    sendToUI('mg:show-modal');
  });

  autoUpdater.on('update-not-available', () => {
    sendToUI('mg:update-not-available');
    notifyBadge(false);
  });

  autoUpdater.on('download-progress', (progress) => {
    const data = {
      percent: Math.round(progress.percent),
      bytesPerSecond: progress.bytesPerSecond,
      transferred: progress.transferred,
      total: progress.total,
    };
    if (mainWindow && !mainWindow.isDestroyed() && mainWindow.setProgressBar) {
      mainWindow.setProgressBar(progress.percent / 100);
    }
    sendToUI('mg:download-progress', data);
  });

  autoUpdater.on('update-downloaded', (info) => {
    updateDownloaded = true;
    updateInfo = info;
    if (mainWindow && !mainWindow.isDestroyed()) mainWindow.setProgressBar(-1);
    sendToUI('mg:update-downloaded', {
      version: info.version,
    });
    notifyBadge(true);
  });

  autoUpdater.on('error', (err) => {
    const msg = err == null ? 'Unknown error' : (err.message || String(err));
    if (mainWindow && !mainWindow.isDestroyed()) mainWindow.setProgressBar(-1);
    sendToUI('mg:error', { message: msg });
  });
}

function sendToUI(channel, data) {
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.webContents.send(channel, data);
  }
}

function notifyBadge(show) {
  // Use the existing IPC logic from main.js by triggering it
  if (show) {
    ipcMain.emit('overlay:show-badge');
  } else {
    ipcMain.emit('overlay:hide-badge');
  }
}

async function check() {
  const isPackaged = true; // Force true to test against GitHub live releases
  if (!isPackaged) {
    setTimeout(() => {
      sendToUI('mg:update-not-available');
      notifyBadge(false);
    }, 1000);
    return { status: 'dev-mode' };
  }
  
  try {
    const result = await autoUpdater.checkForUpdates();
    return { status: 'checking', result };
  } catch (err) {
    sendToUI('mg:error', { message: err.message });
    return { status: 'error', message: err.message };
  }
}

function download() {
  if (!app.isPackaged) return;
  autoUpdater.downloadUpdate();
}

function install() {
  if (!app.isPackaged) return;
  autoUpdater.quitAndInstall();
}

function getStatus() {
  if (!app.isPackaged) return { status: 'dev-mode' };
  if (updateDownloaded) return { status: 'downloaded', version: updateInfo?.version };
  if (updateInfo) return { status: 'available', version: updateInfo.version };
  return { status: 'idle' };
}

module.exports = { 
  init, 
  check, 
  download, 
  install, 
  getStatus, 
  getVersion: () => app.getVersion() 
};
