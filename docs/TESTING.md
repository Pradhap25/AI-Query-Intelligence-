# Testing & Quality Assurance Guide

## Automated Test Suites

The codebase includes comprehensive unit and regression tests written in **Vitest**, verifying every rule defined in the specification.

### Running Automated Tests
```bash
# Run all unit and regression test suites
npm test

# Run tests in watch mode during development
npm run test:watch
```

### Test Coverage Summary

| Test Suite | Purpose | Tests | Status |
| :--- | :--- | :---: | :---: |
| `tests/unit/analyzer.test.ts` | Intent detection, technical entity extraction, uncertainty markers, constraints, filenames, versions, speech filler removal | 6 | **PASS** |
| `tests/unit/reconstructor.test.ts` | Depth levels 1–4, light cleanup, structural rebuild, implicit intent expansion, clarification generation | 5 | **PASS** |
| `tests/unit/validators.test.ts` | Semantic preservation checks, invented causality detection, request direction reversal detection, untrusted script sanitization | 4 | **PASS** |
| `tests/unit/providers.test.ts` | OllamaProvider & OpenAICompatibleProvider endpoints, local vs remote detection, registry creation | 3 | **PASS** |
| `tests/unit/insertion.test.ts` | Textarea replacement, input selection replacement, contenteditable execCommand insertion, clipboard fallback | 4 | **PASS** |
| `tests/unit/overlay-shadow-dom.test.ts` | Shadow DOM style encapsulation, honest 4-stage progression, keyboard accessibility, pause mode toggle | 3 | **PASS** |
| `tests/regression/engine-rules.test.ts` | Comprehensive regression suite covering all Section 9.A edge cases | 10 | **PASS** |
| **Total** | | **35** | **100% PASS** |

---

## Manual Test Checklist for Target Web Applications

Ensure the extension is loaded in Developer Mode (`/dist`) before executing this checklist.

### 1. ChatGPT (`https://chatgpt.com`)
- [ ] Open a new chat in ChatGPT.
- [ ] In the prompt textarea, type: `connect power bi power automate how`
- [ ] Select the text and press **`Ctrl + Shift + Space`**.
- [ ] **Verify**: Floating panel appears directly near the input box.
- [ ] **Verify**: Progression displays: *Analyzing -> Reconstructing -> Validating -> Done*.
- [ ] **Verify**: Badge displays green **LOCAL** (if using Ollama on localhost).
- [ ] Click **[Insert / Replace]**.
- [ ] **Verify**: The textarea content is replaced with the reconstructed prompt: *"How do I connect Power BI with Power Automate? Please provide step-by-step instructions..."*
- [ ] **Verify**: ChatGPT's React state updates (the Send button activates).
- [ ] Press **Esc** to ensure the panel closes cleanly.

### 2. Claude (`https://claude.ai`)
- [ ] Navigate to Claude's new conversation page.
- [ ] In the ProseMirror contenteditable input, type: `login failing with 401 and avatar returns 404`
- [ ] Right-click and choose **"Reconstruct query with AI Query Intelligence"**.
- [ ] **Verify**: Both issues are preserved as distinct items without inventing causality between them.
- [ ] Click **[Edit]**, add a small note, and click **[Done]**.
- [ ] Click **[Insert / Replace]**.
- [ ] **Verify**: Text is seamlessly inserted into Claude's rich text editor without breaking undo/redo history (`Ctrl+Z` works).

### 3. Google Gemini (`https://gemini.google.com`)
- [ ] Open Gemini.
- [ ] In the prompt box, type: `um, like, write debounce hook in react without lodash needed by Friday`
- [ ] Press **`Ctrl + Shift + Space`**.
- [ ] **Verify**: Verbal fillers (`um, like`) are removed.
- [ ] **Verify**: Constraint (`without lodash`) and deadline (`by Friday`) survive in the reconstructed output.
- [ ] Click **[Copy]**.
- [ ] **Verify**: Toast displays "Copied to clipboard". Check clipboard to ensure only the reconstructed prompt was copied.

### 4. Gmail (`https://mail.google.com`)
- [ ] Click **Compose** to open a new message draft.
- [ ] In the email body (contenteditable), type a rough draft query to an internal colleague: `server memory leak in src/worker.ts on v2.4.0`
- [ ] Trigger via **`Ctrl + Shift + Space`**.
- [ ] **Verify**: Filename `src/worker.ts` and version `v2.4.0` are preserved.
- [ ] Click **[Insert / Replace]**.
- [ ] **Verify**: Replaced inside Gmail composer without disrupting email styles or cursor placement.

### 5. Google Docs (`https://docs.google.com`)
- [ ] Open a blank Google Document.
- [ ] Type a query or prompt fragment in a paragraph.
- [ ] Select the text and press **`Ctrl + Shift + Space`**.
- [ ] Because Google Docs uses an internal canvas/custom render surface, test the **[Copy]** button or fallback notification.
- [ ] **Verify**: A toast informs the user: *"Text copied to clipboard! (Press Ctrl+V to paste into editor)"*.
- [ ] Press **`Ctrl + V`** to paste the reconstructed query into the Google Doc.

---

## Debug Logging

To observe detailed pipeline execution, timings, and validator evaluations in your browser console:

1. Open extension **Options** (`chrome-extension://<id>/options.html`).
2. Go to the **General & Interface** tab.
3. Check the **Debug Logging** box.
4. Click **Save Settings**.
5. Open your browser Developer Tools (**F12**) on any webpage where you activate the extension.
6. The console will print detailed logs prefixed with `[QueryIntelligence]` detailing:
   - Extracted entities, versions, and filenames.
   - Exact prompts dispatched to the model.
   - Latency in milliseconds for each pipeline phase.
   - Validator rule reports and integrity checks.
