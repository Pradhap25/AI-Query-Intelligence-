/**
 * AI Query Intelligence - Options & Settings Page Controller
 */

import {
  AskAiTarget,
  ConnectionTestResult,
  DEFAULT_SETTINGS,
  DepthLevel,
  ExtensionSettings,
  HistoryItem,
  InsertionMethod,
  ProviderType,
} from '../../core/types';

document.addEventListener('DOMContentLoaded', async () => {
  // Elements
  const tabBtns = document.querySelectorAll<HTMLButtonElement>('.tab-btn');
  const tabPanels = document.querySelectorAll<HTMLDivElement>('.tab-panel');

  const providerSelect = document.getElementById('cfg-provider') as HTMLSelectElement;
  const endpointInput = document.getElementById('cfg-endpoint') as HTMLInputElement;
  const modelInput = document.getElementById('cfg-model') as HTMLInputElement;
  const apiKeyInput = document.getElementById('cfg-api-key') as HTMLInputElement;
  const groupApiKey = document.getElementById('group-api-key') as HTMLDivElement;
  const timeoutInput = document.getElementById('cfg-timeout') as HTMLInputElement;
  const retriesInput = document.getElementById('cfg-retries') as HTMLInputElement;
  const maxTokensInput = document.getElementById('cfg-max-tokens') as HTMLInputElement;
  const temperatureInput = document.getElementById('cfg-temperature') as HTMLInputElement;

  const depthSelect = document.getElementById('cfg-depth') as HTMLSelectElement;
  const preserveVoiceCheck = document.getElementById('cfg-preserve-voice') as HTMLInputElement;
  const validatePreservationCheck = document.getElementById('cfg-validate-preservation') as HTMLInputElement;
  const clarificationBehaviorSelect = document.getElementById('cfg-clarification-behavior') as HTMLSelectElement;

  const localOnlyCheck = document.getElementById('cfg-local-only') as HTMLInputElement;
  const remoteWarningCheck = document.getElementById('cfg-remote-warning') as HTMLInputElement;
  const historyEnabledCheck = document.getElementById('cfg-history-enabled') as HTMLInputElement;

  const themeSelect = document.getElementById('cfg-theme') as HTMLSelectElement;
  const insertionMethodSelect = document.getElementById('cfg-insertion-method') as HTMLSelectElement;
  const askAiTargetSelect = document.getElementById('cfg-ask-ai-target') as HTMLSelectElement;
  const customAiUrlInput = document.getElementById('cfg-custom-ai-url') as HTMLInputElement;
  const groupCustomAiUrl = document.getElementById('group-custom-ai-url') as HTMLDivElement;
  const debugLoggingCheck = document.getElementById('cfg-debug-logging') as HTMLInputElement;

  const testBtn = document.getElementById('btn-test-connection') as HTMLButtonElement;
  const testSpinner = document.getElementById('test-connection-spinner') as HTMLSpanElement;
  const testAlert = document.getElementById('test-result-alert') as HTMLDivElement;
  const saveBtn = document.getElementById('btn-save-settings') as HTMLButtonElement;
  const savedToast = document.getElementById('saved-toast') as HTMLSpanElement;

  const historyContainer = document.getElementById('history-container') as HTMLDivElement;
  const historySearch = document.getElementById('history-search') as HTMLInputElement;
  const clearHistoryBtn = document.getElementById('btn-clear-history') as HTMLButtonElement;
  const configureShortcutsBtn = document.getElementById('btn-configure-shortcuts') as HTMLButtonElement;

  let currentSettings: ExtensionSettings = { ...DEFAULT_SETTINGS };
  let historyItems: HistoryItem[] = [];

  // Tab switching
  tabBtns.forEach((btn) => {
    btn.addEventListener('click', () => {
      tabBtns.forEach((b) => b.classList.remove('active'));
      tabPanels.forEach((p) => p.classList.remove('active'));

      btn.classList.add('active');
      const targetId = btn.getAttribute('data-tab');
      if (targetId) {
        document.getElementById(targetId)?.classList.add('active');
      }
    });
  });

  // Dynamic field toggling
  providerSelect.addEventListener('change', () => {
    const isOllama = providerSelect.value === 'ollama';
    groupApiKey.style.display = isOllama ? 'none' : 'flex';
    if (isOllama && endpointInput.value === 'http://localhost:1234/v1') {
      endpointInput.value = 'http://localhost:11434';
      modelInput.value = 'qwen2.5:14b';
    } else if (!isOllama && endpointInput.value === 'http://localhost:11434') {
      endpointInput.value = 'http://localhost:1234/v1';
      modelInput.value = 'qwen2.5-14b-instruct';
    }
  });

  askAiTargetSelect.addEventListener('change', () => {
    groupCustomAiUrl.style.display = askAiTargetSelect.value === 'custom' ? 'flex' : 'none';
  });

  // Load Settings
  async function loadSettings(): Promise<void> {
    try {
      const res = await chrome.runtime.sendMessage({ type: 'GET_SETTINGS' });
      if (res && res.success) {
        currentSettings = res.settings;
      }
    } catch (err) {
      console.warn('Could not load settings from background:', err);
    }

    const cfg = currentSettings.providerConfig;
    providerSelect.value = cfg.provider;
    endpointInput.value = cfg.endpoint;
    modelInput.value = cfg.model;
    apiKeyInput.value = cfg.apiKey || '';
    timeoutInput.value = cfg.timeoutMs.toString();
    retriesInput.value = cfg.retries.toString();
    maxTokensInput.value = cfg.maxTokens.toString();
    temperatureInput.value = cfg.temperature.toString();

    groupApiKey.style.display = cfg.provider === 'ollama' ? 'none' : 'flex';

    depthSelect.value = currentSettings.depthLevel.toString();
    preserveVoiceCheck.checked = currentSettings.preserveVoice;
    validatePreservationCheck.checked = currentSettings.validatePreservation;
    clarificationBehaviorSelect.value = currentSettings.clarificationBehavior;

    localOnlyCheck.checked = currentSettings.localOnlyMode;
    remoteWarningCheck.checked = currentSettings.showRemoteWarning;
    historyEnabledCheck.checked = currentSettings.historyEnabled;

    themeSelect.value = currentSettings.theme;
    insertionMethodSelect.value = currentSettings.insertionMethod;
    askAiTargetSelect.value = currentSettings.defaultAskAiTarget;
    customAiUrlInput.value = currentSettings.customAiUrl || 'https://chatgpt.com/?q=';
    groupCustomAiUrl.style.display = currentSettings.defaultAskAiTarget === 'custom' ? 'flex' : 'none';
    debugLoggingCheck.checked = currentSettings.debugLogging;
  }

  // Save Settings
  saveBtn.addEventListener('click', async () => {
    const updated: ExtensionSettings = {
      providerConfig: {
        provider: providerSelect.value as ProviderType,
        endpoint: endpointInput.value.trim(),
        model: modelInput.value.trim(),
        apiKey: apiKeyInput.value.trim(),
        timeoutMs: parseInt(timeoutInput.value, 10) || 15000,
        retries: parseInt(retriesInput.value, 10) || 1,
        maxTokens: parseInt(maxTokensInput.value, 10) || 1024,
        temperature: parseFloat(temperatureInput.value) || 0.2,
      },
      depthLevel: parseInt(depthSelect.value, 10) as DepthLevel,
      preserveVoice: preserveVoiceCheck.checked,
      validatePreservation: validatePreservationCheck.checked,
      clarificationBehavior: clarificationBehaviorSelect.value as 'inline' | 'ask',
      localOnlyMode: localOnlyCheck.checked,
      showRemoteWarning: remoteWarningCheck.checked,
      hasAcknowledgedRemoteWarning: currentSettings.hasAcknowledgedRemoteWarning,
      historyEnabled: historyEnabledCheck.checked,
      pauseExtension: currentSettings.pauseExtension,
      theme: themeSelect.value as 'dark' | 'light' | 'system',
      insertionMethod: insertionMethodSelect.value as InsertionMethod,
      defaultAskAiTarget: askAiTargetSelect.value as AskAiTarget,
      customAiUrl: customAiUrlInput.value.trim(),
      shortcut: 'Ctrl+Shift+Space',
      debugLogging: debugLoggingCheck.checked,
      overlayPosition: currentSettings.overlayPosition,
    };

    try {
      await chrome.runtime.sendMessage({
        type: 'SAVE_SETTINGS',
        settings: updated,
      });

      currentSettings = updated;
      savedToast.style.display = 'inline';
      setTimeout(() => {
        savedToast.style.display = 'none';
      }, 2000);
    } catch (err) {
      console.error('Failed to save settings:', err);
      alert('Error saving settings: ' + err);
    }
  });

  // Test Connection
  testBtn.addEventListener('click', async () => {
    testSpinner.style.display = 'inline';
    testAlert.className = 'alert-box';
    testAlert.style.display = 'none';

    const testConfig = {
      provider: providerSelect.value as ProviderType,
      endpoint: endpointInput.value.trim(),
      model: modelInput.value.trim(),
      apiKey: apiKeyInput.value.trim(),
      timeoutMs: 5000,
      retries: 0,
      maxTokens: 128,
      temperature: 0.1,
    };

    try {
      const res = await chrome.runtime.sendMessage({
        type: 'TEST_CONNECTION',
        config: testConfig,
      });

      testSpinner.style.display = 'none';

      if (res && res.success && res.testResult) {
        const tr: ConnectionTestResult = res.testResult;
        if (tr.ok) {
          testAlert.className = 'alert-box success';
          let html = `<strong>Success!</strong> ${escapeHtml(tr.message)}`;
          if (tr.availableModels && tr.availableModels.length > 0) {
            html += `<br><span style="font-size: 11.5px; opacity: 0.9;">Available models: ${tr.availableModels.slice(0, 8).join(', ')}${tr.availableModels.length > 8 ? '...' : ''}</span>`;
          }
          testAlert.innerHTML = html;
        } else {
          testAlert.className = 'alert-box error';
          testAlert.innerHTML = `<strong>Connection Failed:</strong> ${escapeHtml(tr.message)}`;
        }
      } else {
        testAlert.className = 'alert-box error';
        testAlert.innerHTML = `<strong>Error:</strong> ${escapeHtml(res?.error || 'Test request failed.')}`;
      }
    } catch (err: any) {
      testSpinner.style.display = 'none';
      testAlert.className = 'alert-box error';
      testAlert.innerHTML = `<strong>Error:</strong> ${escapeHtml(err.message || 'Unknown network error.')}`;
    }
  });

  // Load History
  async function loadHistory(): Promise<void> {
    try {
      const res = await chrome.runtime.sendMessage({ type: 'GET_HISTORY' });
      if (res && res.success) {
        historyItems = res.history || [];
        renderHistoryList(historyItems);
      }
    } catch (err) {
      console.warn('Could not load history:', err);
    }
  }

  function renderHistoryList(items: HistoryItem[]): void {
    if (items.length === 0) {
      historyContainer.innerHTML = '<div style="color: var(--text-muted); font-size: 13px; text-align: center; padding: 20px;">No query history recorded.</div>';
      return;
    }

    historyContainer.innerHTML = items
      .map(
        (item) => `
        <div class="history-item" data-id="${item.id}">
          <div class="history-meta">
            <span>${new Date(item.timestamp).toLocaleString()} &bull; ${escapeHtml(item.model)}</span>
            <button class="btn btn-danger btn-delete-history" data-id="${item.id}" style="padding: 2px 6px; font-size: 11px;">Delete</button>
          </div>
          <div class="history-text-row">
            <div class="history-orig">${escapeHtml(item.originalQuery)}</div>
            <div class="history-recon">${escapeHtml(item.reconstructedQuery)}</div>
          </div>
        </div>
      `
      )
      .join('');

    // Attach delete listeners
    historyContainer.querySelectorAll('.btn-delete-history').forEach((btn) => {
      btn.addEventListener('click', async (e) => {
        const id = (e.currentTarget as HTMLElement).getAttribute('data-id');
        if (id) {
          await chrome.runtime.sendMessage({ type: 'DELETE_HISTORY_ITEM', id });
          historyItems = historyItems.filter((h) => h.id !== id);
          renderHistoryList(historyItems);
        }
      });
    });
  }

  // History live search
  historySearch.addEventListener('input', () => {
    const q = historySearch.value.toLowerCase().trim();
    if (!q) {
      renderHistoryList(historyItems);
      return;
    }
    const filtered = historyItems.filter(
      (h) =>
        h.originalQuery.toLowerCase().includes(q) ||
        h.reconstructedQuery.toLowerCase().includes(q) ||
        h.model.toLowerCase().includes(q)
    );
    renderHistoryList(filtered);
  });

  // Clear history
  clearHistoryBtn.addEventListener('click', async () => {
    if (confirm('Are you sure you want to clear all query history?')) {
      await chrome.runtime.sendMessage({ type: 'CLEAR_HISTORY' });
      historyItems = [];
      renderHistoryList([]);
    }
  });

  // Configure shortcuts
  configureShortcutsBtn.addEventListener('click', () => {
    chrome.tabs.create({ url: 'chrome://extensions/shortcuts' });
  });

  function escapeHtml(str: string): string {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  await loadSettings();
  await loadHistory();
});
