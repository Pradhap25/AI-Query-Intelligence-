# Installation & Developer Mode Guide

## Overview
**AI Query Intelligence** is a lightweight Manifest V3 browser extension for Google Chrome, Microsoft Edge, Brave, and other Chromium-based browsers. It runs inside the pages you are already using to reconstruct raw, fragmented, or messy queries into precise, AI-ready requests before you send them to an AI.

---

## Prerequisites
- **Node.js** (v18.0.0 or later, v20+ recommended)
- **Chromium-based browser** (Google Chrome v116+, Microsoft Edge v116+, Brave, Arc, Opera)
- **Local Model Runner (Optional but Recommended)**:
  - [Ollama](https://ollama.com/) running locally on port 11434, OR
  - [LM Studio](https://lmstudio.ai/) / vLLM on port 1234 / 8000

---

## 1. Quick Build from Source

Open a terminal in the project directory:

```bash
# Install dependencies
npm install

# Run tests
npm test

# Build extension into /dist
npm run build
```

This compiles TypeScript source files and bundles them into the `dist/` directory:
- `dist/manifest.json`
- `dist/background.js` (Manifest V3 Service Worker)
- `dist/content.js` (Content Script with Shadow DOM overlay)
- `dist/popup.html` & `dist/popup.js` (Quick status indicator & pause toggle)
- `dist/options.html` & `dist/options.js` (Full configuration & history manager)
- `dist/icons/` (16x16, 48x48, 128x128 icons)

---

## 2. Load Extension in Google Chrome (Developer Mode)

1. Open **Google Chrome**.
2. Navigate to `chrome://extensions` in your address bar (or click **Menu (⋮)** -> **Extensions** -> **Manage Extensions**).
3. Toggle on **Developer mode** in the top-right corner.
4. Click the **Load unpacked** button in the top-left toolbar.
5. In the file picker dialog, navigate to the project workspace and select the **`dist`** directory (e.g. `c:\Users\ELCOT\OneDrive\query\dist`).
6. Click **Select Folder**.
7. You will immediately see **AI Query Intelligence** appear with version **1.0.0**, enabled and ready.
8. (Recommended) Click the **puzzle piece icon** in Chrome's toolbar and pin **AI Query Intelligence** to your browser toolbar.

---

## 3. Load Extension in Microsoft Edge (Developer Mode)

1. Open **Microsoft Edge**.
2. Navigate to `edge://extensions` in the address bar.
3. Toggle on **Developer mode** in the left sidebar.
4. Click the **Load unpacked** button.
5. Select the **`dist`** folder.
6. The extension is now active on Microsoft Edge.

---

## 4. First-Run Onboarding & Model Connection

### Step A: Start Ollama
Ensure Ollama is running on your machine:
```bash
ollama run qwen2.5:14b
# Or lightweight version:
ollama run qwen2.5:7b
```
Verify that Ollama responds at `http://localhost:11434`.

### Step B: Test Connection in Extension
1. Right-click the **QI** toolbar icon and select **Options** (or click the icon and click **Settings & History**).
2. Under the **AI Provider & Model** tab:
   - Ensure Provider is set to **Ollama (Local Default)**.
   - Endpoint URL is `http://localhost:11434`.
   - Model Name is `qwen2.5:14b` (or your chosen model).
3. Click **Test Connection**.
4. You should see a green success alert displaying response latency (e.g., `Connected to Ollama (12ms)`) and the list of available local models.
5. Click **Save Settings**.

---

## 5. Usage Workflow

1. Open any page with an input box (ChatGPT, Claude, Gemini, Google Search, Google Docs, etc.).
2. Type a raw, messy, or shorthand query (e.g., `connect power bi power automate how`).
3. Select the text or keep the text box focused.
4. Press **`Ctrl + Shift + Space`** (or right-click and choose **"Reconstruct query with AI Query Intelligence"**).
5. The sleek floating panel appears directly below your cursor/selection.
6. The panel honestly shows progress: **Analyzing -> Reconstructing -> Validating -> Done**.
7. Inspect the reconstructed query. You can:
   - Click **[Edit]** to make instant manual adjustments.
   - Click **[Insert / Replace]** to inject it directly into your active input or contenteditable editor.
   - Click **[Copy]** to copy only the reconstructed query to your clipboard.
   - Click **[Ask AI]** to instantly open ChatGPT, Claude, Gemini, Perplexity, or Copilot with the query pre-filled!
8. Press **`Esc`** at any time to close the panel.
