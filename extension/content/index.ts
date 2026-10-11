/**
 * AI Query Intelligence - Content Script
 * Captures selection or focused input, renders Shadow DOM overlay,
 * and handles smart insertion.
 */

import {
  AskAiTarget,
  DEFAULT_SETTINGS,
  ExtensionSettings,
  PipelineStage,
  ReconstructionResult,
} from '../../core/types';
import { QueryOverlayComponent } from '../overlay/component';
import { SmartInsertionEngine } from '../insertion';

class ContentScriptController {
  private overlay: QueryOverlayComponent | null = null;
  private settings: ExtensionSettings = { ...DEFAULT_SETTINGS };
  private cachedActiveElement: HTMLElement | null = null;
  private isProcessing = false;

  constructor() {
    this.init();
  }

  private async init(): Promise<void> {
    await this.loadSettings();

    // Listen to background messages
    chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
      if (message.type === 'TRIGGER_RECONSTRUCT') {
        this.handleTriggerReconstruct();
        sendResponse({ received: true });
      } else if (message.type === 'STAGE_UPDATE') {
        this.overlay?.updateStage(message.stage as PipelineStage, message.detail);
      }
      return true;
    });

    // Keyboard shortcut fallback within the active frame
    window.addEventListener('keydown', (e: KeyboardEvent) => {
      if (e.ctrlKey && e.shiftKey && (e.code === 'Space' || e.key === ' ')) {
        e.preventDefault();
        this.handleTriggerReconstruct();
      }
    });
  }

  private async loadSettings(): Promise<void> {
    try {
      const res = await chrome.storage.local.get('qi_settings');
      if (res.qi_settings) {
        this.settings = { ...DEFAULT_SETTINGS, ...res.qi_settings };
      }
    } catch (err) {
      console.warn('[QueryIntelligence] Could not load settings, using defaults:', err);
    }
  }

  private handleTriggerReconstruct(): void {
    if (this.settings.pauseExtension) {
      console.log('[QueryIntelligence] Extension is currently paused.');
      return;
    }

    if (this.isProcessing) return;

    // Cache active element before anything else
    this.cachedActiveElement = document.activeElement as HTMLElement | null;

    // Capture text
    const captured = this.captureTextAndCoordinates();
    if (!captured || !captured.text.trim()) {
      this.showTemporaryToast('Please select text or focus an input field first.');
      return;
    }

    this.showOverlay(captured.text, captured.coords);
    this.startReconstruction(captured.text);
  }

  private captureTextAndCoordinates(): { text: string; coords: { x: number; y: number } } | null {
    let text = '';
    let coords = { x: 100, y: 100 };

    const selection = window.getSelection();

    // 1. Text selected in document
    if (selection && selection.rangeCount > 0 && !selection.isCollapsed) {
      text = selection.toString().trim();
      const rect = selection.getRangeAt(0).getBoundingClientRect();
      coords = {
        x: rect.left,
        y: rect.bottom + 8,
      };
      return { text, coords };
    }

    // 2. Focused Input or Textarea
    const el = this.cachedActiveElement;
    if (el instanceof HTMLTextAreaElement || el instanceof HTMLInputElement) {
      const start = el.selectionStart ?? 0;
      const end = el.selectionEnd ?? 0;
      if (end > start) {
        text = el.value.substring(start, end).trim();
      } else {
        text = el.value.trim();
      }

      const rect = el.getBoundingClientRect();
      coords = {
        x: rect.left,
        y: rect.bottom + 8,
      };
      return { text, coords };
    }

    // 3. Focused contenteditable element (ChatGPT, Claude, Docs)
    if (el && (el.isContentEditable || el.getAttribute('role') === 'textbox')) {
      text = (el.innerText || el.textContent || '').trim();
      const rect = el.getBoundingClientRect();
      coords = {
        x: rect.left,
        y: rect.bottom + 8,
      };
      return { text, coords };
    }

    return null;
  }

  private showOverlay(rawText: string, coords: { x: number; y: number }): void {
    // Remove existing overlay if any
    this.closeOverlay();

    this.overlay = new QueryOverlayComponent(this.settings, {
      onInsert: (reconstructedText) => {
        const result = SmartInsertionEngine.insert(reconstructedText, this.cachedActiveElement);
        if (!result.success) {
          this.showTemporaryToast(result.message);
        }
      },
      onCopy: (reconstructedText) => {
        navigator.clipboard.writeText(reconstructedText);
      },
      onAskAi: (target: AskAiTarget, text: string) => {
        this.openAskAiTarget(target, text);
      },
      onClose: () => {
        this.closeOverlay();
      },
      onClarificationSelect: (selectedOption) => {
        this.showTemporaryToast('Clarified query selected');
      },
      onRemoteAcknowledge: async () => {
        this.settings.hasAcknowledgedRemoteWarning = true;
        await chrome.storage.local.set({ qi_settings: this.settings });
      },
      onSavePosition: async (pos) => {
        this.settings.overlayPosition = pos;
        await chrome.storage.local.set({ qi_settings: this.settings });
      },
    });

    const host = this.overlay.getHostElement();
    document.body.appendChild(host);

    // Position panel
    if (this.settings.overlayPosition) {
      this.overlay.setPosition(this.settings.overlayPosition.x, this.settings.overlayPosition.y);
    } else {
      this.overlay.setPosition(coords.x, coords.y);
    }

    this.overlay.setOriginalText(rawText);
  }

  private async startReconstruction(rawText: string): Promise<void> {
    this.isProcessing = true;

    try {
      // Send reconstruct request to service worker
      const response = await chrome.runtime.sendMessage({
        type: 'RECONSTRUCT_QUERY',
        text: rawText,
        url: window.location.href,
        pageTitle: document.title,
      });

      if (!response || !response.success) {
        this.overlay?.updateStage('ERROR', response?.error || 'Reconstruction failed.');
        return;
      }

      const result: ReconstructionResult = response.result;
      this.overlay?.setResult(result);
    } catch (err: any) {
      this.overlay?.updateStage('ERROR', err.message || 'Error communicating with service worker.');
    } finally {
      this.isProcessing = false;
    }
  }

  private closeOverlay(): void {
    if (this.overlay) {
      const host = this.overlay.getHostElement();
      host.remove();
      this.overlay = null;
    }
  }

  private openAskAiTarget(target: AskAiTarget, queryText: string): void {
    const encoded = encodeURIComponent(queryText);
    let url = '';

    switch (target) {
      case 'chatgpt':
        url = `https://chatgpt.com/?q=${encoded}`;
        break;
      case 'claude':
        url = `https://claude.ai/new?q=${encoded}`;
        break;
      case 'gemini':
        url = `https://gemini.google.com/app`;
        break;
      case 'perplexity':
        url = `https://www.perplexity.ai/search?q=${encoded}`;
        break;
      case 'copilot':
        url = `https://copilot.microsoft.com/`;
        break;
      case 'custom':
        url = (this.settings.customAiUrl || 'https://chatgpt.com/?q=') + encoded;
        break;
    }

    if (url) {
      window.open(url, '_blank', 'noopener,noreferrer');
    }
  }

  private showTemporaryToast(message: string): void {
    const toast = document.createElement('div');
    toast.style.cssText = `
      position: fixed;
      bottom: 24px;
      right: 24px;
      background: rgba(15, 23, 42, 0.95);
      border: 1px solid rgba(255, 255, 255, 0.15);
      color: #f8fafc;
      padding: 10px 16px;
      border-radius: 8px;
      font-size: 12.5px;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      box-shadow: 0 10px 25px rgba(0,0,0,0.5);
      z-index: 2147483647;
      animation: qi-fade-in 0.2s ease;
    `;
    toast.textContent = message;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 2800);
  }
}

// Instantiate controller in page
new ContentScriptController();
