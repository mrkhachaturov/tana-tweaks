/**
 * Tana Tweaks - Content Script (Electron Version)
 * Direct iframe embedding - CSP must be modified by csp-interceptor.js
 */

(function () {
  'use strict';

  let settings = { customRules: [] };
  let compiledRules = [];
  const PROCESSED_ATTR = 'data-tana-tweaks-processed';

  /**
   * Creates a responsive 16:9 wrapper with DIRECT iframe (no blob)
   */
  function createEmbedWrapper(embedUrl, ruleName) {
    const wrapper = document.createElement('div');
    wrapper.className = 'tana-tweaks-embed';
    wrapper.style.cssText = `
      position: relative;
      width: 100%;
      padding-bottom: 56.25%;
      height: 0;
      margin: 10px 0;
      border-radius: 8px;
      overflow: hidden;
      background: #1a1a1a;
    `;

    const iframe = document.createElement('iframe');
    iframe.src = embedUrl;  // Direct URL, no blob wrapper
    iframe.style.cssText = `
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      border: none;
    `;
    iframe.setAttribute('allowfullscreen', '');
    iframe.setAttribute('allow', 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share');
    iframe.setAttribute('referrerpolicy', 'no-referrer-when-downgrade');
    
    // Error handling
    iframe.onerror = () => console.error('[Tana Tweaks] Iframe failed to load:', embedUrl);
    iframe.onload = () => console.log('[Tana Tweaks] Iframe loaded:', embedUrl);
    
    wrapper.appendChild(iframe);
    return wrapper;
  }

  /**
   * Extracts embed URL from template HTML
   */
  function extractEmbedUrl(html) {
    const match = html.match(/src="([^"]+)"/);
    return match ? match[1] : null;
  }

  function insertEmbed(link, wrapper) {
    const isTanaPub = window.location.hostname.includes('tana.pub');

    if (isTanaPub) {
      link.parentElement.insertBefore(wrapper, link.nextSibling);
      link.style.display = 'none';
    } else {
      const contentWrapper = link.closest('.contentWrapper');
      if (contentWrapper?.parentElement) {
        contentWrapper.parentElement.insertBefore(wrapper, contentWrapper.nextSibling);
        const editableWrapper = link.closest('[data-editable-wrapper="true"]');
        if (editableWrapper) {
          editableWrapper.style.display = 'none';
        }
      } else {
        link.parentElement.insertBefore(wrapper, link.nextSibling);
        link.style.display = 'none';
      }
    }
  }

  function processTemplate(template, matches) {
    let result = template;
    result = result.replace(/\{\{match\}\}/g, matches[0] || '');
    for (let i = 1; i < matches.length; i++) {
      result = result.replace(new RegExp(`\\{\\{match${i}\\}\\}`, 'g'), matches[i] || '');
    }
    return result;
  }

  function compileRules() {
    compiledRules = (settings.customRules || [])
      .filter(rule => rule.enabled)
      .map(rule => {
        try {
          return { ...rule, regex: new RegExp(rule.pattern) };
        } catch (e) {
          console.warn(`[Tana Tweaks] Invalid regex in rule "${rule.name}":`, e);
          return null;
        }
      })
      .filter(Boolean);
    
    console.log(`[Tana Tweaks] Compiled ${compiledRules.length} active rules:`, compiledRules.map(r => r.name));
  }

  function matchRule(href) {
    for (const rule of compiledRules) {
      const matches = href.match(rule.regex);
      if (matches) {
        const html = processTemplate(rule.embedTemplate, matches);
        const embedUrl = extractEmbedUrl(html);
        console.log(`[Tana Tweaks] Matched "${rule.name}":`, href, '→', embedUrl);
        return { embedUrl, ruleName: rule.name };
      }
    }
    return null;
  }

  function processLink(link) {
    if (link.hasAttribute(PROCESSED_ATTR)) return;
    link.setAttribute(PROCESSED_ATTR, 'true');

    const href = link.href;
    const match = matchRule(href);
    
    if (match && match.embedUrl) {
      const wrapper = createEmbedWrapper(match.embedUrl, match.ruleName);
      insertEmbed(link, wrapper);
      console.log(`[Tana Tweaks] Created embed for "${match.ruleName}":`, match.embedUrl);
    }
  }

  function buildSelector() {
    if (compiledRules.length === 0) return null;
    
    const selectors = new Set();
    for (const rule of compiledRules) {
      const domainMatch = rule.pattern.match(/([a-zA-Z0-9-]+\.[a-zA-Z]{2,})/);
      if (domainMatch) {
        selectors.add(`a[href*="${domainMatch[1]}"]`);
      }
    }
    if (selectors.size === 0) {
      selectors.add('a[href^="http"]');
    }
    return Array.from(selectors).map(s => `${s}:not([${PROCESSED_ATTR}])`).join(', ');
  }

  function scanLinks() {
    const selector = buildSelector();
    if (!selector) {
      console.log('[Tana Tweaks] No selector (no rules?)');
      return;
    }
    console.log('[Tana Tweaks] Scanning with selector:', selector);
    const links = document.querySelectorAll(selector);
    console.log('[Tana Tweaks] Found', links.length, 'unprocessed links');
    links.forEach(processLink);
  }

  function initObserver() {
    const observer = new MutationObserver((mutations) => {
      let shouldScan = false;
      for (const mutation of mutations) {
        if (mutation.addedNodes.length > 0) {
          shouldScan = true;
          break;
        }
      }
      if (shouldScan) scanLinks();
    });
    observer.observe(document.body, { childList: true, subtree: true });
    return observer;
  }

  async function loadSettings() {
    const result = await chrome.storage.sync.get({ customRules: [] });
    settings = result;
    console.log('[Tana Tweaks] Loaded settings:', JSON.stringify(settings, null, 2));
    compileRules();
  }

  async function init() {
    console.log('[Tana Tweaks] Initializing (direct iframe mode)...');
    await loadSettings();
    scanLinks();
    initObserver();
    console.log(`[Tana Tweaks] Active with ${compiledRules.length} rules`);
  }

  init();
})();
