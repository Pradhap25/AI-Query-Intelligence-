/**
 * AI Query Intelligence - Core Regression Test Suite
 * Strictly covers all required test scenarios specified in Prompt Section 9.A
 */

import { describe, it, expect } from 'vitest';
import { QueryAnalyzer } from '../../core/engine/analyzer';
import { QueryReconstructor } from '../../core/engine/reconstructor';
import { QueryValidator } from '../../core/validators';
import { QueryIntelligencePipeline } from '../../core/engine/pipeline';
import { DEFAULT_SETTINGS } from '../../core/types';

describe('Prompt Section 9.A: Regression & Engine Rules Tests', () => {
  // 1. Grammar and spelling noise, implicit questions, troubleshooting
  describe('1. Grammar, spelling noise, implicit questions, troubleshooting', () => {
    it('cleans verbal noise, fixes high confidence typos, and reconstructs how-to', async () => {
      const raw = 'um, like, connect power bi power automate how';
      const result = await QueryIntelligencePipeline.process(
        raw,
        { ...DEFAULT_SETTINGS, depthLevel: 3 },
        undefined,
        { useModel: false }
      );

      expect(result.reconstructedQuery).not.toMatch(/\bum\b/i);
      expect(result.reconstructedQuery).not.toMatch(/\blike\b/i);
      expect(result.reconstructedQuery).toContain('Power BI');
      expect(result.reconstructedQuery).toContain('Power Automate');
      expect(result.reconstructedQuery).toMatch(/^How do I connect/i);
    });

    it('reconstructs troubleshooting queries into clear diagnostic prompts', async () => {
      const raw = 'fastapi app crashing with unhandled exception on startup';
      const result = await QueryIntelligencePipeline.process(
        raw,
        { ...DEFAULT_SETTINGS, depthLevel: 2 },
        undefined,
        { useModel: false }
      );

      expect(result.analysis.intent).toBe('troubleshooting');
      expect(result.reconstructedQuery).toContain('FastAPI');
      expect(result.reconstructedQuery).toContain('root cause');
    });
  });

  // 2. Multiple problems (both must survive)
  describe('2. Multiple problems (both must survive)', () => {
    it('ensures primary and secondary problems both survive in reconstruction', async () => {
      const raw = 'login fails with 401 unauthorized and user avatar returns 404 not found';
      const result = await QueryIntelligencePipeline.process(
        raw,
        { ...DEFAULT_SETTINGS, depthLevel: 2 },
        undefined,
        { useModel: false }
      );

      const recon = result.reconstructedQuery.toLowerCase();
      expect(recon).toContain('login');
      expect(recon).toContain('401');
      expect(recon).toContain('avatar');
      expect(recon).toContain('404');

      const validation = QueryValidator.validate(result.analysis, result.reconstructedQuery);
      expect(validation.missingPreservations).toEqual([]);
    });
  });

  // 3. Two conditions with NO causality (do not invent it)
  describe('3. Two conditions with NO causality (do not invent cause-and-effect)', () => {
    it('keeps two co-occurring observations distinct and never asserts one caused the other', async () => {
      const raw = 'CPU is at 95% and user session tokens are expiring early';
      const result = await QueryIntelligencePipeline.process(
        raw,
        { ...DEFAULT_SETTINGS, depthLevel: 2 },
        undefined,
        { useModel: false }
      );

      const recon = result.reconstructedQuery.toLowerCase();
      expect(recon).not.toContain('because of the cpu');
      expect(recon).not.toContain('cpu is causing');

      const validation = QueryValidator.validate(result.analysis, result.reconstructedQuery);
      expect(validation.inventedCausality).toBe(false);
    });
  });

  // 4. Help requests (never ask the user what they want)
  describe('4. Help requests (maintain request direction: user -> AI)', () => {
    it('turns "I need help fixing this" into an AI prompt, never asking the user', async () => {
      const raw = 'I need help fixing this query';
      const result = await QueryIntelligencePipeline.process(
        raw,
        { ...DEFAULT_SETTINGS, depthLevel: 2 },
        undefined,
        { useModel: false }
      );

      expect(result.reconstructedQuery).toMatch(/^I need assistance/i);
      expect(result.reconstructedQuery).not.toMatch(/what do you want/i);
      expect(result.reconstructedQuery).not.toMatch(/how can i help you/i);

      const validation = QueryValidator.validate(result.analysis, result.reconstructedQuery);
      expect(validation.wrongDirection).toBe(false);
    });
  });

  // 5. Technical typos (fix only when confident, never guess ambiguous)
  describe('5. Technical typos (fix only when confident)', () => {
    it('corrects high confidence technical terms and leaves ambiguous words untouched', async () => {
      const raw = 'how to deploy kubernets cluster with postgress db and pbi report';
      const result = await QueryIntelligencePipeline.process(
        raw,
        { ...DEFAULT_SETTINGS, depthLevel: 1 },
        undefined,
        { useModel: false }
      );

      expect(result.reconstructedQuery).toContain('Kubernetes');
      expect(result.reconstructedQuery).toContain('PostgreSQL');
      // "pbi" is an ambiguous abbreviation, must NOT be blindly guessed or mangled
      expect(result.reconstructedQuery).toContain('pbi');
    });
  });

  // 6. Constraints, deadlines, uncertainty (must survive)
  describe('6. Constraints, deadlines, uncertainty (must survive)', () => {
    it('strictly preserves constraints, deadlines, and uncertainty markers', async () => {
      const raw =
        'write a deep clone function in typescript without lodash, might be circular references, needed by Friday 5pm';
      const result = await QueryIntelligencePipeline.process(
        raw,
        { ...DEFAULT_SETTINGS, depthLevel: 2 },
        undefined,
        { useModel: false }
      );

      const recon = result.reconstructedQuery;
      expect(recon).toContain('TypeScript');
      expect(recon.toLowerCase()).toContain('without lodash');
      expect(recon.toLowerCase()).toContain('friday');
      // Uncertainty check
      expect(recon.toLowerCase()).toMatch(/might|suspect|potential|possible/);

      const validation = QueryValidator.validate(result.analysis, recon);
      expect(validation.valid).toBe(true);
    });
  });

  // 7. Filenames, code, versions, mixed language
  describe('7. Filenames, code, versions, mixed language', () => {
    it('preserves code tokens, filenames, and version numbers', async () => {
      const raw =
        'in src/auth/jwt.ts line 54, jwt.verify fails with JsonWebTokenError on node v18.17.0';
      const result = await QueryIntelligencePipeline.process(
        raw,
        { ...DEFAULT_SETTINGS, depthLevel: 2 },
        undefined,
        { useModel: false }
      );

      const recon = result.reconstructedQuery;
      expect(recon).toContain('src/auth/jwt.ts');
      expect(recon).toContain('v18.17.0');
      expect(recon).toContain('jwt.verify');
      expect(recon).toContain('JsonWebTokenError');
    });
  });

  // 8. Clear queries (do not over-rewrite)
  describe('8. Clear queries (do not over-rewrite)', () => {
    it('preserves already well-formulated queries with light touch only', async () => {
      const clearQuery =
        'How do I implement a debounced search input in React using TypeScript without external libraries?';
      const result = await QueryIntelligencePipeline.process(
        clearQuery,
        { ...DEFAULT_SETTINGS, depthLevel: 2 },
        undefined,
        { useModel: false }
      );

      expect(result.analysis.isClearAlready).toBe(true);
      // Ensure it was not bloated into a multiple paragraph essay
      expect(result.reconstructedQuery.split(/\s+/).length).toBeLessThan(35);
      expect(result.reconstructedQuery).toContain('React');
      expect(result.reconstructedQuery).toContain('TypeScript');
    });
  });

  // 9. Unrelated requests (do not merge artificially)
  describe('9. Unrelated requests (do not merge artificially into false causality)', () => {
    it('structures unrelated problems distinctly without synthesizing a false single root cause', async () => {
      const raw = 'nginx returns 502 bad gateway and also payment webhook is dropping payload';
      const result = await QueryIntelligencePipeline.process(
        raw,
        { ...DEFAULT_SETTINGS, depthLevel: 2 },
        undefined,
        { useModel: false }
      );

      expect(result.reconstructedQuery).toContain('Primary issue');
      expect(result.reconstructedQuery).toContain('Secondary issue');
      expect(result.reconstructedQuery.toLowerCase()).toContain('both issues');

      const validation = QueryValidator.validate(result.analysis, result.reconstructedQuery);
      expect(validation.inventedCausality).toBe(false);
    });
  });
});
