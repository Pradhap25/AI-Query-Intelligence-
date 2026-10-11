# Release & Store Publishing Guide

This document outlines the store listing metadata, permission justifications, packaging instructions, and submission checklist for publishing **AI Query Intelligence** to the **Chrome Web Store** and **Microsoft Edge Add-ons**.

---

## 1. Store Listing Information

### Extension Name
**AI Query Intelligence**

### Short Description (max 132 characters)
*Reconstruct messy, broken, or shorthand queries into clear, precise, AI-ready requests directly inside your favorite web apps.*

### Category
**Productivity** / **Developer Tools**

### Detailed Description
```text
Say what you mean, more clearly, before sending it to an AI.

Users often type with broken English, spelling mistakes, shorthand, fragments, speech-to-text noise, or incomplete thoughts. AI Query Intelligence understands your intended meaning and faithfully reconstructs it into a natural, precise, AI-ready request.

KEY HIGHLIGHTS:
✓ It is NOT a chatbot or answer engine: It never answers your question—it reconstructs your query so downstream AI models (ChatGPT, Claude, Gemini, Perplexity) give you accurate results on the first attempt.
✓ Runs directly on the page: A lightweight floating overlay appears in a Shadow DOM right near your text cursor. No full-screen dashboards, no tab switching.
✓ 100% Local Inference & Privacy: Connects by default to Ollama (http://localhost:11434) running Qwen 14B or 8B. Your text never leaves your device.
✓ Preserves Technical Details: Never drops error codes, versions, filenames, code snippets, or constraints.
✓ Smart Insertion: Replaces your selection or inserts at your cursor in ChatGPT, Claude, Gemini, Google Docs, Gmail, and any web form.
✓ Keyboard Friendly: Trigger instantly with Ctrl+Shift+Space (Cmd+Shift+Space on Mac) or right-click. Press Esc to dismiss.

HOW IT WORKS:
1. Select text or focus an input box on any page.
2. Press Ctrl+Shift+Space or right-click "Reconstruct query".
3. The floating panel appears showing honest progress: Analyzing -> Reconstructing -> Validating -> Done.
4. Click [Insert / Replace] to insert into your document, or [Ask AI] to open ChatGPT, Claude, Gemini, or Perplexity with your prompt pre-filled!

PRIVACY GUARANTEE:
- Default: Local inference via Ollama.
- Zero analytics, zero telemetry, zero tracking.
- Local history stored exclusively in your browser.
```

---

## 2. Store Screenshot Specifications

Prepare the following 1280x800 PNG screenshots for the store listing:

1. **Screenshot 1: The Core User Flow**  
   *Caption:* Reconstruct messy, shorthand queries into clear, structured AI prompts with Ctrl+Shift+Space.
2. **Screenshot 2: Smart Insertion in ChatGPT & Claude**  
   *Caption:* Seamless insertion into rich-text editors and input fields without leaving the page.
3. **Screenshot 3: Honest Pipeline & Local Inference**  
   *Caption:* Transparent progress indicators with on-device local inference via Ollama (Qwen 14B / 8B).
4. **Screenshot 4: Multiple Issue & Constraint Preservation**  
   *Caption:* Both primary and secondary problems survive without invented causality.
5. **Screenshot 5: Comprehensive Privacy & History Controls**  
   *Caption:* Full control over query history with zero cloud uploads or telemetry.

---

## 3. Store Reviewer Permission Justifications

When submitting to the Chrome Web Store and Edge Add-ons Developer Dashboards, provide the following justifications:

| Permission | Justification for Reviewers |
| :--- | :--- |
| **`activeTab`** | Required to read the currently selected text and calculate coordinates to place the floating panel directly adjacent to the user's cursor when explicitly triggered. |
| **`storage`** | Required to persist user preferences (chosen local model, depth level, theme) and optional local query history exclusively on the user's machine. |
| **`contextMenus`** | Required to provide the right-click "Reconstruct query with AI Query Intelligence" context menu item for selected or editable text. |
| **`scripting`** | Required to inject the content script onto active tabs when triggered via the global keyboard shortcut (`Ctrl+Shift+Space`). |
| **`notifications`** | Required to alert the user if they attempt to trigger reconstruction on protected browser internal pages (`chrome://`, `edge://`, or Web Store) where extensions are restricted by browser policy. |
| **`host_permissions`** (`http://localhost:*`, `http://127.0.0.1:*`) | Required solely to communicate via HTTP with the user's local inference engine (Ollama or LM Studio) running on port 11434, 1234, or 8000. |

---

## 4. Packaging the Extension

Run the packaging script to generate the production ZIP file:

```bash
npm run package
```

This command:
1. Runs `esbuild` with minification enabled.
2. Validates all required bundle files (`manifest.json`, `background.js`, `content.js`, `popup.html`, `options.html`, `icons/`).
3. Compresses the `/dist` directory into `ai-query-intelligence-v1.0.0.zip`.

---

## 5. Submission Checklist

- [x] All 35 automated unit and regression tests pass (`npm test`).
- [x] Production build is minified and free of debug console statements.
- [x] Icons are provided in 16x16, 48x48, and 128x128 formats.
- [x] Manifest V3 compliance verified (no remote code, no `eval`, strict CSP).
- [x] Privacy policy hosted and linked.
- [x] ZIP package tested via Developer Mode unpacked loading.
- [x] Store listing descriptions and permission justifications prepared.
