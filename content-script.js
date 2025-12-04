/**
 * Tana Tweaks - Content Script
 * Embeds videos using custom rules in Tana.inc and Tana.pub
 */

(function () {
  'use strict';

  // Settings cache
  let settings = {
    customRules: []
  };

  // Compiled regex cache for rules
  let compiledRules = [];

  const PROCESSED_ATTR = 'data-tana-tweaks-processed';

  /**
   * Creates a responsive 16:9 wrapper for embedded content
   */
  function createEmbedWrapper(content) {
    const wrapper = document.createElement('div');
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

    if (typeof content === 'string') {
      // HTML string - create a container and set innerHTML
      const inner = document.createElement('div');
      inner.innerHTML = content;
      // Style all iframes inside
      inner.querySelectorAll('iframe').forEach(iframe => {
        iframe.style.cssText = `
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          border: none;
        `;
      });
      // Move children to wrapper
      while (inner.firstChild) {
        wrapper.appendChild(inner.firstChild);
      }
    } else {
      // DOM element
      wrapper.appendChild(content);
    }

    return wrapper;
  }

  /**
   * Inserts embed and hides original link based on platform
   */
  function insertEmbed(link, wrapper) {
    const isTanaPub = window.location.hostname.includes('tana.pub');

    if (isTanaPub) {
      // For tana.pub: Insert after the link and hide it
      link.parentElement.insertBefore(wrapper, link.nextSibling);
      link.style.display = 'none';
    } else {
      // For app.tana.inc: Insert outside the text wrapper for full width
      const contentWrapper = link.closest('.contentWrapper');
      if (contentWrapper?.parentElement) {
        contentWrapper.parentElement.insertBefore(wrapper, contentWrapper.nextSibling);

        // Hide the original link text
        const editableWrapper = link.closest('[data-editable-wrapper="true"]');
        if (editableWrapper) {
          editableWrapper.style.display = 'none';
        }
      } else {
        // Fallback: insert after link
        link.parentElement.insertBefore(wrapper, link.nextSibling);
        link.style.display = 'none';
      }
    }
  }

  /**
   * Process template with match placeholders
   * {{match}} = full match, {{match1}}, {{match2}} = capture groups
   */
  function processTemplate(template, matches) {
    let result = template;
    // Replace {{match}} with full match
    result = result.replace(/\{\{match\}\}/g, matches[0] || '');
    // Replace {{match1}}, {{match2}}, etc. with capture groups
    for (let i = 1; i < matches.length; i++) {
      result = result.replace(new RegExp(`\\{\\{match${i}\\}\\}`, 'g'), matches[i] || '');
    }
    return result;
  }

  /**
   * Compile rules into regex objects
   */
  function compileRules() {
    compiledRules = (settings.customRules || [])
      .filter(rule => rule.enabled)
      .map(rule => {
        try {
          return {
            ...rule,
            regex: new RegExp(rule.pattern)
          };
        } catch (e) {
          console.warn(`[Tana Tweaks] Invalid regex in rule "${rule.name}":`, e);
          return null;
        }
      })
      .filter(Boolean);
    
    console.log(`[Tana Tweaks] Compiled ${compiledRules.length} active rules`);
  }

  /**
   * Try to match link against rules
   * Returns the embed HTML if matched, null otherwise
   */
  function matchRule(href) {
    for (const rule of compiledRules) {
      const matches = href.match(rule.regex);
      if (matches) {
        return {
          html: processTemplate(rule.embedTemplate, matches),
          ruleName: rule.name
        };
      }
    }
    return null;
  }

  /**
   * Process a single link
   */
  function processLink(link) {
    if (link.hasAttribute(PROCESSED_ATTR)) return;
    link.setAttribute(PROCESSED_ATTR, 'true');

    const href = link.href;
    const match = matchRule(href);
    
    if (match) {
      const wrapper = createEmbedWrapper(match.html);
      insertEmbed(link, wrapper);
      console.log(`[Tana Tweaks] Embedded via "${match.ruleName}":`, href);
    }
  }

  /**
   * Build selector for all URLs we want to process
   */
  function buildSelector() {
    if (compiledRules.length === 0) return null;
    
    const selectors = new Set();
    
    // Extract domain hints from patterns for selector optimization
    for (const rule of compiledRules) {
      // Try to extract a domain-like string from the pattern
      const domainMatch = rule.pattern.match(/([a-zA-Z0-9-]+\.[a-zA-Z]{2,})/);
      if (domainMatch) {
        selectors.add(`a[href*="${domainMatch[1]}"]`);
      }
    }
    
    // If we couldn't extract domains from any rule, check all http links
    if (selectors.size === 0) {
      selectors.add('a[href^="http"]');
    }
    
    // Add :not processed filter
    return Array.from(selectors).map(s => `${s}:not([${PROCESSED_ATTR}])`).join(', ');
  }

  /**
   * Scan for and process all matching links
   */
  function scanLinks() {
    const selector = buildSelector();
    if (!selector) return;
    
    const links = document.querySelectorAll(selector);
    links.forEach(processLink);
  }

  /**
   * Sets up MutationObserver for SPA navigation
   */
  function initObserver() {
    const observer = new MutationObserver((mutations) => {
      let shouldScan = false;
      for (const mutation of mutations) {
        if (mutation.addedNodes.length > 0) {
          shouldScan = true;
          break;
        }
      }
      if (shouldScan) {
        scanLinks();
      }
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true
    });

    return observer;
  }

  /**
   * Load settings from storage
   */
  async function loadSettings() {
    const result = await chrome.storage.sync.get({
      customRules: []
    });
    settings = result;
    compileRules();
  }

  /**
   * Listen for settings updates from popup
   */
  chrome.runtime.onMessage.addListener((message) => {
    if (message.type === 'SETTINGS_UPDATED') {
      settings = message.settings;
      compileRules();
      // Re-scan for any new matches
      scanLinks();
    }
  });

  /**
   * Initialize the extension
   */
  async function init() {
    await loadSettings();

    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => {
        scanLinks();
        initObserver();
      });
    } else {
      scanLinks();
      initObserver();
    }

    const enabledCount = compiledRules.length;
    console.log(`[Tana Tweaks] Extension Active (${enabledCount} rule${enabledCount !== 1 ? 's' : ''} enabled)`);
  }

  init();
})();
