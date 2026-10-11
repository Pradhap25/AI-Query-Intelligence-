import { describe, it, expect } from 'vitest';
import { QueryAnalyzer } from '../../core/engine/analyzer';
import { QueryReconstructor } from '../../core/engine/reconstructor';
import { DEFAULT_SETTINGS } from '../../core/types';

describe('QueryReconstructor', () => {
  it('performs depth 1 light cleanup without altering structure', () => {
    const raw = 'how do i configure  dockr  container port mapping';
    const analysis = QueryAnalyzer.analyze(raw);
    const result = QueryReconstructor.reconstructDeterministically(raw, analysis, {
      ...DEFAULT_SETTINGS,
      depthLevel: 1,
    });

    expect(result.reconstructedText).toContain('Docker');
    expect(result.reconstructedText).toMatch(/\?$/);
  });

  it('reconstructs implicit how-to requests (Depth 3)', () => {
    const raw = 'connect power bi power automate how';
    const analysis = QueryAnalyzer.analyze(raw);
    const result = QueryReconstructor.reconstructDeterministically(raw, analysis, {
      ...DEFAULT_SETTINGS,
      depthLevel: 3,
    });

    expect(result.reconstructedText).toMatch(/^How do I connect Power BI with Power Automate/i);
    expect(result.reconstructedText).toContain('step-by-step instructions');
  });

  it('reconstructs help requests without reversing request direction', () => {
    const raw = 'I need help fixing this query';
    const analysis = QueryAnalyzer.analyze(raw);
    const result = QueryReconstructor.reconstructDeterministically(raw, analysis, {
      ...DEFAULT_SETTINGS,
      depthLevel: 2,
    });

    expect(result.reconstructedText).toContain('I need assistance');
    expect(result.reconstructedText).not.toMatch(/what do you want/i);
    expect(result.reconstructedText).not.toMatch(/how can i help you/i);
  });

  it('preserves multiple problems in distinct sections (Depth 2)', () => {
    const raw = 'auth service returns 500 and user session expires immediately';
    const analysis = QueryAnalyzer.analyze(raw);
    const result = QueryReconstructor.reconstructDeterministically(raw, analysis, {
      ...DEFAULT_SETTINGS,
      depthLevel: 2,
    });

    expect(result.reconstructedText).toContain('Primary issue');
    expect(result.reconstructedText).toContain('Secondary issue');
    expect(result.reconstructedText).toContain('both issues');
  });

  it('provides clarification options for ambiguous input (Depth 4)', () => {
    const raw = 'kubernetes';
    const analysis = QueryAnalyzer.analyze(raw);
    const result = QueryReconstructor.reconstructDeterministically(raw, analysis, {
      ...DEFAULT_SETTINGS,
      depthLevel: 4,
    });

    expect(result.clarificationOptions).toBeDefined();
    expect(result.clarificationOptions!.length).toBeGreaterThan(0);
    expect(result.clarificationOptions![0]).toContain('Kubernetes');
  });
});
