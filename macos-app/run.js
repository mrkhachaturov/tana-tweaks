#!/usr/bin/env node
/**
 * Tana Tweaks - All-in-One Runner
 * Uses Page.setBypassCSP and stays connected to handle reloads
 */

const http = require('http');
const fs = require('fs');
const path = require('path');
const WebSocket = require('ws');

const DEBUG_PORT = 9222;
const CONTENT_SCRIPT = fs.readFileSync(path.join(__dirname, 'content-script-electron.js'), 'utf8');

const CHROME_STORAGE_MOCK = `
window.chrome = window.chrome || {};
window.chrome.storage = {
  sync: {
    get: function(defaults) {
      return new Promise((resolve) => {
        const stored = localStorage.getItem('tana-tweaks-settings');
        const data = stored ? JSON.parse(stored) : {};
        resolve({ ...defaults, ...data });
      });
    },
    set: function(data) {
      return new Promise((resolve) => {
        const stored = localStorage.getItem('tana-tweaks-settings');
        const existing = stored ? JSON.parse(stored) : {};
        localStorage.setItem('tana-tweaks-settings', JSON.stringify({ ...existing, ...data }));
        resolve();
      });
    }
  }
};
window.chrome.runtime = { onMessage: { addListener: function() {} } };

// Initialize default rules
(function() {
  const DEFAULT_RULES = [
    {
      id: "preset-kinescope",
      name: "Kinescope", 
      enabled: true,
      pattern: "kinescope\\\\.io/(?:embed/)?([a-zA-Z0-9_-]+)",
      embedTemplate: '<iframe src="https://kinescope.io/embed/{{match1}}" allowfullscreen></iframe>'
    },
    {
      id: "preset-loom",
      name: "Loom",
      enabled: true, 
      pattern: "loom\\\\.com/share/([a-zA-Z0-9]+)",
      embedTemplate: '<iframe src="https://www.loom.com/embed/{{match1}}" allowfullscreen></iframe>'
    },
    {
      id: "preset-vkvideo",
      name: "VK Video",
      enabled: true,
      pattern: "vkvideo\\\\.ru/video(\\\\d+)_(\\\\d+)",
      embedTemplate: '<iframe src="https://vkvideo.ru/video_ext.php?oid={{match1}}&id={{match2}}" allowfullscreen></iframe>'
    }
  ];
  if (!localStorage.getItem('tana-tweaks-settings')) {
    localStorage.setItem('tana-tweaks-settings', JSON.stringify({ customRules: DEFAULT_RULES }));
    console.log('[Tana Tweaks] Initialized default rules');
  }
})();
`;

function httpGetJson(urlPath) {
  return new Promise((resolve, reject) => {
    http.get(`http://localhost:${DEBUG_PORT}${urlPath}`, res => {
      let data = '';
      res.on('data', c => data += c);
      res.on('end', () => {
        try { resolve(JSON.parse(data)); }
        catch (e) { reject(e); }
      });
    }).on('error', reject);
  });
}

async function findTana() {
  try {
    const targets = await httpGetJson('/json/list');
    return targets.find(t => t.type === 'page' && t.url.includes('app.tana.inc'));
  } catch {
    return null;
  }
}

async function runSession(tana) {
  return new Promise((resolve) => {
    console.log(`[+] Connecting to: ${tana.url.substring(0, 50)}...`);
    
    const ws = new WebSocket(tana.webSocketDebuggerUrl);
    let msgId = 0;
    const pending = new Map();
    
    const send = (method, params = {}) => new Promise((res, rej) => {
      const id = ++msgId;
      pending.set(id, { resolve: res, reject: rej, method });
      ws.send(JSON.stringify({ id, method, params }));
    });
    
    const inject = async () => {
      try {
        await send('Runtime.evaluate', { expression: CHROME_STORAGE_MOCK });
        console.log('[+] Injected storage mock');
        
        await send('Runtime.evaluate', { expression: CONTENT_SCRIPT });
        console.log('[+] Injected content script');
        console.log('[*] Ready! Videos should now embed properly.');
      } catch (e) {
        console.log('[-] Injection error:', e.message);
      }
    };
    
    ws.on('open', async () => {
      console.log('[+] Connected');
      
      try {
        await send('Page.enable');
        await send('Runtime.enable');
        
        // CSP bypass must be set BEFORE page loads, so we set it then reload
        await send('Page.setBypassCSP', { enabled: true });
        console.log('[+] CSP bypass enabled - reloading page to apply...');
        
        // Reload to apply CSP bypass
        await send('Page.reload', { ignoreCache: true });
        console.log('[*] Page reloading...');
        
        // Injection will happen via Page.loadEventFired handler
      } catch (e) {
        console.log('[-] Setup error:', e.message);
      }
    });
    
    ws.on('message', async raw => {
      const msg = JSON.parse(raw);
      
      if (msg.id && pending.has(msg.id)) {
        const { resolve, reject } = pending.get(msg.id);
        pending.delete(msg.id);
        if (msg.error) reject(new Error(msg.error.message));
        else resolve(msg.result);
        return;
      }
      
      // Detect page navigation/reload
      if (msg.method === 'Page.frameNavigated' && msg.params?.frame?.url?.includes('app.tana.inc')) {
        console.log('[*] Page navigated, re-enabling CSP bypass...');
        try {
          await send('Page.setBypassCSP', { enabled: true });
        } catch {}
        setTimeout(inject, 1000);
      }
      
      if (msg.method === 'Page.loadEventFired') {
        console.log('[*] Page loaded, injecting scripts...');
        setTimeout(inject, 500);
      }
    });
    
    ws.on('error', e => {
      if (e.message.includes('ECONNREFUSED')) {
        console.log('[!] Connection refused - Tana not running?');
      } else {
        console.log('[-] Error:', e.message);
      }
    });
    
    ws.on('close', () => {
      console.log('[!] Disconnected');
      resolve();
    });
    
    // Keep alive ping
    const pingInterval = setInterval(() => {
      if (ws.readyState === WebSocket.OPEN) {
        send('Runtime.evaluate', { expression: '1' }).catch(() => {});
      } else {
        clearInterval(pingInterval);
      }
    }, 5000);
  });
}

async function main() {
  console.log('╔═══════════════════════════════════════╗');
  console.log('║     Tana Tweaks Runner                ║');
  console.log('║     CSP Bypass + Auto-Inject          ║');
  console.log('╚═══════════════════════════════════════╝');
  console.log('');
  console.log('Keep this running while using Tana.');
  console.log('Press Ctrl+C to stop.');
  console.log('');
  
  while (true) {
    const tana = await findTana();
    
    if (tana) {
      await runSession(tana);
    } else {
      console.log('[!] Tana not found. Waiting...');
    }
    
    await new Promise(r => setTimeout(r, 2000));
  }
}

process.on('SIGINT', () => {
  console.log('\n[*] Stopping...');
  process.exit(0);
});

main().catch(e => {
  console.error('Fatal:', e);
  process.exit(1);
});
