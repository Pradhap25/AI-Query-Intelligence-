/**
 * AI Query Intelligence - Floating Overlay Component
 * Rendered exclusively inside a Shadow DOM.
 */

import {
  AskAiTarget,
  ExtensionSettings,
  PipelineStage,
  ReconstructionResult,
} from '../../core/types';
import { OVERLAY_STYLES } from './styles';

export interface OverlayCallbacks {
  onInsert: (reconstructedText: string) => void;
  onCopy: (reconstructedText: string) => void;
  onAskAi: (target: AskAiTarget, text: string) => void;
  onClose: () => void;
  onClarificationSelect: (selectedOption: string) => void;
  onRemoteAcknowledge?: () => void;
  onSavePosition?: (pos: { x: number; y: number }) => void;
}

export class QueryOverlayComponent {
  private host: HTMLElement;
  private shadow: ShadowRoot;
  private container: HTMLDivElement;
  private currentStage: PipelineStage = 'IDLE';
  private originalText = '';
  private reconstructedText = '';
  private isEditing = false;
  private isLocal = true;
  private clarificationOptions: string[] = [];
  private callbacks: OverlayCallbacks;
  private settings: ExtensionSettings;
  private errorMessage = '';

  // Dragging state
  private isDragging = false;
  private dragStartX = 0;
  private dragStartY = 0;
  private initialLeft = 0;
  private initialTop = 0;

  constructor(settings: ExtensionSettings, callbacks: OverlayCallbacks) {
    this.settings = settings;
    this.callbacks = callbacks;

    // Create host element
    this.host = document.createElement('div');
    this.host.id = 'ai-query-intelligence-host';
    this.shadow = this.host.attachShadow({ mode: 'open' });

    // Apply styles
    const styleEl = document.createElement('style');
    styleEl.textContent = OVERLAY_STYLES;
    this.shadow.appendChild(styleEl);

    // Apply theme
    this.host.setAttribute('data-theme', settings.theme);

    // Create panel container
    this.container = document.createElement('div');
    this.container.className = 'panel-container';
    this.shadow.appendChild(this.container);

    this.setupGlobalListeners();
    this.render();
  }

  public getHostElement(): HTMLElement {
    return this.host;
  }

  public setPosition(x: number, y: number): void {
    const maxX = window.innerWidth - 500;
    const maxY = window.innerHeight - 350;
    const safeX = Math.max(16, Math.min(x, maxX));
    const safeY = Math.max(16, Math.min(y, maxY));

    this.container.style.left = `${safeX}px`;
    this.container.style.top = `${safeY}px`;
  }

  public updateStage(stage: PipelineStage, message?: string): void {
    this.currentStage = stage;
    if (stage === 'ERROR' && message) {
      this.errorMessage = message;
    }
    this.render();
  }

  public setResult(result: ReconstructionResult): void {
    this.originalText = result.originalQuery;
    this.reconstructedText = result.reconstructedQuery;
    this.isLocal = result.isLocal;
    this.clarificationOptions = result.clarificationOptions || [];
    this.currentStage = result.requiresClarification ? 'CLARIFICATION_REQUIRED' : 'COMPLETED';
    this.render();
  }

  public setOriginalText(text: string): void {
    this.originalText = text;
    this.currentStage = 'CAPTURED';
    this.render();
  }

  private setupGlobalListeners(): void {
    // ESC closes panel
    const escListener = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        this.callbacks.onClose();
      }
    };
    window.addEventListener('keydown', escListener);

    // Window mousemove / mouseup for dragging
    window.addEventListener('mousemove', (e: MouseEvent) => {
      if (!this.isDragging) return;
      const dx = e.clientX - this.dragStartX;
      const dy = e.clientY - this.dragStartY;
      const newX = Math.max(10, Math.min(window.innerWidth - 490, this.initialLeft + dx));
      const newY = Math.max(10, Math.min(window.innerHeight - 200, this.initialTop + dy));
      this.container.style.left = `${newX}px`;
      this.container.style.top = `${newY}px`;
    });

    window.addEventListener('mouseup', () => {
      if (this.isDragging) {
        this.isDragging = false;
        const rect = this.container.getBoundingClientRect();
        this.callbacks.onSavePosition?.({ x: rect.left, y: rect.top });
      }
    });
  }

  private render(): void {
    this.container.innerHTML = `
      <!-- Header (Draggable) -->
      <div class="panel-header" id="qi-header">
        <div class="header-title-row">
          <div class="brand-icon">QI</div>
          <span class="title-text">Query Intelligence</span>
          <span class="badge ${this.isLocal ? 'badge-local' : 'badge-remote'}">
            ${this.isLocal ? 'LOCAL' : 'REMOTE'}
          </span>
        </div>
        <div class="header-actions">
          <button class="icon-btn" id="qi-close-btn" title="Close (Esc)">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
          </button>
        </div>
      </div>

      <!-- Honest Status Tracker -->
      <div class="status-tracker">
        <div class="stages-list">
          <span class="stage-step ${this.getStepClass('ANALYZING')}">Analyzing</span>
          <span class="stage-divider">/</span>
          <span class="stage-step ${this.getStepClass('RECONSTRUCTING')}">Reconstructing</span>
          <span class="stage-divider">/</span>
          <span class="stage-step ${this.getStepClass('VALIDATING')}">Validating</span>
          <span class="stage-divider">/</span>
          <span class="stage-step ${this.getStepClass('COMPLETED')}">Done</span>
        </div>
        ${this.renderStatusChip()}
      </div>

      <!-- Main Body -->
      <div class="panel-body">
        ${this.renderRemoteWarningIfNeeded()}
        ${this.renderOriginalBox()}
        ${this.renderReconstructionBox()}
        ${this.renderClarificationSection()}
        ${this.renderErrorSection()}
      </div>

      <!-- Footer Actions -->
      <div class="panel-footer">
        <div class="left-actions">
          <div class="ask-ai-dropdown">
            <button class="btn btn-secondary" id="qi-ask-ai-btn">
              <span>Ask AI</span>
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="6 9 12 15 18 9"></polyline></svg>
            </button>
            <div class="dropdown-menu" id="qi-ask-ai-menu" style="display: none;">
              <button class="dropdown-item" data-target="chatgpt">ChatGPT</button>
              <button class="dropdown-item" data-target="claude">Claude</button>
              <button class="dropdown-item" data-target="gemini">Gemini</button>
              <button class="dropdown-item" data-target="perplexity">Perplexity</button>
              <button class="dropdown-item" data-target="copilot">Copilot</button>
            </div>
          </div>
          <button class="btn btn-secondary" id="qi-edit-btn">
            ${this.isEditing ? 'Done' : 'Edit'}
          </button>
        </div>

        <div class="right-actions">
          <button class="btn btn-secondary" id="qi-copy-btn">
            ${this.currentStage === 'COPIED' ? 'Copied!' : 'Copy'}
          </button>
          <button class="btn btn-primary" id="qi-insert-btn">
            ${this.currentStage === 'INSERTED' ? 'Inserted!' : 'Insert / Replace'}
          </button>
        </div>
      </div>
    `;

    this.attachDomHandlers();
  }

  private getStepClass(step: PipelineStage): string {
    const order: PipelineStage[] = ['ANALYZING', 'RECONSTRUCTING', 'VALIDATING', 'COMPLETED'];
    const currentIdx = order.indexOf(this.currentStage);
    const stepIdx = order.indexOf(step);

    if (this.currentStage === step) return 'active';
    if (currentIdx > stepIdx || this.currentStage === 'COMPLETED' || this.currentStage === 'COPIED' || this.currentStage === 'INSERTED') {
      return 'completed';
    }
    return '';
  }

  private renderStatusChip(): string {
    if (this.currentStage === 'COPIED') {
      return '<span class="toast-msg">Copied to clipboard</span>';
    }
    if (this.currentStage === 'INSERTED') {
      return '<span class="toast-msg">Inserted into document</span>';
    }
    if (this.currentStage === 'ERROR') {
      return '<span style="color: #f87171; font-size: 11px;">Error</span>';
    }
    return '';
  }

  private renderRemoteWarningIfNeeded(): string {
    if (!this.isLocal && !this.settings.hasAcknowledgedRemoteWarning && this.settings.showRemoteWarning) {
      return `
        <div class="remote-warning-banner">
          <div><strong>Notice: Remote Inference</strong></div>
          <div>Text will leave your device and be processed by <code>${this.escapeHtml(this.settings.providerConfig.endpoint)}</code>.</div>
          <div style="display: flex; gap: 6px; margin-top: 4px;">
            <button class="btn btn-primary" id="qi-ack-remote-btn" style="padding: 3px 8px; font-size: 11px;">I Understand, Proceed</button>
          </div>
        </div>
      `;
    }
    return '';
  }

  private renderOriginalBox(): string {
    if (!this.originalText) return '';
    return `
      <div class="query-card">
        <span class="query-label">Original Query</span>
        <div class="query-box original">${this.escapeHtml(this.originalText)}</div>
      </div>
    `;
  }

  private renderReconstructionBox(): string {
    if (this.isEditing) {
      return `
        <div class="query-card">
          <span class="query-label">Edit Reconstructed Query</span>
          <textarea class="query-edit-area" id="qi-edit-textarea">${this.escapeHtml(this.reconstructedText)}</textarea>
        </div>
      `;
    }

    const placeholder = this.currentStage === 'ANALYZING' || this.currentStage === 'RECONSTRUCTING'
      ? 'Analyzing and reconstructing query...'
      : 'Ready';

    return `
      <div class="query-card">
        <span class="query-label">AI-Ready Reconstructed Query</span>
        <div class="query-box reconstructed" id="qi-reconstructed-content">${this.escapeHtml(this.reconstructedText || placeholder)}</div>
      </div>
    `;
  }

  private renderClarificationSection(): string {
    if (this.clarificationOptions.length === 0) return '';
    const pills = this.clarificationOptions
      .map(
        (opt) =>
          `<button class="clarification-pill" data-option="${this.escapeHtml(opt)}">${this.escapeHtml(opt)}</button>`
      )
      .join('');

    return `
      <div class="clarification-section">
        <span class="clarification-title">Select Clarification:</span>
        ${pills}
      </div>
    `;
  }

  private renderErrorSection(): string {
    if (this.currentStage !== 'ERROR' || !this.errorMessage) return '';
    return `
      <div style="padding: 8px 10px; background: rgba(239, 68, 68, 0.15); border: 1px solid rgba(239, 68, 68, 0.35); border-radius: 8px; color: #fca5a5; font-size: 11.5px;">
        <strong>Error:</strong> ${this.escapeHtml(this.errorMessage)}
      </div>
    `;
  }

  private attachDomHandlers(): void {
    // Header Drag
    const header = this.shadow.getElementById('qi-header');
    if (header) {
      header.addEventListener('mousedown', (e: MouseEvent) => {
        if ((e.target as HTMLElement).closest('button')) return;
        this.isDragging = true;
        this.dragStartX = e.clientX;
        this.dragStartY = e.clientY;
        const rect = this.container.getBoundingClientRect();
        this.initialLeft = rect.left;
        this.initialTop = rect.top;
      });
    }

    // Close
    const closeBtn = this.shadow.getElementById('qi-close-btn');
    closeBtn?.addEventListener('click', () => this.callbacks.onClose());

    // Copy
    const copyBtn = this.shadow.getElementById('qi-copy-btn');
    copyBtn?.addEventListener('click', () => {
      this.callbacks.onCopy(this.reconstructedText);
      this.updateStage('COPIED');
      setTimeout(() => {
        if (this.currentStage === 'COPIED') {
          this.updateStage('COMPLETED');
        }
      }, 1800);
    });

    // Insert
    const insertBtn = this.shadow.getElementById('qi-insert-btn');
    insertBtn?.addEventListener('click', () => {
      this.callbacks.onInsert(this.reconstructedText);
      this.updateStage('INSERTED');
      setTimeout(() => {
        if (this.currentStage === 'INSERTED') {
          this.callbacks.onClose();
        }
      }, 1500);
    });

    // Edit Toggle
    const editBtn = this.shadow.getElementById('qi-edit-btn');
    editBtn?.addEventListener('click', () => {
      if (this.isEditing) {
        const textarea = this.shadow.getElementById('qi-edit-textarea') as HTMLTextAreaElement | null;
        if (textarea) {
          this.reconstructedText = textarea.value.trim();
        }
        this.isEditing = false;
        this.render();
      } else {
        this.isEditing = true;
        this.render();
        const textarea = this.shadow.getElementById('qi-edit-textarea') as HTMLTextAreaElement | null;
        textarea?.focus();
      }
    });

    // Ask AI Dropdown Toggle
    const askAiBtn = this.shadow.getElementById('qi-ask-ai-btn');
    const askAiMenu = this.shadow.getElementById('qi-ask-ai-menu');
    askAiBtn?.addEventListener('click', (e) => {
      e.stopPropagation();
      if (askAiMenu) {
        askAiMenu.style.display = askAiMenu.style.display === 'none' ? 'flex' : 'none';
      }
    });

    // Ask AI items
    this.shadow.querySelectorAll('.dropdown-item').forEach((item) => {
      item.addEventListener('click', () => {
        const target = item.getAttribute('data-target') as AskAiTarget;
        this.callbacks.onAskAi(target, this.reconstructedText);
        if (askAiMenu) askAiMenu.style.display = 'none';
      });
    });

    // Clarification pills
    this.shadow.querySelectorAll('.clarification-pill').forEach((pill) => {
      pill.addEventListener('click', () => {
        const opt = pill.getAttribute('data-option');
        if (opt) {
          this.reconstructedText = opt;
          this.clarificationOptions = [];
          this.currentStage = 'COMPLETED';
          this.callbacks.onClarificationSelect(opt);
          this.render();
        }
      });
    });

    // Remote Acknowledge
    const ackBtn = this.shadow.getElementById('qi-ack-remote-btn');
    ackBtn?.addEventListener('click', () => {
      this.settings.hasAcknowledgedRemoteWarning = true;
      this.callbacks.onRemoteAcknowledge?.();
      this.render();
    });
  }

  private escapeHtml(str: string): string {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }
}
