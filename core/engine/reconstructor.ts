/**
 * AI Query Intelligence - Reconstructor
 * Implements deterministic rule-based query reconstruction as well as
 * synthesis with model outputs, strictly adhering to all engine rules.
 */

import { DepthLevel, ExtensionSettings, QueryAnalysis } from '../types';
import { QueryAnalyzer } from './analyzer';
import { QueryValidator } from '../validators';

export class QueryReconstructor {
  /**
   * Deterministic reconstruction engine.
   * Can run completely offline, without dependencies or network requests.
   */
  public static reconstructDeterministically(
    rawText: string,
    analysis: QueryAnalysis,
    settings: ExtensionSettings
  ): { reconstructedText: string; clarificationOptions?: string[] } {
    const depth = settings.depthLevel;

    // Depth 1: Light cleanup only
    if (depth === 1 || analysis.isClearAlready) {
      return { reconstructedText: this.lightCleanup(rawText, analysis) };
    }

    // Depth 4: Minimal clarification needed (if query is fundamentally ambiguous)
    if (depth === 4 || analysis.isAmbiguous) {
      return this.handleClarificationNeeded(rawText, analysis);
    }

    // Clean verbal noise and apply confident entity typos
    let cleaned = QueryAnalyzer.cleanNoise(rawText);
    cleaned = QueryAnalyzer.applyConfidentEntityCorrections(cleaned);

    // Check for implicit how-to requests (e.g. "connect power bi power automate how")
    if (analysis.intent === 'how-to' && (/how\s*$/i.test(cleaned) || /^(?:how to|how)\s+/i.test(cleaned) || !cleaned.includes('?'))) {
      return { reconstructedText: this.reconstructHowTo(cleaned, analysis) };
    }

    // Check for generic help requests ("I need help fixing this query")
    if (/^i need help (?:fixing|with|debugging)\s+(?:this|my)\s+(?:query|issue|code|bug)/i.test(cleaned)) {
      return { reconstructedText: this.reconstructHelpRequest(cleaned, analysis) };
    }

    // Depth 2 or 3: Structural Rebuild / Implicit Intent Clarified
    return { reconstructedText: this.structuralRebuild(cleaned, analysis, depth) };
  }

  /**
   * Depth 1: Light cleanup (preserves original structure, fixes typos & punctuation)
   */
  private static lightCleanup(raw: string, analysis: QueryAnalysis): string {
    let text = QueryAnalyzer.cleanNoise(raw);
    text = QueryAnalyzer.applyConfidentEntityCorrections(text);

    // Capitalize first letter
    if (text.length > 0) {
      text = text.charAt(0).toUpperCase() + text.slice(1);
    }

    // Ensure ending punctuation
    if (!/[.?!]$/.test(text)) {
      text += text.toLowerCase().startsWith('how') || text.toLowerCase().startsWith('what') || text.toLowerCase().startsWith('why')
        ? '?'
        : '.';
    }

    return text;
  }

  /**
   * Reconstructs implicit or shorthand how-to queries
   * e.g., "connect power bi power automate how" -> "How can I connect Power BI with Power Automate?..."
   */
  private static reconstructHowTo(text: string, analysis: QueryAnalysis): string {
    // Strip trailing or leading 'how' and punctuation
    let core = text.replace(/how\s*$/i, '').replace(/^(?:how to|how)\s+/i, '').replace(/^[,\s]+|[,\s]+$/g, '').trim();

    // Check if entities like Power BI and Power Automate are in it
    if (analysis.technicalEntities.length >= 2 && core.toLowerCase().includes('connect')) {
      const e1 = analysis.technicalEntities[0];
      const e2 = analysis.technicalEntities[1];
      let recon = `How do I connect ${e1} with ${e2}? Please provide step-by-step instructions, authentication prerequisites, and common integration patterns.`;
      return this.appendConstraintsAndDeadlines(recon, analysis);
    }

    // General how-to reconstruction
    let subject = core;
    if (subject.toLowerCase().startsWith('to ')) {
      subject = subject.slice(3).trim();
    }
    let recon = `How do I ${subject}? Please explain the standard approach with an example.`;
    return this.appendConstraintsAndDeadlines(recon, analysis);
  }

  /**
   * Reconstructs help requests ensuring the request direction stays from user to AI
   */
  private static reconstructHelpRequest(text: string, analysis: QueryAnalysis): string {
    let detail = text.replace(/^i need help (?:fixing|with|debugging)\s+(?:this|my)\s+/i, '').trim();
    if (!detail) {
      detail = 'the issue described below';
    }

    let recon = `I need assistance troubleshooting and resolving an issue with ${detail}. Please review the details below, identify potential root causes, and provide recommended fixes:`;
    return this.appendConstraintsAndDeadlines(recon, analysis);
  }

  /**
   * Depth 2 & 3: Structural Rebuild
   */
  private static structuralRebuild(
    cleaned: string,
    analysis: QueryAnalysis,
    depth: DepthLevel
  ): string {
    // If multiple problems exist, structure them distinctly without inventing causality
    if (analysis.secondaryProblems.length > 0) {
      const parts: string[] = [];
      parts.push(`I am encountering multiple related issues:`);
      parts.push(`1. Primary issue: ${this.cleanSentence(analysis.primaryProblem || cleaned)}.`);
      analysis.secondaryProblems.forEach((sec, idx) => {
        parts.push(`${idx + 2}. Secondary issue: ${this.cleanSentence(sec)}.`);
      });

      if (analysis.uncertaintyPhrases.length > 0) {
        parts.push(`Note: It is currently suspected that this ${analysis.uncertaintyPhrases[0]}, though this is unconfirmed.`);
      }

      parts.push(`How can I systematically diagnose and resolve both issues?`);
      let combined = parts.join('\n');
      return this.appendConstraintsAndDeadlines(combined, analysis);
    }

    // Single issue / general structural rebuild
    let sentence = this.cleanSentence(cleaned);
    let recon = '';

    if (analysis.intent === 'troubleshooting') {
      recon = `I am experiencing an issue where: ${sentence}. How can I identify the root cause and resolve it?`;
    } else if (analysis.intent === 'comparison') {
      recon = `Can you provide a structured comparison of: ${sentence}? Please cover advantages, disadvantages, and typical use cases for each.`;
    } else if (analysis.intent === 'code-review') {
      recon = `Please review and optimize the following implementation: ${sentence}. Focus on performance, maintainability, and best practices.`;
    } else {
      recon = sentence;
      if (!/[.?!]$/.test(recon)) {
        recon += '.';
      }
    }

    return this.appendConstraintsAndDeadlines(recon, analysis);
  }

  /**
   * Depth 4: Handles ambiguous queries with minimal clarification
   */
  private static handleClarificationNeeded(
    raw: string,
    analysis: QueryAnalysis
  ): { reconstructedText: string; clarificationOptions: string[] } {
    const cleaned = QueryAnalyzer.applyConfidentEntityCorrections(raw.trim());
    let promptDraft = `Please clarify your request regarding "${cleaned}".`;
    const options: string[] = [
      `How do I install and configure ${cleaned}?`,
      `How do I troubleshoot a common error with ${cleaned}?`,
      `What is an architectural overview and best practices for ${cleaned}?`,
    ];

    return {
      reconstructedText: promptDraft,
      clarificationOptions: options,
    };
  }

  /**
   * Appends constraints, exclusions, and deadlines without corrupting causality
   */
  private static appendConstraintsAndDeadlines(
    baseQuery: string,
    analysis: QueryAnalysis
  ): string {
    const additions: string[] = [];

    if (analysis.constraints.length > 0) {
      additions.push(`Constraints: Must adhere to ${analysis.constraints.join(', ')}.`);
    }

    if (analysis.exclusions.length > 0) {
      additions.push(`Exclusions: Please ensure ${analysis.exclusions.join(', ')}.`);
    }

    if (analysis.deadlines) {
      additions.push(`Timeline: Needs to be resolved ${analysis.deadlines}.`);
    } else if (analysis.urgency === 'high') {
      additions.push(`Priority: High priority / urgent resolution requested.`);
    }

    if (additions.length === 0) {
      return baseQuery;
    }

    return `${baseQuery}\n\n${additions.join('\n')}`;
  }

  private static cleanSentence(text: string): string {
    let s = text.trim();
    if (s.length > 0) {
      s = s.charAt(0).toUpperCase() + s.slice(1);
    }
    return s.replace(/[.?!]+$/, '');
  }
}
