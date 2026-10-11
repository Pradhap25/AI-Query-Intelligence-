import { describe, it, expect } from 'vitest';
import { QueryAnalyzer } from '../../core/engine/analyzer';

describe('QueryAnalyzer', () => {
  it('extracts technical entities and identifies high-confidence typos', () => {
    const raw = 'help me setup kubernets and postgress with dockr';
    const analysis = QueryAnalyzer.analyze(raw);

    expect(analysis.technicalEntities).toContain('Kubernetes');
    expect(analysis.technicalEntities).toContain('PostgreSQL');
    expect(analysis.technicalEntities).toContain('Docker');
  });

  it('detects uncertainty phrases and does not treat them as confirmed facts', () => {
    const raw = 'the server crashed, might be out of memory or possibly thread deadlock';
    const analysis = QueryAnalyzer.analyze(raw);

    expect(analysis.uncertaintyPhrases.length).toBeGreaterThan(0);
    expect(analysis.uncertaintyPhrases.some((u) => u.includes('might be'))).toBe(true);
    expect(analysis.hypotheses.length).toBeGreaterThan(0);
  });

  it('detects constraints, exclusions, and deadlines', () => {
    const raw = 'build a debounce hook in react without lodash and no external libraries needed by Friday';
    const analysis = QueryAnalyzer.analyze(raw);

    expect(analysis.exclusions.length).toBeGreaterThan(0);
    expect(analysis.deadlines).toBeDefined();
    expect(analysis.deadlines?.toLowerCase()).toContain('friday');
  });

  it('detects versions, filenames, ports, and code commands', () => {
    const raw = 'error in src/server.ts on port 8080 running node v20.10.0 after executing npm run build';
    const analysis = QueryAnalyzer.analyze(raw);

    expect(analysis.filenamesAndPaths).toContain('src/server.ts');
    expect(analysis.numbersAndVersions).toContain('port 8080');
    expect(analysis.numbersAndVersions).toContain('v20.10.0');
    expect(analysis.codeOrCommands.some((c) => c.includes('npm run build'))).toBe(true);
  });

  it('detects multiple problems and splits them into primary and secondary issues', () => {
    const raw = 'login fails with 401 and also avatar images return 404';
    const analysis = QueryAnalyzer.analyze(raw);

    expect(analysis.primaryProblem).toBeDefined();
    expect(analysis.primaryProblem?.toLowerCase()).toContain('login');
    expect(analysis.secondaryProblems.length).toBeGreaterThan(0);
    expect(analysis.secondaryProblems[0].toLowerCase()).toContain('avatar');
  });

  it('cleans verbal speech-to-text filler noise', () => {
    const dirty = 'um, like, basically I want to connect to redis, you know?';
    const cleaned = QueryAnalyzer.cleanNoise(dirty);

    expect(cleaned).not.toMatch(/\bum\b/i);
    expect(cleaned).not.toMatch(/\blike,\b/i);
    expect(cleaned).not.toMatch(/\byou know\b/i);
  });
});
