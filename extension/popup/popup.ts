/**
 * AI Query Intelligence - Popup Logic
 */

import { DEFAULT_SETTINGS, ExtensionSettings } from '../../core/types';

document.addEventListener('DOMContentLoaded', async () => {
  const statusDot = document.getElementById('popup-status-dot');
  const statusText = document.getElementById('popup-status-text');
  const providerName = document.getElementById('popup-provider-name');
  const modelName = document.getElementById('popup-model-name');
  const modeBadge = document.getElementById('popup-mode-badge');
  const togglePauseBtn = document.getElementById('popup-toggle-pause-btn');
  const pauseBtnText = document.getElementById('popup-pause-btn-text');
  const openSettingsBtn = document.getElementById('popup-open-settings-btn');

  let currentSettings: ExtensionSettings = { ...DEFAULT_SETTINGS };

  async function refreshUI(): Promise<void> {
    try {
      const response = await chrome.runtime.sendMessage({ type: 'GET_SETTINGS' });
      if (response && response.success) {
        currentSettings = response.settings;
      }
    } catch (err) {
      console.warn('Could not fetch settings from service worker:', err);
    }

    const cfg = currentSettings.providerConfig;
    const isPaused = currentSettings.pauseExtension;

    // Local vs Remote check
    const isLocal =
      cfg.endpoint.includes('localhost') ||
      cfg.endpoint.includes('127.0.0.1') ||
      cfg.endpoint.includes('::1');

    if (modeBadge) {
      modeBadge.textContent = isLocal ? 'LOCAL' : 'REMOTE';
      modeBadge.style.color = isLocal ? '#34d399' : '#fbbf24';
      modeBadge.style.background = isLocal ? 'rgba(16, 185, 129, 0.2)' : 'rgba(245, 158, 11, 0.2)';
    }

    if (providerName) {
      providerName.textContent = cfg.provider === 'ollama' ? 'Ollama' : 'OpenAI-Compatible';
    }

    if (modelName) {
      modelName.textContent = cfg.model || 'qwen2.5:14b';
    }

    if (isPaused) {
      statusDot?.classList.remove('warning');
      statusDot?.classList.add('paused');
      if (statusText) statusText.textContent = 'Paused';
      togglePauseBtn?.classList.add('paused');
      if (pauseBtnText) pauseBtnText.textContent = 'Resume Extension';
    } else {
      statusDot?.classList.remove('paused', 'warning');
      if (statusText) statusText.textContent = 'Active';
      togglePauseBtn?.classList.remove('paused');
      if (pauseBtnText) pauseBtnText.textContent = 'Pause Extension';
    }
  }

  // Handle Pause / Resume toggle
  togglePauseBtn?.addEventListener('click', async () => {
    try {
      const res = await chrome.runtime.sendMessage({ type: 'TOGGLE_PAUSE' });
      if (res && res.success) {
        currentSettings.pauseExtension = res.paused;
        await refreshUI();
      }
    } catch (err) {
      console.error('Failed to toggle pause:', err);
    }
  });

  // Open Options page
  openSettingsBtn?.addEventListener('click', () => {
    chrome.runtime.openOptionsPage();
  });

  await refreshUI();
});
