(function() {
  console.log('[MG] Update UI script evaluated');
  if (window.__MG_UPDATE_UI__) {
    console.log('[MG] Update UI already loaded');
    if (typeof window.__MG_UPDATE_UI_SHOW === 'function') {
      window.__MG_UPDATE_UI_SHOW();
    }
    return;
  }

  var api = window.__mg_update;
  if (!api) {
    console.error('[MG] Update API not found on window.__mg_update');
    return;
  }

  window.__MG_UPDATE_UI__ = true;

  var state = { 
    status: 'idle', 
    currentVer: '', 
    version: null, 
    progress: null, 
    releaseNotes: null, 
    error: null 
  };

  var C = {
    bg: '#000000',
    surface: '#0f1114',
    border: '#1f2226',
    text: '#ffffff',
    muted: '#8b8e94',
    accent: '#d4b88c',
    accentHover: '#e0c89c',
    buttonDark: '#1a1d21',
    cardBg: '#08090a',
    danger: '#ff4d4d',
  };

  function html() {
    var isUpdate = state.status === 'available' || state.status === 'downloaded' || state.status === 'downloading';
    var isChecking = state.status === 'checking';
    
    var verBadgeText = (state.currentVer && state.version)
      ? ('v' + state.currentVer + ' <span style="color:' + C.accent + ';margin:0 8px;">\u2192</span> v' + state.version)
      : (state.currentVer ? 'v' + state.currentVer : '');

    return ''
    + '<div id="mg-overlay" style="display:none;position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.85);z-index:2147483647;justify-content:center;align-items:center;backdrop-filter:blur(12px);font-family:Inter, -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, sans-serif;">'

    + '<div style="background:' + C.surface + ';border:1px solid ' + C.border + ';border-radius:28px;padding:0;max-width:620px;width:94%;color:' + C.text + ';font-size:14px;max-height:85vh;overflow:hidden;box-shadow:0 40px 120px rgba(0,0,0,0.9);display:flex;flex-direction:column;position:relative;">'

    /* ── Header ── */
    + '<div style="display:flex;justify-content:space-between;align-items:center;padding:28px 40px 20px;">'
      + '<button id="mg-back" style="background:none;border:none;color:' + C.muted + ';font-size:13px;cursor:pointer;padding:0;display:flex;align-items:center;gap:10px;font-weight:500;transition:color 0.2s;">'
        + '<span style="font-size:20px;">\u2190</span> Back to Dashboard'
      + '</button>'
      + '<div style="display:flex;align-items:center;gap:16px;">'
        + '<span style="font-size:10px;color:' + C.muted + ';letter-spacing:2px;text-transform:uppercase;font-weight:700;">SYSTEM ROUTE</span>'
        + '<span id="mg-ver-badge" style="font-size:12px;color:' + C.text + ';background:' + C.bg + ';padding:5px 14px;border-radius:10px;border:1px solid ' + C.border + ';font-weight:600;display:flex;align-items:center;">' + verBadgeText + '</span>'
        + '<button id="mg-close-x" style="background:none;border:none;color:' + C.muted + ';font-size:22px;cursor:pointer;padding:4px 8px;line-height:1;transition:color 0.2s;margin-left:8px;">\u2715</button>'
      + '</div>'
    + '</div>'

    /* ── Main Body ── */
    + '<div style="padding:10px 40px 40px;flex:1;overflow-y:auto;">'

      /* Main Icon + Title Section */
      + '<div style="display:flex;align-items:center;gap:24px;margin-bottom:32px;margin-top:10px;">'
        + '<div style="width:72px;height:72px;border-radius:50%;background:' + C.bg + ';border:1.5px solid ' + C.border + ';display:flex;align-items:center;justify-content:center;font-size:28px;color:' + C.accent + ';flex-shrink:0;box-shadow:inset 0 0 20px rgba(0,0,0,0.5);">'
          + '<span id="mg-icon-arrow" style="' + (state.status === 'downloading' || isChecking ? 'display:none;' : '') + '">\u2193</span>'
          + '<div id="mg-icon-spinner" style="' + (isChecking || state.status === 'downloading' ? '' : 'display:none;') + ';width:24px;height:24px;border:3px solid rgba(212, 184, 140, 0.1);border-top-color:' + C.accent + ';border-radius:50%;animation:mg-spin 0.8s linear infinite;"></div>'
        + '</div>'
        + '<div>'
          + '<div id="mg-status-label" style="font-size:11px;color:' + C.accent + ';letter-spacing:2px;text-transform:uppercase;font-weight:800;opacity:0.9;">'
            + (state.status === 'available' ? 'SYSTEM UPDATE PENDING' : (isChecking ? 'CHECKING FOR UPDATES' : (state.status === 'downloading' ? 'DOWNLOADING UPDATE' : (state.status === 'downloaded' ? 'UPDATE READY' : 'SYSTEM UP TO DATE'))))
          + '</div>'
          + '<div id="mg-title" style="font-size:32px;font-weight:800;color:' + C.text + ';margin-top:2px;letter-spacing:-0.5px;">'
            + 'Magic Garden' + (state.version ? (' <span style="color:' + C.accent + '">v' + state.version + '</span>') : (state.currentVer ? ' v' + state.currentVer : ''))
          + '</div>'
        + '</div>'
      + '</div>'

      /* ── Progress ── */
      + '<div id="mg-progress-section" style="margin-bottom:32px;display:none;background:' + C.cardBg + ';padding:20px;border-radius:18px;border:1px solid ' + C.border + ';">'
        + '<div style="display:flex;justify-content:space-between;font-size:13px;color:' + C.text + ';margin-bottom:12px;font-weight:600;">'
          + '<span id="mg-progress-text">Downloading update...</span>'
          + '<span id="mg-progress-pct" style="color:' + C.accent + ';">0%</span>'
        + '</div>'
        + '<div style="height:8px;background:' + C.bg + ';border-radius:4px;overflow:hidden;border:1px solid ' + C.border + ';">'
          + '<div id="mg-progress-bar" style="height:100%;width:0%;background:' + C.accent + ';border-radius:4px;transition:width .4s cubic-bezier(0.4, 0, 0.2, 1);box-shadow:0 0 15px rgba(212, 184, 140, 0.4);"></div>'
        + '</div>'
      + '</div>'

      /* ── Changelog ── */
      + '<div id="mg-changelog-section" style="' + (state.releaseNotes ? '' : 'display:none;') + '">'
        + '<div style="font-size:11px;color:' + C.muted + ';letter-spacing:2px;text-transform:uppercase;margin-bottom:14px;font-weight:800;">WHAT\\'S NEW IN THIS VERSION</div>'
        + '<div id="mg-release-notes" style="background:' + C.cardBg + ';border:1px solid ' + C.border + ';border-radius:20px;padding:24px;max-height:260px;overflow-y:auto;font-size:14px;line-height:1.8;color:' + C.text + ';white-space:pre-wrap;opacity:0.95;">'
          + (state.releaseNotes || '')
        + '</div>'
      + '</div>'

      /* ── Error ── */
      + '<div id="mg-error" style="color:' + C.danger + ';font-size:13px;margin-top:20px;display:none;background:rgba(255, 77, 77, 0.1);padding:14px 20px;border-radius:12px;border:1px solid rgba(255, 77, 77, 0.2);font-weight:500;"></div>'

    + '</div>'

    /* ── Footer ── */
    + '<div style="padding:28px 40px;display:flex;gap:14px;justify-content:flex-end;background:rgba(0,0,0,0.2);border-top:1px solid ' + C.border + ';">'
      + '<button id="mg-btn-skip" style="padding:14px 28px;border:1.5px solid ' + C.border + ';border-radius:16px;cursor:pointer;font-size:13px;background:' + C.buttonDark + ';color:' + C.muted + ';font-weight:700;transition:all 0.2s;letter-spacing:0.5px;">SKIP FOR NOW</button>'
      + '<button id="mg-btn-primary" style="display:' + (isUpdate ? 'flex' : 'none') + ';padding:14px 32px;border:none;border-radius:16px;cursor:pointer;font-size:13px;background:' + C.accent + ';color:#000000;font-weight:800;align-items:center;gap:12px;transition:all 0.2s;box-shadow:0 8px 24px rgba(212, 184, 140, 0.25);letter-spacing:0.5px;">'
        + '<span id="mg-btn-icon" style="font-size:18px;">\u2193</span> <span id="mg-btn-primary-text">' + (state.status === 'downloaded' ? 'INSTALL & UPDATE NOW' : 'DOWNLOAD & UPDATE NOW') + '</span>'
      + '</button>'
    + '</div>'

    + '</div>'
    + '<style>'
      + '@keyframes mg-spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }'
      + '#mg-back:hover { color: ' + C.text + ' !important; }'
      + '#mg-btn-skip:hover { border-color: ' + C.muted + '; color: ' + C.text + '; background: ' + C.border + '; }'
      + '#mg-btn-primary:hover { background: ' + C.accentHover + '; transform: translateY(-2px); box-shadow: 0 12px 32px rgba(212, 184, 140, 0.35); }'
      + '#mg-btn-primary:active { transform: translateY(0); }'
      + '#mg-release-notes::-webkit-scrollbar { width: 8px; }'
      + '#mg-release-notes::-webkit-scrollbar-track { background: transparent; }'
      + '#mg-release-notes::-webkit-scrollbar-thumb { background: ' + C.border + '; border-radius: 10px; }'
      + '#mg-release-notes::-webkit-scrollbar-thumb:hover { background: ' + C.muted + '; }'
    + '</style>'
    + '</div>';
  }

  function show() {
    var el = document.getElementById('mg-overlay');
    if (el) { el.style.display = 'flex'; return; }
    initUI();
  }
  window.__MG_UPDATE_UI_SHOW = show;

  function hide() {
    var el = document.getElementById('mg-overlay');
    if (el) el.style.display = 'none';
  }

  function refreshUI() {
    var overlay = document.getElementById('mg-overlay');
    var iconArrow = document.getElementById('mg-icon-arrow');
    var iconSpinner = document.getElementById('mg-icon-spinner');
    var statusLabel = document.getElementById('mg-status-label');
    var title = document.getElementById('mg-title');
    var verBadge = document.getElementById('mg-ver-badge');
    var notes = document.getElementById('mg-release-notes');
    var notesSection = document.getElementById('mg-changelog-section');
    var progressSection = document.getElementById('mg-progress-section');
    var bar = document.getElementById('mg-progress-bar');
    var pct = document.getElementById('mg-progress-pct');
    var progText = document.getElementById('mg-progress-text');
    var errEl = document.getElementById('mg-error');
    var skipBtn = document.getElementById('mg-btn-skip');
    var primaryBtn = document.getElementById('mg-btn-primary');
    var primaryText = document.getElementById('mg-btn-primary-text');
    var btnIcon = document.getElementById('mg-btn-icon');

    var isUpdate = state.status === 'available' || state.status === 'downloaded';
    var isChecking = state.status === 'checking';
    var isDownloading = state.status === 'downloading';

    if (iconArrow) iconArrow.style.display = (isDownloading || isChecking) ? 'none' : '';
    if (iconSpinner) iconSpinner.style.display = (isChecking || isDownloading) ? '' : 'none';

    if (statusLabel) {
      if (state.status === 'available') statusLabel.textContent = 'SYSTEM UPDATE PENDING';
      else if (isChecking) statusLabel.textContent = 'CHECKING FOR UPDATES';
      else if (isDownloading) statusLabel.textContent = 'DOWNLOADING UPDATE';
      else if (state.status === 'downloaded') statusLabel.textContent = 'UPDATE READY';
      else statusLabel.textContent = 'SYSTEM UP TO DATE';
    }

    if (title) {
      if (state.version) {
        title.innerHTML = 'Magic Garden <span style="color:' + C.accent + '">v' + state.version + '</span>';
      } else if (state.currentVer) {
        title.textContent = 'Magic Garden v' + state.currentVer;
      }
    }

    if (verBadge) {
      if (state.currentVer && state.version) {
        verBadge.innerHTML = 'v' + state.currentVer + ' <span style="color:' + C.accent + ';margin:0 8px;">\u2192</span> v' + state.version;
      } else if (state.currentVer) {
        verBadge.textContent = 'v' + state.currentVer;
      }
    }

    if (notesSection) notesSection.style.display = state.releaseNotes ? '' : 'none';
    if (notes) notes.textContent = state.releaseNotes || '';

    if (progressSection) {
      if (isDownloading && state.progress) {
        progressSection.style.display = '';
        if (bar) bar.style.width = state.progress.percent + '%';
        if (pct) pct.textContent = state.progress.percent + '%';
        if (progText) {
          progText.textContent = state.progress.bytesPerSecond
            ? 'Downloading... (' + formatBytes(state.progress.bytesPerSecond) + '/s)'
            : 'Downloading...';
        }
      } else {
        progressSection.style.display = 'none';
      }
    }

    if (errEl) {
      if (state.error) {
        errEl.textContent = state.error;
        errEl.style.display = '';
      } else {
        errEl.style.display = 'none';
      }
    }

    if (skipBtn) skipBtn.style.display = isChecking ? 'none' : '';

    if (primaryBtn) {
      if (isUpdate || isDownloading) {
        primaryBtn.style.display = 'flex';
        if (primaryText) {
          if (state.status === 'downloaded') {
            primaryText.textContent = 'INSTALL & UPDATE NOW';
            if (btnIcon) btnIcon.textContent = '\u21BB';
          } else if (isDownloading) {
            primaryText.textContent = 'DOWNLOADING...';
            if (btnIcon) btnIcon.textContent = '\u29D7';
          } else {
            primaryText.textContent = 'DOWNLOAD & UPDATE NOW';
            if (btnIcon) btnIcon.textContent = '\u2193';
          }
        }
      } else {
        primaryBtn.style.display = 'none';
      }
    }
  }

  function formatBytes(b) {
    if (b < 1024) return b + ' B/s';
    if (b < 1048576) return (b / 1024).toFixed(1) + ' KB/s';
    return (b / 1048576).toFixed(1) + ' MB/s';
  }

  function initUI() {
    var existing = document.getElementById('mg-overlay');
    if (existing) existing.remove();

    var container = document.createElement('div');
    container.innerHTML = html();
    (document.body || document.documentElement).appendChild(container.firstElementChild);
    console.log('[MG] Update UI appended to document');
    
    document.getElementById('mg-back').onclick = hide;
    document.getElementById('mg-close-x').onclick = hide;
    document.getElementById('mg-btn-skip').onclick = hide;
    document.getElementById('mg-btn-primary').onclick = function() {
      if (state.status === 'downloaded') {
        api.installUpdate();
      } else if (state.status === 'available') {
        state.error = null;
        state.status = 'downloading';
        refreshUI();
        api.downloadUpdate();
      }
    };
    refreshUI();
    show();
    checkWithNotes();
  }

  function checkWithNotes() {
    api.getVersion().then(function(v) {
      state.currentVer = v;
      refreshUI();
    });

    api.getReleaseNotes().then(function(data) {
      if (data && data.body) {
        state.releaseNotes = data.body;
        refreshUI();
      }
    });

    if (state.status !== 'available' && state.status !== 'downloading' && state.status !== 'downloaded') {
      state.status = 'checking';
      state.error = null;
      refreshUI();
      api.checkForUpdates();
    }
  }

  api.on('update-available', function(info) {
    state.status = 'available';
    state.version = info.version;
    state.error = null;
    refreshUI();
  });

  api.on('update-not-available', function() {
    if (state.status === 'checking') {
      state.status = 'idle';
      refreshUI();
    }
  });

  api.on('download-progress', function(p) {
    state.status = 'downloading';
    state.progress = p;
    refreshUI();
  });

  api.on('update-downloaded', function(info) {
    state.status = 'downloaded';
    state.version = info.version;
    state.progress = null;
    refreshUI();
  });

  api.on('error', function(err) {
    state.status = 'idle';
    state.error = err.message || 'Error checking for updates';
    refreshUI();
  });

  initUI();
})();
