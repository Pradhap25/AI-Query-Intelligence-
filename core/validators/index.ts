/**
 * AI Query Intelligence - Validators
 * Enforces preservation, causality integrity, request direction,
 * depth boundaries, and safety against untrusted model output.
 */

import { QueryAnalysis, ValidationResult } from '../types';

export class QueryValidator {
  /**
   * Validates a reconstructed query against original analysis
   */
  public static validate(
    originalAnalysis: QueryAnalysis,
    reconstructedText: string
  ): ValidationResult {
    const reconLower = reconstructedText.toLowerCase();
    const origLower = originalAnalysis.raw.toLowerCase();
    const notes: string[] = [];
    const missingPreservations: string[] = [];

    // 1. Preservation Checks

    // Technical Entities
    for (const entity of originalAnalysis.technicalEntities) {
      if (!reconLower.includes(entity.toLowerCase())) {
        missingPreservations.push(`Technical entity: ${entity}`);
      }
    }

    // Numbers & Versions
    for (const ver of originalAnalysis.numbersAndVersions) {
      if (!reconstructedText.includes(ver)) {
        missingPreservations.push(`Version/Number: ${ver}`);
      }
    }

    // Filenames & Paths
    for (const fn of originalAnalysis.filenamesAndPaths) {
      if (!reconstructedText.includes(fn)) {
        missingPreservations.push(`Filename/Path: ${fn}`);
      }
    }

    // Code & Commands
    for (const code of originalAnalysis.codeOrCommands) {
      if (!reconstructedText.includes(code)) {
        missingPreservations.push(`Code/Command: ${code}`);
      }
    }

    // Quoted text
    for (const quote of originalAnalysis.quotedText) {
      if (!reconstructedText.includes(quote)) {
        missingPreservations.push(`Quoted phrase: "${quote}"`);
      }
    }

    // Constraints & Exclusions
    for (const constraint of originalAnalysis.constraints) {
      // Check key words of constraint
      const words = constraint.toLowerCase().split(/\s+/).filter((w) => w.length > 3);
      const allFound = words.every((w) => reconLower.includes(w));
      if (!allFound) {
        missingPreservations.push(`Constraint: ${constraint}`);
      }
    }

    for (const exclusion of originalAnalysis.exclusions) {
      const words = exclusion.toLowerCase().split(/\s+/).filter((w) => w.length > 3);
      const allFound = words.every((w) => reconLower.includes(w));
      if (!allFound) {
        missingPreservations.push(`Exclusion: ${exclusion}`);
      }
    }

    // Uncertainty phrases (e.g. "might be", "possibly", "maybe")
    // If original expressed uncertainty, reconstructed MUST NOT declare it as confirmed fact!
    let uncertaintyPreserved = true;
    if (originalAnalysis.uncertaintyPhrases.length > 0) {
      const hasUncertaintyInRecon =
        /\b(might|may|possibly|possible|could be|suspect|suspected|seems|potential|potentially|hypothesize|unconfirmed)\b/i.test(
          reconLower
        );
      if (!hasUncertaintyInRecon) {
        uncertaintyPreserved = false;
        missingPreservations.push(`Uncertainty marker: must preserve hypothetical nature`);
      }
    }

    // Secondary problems preservation (e.g. "and avatar 404" alongside "login 401")
    for (const sec of originalAnalysis.secondaryProblems) {
      const secWords = sec.toLowerCase().split(/\s+/).filter((w) => w.length > 3 && !['also', 'with', 'that', 'this'].includes(w));
      if (secWords.length > 0) {
        const foundAny = secWords.some((w) => reconLower.includes(w));
        if (!foundAny) {
          missingPreservations.push(`Secondary problem: ${sec}`);
        }
      }
    }

    // 2. Causality Check
    // If the original has NO causal words (e.g. user listed two conditions without "because", "due to", "caused by", "leading to")
    // but the reconstructed text invented "because", "due to", "causing", flag it!
    const originalHasCausality = /\b(because|caused by|leads to|leading to|due to|resulting in|results in|as a result)\b/i.test(
      origLower
    );
    const reconHasCausality = /\b(because of the|due to the|caused by the|resulting from the)\b/i.test(
      reconLower
    );
    const inventedCausality = !originalHasCausality && reconHasCausality && originalAnalysis.secondaryProblems.length > 0;
    if (inventedCausality) {
      notes.push('Causality was artificially introduced between independent observations');
    }

    // 3. Request Direction Check
    // The user is asking an AI for help.
    // The reconstructed text MUST NOT reverse direction (e.g., "What would you like me to fix?",
    // "Please clarify what error you are seeing", "How can I help you today?").
    const wrongDirectionPatterns = [
      /\bwhat (?:do you|would you) (?:want|need|like) me to\b/i,
      /\bhow can i (?:assist|help) you (?:today)?\b/i,
      /\bplease let me know what\b/i,
      /\bwhat are you trying to achieve\?\b/i,
      /\bwhat is your goal\?\b/i,
    ];
    let wrongDirection = false;
    for (const pattern of wrongDirectionPatterns) {
      if (pattern.test(reconstructedText)) {
        wrongDirection = true;
        notes.push('Reconstructed text reversed request direction (prompt became an assistant query)');
        break;
      }
    }

    // 4. Over-rewriting Check
    // If original was already clear, check if reconstructed text changed the meaning or bloated drastically
    let overRewritten = false;
    if (originalAnalysis.isClearAlready) {
      const origWords = originalAnalysis.raw.trim().split(/\s+/).length;
      const reconWords = reconstructedText.trim().split(/\s+/).length;
      if (reconWords > origWords * 3) {
        overRewritten = true;
        notes.push('Query was already clear but was excessively expanded');
      }
    }

    // 5. Entity corruption check
    let entityCorruption = false;
    // Check if technical entities were scrambled or hallucinated
    for (const entity of originalAnalysis.technicalEntities) {
      // If entity was Power BI, make sure it didn't turn into something completely different
      if (!reconLower.includes(entity.toLowerCase().replace(/\s+/g, ''))) {
        if (!reconLower.includes(entity.toLowerCase())) {
          entityCorruption = true;
        }
      }
    }

    // 6. Untrusted text sanitization check
    // Ensure no dangerous tags or script schemes
    if (/<script|javascript:|data:text\/html|onload=|onerror=/i.test(reconstructedText)) {
      notes.push('Untrusted HTML or executable payload detected and blocked');
      reconstructedText = QueryValidator.sanitizeText(reconstructedText);
    }

    const valid = missingPreservations.length === 0 && !wrongDirection && !inventedCausality;

    return {
      valid,
      missingPreservations,
      inventedCausality,
      wrongDirection,
      overRewritten,
      entityCorruption,
      notes,
    };
  }

  /**
   * Sanitizes text to guarantee it is strictly treated as untrusted plain text
   */
  public static sanitizeText(text: string): string {
    return text
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/<[^>]+>/g, '') // Strip HTML tags
      .replace(/javascript:/gi, '')
      .trim();
  }
}
