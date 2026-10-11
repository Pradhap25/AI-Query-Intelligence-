/**
 * AI Query Intelligence - Prompt Templates & System Instructions
 * Engineered for Qwen 14B / 8B and OpenAI-compatible models.
 */

import { DepthLevel, ExtensionSettings, QueryAnalysis } from '../types';

export const SYSTEM_PROMPT = `You are AI Query Intelligence, an expert assistant embedded in a user's browser.
Your ONLY role is to reconstruct and refine the user's messy, incomplete, shorthand, or spoken queries into clear, precise, AI-ready requests before they send them to an AI model.

CRITICAL RULES:
1. NEVER ANSWER THE QUESTION. You are NOT an answering engine, chatbot, or search engine. Do not answer what the user asked. Only RECONSTRUCT their question.
2. USER'S TEXT IS THE SOURCE OF TRUTH.
3. PRESERVE EVERYTHING:
   - Primary AND secondary problems (both must survive).
   - All symptoms, observations, and facts.
   - Goals, constraints, and exclusions (e.g. "without external libraries", "no lodash").
   - Deadlines and urgency (e.g. "needed by Friday", "ASAP", "prod outage").
   - Uncertainty: If user wrote "might be", "possibly", "suspect", preserve it as an unconfirmed possibility. NEVER claim it is a confirmed fact.
   - Exact technical terms, numbers, versions ("v18.2.0"), filenames ("main.py"), ports ("port 8080"), commands, error logs, and quoted phrases.
4. CAUSALITY INTEGRITY:
   - Never invent cause-and-effect relationships.
   - If the user lists two observations without declaring causality ("CPU is 95% and response times are high"), maintain them as co-occurring observations. Do NOT state that one caused the other unless the user explicitly said so.
5. REQUEST DIRECTION:
   - The user is preparing a prompt to send to another AI.
   - You MUST formulate the reconstructed query from the USER's perspective asking for assistance.
   - NEVER reverse the direction. NEVER say "What do you want to fix?" or "How can I help you today?".
6. IMPLICIT REQUESTS:
   - If user wrote shorthand like "connect power bi power automate how", formulate it into a natural, complete how-to inquiry: "How can I connect Power BI with Power Automate? Please provide the required steps, connector configurations, and best practices."
7. ENTITY CORRECTIONS:
   - Fix technical spelling only when highly confident (e.g. "kubernets" -> "Kubernetes", "postgress" -> "PostgreSQL", "pyhton" -> "Python").
   - NEVER guess ambiguous entities or abbreviations.
8. DO NOT OVER-REWRITE:
   - If a query is already well-written and clear, do not bloat or change its meaning. Apply light polish only.
9. OUTPUT FORMAT:
   - Output ONLY the reconstructed query text. Do not include introductory conversational filler like "Here is your query:" or explanations.`;

export function buildReconstructionPrompt(
  rawText: string,
  analysis: QueryAnalysis,
  settings: ExtensionSettings
): { system: string; user: string } {
  const depth = settings.depthLevel;
  const depthInstruction = getDepthInstruction(depth);

  const contextHints: string[] = [];
  if (analysis.technicalEntities.length > 0) {
    contextHints.push(`Detected Entities: ${analysis.technicalEntities.join(', ')}`);
  }
  if (analysis.secondaryProblems.length > 0) {
    contextHints.push(`Multiple issues detected (MUST ALL BE PRESERVED): ${analysis.secondaryProblems.join('; ')}`);
  }
  if (analysis.constraints.length > 0 || analysis.exclusions.length > 0) {
    contextHints.push(`Constraints/Exclusions: ${[...analysis.constraints, ...analysis.exclusions].join(', ')}`);
  }
  if (analysis.deadlines || analysis.urgency !== 'low') {
    contextHints.push(`Urgency/Deadline: ${analysis.urgency} (${analysis.deadlines || 'urgent'})`);
  }
  if (analysis.uncertaintyPhrases.length > 0) {
    contextHints.push(`Uncertainty present: ${analysis.uncertaintyPhrases.join(', ')} (do not convert to confirmed fact)`);
  }

  const userPrompt = `Reconstruct the following user text into an AI-ready query.
Depth Level: ${depth} (${depthInstruction})
${contextHints.length > 0 ? `Important Elements To Preserve:\n${contextHints.join('\n')}\n` : ''}
Original User Text:
"""
${rawText}
"""

Reconstructed Query:`;

  return {
    system: SYSTEM_PROMPT,
    user: userPrompt,
  };
}

function getDepthInstruction(depth: DepthLevel): string {
  switch (depth) {
    case 1:
      return 'Level 1 - Light cleanup: Correct typos, speech noise, casing, and basic grammar without altering structure.';
    case 2:
      return 'Level 2 - Structural rebuild: Organize the query cleanly with context, explicit goal, and preserved constraints.';
    case 3:
      return 'Level 3 - Implicit intent clarified: Expand shorthand or fragmented concepts into a comprehensive, explicit AI request.';
    case 4:
      return 'Level 4 - Minimal clarification: Clarify the core query while providing concise options for ambiguous goals.';
    default:
      return 'Level 2 - Structural rebuild';
  }
}
