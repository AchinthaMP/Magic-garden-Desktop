import * as fs from 'fs';
import * as path from 'path';

const polyfill = fs.readFileSync(path.join(__dirname, 'polyfill.js'), 'utf8');

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
      'Failed to initialize QPM:\n' + (e instanceof Error ? (e.stack || e.message) : String(e)));
  } catch { /* ignore */ }
}
