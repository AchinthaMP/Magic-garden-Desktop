const fs = require('fs');
const path = require('path');
const { ipcRenderer } = require('electron');

const polyfill = fs.readFileSync(path.join(__dirname, 'polyfill.js'), 'utf8');
const updateUICode = require('./update-ui');

window.__mg_update = {
  checkForUpdates: () => ipcRenderer.invoke('mg:check-update'),
  downloadUpdate: () => ipcRenderer.invoke('mg:download-update'),
  installUpdate: () => ipcRenderer.invoke('mg:install-update'),
  getVersion: () => ipcRenderer.invoke('mg:get-version'),
  getReleaseNotes: () => ipcRenderer.invoke('mg:get-release-notes'),
  on: function(channel, cb) {
    ipcRenderer.on('mg:' + channel, function(_, data) { cb(data); });
  },
};

// Listen for show-update-modal request from main process
ipcRenderer.on('mg:show-modal', function() {
  if (window.__MG_UPDATE_UI__ && typeof window.__MG_UPDATE_UI_SHOW === 'function') {
    window.__MG_UPDATE_UI_SHOW();
    return;
  }
  try {
    eval(updateUICode);
  } catch (err) {
    console.error('[MG] UI Eval Error:', err);
  }
});

// PIXI hook: same as QPM's createPixiHooks()
// Intercepts Object.defineProperty for 'app' getter to detect PIXI init
// NOTE: desc.get() is NOT called here (avoids crashing the game)
const pixiHook = `
(function() {
  if (window.__QPM_PIXI_HOOK__) return;
  window.__QPM_PIXI_HOOK__ = true;
  var origDP = Object.defineProperty;
  Object.defineProperty = function(obj, prop, desc) {
    var result = origDP.call(this, obj, prop, desc);
    if (prop === 'app' && desc && desc.get) {
      if (!window.__PIXI_APP_INIT__) {
        window.__PIXI_APP_INIT__ = true;
        window.dispatchEvent(new Event('__PIXI_APP_INIT__'));
      }
    }
    return result;
  };
})();
`;

try {
  eval(polyfill + '\n' + pixiHook);
} catch (e) {
  try {
    require('electron').dialog.showErrorBox('Magic Garden - Preload Error', 
      'Failed to initialize QPM:\n' + (e.stack || e.message || e));
  } catch (_) {}
}
