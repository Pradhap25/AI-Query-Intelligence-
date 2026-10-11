/**
 * AI Query Intelligence - Smart Insertion Engine
 * Handles safe, robust text replacement across:
 * - HTML textarea and input
 * - React, Vue, Angular controlled inputs
 * - contenteditable editors (ChatGPT, Claude, Gemini, Lexical, ProseMirror, DraftJS, Slate, Google Docs, Gmail)
 * - Safe fallback to clipboard with notification
 */

export interface InsertionResult {
  success: boolean;
  method: 'execCommand' | 'inputProperty' | 'range' | 'clipboard-fallback';
  message: string;
}

export class SmartInsertionEngine {
  /**
   * Attempts to replace the selected text or active element's content with the reconstructed text.
   */
  public static insert(
    text: string,
    targetElement?: HTMLElement | null
  ): InsertionResult {
    const target = targetElement || (document.activeElement as HTMLElement | null);

    // 1. If target is a standard HTMLInputElement or HTMLTextAreaElement
    const isTextArea =
      typeof HTMLTextAreaElement !== 'undefined'
        ? target instanceof HTMLTextAreaElement
        : target?.tagName?.toLowerCase() === 'textarea';

    const isInput =
      typeof HTMLInputElement !== 'undefined'
        ? target instanceof HTMLInputElement
        : target?.tagName?.toLowerCase() === 'input';

    if (
      isTextArea ||
      (isInput && /^(text|search|url|tel)$/i.test((target as any).type || 'text'))
    ) {
      const inputOrTextarea = target as HTMLInputElement | HTMLTextAreaElement;
      try {
        const start = inputOrTextarea.selectionStart ?? 0;
        const end = inputOrTextarea.selectionEnd ?? inputOrTextarea.value.length;
        const hasSelection = end > start;

        // If user selected text, replace selection; otherwise replace whole text if small, or insert at cursor
        if (hasSelection) {
          inputOrTextarea.setRangeText(text, start, end, 'end');
        } else {
          // Replace or insert at cursor
          if (inputOrTextarea.value.trim().length === 0 || inputOrTextarea.value.trim().length <= 50) {
            this.setNativeValue(inputOrTextarea, text);
          } else {
            inputOrTextarea.setRangeText(text, start, start, 'end');
          }
        }

        // Dispatch input and change events for framework binding
        inputOrTextarea.dispatchEvent(new Event('input', { bubbles: true }));
        inputOrTextarea.dispatchEvent(new Event('change', { bubbles: true }));
        inputOrTextarea.focus();

        return {
          success: true,
          method: 'inputProperty',
          message: 'Text inserted into input field.',
        };
      } catch (err) {
        console.warn('[SmartInsertion] Standard input insertion failed:', err);
      }
    }

    // 2. If target is contenteditable (ChatGPT, Claude, Lexical, ProseMirror, DraftJS, Gmail, etc.)
    const isContentEditable =
      target?.isContentEditable ||
      (typeof target?.getAttribute === 'function' &&
        (target.getAttribute('contenteditable') === 'true' || target.getAttribute('role') === 'textbox'));

    const sel = typeof window !== 'undefined' && typeof window.getSelection === 'function'
      ? window.getSelection()
      : null;

    if (isContentEditable || sel?.rangeCount) {
      try {
        // execCommand insertText is the most reliable way for rich-text editors to maintain undo stack and internal state
        if (target) {
          target.focus();
        }

        const success = typeof document !== 'undefined' && typeof document.execCommand === 'function'
          ? document.execCommand('insertText', false, text)
          : false;

        if (success) {
          if (target && typeof InputEvent !== 'undefined') {
            target.dispatchEvent(new InputEvent('input', { bubbles: true, inputType: 'insertText', data: text }));
          }
          return {
            success: true,
            method: 'execCommand',
            message: 'Text inserted via editor command.',
          };
        }
      } catch (err) {
        console.warn('[SmartInsertion] execCommand failed:', err);
      }

      // Try Range API replacement
      try {
        if (sel && sel.rangeCount > 0) {
          const range = sel.getRangeAt(0);
          range.deleteContents();
          const textNode = document.createTextNode(text);
          range.insertNode(textNode);
          range.setStartAfter(textNode);
          range.setEndAfter(textNode);
          sel.removeAllRanges();
          sel.addRange(range);

          if (target) {
            target.dispatchEvent(new Event('input', { bubbles: true }));
          }

          return {
            success: true,
            method: 'range',
            message: 'Text inserted via DOM Range.',
          };
        }
      } catch (err) {
        console.warn('[SmartInsertion] DOM Range replacement failed:', err);
      }
    }

    // 3. Fallback: Copy to clipboard safely
    try {
      if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
        navigator.clipboard.writeText(text);
        return {
          success: false,
          method: 'clipboard-fallback',
          message: 'Could not auto-insert into editor. Query was copied to clipboard instead! (Press Ctrl+V to paste)',
        };
      }
      return {
        success: false,
        method: 'clipboard-fallback',
        message: 'Clipboard not accessible. Please copy text manually.',
      };
    } catch (err) {
      return {
        success: false,
        method: 'clipboard-fallback',
        message: 'Insertion failed. Please copy the reconstructed text manually.',
      };
    }
  }

  /**
   * Helper to set value on React/Vue controlled inputs bypassing framework overrides
   */
  private static setNativeValue(
    element: HTMLInputElement | HTMLTextAreaElement,
    value: string
  ): void {
    try {
      const isInput = typeof HTMLInputElement !== 'undefined' && element instanceof HTMLInputElement;
      const prototype = isInput
        ? window.HTMLInputElement?.prototype
        : window.HTMLTextAreaElement?.prototype;

      const descriptor = prototype ? Object.getOwnPropertyDescriptor(prototype, 'value') : null;
      if (descriptor && descriptor.set) {
        descriptor.set.call(element, value);
      } else {
        element.value = value;
      }
    } catch {
      element.value = value;
    }
  }
}
