(function() {
  var panel = document.createElement('div');
  panel.id = 'qpm-custom-panel';
  panel.style.cssText = [
    'position: fixed',
    'top: 80px',
    'right: 20px',
    'z-index: 999999',
    'width: 320px',
    'max-height: 80vh',
    'background: rgba(12, 17, 22, 0.95)',
    'border: 1px solid rgba(143, 130, 255, 0.3)',
    'border-radius: 12px',
    'box-shadow: 0 8px 32px rgba(0,0,0,0.6)',
    'font-family: system-ui, -apple-system, sans-serif',
    'font-size: 13px',
    'color: #eef0ff',
    'overflow: hidden',
    'display: flex',
    'flex-direction: column',
    'user-select: none',
    'backdrop-filter: blur(8px)',
  ].join(';');

  // Drag header
  var header = document.createElement('div');
  header.style.cssText = [
    'padding: 10px 14px',
    'background: rgba(143, 130, 255, 0.15)',
    'border-bottom: 1px solid rgba(143, 130, 255, 0.2)',
    'display: flex',
    'align-items: center',
    'justify-content: space-between',
    'cursor: move',
    'flex-shrink: 0',
  ].join(';');

  var title = document.createElement('span');
  title.textContent = 'QPM Control Panel';
  title.style.cssText = 'font-weight: 700; font-size: 14px; color: #8f82ff; letter-spacing: 0.3px;';

  var closeBtn = document.createElement('button');
  closeBtn.textContent = '?';
  closeBtn.style.cssText = [
    'background: none',
    'border: none',
    'color: rgba(255,255,255,0.4)',
    'cursor: pointer',
    'font-size: 16px',
    'padding: 0 2px',
    'line-height: 1',
  ].join(';');
  closeBtn.onclick = function() { panel.style.display = 'none'; };
  closeBtn.onmouseenter = function() { closeBtn.style.color = '#fff'; };
  closeBtn.onmouseleave = function() { closeBtn.style.color = 'rgba(255,255,255,0.4)'; };

  header.appendChild(title);
  header.appendChild(closeBtn);
  panel.appendChild(header);

  // Content area
  var content = document.createElement('div');
  content.style.cssText = [
    'padding: 10px 14px',
    'overflow-y: auto',
    'flex: 1',
    'display: flex',
    'flex-direction: column',
    'gap: 6px',
  ].join(';');

  // Status section
  var statusSection = document.createElement('div');
  statusSection.style.cssText = [
    'padding: 8px 10px',
    'border-radius: 8px',
    'background: rgba(255,255,255,0.03)',
    'border: 1px solid rgba(255,255,255,0.06)',
    'font-size: 11px',
    'display: flex',
    'align-items: center',
    'gap: 8px',
    'margin-bottom: 4px',
  ].join(';');

  var statusDot = document.createElement('span');
  statusDot.style.cssText = 'width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0;';
  var statusText = document.createElement('span');
  statusText.style.cssText = 'color: rgba(255,255,255,0.6);';

  statusSection.appendChild(statusDot);
  statusSection.appendChild(statusText);
  content.appendChild(statusSection);

  // Sep
  var sep = document.createElement('div');
  sep.style.cssText = 'height: 1px; background: rgba(255,255,255,0.06); margin: 4px 0;';
  content.appendChild(sep);

  // Menu commands section
  var menuLabel = document.createElement('div');
  menuLabel.textContent = 'QPM Commands';
  menuLabel.style.cssText = 'font-size: 11px; font-weight: 600; color: rgba(143,130,255,0.7); text-transform: uppercase; letter-spacing: 0.5px; padding: 2px 0;';
  content.appendChild(menuLabel);

  var menuContainer = document.createElement('div');
  menuContainer.style.cssText = 'display: flex; flex-direction: column; gap: 4px;';
  content.appendChild(menuContainer);

  // Sprite fallback button
  var sep2 = document.createElement('div');
  sep2.style.cssText = 'height: 1px; background: rgba(255,255,255,0.06); margin: 4px 0;';
  content.appendChild(sep2);

  var debugLabel = document.createElement('div');
  debugLabel.textContent = 'Debug';
  debugLabel.style.cssText = 'font-size: 11px; font-weight: 600; color: rgba(255,255,255,0.3); text-transform: uppercase; letter-spacing: 0.5px; padding: 2px 0;';
  content.appendChild(debugLabel);

  var forceBtn = createButton('Force Sprite Init', function() {
    console.log('[QPM-Panel] Forcing sprite init...');
    window.__PIXI_APP_INIT__ = true;
    window.dispatchEvent(new Event('__PIXI_APP_INIT__'));
    try {
      var canvas = document.querySelector('canvas');
      if (canvas) { window.__PIXI_APP__ = canvas.__pixi || canvas; }
    } catch(e) {}
    forceBtn.textContent = '? Sprite Init Fired';
    forceBtn.style.borderColor = 'rgba(34,197,94,0.4)';
    setTimeout(function() { forceBtn.textContent = 'Force Sprite Init'; forceBtn.style.borderColor = ''; }, 2000);
  });
  content.appendChild(forceBtn);

  var refreshBtn = createButton('? Refresh Menu', function() {
    updateMenu();
    refreshBtn.textContent = '? Refreshed';
    setTimeout(function() { refreshBtn.textContent = '? Refresh Menu'; }, 1000);
  });
  content.appendChild(refreshBtn);

  panel.appendChild(content);

  // Create a styled button
  function createButton(text, onClick) {
    var btn = document.createElement('button');
    btn.textContent = text;
    btn.style.cssText = [
      'padding: 7px 10px',
      'border-radius: 6px',
      'border: 1px solid rgba(143,130,255,0.25)',
      'background: rgba(143,130,255,0.08)',
      'color: #eef0ff',
      'font-size: 12px',
      'cursor: pointer',
      'text-align: left',
      'transition: background 0.15s, border-color 0.15s',
      'font-family: inherit',
    ].join(';');
    btn.onmouseenter = function() {
      btn.style.background = 'rgba(143,130,255,0.18)';
      btn.style.borderColor = 'rgba(143,130,255,0.5)';
    };
    btn.onmouseleave = function() {
      btn.style.background = 'rgba(143,130,255,0.08)';
      btn.style.borderColor = 'rgba(143,130,255,0.25)';
    };
    btn.onclick = onClick;
    return btn;
  }

  // Update menu from QPM_MENU
  function updateMenu() {
    menuContainer.innerHTML = '';
    var commands = window.QPM_MENU || {};
    var keys = Object.keys(commands);
    if (keys.length === 0) {
      var empty = document.createElement('div');
      empty.textContent = 'No QPM commands registered yet';
      empty.style.cssText = 'font-size: 11px; color: rgba(255,255,255,0.3); font-style: italic; padding: 8px 0; text-align: center;';
      menuContainer.appendChild(empty);
    } else {
      keys.forEach(function(name) {
        var btn = createButton(name, function() {
          try {
            commands[name]();
            console.log('[QPM-Panel] Executed:', name);
          } catch(e) {
            console.error('[QPM-Panel] Command error:', e);
          }
        });
        menuContainer.appendChild(btn);
      });
    }

    // Update status
    var hasQpm = typeof window.__QPM_INITIALIZED__ !== 'undefined' || keys.length > 0;
    statusDot.style.background = hasQpm ? '#22c55e' : '#ef4444';
    statusDot.style.boxShadow = hasQpm ? '0 0 6px rgba(34,197,94,0.5)' : 'none';
    statusText.textContent = hasQpm ? 'QPM is running (' + keys.length + ' commands)' : 'QPM not detected';
  }

  // Drag functionality
  var isDragging = false, startX, startY, startLeft, startRight;
  header.onmousedown = function(e) {
    isDragging = true;
    startX = e.clientX;
    startY = e.clientY;
    startRight = parseInt(panel.style.right) || 20;
    startLeft = parseInt(panel.style.left) || null;
    document.body.style.cursor = 'move';
    panel.style.transition = 'none';
  };
  document.onmousemove = function(e) {
    if (!isDragging) return;
    var dx = startX - e.clientX;
    var dy = startY - e.clientY;
    if (startLeft !== null) {
      panel.style.left = (startLeft - dx) + 'px';
      panel.style.right = 'auto';
    } else {
      panel.style.right = (startRight + dx) + 'px';
      panel.style.left = 'auto';
    }
    panel.style.top = (parseInt(panel.style.top) || 80) - dy + 'px';
    startX = e.clientX;
    startY = e.clientY;
    startRight = parseInt(panel.style.right) || 20;
    startLeft = parseInt(panel.style.left) || null;
  };
  document.onmouseup = function() {
    if (isDragging) {
      isDragging = false;
      document.body.style.cursor = '';
      panel.style.transition = '';
    }
  };

  // Append to body
  if (document.body) {
    document.body.appendChild(panel);
  } else {
    document.addEventListener('DOMContentLoaded', function() {
      document.body.appendChild(panel);
    });
  }

  // Initial update with delay for QPM to register
  setTimeout(updateMenu, 1000);
  setTimeout(updateMenu, 3000);
  setInterval(updateMenu, 10000);
})();
