/**
 * Storage Schema:
 * {
 *   theme: 'auto' | 'light' | 'dark',
 *   customRules: Array<{
 *     id: string,
 *     name: string,
 *     enabled: boolean,
 *     pattern: string,
 *     embedTemplate: string,
 *     isPreset?: boolean
 *   }>
 * }
 */

// ============================================
// Theme Management
// ============================================

const THEME_KEY = 'theme';
let currentTheme = 'auto';

// Get system preference
function getSystemTheme() {
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

// Apply theme to document
function applyTheme(theme) {
  const root = document.documentElement;
  
  if (theme === 'auto') {
    // Remove forced theme, let CSS media query handle it
    root.removeAttribute('data-theme');
  } else {
    root.setAttribute('data-theme', theme);
  }
  
  // Update toggle buttons
  document.querySelectorAll('.theme-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.theme === theme);
  });
}

// Load theme from storage
async function loadTheme() {
  const result = await chrome.storage.sync.get({ [THEME_KEY]: 'auto' });
  currentTheme = result[THEME_KEY];
  applyTheme(currentTheme);
}

// Save theme to storage
async function saveTheme(theme) {
  currentTheme = theme;
  await chrome.storage.sync.set({ [THEME_KEY]: theme });
  applyTheme(theme);
}

// Initialize theme toggle
function initThemeToggle() {
  document.querySelectorAll('.theme-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      saveTheme(btn.dataset.theme);
    });
  });
  
  // Listen for system theme changes
  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
    if (currentTheme === 'auto') {
      applyTheme('auto');
    }
  });
}

// ============================================
// Preset Rules
// ============================================

const PRESET_RULES = [
  {
    id: 'preset-kinescope',
    name: 'Kinescope',
    enabled: false,
    isPreset: true,
    pattern: 'kinescope\\.io/(?:embed/)?([a-zA-Z0-9_-]+)',
    embedTemplate: '<iframe src="https://kinescope.io/embed/{{match1}}" allow="autoplay; fullscreen; picture-in-picture; encrypted-media; gyroscope; accelerometer; clipboard-write; screen-wake-lock;" allowfullscreen></iframe>'
  },
  {
    id: 'preset-vk',
    name: 'VK Video',
    enabled: false,
    isPreset: true,
    pattern: 'vkvideo\\.ru/video(\\d+)_(\\d+)',
    embedTemplate: '<iframe src="https://vkvideo.ru/video_ext.php?oid={{match1}}&id={{match2}}" allow="autoplay; encrypted-media; fullscreen; picture-in-picture" allowfullscreen></iframe>'
  },
  {
    id: 'preset-wistia',
    name: 'Wistia',
    enabled: false,
    isPreset: true,
    pattern: 'wistia\\.com/medias/([a-zA-Z0-9]+)',
    embedTemplate: '<iframe src="https://fast.wistia.net/embed/iframe/{{match1}}" allow="autoplay; fullscreen" allowfullscreen></iframe>'
  }
];

const DEFAULT_SETTINGS = {
  customRules: [...PRESET_RULES]
};

// ============================================
// Utility Functions
// ============================================

function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

function isValidRegex(pattern) {
  try {
    new RegExp(pattern);
    return true;
  } catch (e) {
    return false;
  }
}

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

function truncate(str, len) {
  return str.length > len ? str.substring(0, len) + '...' : str;
}

function showStatus(message, isSuccess = true) {
  const statusEl = document.getElementById('status');
  statusEl.textContent = message;
  statusEl.className = isSuccess ? 'status success' : 'status';
  
  setTimeout(() => {
    statusEl.textContent = '';
  }, 2000);
}

// ============================================
// Settings Management
// ============================================

async function loadSettings() {
  const result = await chrome.storage.sync.get(null);
  
  // Migration: if old kinescopeEmbed exists, convert to new format
  if ('kinescopeEmbed' in result) {
    console.log('[Tana Tweaks] Migrating legacy settings...');
    
    let rules = [...PRESET_RULES];
    
    if (result.kinescopeEmbed) {
      const kinescopeRule = rules.find(r => r.id === 'preset-kinescope');
      if (kinescopeRule) kinescopeRule.enabled = true;
    }
    
    if (result.customRules && Array.isArray(result.customRules)) {
      const userRules = result.customRules.filter(r => !r.isPreset && !r.id?.startsWith('preset-'));
      rules = [...rules, ...userRules];
    }
    
    await chrome.storage.sync.remove('kinescopeEmbed');
    await chrome.storage.sync.set({ customRules: rules });
    
    return { customRules: rules };
  }
  
  // Ensure presets exist
  let rules = result.customRules || [];
  let needsSave = false;
  
  for (const preset of PRESET_RULES) {
    const exists = rules.find(r => r.id === preset.id);
    if (!exists) {
      rules.unshift({ ...preset });
      needsSave = true;
    }
  }
  
  if (needsSave) {
    await chrome.storage.sync.set({ customRules: rules });
  }
  
  return { customRules: rules };
}

async function saveSettings(settings) {
  await chrome.storage.sync.set(settings);
}

async function notifyTabs(settings) {
  const tabs = await chrome.tabs.query({ url: ['https://app.tana.inc/*', 'https://tana.pub/*', 'https://*.tana.pub/*'] });
  for (const tab of tabs) {
    chrome.tabs.sendMessage(tab.id, { type: 'SETTINGS_UPDATED', settings })
      .catch(() => {});
  }
}

// ============================================
// State
// ============================================

let currentSettings = { ...DEFAULT_SETTINGS };
let editingRuleId = null;

// ============================================
// Rules Rendering
// ============================================

function renderRules() {
  const container = document.getElementById('rulesList');
  const rules = currentSettings.customRules || [];
  
  if (rules.length === 0) {
    container.innerHTML = '<p class="no-rules">No rules configured.</p>';
    return;
  }
  
  const presets = rules.filter(r => r.isPreset);
  const userRules = rules.filter(r => !r.isPreset);
  
  let html = '';
  
  if (presets.length > 0) {
    html += '<div class="rules-group"><div class="rules-group-title">Presets</div>';
    html += presets.map(rule => renderRuleItem(rule, true)).join('');
    html += '</div>';
  }
  
  if (userRules.length > 0) {
    html += '<div class="rules-group"><div class="rules-group-title">Custom Rules</div>';
    html += userRules.map(rule => renderRuleItem(rule, false)).join('');
    html += '</div>';
  }
  
  container.innerHTML = html;
  
  // Add event listeners
  container.querySelectorAll('.rule-toggle').forEach(toggle => {
    toggle.addEventListener('change', handleRuleToggle);
  });
  container.querySelectorAll('.info-rule').forEach(btn => {
    btn.addEventListener('click', handleInfoRule);
  });
  container.querySelectorAll('.edit-rule').forEach(btn => {
    btn.addEventListener('click', handleEditRule);
  });
  container.querySelectorAll('.delete-rule').forEach(btn => {
    btn.addEventListener('click', handleDeleteRule);
  });
}

function renderRuleItem(rule, isPreset) {
  return `
    <div class="rule-item ${isPreset ? 'preset' : ''}" data-id="${rule.id}">
      <div class="rule-header">
        <div class="rule-info">
          <span class="rule-name">
            ${escapeHtml(rule.name)}
            ${isPreset ? '<span class="preset-badge">Preset</span>' : ''}
          </span>
          <span class="rule-pattern">${escapeHtml(truncate(rule.pattern, 28))}</span>
        </div>
        <div class="rule-actions">
          <label class="toggle small">
            <input type="checkbox" class="rule-toggle" data-id="${rule.id}" ${rule.enabled ? 'checked' : ''}>
            <span class="slider"></span>
          </label>
          ${isPreset ? `
            <button class="btn-icon info-rule" data-id="${rule.id}" title="View Details">ℹ</button>
          ` : `
            <button class="btn-icon edit-rule" data-id="${rule.id}" title="Edit">✎</button>
            <button class="btn-icon delete-rule" data-id="${rule.id}" title="Delete">×</button>
          `}
        </div>
      </div>
    </div>
  `;
}

// ============================================
// Event Handlers
// ============================================

async function handleRuleToggle(e) {
  const id = e.target.dataset.id;
  const rule = currentSettings.customRules.find(r => r.id === id);
  if (rule) {
    rule.enabled = e.target.checked;
    await saveSettings(currentSettings);
    await notifyTabs(currentSettings);
    showStatus(rule.enabled ? `${rule.name} enabled` : `${rule.name} disabled`);
  }
}

function handleInfoRule(e) {
  const id = e.target.dataset.id;
  const rule = currentSettings.customRules.find(r => r.id === id);
  if (rule) {
    showInfoModal(rule);
  }
}

function showInfoModal(rule) {
  const modal = document.getElementById('infoModal');
  document.getElementById('infoName').textContent = rule.name;
  document.getElementById('infoPattern').textContent = rule.pattern;
  document.getElementById('infoTemplate').textContent = rule.embedTemplate;
  modal.classList.remove('hidden');
}

function hideInfoModal() {
  document.getElementById('infoModal').classList.add('hidden');
}

function handleEditRule(e) {
  const id = e.target.dataset.id;
  const rule = currentSettings.customRules.find(r => r.id === id);
  if (rule && !rule.isPreset) {
    editingRuleId = id;
    document.getElementById('ruleName').value = rule.name;
    document.getElementById('rulePattern').value = rule.pattern;
    document.getElementById('ruleTemplate').value = rule.embedTemplate;
    document.getElementById('ruleFormTitle').textContent = 'Edit Rule';
    document.getElementById('ruleForm').classList.remove('hidden');
    document.getElementById('addRuleBtn').classList.add('hidden');
  }
}

async function handleDeleteRule(e) {
  const id = e.target.dataset.id;
  const rule = currentSettings.customRules.find(r => r.id === id);
  
  if (rule?.isPreset) {
    showStatus('Cannot delete preset rules', false);
    return;
  }
  
  if (confirm('Delete this rule?')) {
    currentSettings.customRules = currentSettings.customRules.filter(r => r.id !== id);
    await saveSettings(currentSettings);
    await notifyTabs(currentSettings);
    renderRules();
    showStatus('Rule deleted');
  }
}

function showRuleForm() {
  editingRuleId = null;
  document.getElementById('ruleName').value = '';
  document.getElementById('rulePattern').value = '';
  document.getElementById('ruleTemplate').value = '';
  document.getElementById('ruleFormTitle').textContent = 'Add Custom Rule';
  document.getElementById('ruleForm').classList.remove('hidden');
  document.getElementById('addRuleBtn').classList.add('hidden');
}

function hideRuleForm() {
  document.getElementById('ruleForm').classList.add('hidden');
  document.getElementById('addRuleBtn').classList.remove('hidden');
  editingRuleId = null;
}

async function saveRule() {
  const name = document.getElementById('ruleName').value.trim();
  const pattern = document.getElementById('rulePattern').value.trim();
  const embedTemplate = document.getElementById('ruleTemplate').value.trim();
  
  if (!name) {
    showStatus('Please enter a rule name', false);
    return;
  }
  if (!pattern) {
    showStatus('Please enter a URL pattern', false);
    return;
  }
  if (!isValidRegex(pattern)) {
    showStatus('Invalid regex pattern', false);
    return;
  }
  if (!embedTemplate) {
    showStatus('Please enter an embed template', false);
    return;
  }
  
  if (editingRuleId) {
    const rule = currentSettings.customRules.find(r => r.id === editingRuleId);
    if (rule && !rule.isPreset) {
      rule.name = name;
      rule.pattern = pattern;
      rule.embedTemplate = embedTemplate;
    }
  } else {
    currentSettings.customRules.push({
      id: generateId(),
      name,
      enabled: true,
      isPreset: false,
      pattern,
      embedTemplate
    });
  }
  
  await saveSettings(currentSettings);
  await notifyTabs(currentSettings);
  renderRules();
  hideRuleForm();
  showStatus(editingRuleId ? 'Rule updated' : 'Rule added');
}

// ============================================
// Initialization
// ============================================

async function init() {
  // Load and apply theme first
  await loadTheme();
  initThemeToggle();
  
  // Load settings and render
  currentSettings = await loadSettings();
  renderRules();
  
  // Form handlers
  document.getElementById('addRuleBtn').addEventListener('click', showRuleForm);
  document.getElementById('cancelRule').addEventListener('click', hideRuleForm);
  document.getElementById('saveRule').addEventListener('click', saveRule);
  
  // Modal handlers
  document.getElementById('closeInfoModal').addEventListener('click', hideInfoModal);
  document.getElementById('infoModal').addEventListener('click', (e) => {
    if (e.target.id === 'infoModal') hideInfoModal();
  });
}

document.addEventListener('DOMContentLoaded', init);
