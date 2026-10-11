/**
 * AI Query Intelligence - Core Types
 */

export type PipelineStage =
  | 'IDLE'
  | 'CAPTURED'
  | 'ANALYZING'
  | 'RECONSTRUCTING'
  | 'VALIDATING'
  | 'COMPLETED'
  | 'EDITING'
  | 'COPIED'
  | 'INSERTED'
  | 'ERROR'
  | 'CLARIFICATION_REQUIRED';

export type HonestStage = 'analyzing' | 'reconstructing' | 'validating' | 'done';

export type DepthLevel = 1 | 2 | 3 | 4;

export type ProviderType = 'ollama' | 'openai-compatible';

export type AskAiTarget = 'chatgpt' | 'claude' | 'gemini' | 'perplexity' | 'copilot' | 'custom';

export type InsertionMethod = 'auto' | 'execCommand' | 'inputEvent' | 'clipboard';

export interface ProviderConfig {
  provider: ProviderType;
  endpoint: string;
  model: string;
  apiKey?: string;
  maxTokens: number;
  temperature: number;
  timeoutMs: number;
  retries: number;
}

export interface ExtensionSettings {
  // Provider settings
  providerConfig: ProviderConfig;

  // Reconstruction behavior
  depthLevel: DepthLevel;
  preserveVoice: boolean;
  clarificationBehavior: 'inline' | 'ask';
  validatePreservation: boolean;

  // Privacy & Safety
  historyEnabled: boolean;
  localOnlyMode: boolean;
  showRemoteWarning: boolean;
  hasAcknowledgedRemoteWarning: boolean;
  pauseExtension: boolean;

  // UI & Integration
  theme: 'dark' | 'light' | 'system';
  overlayPosition?: { x: number; y: number };
  defaultAskAiTarget: AskAiTarget;
  customAiUrl?: string;
  insertionMethod: InsertionMethod;
  shortcut: string;
  debugLogging: boolean;
}

export interface QueryAnalysis {
  raw: string;
  intent: 'troubleshooting' | 'how-to' | 'explanation' | 'code-review' | 'comparison' | 'general';
  perspective: 'first-person' | 'third-person' | 'neutral';
  primaryProblem?: string;
  secondaryProblems: string[];
  symptoms: string[];
  facts: string[];
  hypotheses: string[];
  goals: string[];
  constraints: string[];
  exclusions: string[];
  deadlines?: string;
  urgency?: 'low' | 'medium' | 'high';
  uncertaintyPhrases: string[];
  technicalEntities: string[];
  numbersAndVersions: string[];
  filenamesAndPaths: string[];
  codeOrCommands: string[];
  quotedText: string[];
  detectedDepth: DepthLevel;
  isClearAlready: boolean;
  isAmbiguous: boolean;
}

export interface ValidationResult {
  valid: boolean;
  missingPreservations: string[];
  inventedCausality: boolean;
  wrongDirection: boolean; // True if it turns user's request into a question asking user what to do
  overRewritten: boolean;
  entityCorruption: boolean;
  notes: string[];
}

export interface ReconstructionResult {
  id: string;
  originalQuery: string;
  reconstructedQuery: string;
  analysis: QueryAnalysis;
  validation: ValidationResult;
  clarificationOptions?: string[];
  providerId: string;
  modelUsed: string;
  isLocal: boolean;
  durationMs: number;
  timestamp: number;
  requiresClarification: boolean;
}

export interface HistoryItem {
  id: string;
  timestamp: number;
  originalQuery: string;
  reconstructedQuery: string;
  provider: string;
  model: string;
  url?: string;
  pageTitle?: string;
  depthLevel: DepthLevel;
}

export interface ConnectionTestResult {
  ok: boolean;
  message: string;
  latencyMs?: number;
  availableModels?: string[];
  isLocal: boolean;
}

export const DEFAULT_SETTINGS: ExtensionSettings = {
  providerConfig: {
    provider: 'ollama',
    endpoint: 'http://localhost:11434',
    model: 'qwen2.5:14b', // Standard high quality Ollama model (Qwen 14B / 8B / 3.x compatible)
    apiKey: '',
    maxTokens: 1024,
    temperature: 0.2, // Low temperature for deterministic, faithful reconstruction
    timeoutMs: 15000,
    retries: 1,
  },
  depthLevel: 2,
  preserveVoice: true,
  clarificationBehavior: 'inline',
  validatePreservation: true,
  historyEnabled: true,
  localOnlyMode: false,
  showRemoteWarning: true,
  hasAcknowledgedRemoteWarning: false,
  pauseExtension: false,
  theme: 'dark',
  defaultAskAiTarget: 'chatgpt',
  customAiUrl: 'https://chat.openai.com/?q=',
  insertionMethod: 'auto',
  shortcut: 'Ctrl+Shift+Space',
  debugLogging: false,
};
