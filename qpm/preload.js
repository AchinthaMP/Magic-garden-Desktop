const fs = require('fs');
const path = require('path');

const polyfill = fs.readFileSync(path.join(__dirname, 'polyfill.js'), 'utf8');

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

eval(polyfill + '\n' + pixiHook);
