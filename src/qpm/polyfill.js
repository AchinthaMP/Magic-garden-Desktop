(function() {
  if (typeof unsafeWindow === 'undefined') { window.unsafeWindow = window; }

  if (typeof GM_xmlhttpRequest === 'undefined') {
    window.GM_xmlhttpRequest = function(details) {
      var xhr = new XMLHttpRequest();
      xhr.open(details.method || 'GET', details.url, true);
      if (details.headers) {
        Object.keys(details.headers).forEach(function(k) {
          xhr.setRequestHeader(k, details.headers[k]);
        });
      }
      if (details.responseType) xhr.responseType = details.responseType;
      if (details.timeout) xhr.timeout = details.timeout;
      xhr.onload = function() {
        if (details.onload) details.onload({
          status: xhr.status,
          statusText: xhr.statusText,
          response: xhr.response,
          responseText: xhr.responseText,
          responseHeaders: xhr.getAllResponseHeaders(),
          finalUrl: details.url,
          readyState: xhr.readyState
        });
      };
      xhr.onerror = function() {
        if (details.onerror) details.onerror({ status: 0, statusText: 'error' });
      };
      xhr.ontimeout = function() {
        if (details.ontimeout) details.ontimeout();
      };
      xhr.onprogress = function(e) {
        if (details.onprogress) details.onprogress(e);
      };
      xhr.onreadystatechange = function() {
        if (xhr.readyState === 4 && details.onloadend) details.onloadend({
          status: xhr.status,
          response: xhr.response,
          responseText: xhr.responseText
        });
      };
      if (details.data) xhr.send(details.data);
      else xhr.send();
      return xhr;
    };
  }

  if (typeof GM_setValue === 'undefined') {
    window.GM_setValue = function(key, val) {
      try { localStorage.setItem('QPM_' + key, JSON.stringify(val)); } catch(e) {}
    };
  }
  if (typeof GM_getValue === 'undefined') {
    window.GM_getValue = function(key, def) {
      try {
        var v = localStorage.getItem('QPM_' + key);
        return v !== null ? JSON.parse(v) : def;
      } catch(e) { return def; }
    };
  }
  if (typeof GM_deleteValue === 'undefined') {
    window.GM_deleteValue = function(key) {
      try { localStorage.removeItem('QPM_' + key); } catch(e) {}
    };
  }
  if (typeof GM_listValues === 'undefined') {
    window.GM_listValues = function() {
      var out = [];
      try {
        for (var i = 0; i < localStorage.length; i++) {
          var k = localStorage.key(i);
          if (k && k.indexOf('QPM_') === 0) out.push(k.slice(4));
        }
      } catch(e) {}
      return out;
    };
  }

  if (typeof GM_addStyle === 'undefined') {
    window.GM_addStyle = function(css) {
      const style = document.createElement('style');
      style.textContent = css;
      document.head.appendChild(style);
      return style;
    };
  }

  if (typeof GM_registerMenuCommand === 'undefined') {
    window.GM_registerMenuCommand = function(name, fn) {
      console.log('[QPM] Menu registered:', name);
      // Optional: expose it to window for manual trigger
      if (!window.QPM_MENU) window.QPM_MENU = {};
      window.QPM_MENU[name] = fn;
    };
  }

  if (typeof GM_setClipboard === 'undefined') {
    window.GM_setClipboard = function(text) {
      navigator.clipboard.writeText(text);
    };
  }

  if (typeof GM_log === 'undefined') {
    window.GM_log = console.log.bind(console);
  }

  if (typeof GM_getResourceText === 'undefined') {
    window.GM_getResourceText = function() { return null; };
  }
  
  if (typeof GM_getResourceURL === 'undefined') {
    window.GM_getResourceURL = function() { return null; };
  }

  if (typeof GM_openInTab === 'undefined') {
    window.GM_openInTab = function(url, opts) {
      window.open(url, '_blank', 'noopener,noreferrer');
    };
  }

  if (typeof GM === 'undefined') window.GM = {};
  if (!GM.setValue) GM.setValue = GM_setValue;
  if (!GM.getValue) GM.getValue = GM_getValue;
  if (!GM.deleteValue) GM.deleteValue = GM_deleteValue;
  if (!GM.listValues) GM.listValues = GM_listValues;
  if (!GM.xmlHttpRequest) GM.xmlHttpRequest = GM_xmlhttpRequest;
  if (!GM.openInTab) GM.openInTab = GM_openInTab;
  if (!GM.registerMenuCommand) GM.registerMenuCommand = GM_registerMenuCommand;
  if (!GM.addStyle) GM.addStyle = GM_addStyle;
  if (!GM.setClipboard) GM.setClipboard = GM_setClipboard;
  if (!GM.log) GM.log = GM_log;
  if (!GM.getResourceText) GM.getResourceText = GM_getResourceText;
  if (!GM.getResourceURL) GM.getResourceURL = GM_getResourceURL;

  console.log('[QPM] GM polyfill ready');
})();
