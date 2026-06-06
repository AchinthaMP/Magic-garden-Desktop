const { ipcRenderer } = require('electron');

window.__overlay = {
  onClick: function() { ipcRenderer.send('overlay:btn-click'); },
  showBadge: function() { ipcRenderer.send('overlay:show-badge'); },
  hideBadge: function() { ipcRenderer.send('overlay:hide-badge'); },
};
