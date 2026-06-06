import log from 'electron-log';
import { autoUpdater } from 'electron-updater';
import { BrowserWindow } from 'electron';

autoUpdater.logger = log;
log.transports.file.level = 'info';

let mainWindow: BrowserWindow | null = null;

function sendToUI(channel: string, data?: unknown): void {
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.webContents.send(channel, data);
  }
}

export function init(win: BrowserWindow): void {
  mainWindow = win;

  autoUpdater.on('checking-for-update', () => {
    log.info('Checking for update...');
    sendToUI('mg:update-message', 'Checking for update...');
  });

  autoUpdater.on('update-available', (info) => {
    log.info('Update available:', info);
    sendToUI('mg:update-available', { version: info.version });
  });

  autoUpdater.on('update-not-available', (info) => {
    log.info('Update not available:', info);
    sendToUI('mg:update-message', 'You have the latest version.');
  });

  autoUpdater.on('error', (err) => {
    log.error('Auto-updater error:', err);
    sendToUI('mg:update-message', 'Update error: ' + (err?.message || err));
  });

  autoUpdater.on('download-progress', (progress) => {
    const msg = `Download speed: ${progress.bytesPerSecond} - Downloaded ${progress.percent}% (${progress.transferred}/${progress.total})`;
    log.info(msg);
    sendToUI('mg:download-progress', {
      percent: Math.round(progress.percent),
      bytesPerSecond: progress.bytesPerSecond,
      transferred: progress.transferred,
      total: progress.total,
    });
  });

  autoUpdater.on('update-downloaded', (info) => {
    log.info('Update downloaded:', info);
    sendToUI('mg:update-downloaded', { version: info.version });
    setTimeout(() => {
      autoUpdater.quitAndInstall();
    }, 5000);
  });
}

export function checkForUpdates(): void {
  log.info('Checking for updates...');
  autoUpdater.checkForUpdatesAndNotify();
}
