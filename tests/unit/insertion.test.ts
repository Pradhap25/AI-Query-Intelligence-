/**
 * AI Query Intelligence - Smart Insertion Unit Tests
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { SmartInsertionEngine } from '../../extension/insertion';

describe('SmartInsertionEngine', () => {
  beforeEach(() => {
    (global as any).window = (global as any).window || {};
    (global as any).document = (global as any).document || {};
    (global as any).navigator = (global as any).navigator || {};
    (global as any).Event = class Event {
      constructor(public type: string) {}
    };
    (global as any).InputEvent = class InputEvent extends (global as any).Event {
      constructor(type: string, public init?: any) {
        super(type);
      }
    };
  });

  it('inserts into standard textarea replacing empty content', () => {
    const mockTextarea: any = {
      tagName: 'TEXTAREA',
      value: '',
      selectionStart: 0,
      selectionEnd: 0,
      setRangeText(text: string, start: number, end: number) {
        this.value = this.value.substring(0, start) + text + this.value.substring(end);
      },
      dispatchEvent: () => true,
      focus: () => {},
    };

    const result = SmartInsertionEngine.insert('Reconstructed prompt', mockTextarea);
    expect(result.success).toBe(true);
    expect(mockTextarea.value).toBe('Reconstructed prompt');
  });

  it('inserts into standard input replacing selected range', () => {
    const mockInput: any = {
      tagName: 'INPUT',
      type: 'text',
      value: 'hello old query world',
      selectionStart: 6,
      selectionEnd: 15,
      setRangeText(text: string, start: number, end: number) {
        this.value = this.value.substring(0, start) + text + this.value.substring(end);
      },
      dispatchEvent: () => true,
      focus: () => {},
    };

    const result = SmartInsertionEngine.insert('improved AI request', mockInput);
    expect(result.success).toBe(true);
    expect(mockInput.value).toBe('hello improved AI request world');
  });

  it('inserts into contenteditable elements via execCommand', () => {
    let executedCmd = '';
    let executedVal = '';

    (global as any).document.execCommand = (cmd: string, _ui?: boolean, val?: string) => {
      executedCmd = cmd;
      executedVal = val || '';
      return true;
    };

    const mockContentEditable: any = {
      tagName: 'DIV',
      isContentEditable: true,
      getAttribute: (attr: string) => (attr === 'contenteditable' ? 'true' : null),
      dispatchEvent: () => true,
      focus: () => {},
    };

    const result = SmartInsertionEngine.insert('Rich text reconstructed prompt', mockContentEditable);
    expect(result.success).toBe(true);
    expect(result.method).toBe('execCommand');
    expect(executedCmd).toBe('insertText');
    expect(executedVal).toBe('Rich text reconstructed prompt');
  });

  it('falls back safely to clipboard if element is null or non-editable', () => {
    let clipboardData = '';
    (global as any).navigator.clipboard = {
      writeText: async (t: string) => {
        clipboardData = t;
      },
    };

    const result = SmartInsertionEngine.insert('Fallback prompt text', null);
    expect(result.success).toBe(false);
    expect(result.method).toBe('clipboard-fallback');
    expect(clipboardData).toBe('Fallback prompt text');
  });
});
