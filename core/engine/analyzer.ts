/**
 * AI Query Intelligence - Query Analyzer
 * Understands: intent, perspective, context, urgency, constraints,
 * uncertainty, technical entities, versions, filenames, code, etc.
 */

import { DepthLevel, QueryAnalysis } from '../types';

// High-confidence technical typos that can be safely corrected
const HIGH_CONFIDENCE_ENTITIES: Record<string, string> = {
  kubernetes: 'Kubernetes',
  kubernets: 'Kubernetes',
  k8s: 'Kubernetes',
  docker: 'Docker',
  dockr: 'Docker',
  postgress: 'PostgreSQL',
  postgres: 'PostgreSQL',
  postgre: 'PostgreSQL',
  mongo: 'MongoDB',
  mongodb: 'MongoDB',
  python: 'Python',
  pyhton: 'Python',
  pyton: 'Python',
  javascript: 'JavaScript',
  javscript: 'JavaScript',
  javascrip: 'JavaScript',
  typescript: 'TypeScript',
  typescrip: 'TypeScript',
  'type script': 'TypeScript',
  react: 'React',
  reactjs: 'React',
  vuejs: 'Vue.js',
  angularjs: 'Angular',
  powerbi: 'Power BI',
  'power bi': 'Power BI',
  powerautomate: 'Power Automate',
  'power automate': 'Power Automate',
  tailwind: 'Tailwind CSS',
  tailwindcss: 'Tailwind CSS',
  chatgpt: 'ChatGPT',
  claude: 'Claude',
  gemini: 'Gemini',
  github: 'GitHub',
  vscode: 'VS Code',
  fastapi: 'FastAPI',
  nextjs: 'Next.js',
  nestjs: 'NestJS',
  graphql: 'GraphQL',
  sqlite: 'SQLite',
  redis: 'Redis',
  nginx: 'NGINX',
  apache: 'Apache',
  ubuntu: 'Ubuntu',
  linux: 'Linux',
  windows: 'Windows',
  macos: 'macOS',
  powershell: 'PowerShell',
  bash: 'Bash',
  npm: 'npm',
  webpack: 'Webpack',
  vite: 'Vite',
  vitest: 'Vitest',
  playwright: 'Playwright',
  jest: 'Jest',
  esbuild: 'esbuild',
};

// Speech-to-text and verbal filler noise patterns
const FILLER_WORDS_REGEX = /\b(um+|uh+|er+|ah+|like|you know|basically|literally|i mean)(?:,\s*|\s*|\?|\.|$)/gi;

// Uncertainty indicators that must be preserved
const UNCERTAINTY_PATTERNS = [
  /\b(might be|maybe|possibly|could be|seems like|suspect that|suspecting|not sure if|uncertain|probably|appears to be)\b/gi,
];

// Urgency and deadline patterns
const URGENCY_PATTERNS = [
  /\b(asap|urgent|urgently|production outage|down in prod|p0|critical|emergency|high priority)\b/gi,
  /\b(by\s+(?:monday|tuesday|wednesday|thursday|friday|saturday|sunday|today|tomorrow|eod|eow|\d{1,2}(?::\d{2})?\s*(?:am|pm)?))\b/gi,
  /\b(deadline(?:\s+is)?\s+[^.,;\n]+)\b/gi,
];

// Constraint and exclusion indicators
const CONSTRAINT_PATTERNS = [
  /\b(without\s+[^.,;\n]+)\b/gi,
  /\b(no\s+(?:external|third[- ]party|extra|additional)\s+[^.,;\n]+)\b/gi,
  /\b(do not\s+use\s+[^.,;\n]+|don't\s+use\s+[^.,;\n]+)\b/gi,
  /\b(must\s+(?:be|use|support|run on)\s+[^.,;\n]+)\b/gi,
  /\b(only\s+using\s+[^.,;\n]+)\b/gi,
  /\b(restricted to\s+[^.,;\n]+)\b/gi,
];

// Filenames and paths regex
const FILENAME_REGEX = /\b[\w.-]+(?:\/[\w.-]+)*\.(?:ts|js|jsx|tsx|py|rb|go|rs|java|c|cpp|h|json|yaml|yml|toml|html|css|scss|md|sql|sh|bat|ps1|env|conf|config)\b|\/[\w./-]+\b|[a-zA-Z]:\\[\w.\\]+\b/g;

// Versions and numbers
const VERSION_REGEX = /\bv?\d+\.\d+(?:\.\d+)?(?:-[a-zA-Z0-9.]+)?\b|\bport\s+\d+\b|\b\d+\s*(?:ms|s|gb|mb|kb|tb|hz|mhz|ghz|%)\b/gi;

// Code keywords, commands, and backticked terms
const CODE_CMD_REGEX = /`([^`]+)`|\b(npm\s+[a-z0-9_:-]+(?:\s+[a-z0-9_:-]+)*|yarn\s+[a-z0-9_:-]+(?:\s+[a-z0-9_:-]+)*|pnpm\s+[a-z0-9_:-]+(?:\s+[a-z0-9_:-]+)*|git\s+[a-z0-9_:-]+(?:\s+[a-z0-9_:-]+)*|docker\s+[a-z0-9_:-]+(?:\s+[a-z0-9_:-]+)*|kubectl\s+[a-z0-9_:-]+(?:\s+[a-z0-9_:-]+)*|curl\s+[^\s]+|grep\s+[^\s]+)\b/gi;

// Quoted strings
const QUOTED_REGEX = /"([^"]+)"|'([^']+)'/g;

export class QueryAnalyzer {
  public static analyze(rawText: string): QueryAnalysis {
    const raw = rawText.trim();

    // 1. Perspective check
    const isFirstPerson = /\b(i|my|me|we|our|us)\b/i.test(raw);
    const perspective = isFirstPerson ? 'first-person' : 'neutral';

    // 2. Identify Intent
    let intent: QueryAnalysis['intent'] = 'general';
    const lower = raw.toLowerCase();

    if (
      /\b(error|failed|fails|exception|crash|broken|bug|issue|traceback|undefined|nullpointer|status \d{3}|errno)\b/i.test(
        lower
      )
    ) {
      intent = 'troubleshooting';
    } else if (
      /\b(how to|how do i|how can|steps to|guide|connect .* how|setup|install|configure)\b/i.test(
        lower
      ) ||
      /how\s*$/i.test(lower)
    ) {
      intent = 'how-to';
    } else if (/\b(difference between|vs|versus|compare|pros and cons|better than)\b/i.test(lower)) {
      intent = 'comparison';
    } else if (/\b(review|optimize|refactor|clean up|improve performance)\b/i.test(lower)) {
      intent = 'code-review';
    } else if (/\b(what is|explain|why does|how does|understanding|concept of)\b/i.test(lower)) {
      intent = 'explanation';
    }

    // 3. Extract technical entities (with high confidence typo awareness)
    const technicalEntities: string[] = [];
    for (const [typo, correct] of Object.entries(HIGH_CONFIDENCE_ENTITIES)) {
      const regex = new RegExp(`\\b${typo}\\b`, 'i');
      if (regex.test(raw)) {
        if (!technicalEntities.includes(correct)) {
          technicalEntities.push(correct);
        }
      }
    }

    // 4. Extract uncertainty phrases
    const uncertaintyPhrases: string[] = [];
    for (const p of UNCERTAINTY_PATTERNS) {
      const matches = raw.match(p);
      if (matches) {
        matches.forEach((m) => {
          if (!uncertaintyPhrases.includes(m.trim())) {
            uncertaintyPhrases.push(m.trim());
          }
        });
      }
    }

    // 5. Extract deadlines and urgency
    let deadlines: string | undefined;
    let urgency: 'low' | 'medium' | 'high' = 'low';
    for (const p of URGENCY_PATTERNS) {
      const match = raw.match(p);
      if (match) {
        if (/asap|urgent|outage|critical|p0|emergency/i.test(match[0])) {
          urgency = 'high';
        } else {
          urgency = 'medium';
          deadlines = match[0].trim();
        }
      }
    }

    // 6. Extract constraints and exclusions
    const constraints: string[] = [];
    const exclusions: string[] = [];
    for (const p of CONSTRAINT_PATTERNS) {
      const matches = raw.match(p);
      if (matches) {
        matches.forEach((m) => {
          const trimmed = m.trim();
          if (/^without|^no\s|^do not\s+use|^don't\s+use/i.test(trimmed)) {
            exclusions.push(trimmed);
          } else {
            constraints.push(trimmed);
          }
        });
      }
    }

    // 7. Extract numbers and versions
    const numbersAndVersions: string[] = [];
    const verMatches = raw.match(VERSION_REGEX);
    if (verMatches) {
      verMatches.forEach((v) => {
        if (!numbersAndVersions.includes(v.trim())) {
          numbersAndVersions.push(v.trim());
        }
      });
    }

    // 8. Extract filenames and paths
    const filenamesAndPaths: string[] = [];
    const fnMatches = raw.match(FILENAME_REGEX);
    if (fnMatches) {
      fnMatches.forEach((fn) => {
        if (!filenamesAndPaths.includes(fn.trim())) {
          filenamesAndPaths.push(fn.trim());
        }
      });
    }

    // 9. Extract code commands and quotes
    const codeOrCommands: string[] = [];
    const cmdMatches = raw.match(CODE_CMD_REGEX);
    if (cmdMatches) {
      cmdMatches.forEach((c) => {
        const clean = c.replace(/`/g, '').trim();
        if (!codeOrCommands.includes(clean)) {
          codeOrCommands.push(clean);
        }
      });
    }

    const quotedText: string[] = [];
    const quoteMatches = raw.match(QUOTED_REGEX);
    if (quoteMatches) {
      quoteMatches.forEach((q) => {
        const clean = q.replace(/^["']|["']$/g, '').trim();
        if (!quotedText.includes(clean)) {
          quotedText.push(clean);
        }
      });
    }

    // 10. Extract multiple problems & symptoms
    const symptoms: string[] = [];
    const facts: string[] = [];
    const hypotheses: string[] = [];
    const secondaryProblems: string[] = [];
    let primaryProblem: string | undefined;

    // Check for multiple co-occurring issues (e.g., "login 401 and avatar 404", "cpu high and page slow")
    const splitIssues = raw.split(/\b(?:and also|also|as well as|and(?:\s+the)?)\b/i);
    if (splitIssues.length > 1) {
      primaryProblem = splitIssues[0].trim();
      for (let i = 1; i < splitIssues.length; i++) {
        const secondary = splitIssues[i].trim();
        if (secondary.length > 3) {
          secondaryProblems.push(secondary);
        }
      }
    } else {
      primaryProblem = raw;
    }

    // Categorize facts vs hypotheses
    if (uncertaintyPhrases.length > 0) {
      hypotheses.push(...uncertaintyPhrases);
    }
    if (numbersAndVersions.length > 0) {
      facts.push(...numbersAndVersions);
    }

    // 11. Goals
    const goals: string[] = [];
    const goalMatch = raw.match(
      /\b(?:want to|need to|trying to|goal is|how to|in order to)\s+([^.,;\n]+)/i
    );
    if (goalMatch) {
      goals.push(goalMatch[1].trim());
    } else if (intent === 'how-to') {
      goals.push(raw);
    }

    // 12. Evaluate clarity and determine recommended Depth Level
    // Check if query is already grammatically solid and clear
    const wordCount = raw.split(/\s+/).length;
    const hasPunctuation = /[?.!]$/.test(raw);
    const hasBrokenGrammar =
      /\b(how connect|me want|fix why|do how|pls|plz|thx|cant|dont|wont|is not work)\b/i.test(raw);
    const hasSpeechNoise = FILLER_WORDS_REGEX.test(raw);

    const isClearAlready =
      wordCount >= 6 &&
      hasPunctuation &&
      !hasBrokenGrammar &&
      !hasSpeechNoise &&
      !/how\s*$/i.test(raw) &&
      !raw.includes('???');

    let detectedDepth: DepthLevel = 2; // Default structural rebuild
    if (isClearAlready) {
      detectedDepth = 1; // Light cleanup only, do not over-rewrite!
    } else if (/^(what|how|why)\s*$/i.test(raw) || raw.length < 5) {
      detectedDepth = 4; // Minimal clarification needed
    } else if (/how\s*$/i.test(raw) || !raw.includes(' ') || raw.split(/\s+/).length <= 4) {
      detectedDepth = 3; // Implicit intent clarified
    }

    const isAmbiguous = detectedDepth === 4 || raw.trim().length <= 3;

    return {
      raw,
      intent,
      perspective,
      primaryProblem,
      secondaryProblems,
      symptoms,
      facts,
      hypotheses,
      goals,
      constraints,
      exclusions,
      deadlines,
      urgency,
      uncertaintyPhrases,
      technicalEntities,
      numbersAndVersions,
      filenamesAndPaths,
      codeOrCommands,
      quotedText,
      detectedDepth,
      isClearAlready,
      isAmbiguous,
    };
  }

  /**
   * Cleans verbal filler noise and common speech-to-text artifacts
   */
  public static cleanNoise(text: string): string {
    return text
      .replace(FILLER_WORDS_REGEX, ' ')
      .replace(/\s*,\s*,+/g, ',')
      .replace(/\s{2,}/g, ' ')
      .replace(/^[,\s?]+|[,\s]+$/g, '')
      .trim();
  }

  /**
   * Applies confident technical typo corrections without altering ambiguous words
   */
  public static applyConfidentEntityCorrections(text: string): string {
    let result = text;
    for (const [typo, correct] of Object.entries(HIGH_CONFIDENCE_ENTITIES)) {
      const regex = new RegExp(`\\b${typo}\\b`, 'gi');
      result = result.replace(regex, correct);
    }
    return result;
  }
}
