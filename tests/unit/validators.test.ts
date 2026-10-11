import { describe, it, expect } from 'vitest';
import { QueryAnalyzer } from '../../core/engine/analyzer';
import { QueryValidator } from '../../core/validators';

describe('QueryValidator', () => {
  it('flags missing technical entities and versions', () => {
    const raw = 'getting 504 gateway timeout on nginx v1.24 with upstream port 8000';
    const analysis = QueryAnalyzer.analyze(raw);

    // Simulated incomplete reconstruction where port and version were dropped
    const reconstructed = 'I am seeing a gateway timeout on my server.';
    const validation = QueryValidator.validate(analysis, reconstructed);

    expect(validation.valid).toBe(false);
    expect(validation.missingPreservations.some((m) => m.includes('port 8000'))).toBe(true);
    expect(validation.missingPreservations.some((m) => m.includes('v1.24'))).toBe(true);
  });

  it('detects and flags invented causality', () => {
    const raw = 'CPU is at 99% and incoming network packets dropped';
    const analysis = QueryAnalyzer.analyze(raw);

    // Reconstruction that falsely claims CPU caused network drop
    const reconstructed =
      'Because of the high CPU utilization at 99%, incoming network packets are being dropped.';
    const validation = QueryValidator.validate(analysis, reconstructed);

    expect(validation.inventedCausality).toBe(true);
  });

  it('flags wrong request direction when prompt acts as assistant asking user', () => {
    const raw = 'I need help fixing this query';
    const analysis = QueryAnalyzer.analyze(raw);

    const reversedReconstruction =
      'What do you want me to help you fix? Please provide details.';
    const validation = QueryValidator.validate(analysis, reversedReconstruction);

    expect(validation.wrongDirection).toBe(true);
    expect(validation.valid).toBe(false);
  });

  it('sanitizes untrusted text containing malicious script tags', () => {
    const malicious =
      'How to sort array <script>alert("hacked")</script> and javascript:void(0)';
    const sanitized = QueryValidator.sanitizeText(malicious);

    expect(sanitized).not.toContain('<script>');
    expect(sanitized).not.toContain('javascript:');
    expect(sanitized).toContain('How to sort array');
  });
});
