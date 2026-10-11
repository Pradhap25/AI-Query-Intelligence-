/**
 * AI Query Intelligence - Overlay Shadow DOM Styles
 */

export const OVERLAY_STYLES = `
:host {
  all: initial;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
  font-size: 13px;
  line-height: 1.5;
  color: #e2e8f0;
  box-sizing: border-box;
  z-index: 2147483647;
}

*, *::before, *::after {
  box-sizing: inherit;
}

.panel-container {
  position: fixed;
  width: 480px;
  max-width: calc(100vw - 32px);
  max-height: 85vh;
  background: rgba(18, 22, 34, 0.94);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 12px;
  box-shadow: 0 16px 40px -8px rgba(0, 0, 0, 0.6), 0 0 0 1px rgba(255, 255, 255, 0.05);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  animation: qi-fade-in 0.18s cubic-bezier(0.16, 1, 0.3, 1);
}

@keyframes qi-fade-in {
  from {
    opacity: 0;
    transform: translateY(6px) scale(0.98);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

/* Header */
.panel-header {
  padding: 10px 14px;
  background: rgba(255, 255, 255, 0.03);
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
  display: flex;
  align-items: center;
  justify-content: space-between;
  cursor: grab;
  user-select: none;
}

.panel-header:active {
  cursor: grabbing;
}

.header-title-row {
  display: flex;
  align-items: center;
  gap: 8px;
}

.brand-icon {
  width: 18px;
  height: 18px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 5px;
  background: linear-gradient(135deg, #6366f1, #3b82f6);
  color: #fff;
  font-weight: 700;
  font-size: 11px;
}

.title-text {
  font-weight: 600;
  font-size: 12.5px;
  color: #f8fafc;
  letter-spacing: -0.01em;
}

.badge {
  font-size: 9.5px;
  font-weight: 700;
  letter-spacing: 0.04em;
  padding: 2px 6px;
  border-radius: 4px;
  text-transform: uppercase;
}

.badge-local {
  background: rgba(16, 185, 129, 0.2);
  color: #34d399;
  border: 1px solid rgba(16, 185, 129, 0.35);
}

.badge-remote {
  background: rgba(245, 158, 11, 0.2);
  color: #fbbf24;
  border: 1px solid rgba(245, 158, 11, 0.35);
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 4px;
}

.icon-btn {
  background: transparent;
  border: none;
  color: #94a3b8;
  cursor: pointer;
  padding: 4px;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.15s ease;
}

.icon-btn:hover {
  background: rgba(255, 255, 255, 0.1);
  color: #f8fafc;
}

/* Status progression bar */
.status-tracker {
  padding: 8px 14px;
  background: rgba(0, 0, 0, 0.25);
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

.stages-list {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 11px;
}

.stage-step {
  display: flex;
  align-items: center;
  gap: 4px;
  color: #64748b;
  font-weight: 500;
}

.stage-step.active {
  color: #60a5fa;
  font-weight: 600;
}

.stage-step.active::before {
  content: "";
  display: inline-block;
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #60a5fa;
  box-shadow: 0 0 8px #3b82f6;
  animation: pulse-dot 1.2s infinite;
}

.stage-step.completed {
  color: #94a3b8;
}

.stage-divider {
  color: #334155;
  font-size: 9px;
}

@keyframes pulse-dot {
  0%, 100% { opacity: 1; transform: scale(1); }
  50% { opacity: 0.4; transform: scale(0.8); }
}

/* Body */
.panel-body {
  padding: 12px 14px;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 12px;
  max-height: calc(85vh - 120px);
}

.query-card {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.query-label {
  font-size: 10.5px;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  font-weight: 600;
  color: #94a3b8;
}

.query-box {
  background: rgba(0, 0, 0, 0.35);
  border: 1px solid rgba(255, 255, 255, 0.07);
  border-radius: 8px;
  padding: 8px 10px;
  font-size: 12.5px;
  line-height: 1.5;
  word-break: break-word;
  white-space: pre-wrap;
  color: #cbd5e1;
}

.query-box.original {
  max-height: 80px;
  overflow-y: auto;
  color: #94a3b8;
  font-size: 11.5px;
}

.query-box.reconstructed {
  border-color: rgba(99, 102, 241, 0.35);
  background: rgba(15, 23, 42, 0.6);
  color: #f1f5f9;
  font-weight: 450;
  min-height: 50px;
}

.query-edit-area {
  width: 100%;
  min-height: 80px;
  background: rgba(15, 23, 42, 0.85);
  border: 1px solid #6366f1;
  border-radius: 8px;
  padding: 8px 10px;
  font-family: inherit;
  font-size: 12.5px;
  line-height: 1.5;
  color: #f1f5f9;
  outline: none;
  resize: vertical;
}

/* Clarification Options (Depth 4) */
.clarification-section {
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 8px;
  background: rgba(245, 158, 11, 0.08);
  border: 1px solid rgba(245, 158, 11, 0.25);
  border-radius: 8px;
}

.clarification-title {
  font-size: 11px;
  font-weight: 600;
  color: #fbbf24;
}

.clarification-pill {
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 6px;
  padding: 6px 8px;
  color: #e2e8f0;
  font-size: 11.5px;
  text-align: left;
  cursor: pointer;
  transition: all 0.15s ease;
}

.clarification-pill:hover {
  background: rgba(99, 102, 241, 0.2);
  border-color: rgba(99, 102, 241, 0.5);
  color: #fff;
}

/* Remote warning banner */
.remote-warning-banner {
  padding: 8px 10px;
  background: rgba(245, 158, 11, 0.15);
  border: 1px solid rgba(245, 158, 11, 0.35);
  border-radius: 8px;
  font-size: 11.5px;
  color: #fbbf24;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

/* Action Footer */
.panel-footer {
  padding: 10px 14px;
  background: rgba(255, 255, 255, 0.02);
  border-top: 1px solid rgba(255, 255, 255, 0.08);
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

.left-actions, .right-actions {
  display: flex;
  align-items: center;
  gap: 6px;
}

.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 5px;
  padding: 5px 10px;
  border-radius: 6px;
  font-size: 11.5px;
  font-weight: 500;
  cursor: pointer;
  border: 1px solid transparent;
  transition: all 0.15s ease;
  user-select: none;
  outline: none;
}

.btn:active {
  transform: scale(0.97);
}

.btn-secondary {
  background: rgba(255, 255, 255, 0.07);
  border-color: rgba(255, 255, 255, 0.12);
  color: #cbd5e1;
}

.btn-secondary:hover {
  background: rgba(255, 255, 255, 0.12);
  color: #ffffff;
}

.btn-primary {
  background: linear-gradient(135deg, #4f46e5, #3b82f6);
  color: #ffffff;
  border-color: rgba(255, 255, 255, 0.15);
  box-shadow: 0 2px 8px rgba(79, 70, 229, 0.35);
}

.btn-primary:hover {
  background: linear-gradient(135deg, #4338ca, #2563eb);
}

.btn-success {
  background: rgba(16, 185, 129, 0.2);
  border-color: rgba(16, 185, 129, 0.4);
  color: #34d399;
}

/* Ask AI Dropdown */
.ask-ai-dropdown {
  position: relative;
}

.dropdown-menu {
  position: absolute;
  bottom: calc(100% + 6px);
  left: 0;
  background: #1e2433;
  border: 1px solid rgba(255, 255, 255, 0.15);
  border-radius: 8px;
  padding: 4px;
  min-width: 140px;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.5);
  display: flex;
  flex-direction: column;
  gap: 2px;
  z-index: 100;
}

.dropdown-item {
  background: transparent;
  border: none;
  padding: 6px 8px;
  text-align: left;
  font-size: 11.5px;
  color: #cbd5e1;
  border-radius: 5px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 6px;
  transition: all 0.1s ease;
}

.dropdown-item:hover {
  background: rgba(255, 255, 255, 0.08);
  color: #ffffff;
}

/* Notification toast */
.toast-msg {
  font-size: 11px;
  color: #34d399;
  display: flex;
  align-items: center;
  gap: 4px;
  animation: qi-fade-in 0.2s ease;
}

/* Light Mode Overrides */
:host([data-theme="light"]) .panel-container {
  background: rgba(255, 255, 255, 0.96);
  border-color: rgba(0, 0, 0, 0.12);
  box-shadow: 0 16px 40px -8px rgba(0, 0, 0, 0.18), 0 0 0 1px rgba(0, 0, 0, 0.05);
  color: #1e293b;
}

:host([data-theme="light"]) .panel-header {
  background: rgba(0, 0, 0, 0.02);
  border-color: rgba(0, 0, 0, 0.08);
}

:host([data-theme="light"]) .title-text {
  color: #0f172a;
}

:host([data-theme="light"]) .status-tracker {
  background: rgba(0, 0, 0, 0.04);
  border-color: rgba(0, 0, 0, 0.06);
}

:host([data-theme="light"]) .query-box {
  background: #f8fafc;
  border-color: #e2e8f0;
  color: #334155;
}

:host([data-theme="light"]) .query-box.reconstructed {
  background: #f1f5f9;
  border-color: #818cf8;
  color: #0f172a;
}

:host([data-theme="light"]) .btn-secondary {
  background: #f1f5f9;
  border-color: #cbd5e1;
  color: #334155;
}

:host([data-theme="light"]) .btn-secondary:hover {
  background: #e2e8f0;
  color: #0f172a;
}
`;
