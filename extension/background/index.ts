/**
 * AI Query Intelligence - Background Service Worker (Manifest V3)
 * Handles shortcuts, context menus, model calls via pipeline, settings, and history.
 */

import {
  DEFAULT_SETTINGS,
  ExtensionSettings,
  HistoryItem,
  PipelineStage,
} from '../../core/types';
import { QueryIntelligencePipeline } from '../../core/engine/pipeline';
import { ProviderRegistry } from '../../core/providers/registry';

// Initialize on install
chrome.runtime.onInstalled.addListener(async () => {
  console.log('[QueryIntelligence] Extension installed / updated.');

  // Set default settings if not already present
  const existing = await chrome.storage.local.get('qi_settings');
  if (!existing.qi_settings) {
    await chrome.storage.local.set({ qi_settings: DEFAULT_SETTINGS });
  }

  // Create context menu item
  chrome.contextMenus.removeAll(() => {
    chrome.contextMenus.create({
      id: 'qi-reconstruct-menu',
      title: 'Reconstruct query with AI Query Intelligence',
      contexts: ['selection', 'editable'],
    });
  });
});

// Handle context menu clicks
chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  if (info.menuItemId === 'qi-reconstruct-menu' && tab?.id) {
    await triggerReconstructionInTab(tab.id, tab.url);
  }
});

// Handle keyboard shortcut command
chrome.commands.onCommand.addListener(async (command) => {
  if (command === 'reconstruct-query') {
    const [activeTab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (activeTab?.id) {
      await triggerReconstructionInTab(activeTab.id, activeTab.url);
    }
  }
});

async function triggerReconstructionInTab(tabId: number, url?: string): Promise<void> {
  // Check if page is blocked by browser security policy (chrome://, edge://, Chrome Web Store)
  if (isBlockedUrl(url)) {
    chrome.notifications.create({
      type: 'basic',
      iconUrl: 'icons/icon48.png',
      title: 'AI Query Intelligence',
      message: 'Extension overlays cannot be loaded on internal browser pages (chrome://, edge://) or Web Store pages.',
    });
    return;
  }

  const settings = await getSettings();
  if (settings.pauseExtension) {
    chrome.notifications.create({
      type: 'basic',
      iconUrl: 'icons/icon48.png',
      title: 'AI Query Intelligence (Paused)',
      message: 'Extension is currently paused. Resume it from the extension popup or settings.',
    });
    return;
  }

  try {
    await chrome.tabs.sendMessage(tabId, { type: 'TRIGGER_RECONSTRUCT' });
  } catch (err) {
    // If content script was not injected yet (e.g. tab opened before extension installed)
    try {
      await chrome.scripting.executeScript({
        target: { tabId },
        files: ['content.js'],
      });
      setTimeout(async () => {
        await chrome.tabs.sendMessage(tabId, { type: 'TRIGGER_RECONSTRUCT' });
      }, 100);
    } catch (injectErr) {
      console.error('[QueryIntelligence] Script injection failed:', injectErr);
    }
  }
}

function isBlockedUrl(url?: string): boolean {
  if (!url) return false;
  return (
    url.startsWith('chrome://') ||
    url.startsWith('chrome-extension://') ||
    url.startsWith('edge://') ||
    url.startsWith('about:') ||
    url.includes('chromewebstore.google.com') ||
    url.includes('chrome.google.com/webstore') ||
    url.includes('microsoftedge.microsoft.com/addons')
  );
}

// Runtime message router
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  (async () => {
    try {
      switch (message.type) {
        case 'RECONSTRUCT_QUERY': {
          const settings = await getSettings();
          const tabId = sender.tab?.id;

          const result = await QueryIntelligencePipeline.process(
            message.text,
            settings,
            (stage: PipelineStage, detail?: string) => {
              if (tabId) {
                chrome.tabs.sendMessage(tabId, {
                  type: 'STAGE_UPDATE',
                  stage,
                  detail,
                }).catch(() => {});
              }
            }
          );

          // Save to history if enabled
          if (settings.historyEnabled) {
            await saveHistoryItem({
              id: result.id,
              timestamp: result.timestamp,
              originalQuery: result.originalQuery,
              reconstructedQuery: result.reconstructedQuery,
              provider: result.providerId,
              model: result.modelUsed,
              url: message.url,
              pageTitle: message.pageTitle,
              depthLevel: settings.depthLevel,
            });
          }

          sendResponse({ success: true, result });
          break;
        }

        case 'TEST_CONNECTION': {
          const provider = ProviderRegistry.createProvider(message.config);
          const testRes = await provider.testConnection();
          sendResponse({ success: true, testResult: testRes });
          break;
        }

        case 'GET_SETTINGS': {
          const settings = await getSettings();
          sendResponse({ success: true, settings });
          break;
        }

        case 'SAVE_SETTINGS': {
          await chrome.storage.local.set({ qi_settings: message.settings });
          await updateBadgeStatus(message.settings.pauseExtension);
          sendResponse({ success: true });
          break;
        }

        case 'TOGGLE_PAUSE': {
          const current = await getSettings();
          current.pauseExtension = !current.pauseExtension;
          await chrome.storage.local.set({ qi_settings: current });
          await updateBadgeStatus(current.pauseExtension);
          sendResponse({ success: true, paused: current.pauseExtension });
          break;
        }

        case 'GET_HISTORY': {
          const history = await getHistory();
          sendResponse({ success: true, history });
          break;
        }

        case 'DELETE_HISTORY_ITEM': {
          await deleteHistoryItem(message.id);
          sendResponse({ success: true });
          break;
        }

        case 'CLEAR_HISTORY': {
          await chrome.storage.local.remove('qi_history');
          sendResponse({ success: true });
          break;
        }

        default:
          sendResponse({ success: false, error: 'Unknown message type' });
      }
    } catch (err: any) {
      console.error('[QueryIntelligence] Message error:', err);
      sendResponse({ success: false, error: err.message || 'Internal error' });
    }
  })();

  return true; // Keep message channel open for async response
});

async function getSettings(): Promise<ExtensionSettings> {
  const data = await chrome.storage.local.get('qi_settings');
  return { ...DEFAULT_SETTINGS, ...data.qi_settings };
}

async function updateBadgeStatus(paused: boolean): Promise<void> {
  if (paused) {
    chrome.action.setBadgeText({ text: 'PAUSE' });
    chrome.action.setBadgeBackgroundColor({ color: '#ef4444' });
  } else {
    chrome.action.setBadgeText({ text: '' });
  }
}

async function getHistory(): Promise<HistoryItem[]> {
  const data = await chrome.storage.local.get('qi_history');
  return (data.qi_history as HistoryItem[]) || [];
}

async function saveHistoryItem(item: HistoryItem): Promise<void> {
  const history = await getHistory();
  // Keep last 150 items
  const updated = [item, ...history].slice(0, 150);
  await chrome.storage.local.set({ qi_history: updated });
}

async function deleteHistoryItem(id: string): Promise<void> {
  const history = await getHistory();
  const updated = history.filter((item) => item.id !== id);
  await chrome.storage.local.set({ qi_history: updated });
}
