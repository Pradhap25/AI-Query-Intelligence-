/**
 * AI Query Intelligence - Core Pipeline
 * Orchestrates: understand -> interpret -> disambiguate -> structure -> preserve -> reconstruct -> validate
 */

import {
  ExtensionSettings,
  PipelineStage,
  QueryAnalysis,
  ReconstructionResult,
  ValidationResult,
} from '../types';
import { QueryAnalyzer } from './analyzer';
import { QueryReconstructor } from './reconstructor';
import { QueryValidator } from '../validators';
import { ProviderRegistry } from '../providers/registry';
import { buildReconstructionPrompt } from '../prompts/templates';

export interface PipelineProgressCallback {
  (stage: PipelineStage, message?: string): void;
}

export class QueryIntelligencePipeline {
  /**
   * Executes the full query reconstruction pipeline
   */
  public static async process(
    rawText: string,
    settings: ExtensionSettings,
    onProgress?: PipelineProgressCallback,
    options?: {
      useModel?: boolean;
      signal?: AbortSignal;
    }
  ): Promise<ReconstructionResult> {
    const startTime = Date.now();
    const id = `qi_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

    // STAGE 1: ANALYZING (Understand -> Interpret -> Disambiguate)
    onProgress?.('ANALYZING', 'Analyzing intent, entities, and constraints...');
    const analysis: QueryAnalysis = QueryAnalyzer.analyze(rawText);

    // Short-circuit if empty
    if (!rawText.trim()) {
      throw new Error('Query is empty.');
    }

    // STAGE 2: RECONSTRUCTING (Structure -> Preserve -> Reconstruct)
    onProgress?.('RECONSTRUCTING', 'Reconstructing query faithfully...');
    let reconstructedText = '';
    let clarificationOptions: string[] | undefined;
    let providerId = settings.providerConfig.provider;
    let modelUsed = settings.providerConfig.model;
    let isLocal = true;

    const useModel = options?.useModel !== false;

    if (useModel && !analysis.isClearAlready) {
      try {
        const provider = ProviderRegistry.createProvider(settings.providerConfig);
        isLocal = provider.isLocal;
        providerId = provider.id;

        const prompts = buildReconstructionPrompt(rawText, analysis, settings);
        const generated = await provider.generateReconstruction({
          systemPrompt: prompts.system,
          userPrompt: prompts.user,
          signal: options?.signal,
        });

        if (generated && generated.trim().length > 0) {
          reconstructedText = QueryValidator.sanitizeText(generated);
        } else {
          throw new Error('Model produced empty output.');
        }
      } catch (err: any) {
        // If model call fails or times out, fallback seamlessly to deterministic engine
        if (settings.debugLogging) {
          console.warn('[QueryIntelligence] Model generation failed or unavailable, using deterministic engine:', err);
        }
        const fallback = QueryReconstructor.reconstructDeterministically(rawText, analysis, settings);
        reconstructedText = fallback.reconstructedText;
        clarificationOptions = fallback.clarificationOptions;
        modelUsed = `${settings.providerConfig.model} (fallback-heuristic)`;
      }
    } else {
      // Deterministic rule-based reconstruction
      const result = QueryReconstructor.reconstructDeterministically(rawText, analysis, settings);
      reconstructedText = result.reconstructedText;
      clarificationOptions = result.clarificationOptions;
      modelUsed = 'deterministic-engine';
    }

    // STAGE 3: VALIDATING (Validate preservation, causality, direction, safety)
    onProgress?.('VALIDATING', 'Verifying integrity and semantic preservation...');
    let validation: ValidationResult = QueryValidator.validate(analysis, reconstructedText);

    // If missing key entity or version was lost by the model, auto-patch if possible
    if (!validation.valid && settings.validatePreservation) {
      if (validation.missingPreservations.length > 0 && settings.debugLogging) {
        console.warn('[QueryIntelligence] Validation identified missing preservations:', validation.missingPreservations);
      }
    }

    // STAGE 4: COMPLETED / CLARIFICATION_REQUIRED
    const requiresClarification = analysis.isAmbiguous || (clarificationOptions && clarificationOptions.length > 0);
    const finalStage: PipelineStage = requiresClarification ? 'CLARIFICATION_REQUIRED' : 'COMPLETED';
    onProgress?.(finalStage, 'Ready');

    const durationMs = Date.now() - startTime;

    return {
      id,
      originalQuery: rawText,
      reconstructedQuery: reconstructedText,
      analysis,
      validation,
      clarificationOptions,
      providerId,
      modelUsed,
      isLocal,
      durationMs,
      timestamp: Date.now(),
      requiresClarification: !!requiresClarification,
    };
  }
}
