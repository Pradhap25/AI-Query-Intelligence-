# AI Query Intelligence 🧠

> A lightweight, local-first Manifest V3 browser extension for Chrome and Edge that reconstructs messy, fragmented, or shorthand queries into natural, precise, AI-ready requests before you send them to an AI model.

---

## 🌟 Key Highlights

- **Attached to Your Page**: Operates inside the websites you already use (ChatGPT, Claude, Gemini, Perplexity, Copilot, Google Docs, Gmail, etc.) using an isolated **Shadow DOM** overlay. No new tabs, no full-screen dashboards, no focus stealing.
- **Never Answers the Question**: It is **not** an answer engine, chatbot, or grammar checker. It exclusively reconstructs your query so downstream AI models give you high-quality responses on your first attempt.
- **100% Local Inference by Default**: Direct integration with **Ollama** (`http://localhost:11434`) running **Qwen 2.5 / 3 (14B or 7B)**, or **LM Studio** (`http://localhost:1234/v1`). Your text stays on your hardware.
- **Strict Engine Rules**:
  - **Raw Text is Source of Truth**: Understands intent, perspective, context, and knowledge level.
  - **Preserves Everything**: Primary and secondary problems, symptoms, constraints, exclusions, deadlines, uncertainty, technical terms, code, numbers, versions, filenames, and commands survive intact.
  - **Causality Integrity**: Never invents cause-and-effect relationships between independent observations.
  - **Request Direction**: Always structures queries from the user's perspective to the AI—never asks the user what they want.
  - **Honest Status Progression**: Real pipeline updates (*Analyzing -> Reconstructing -> Validating -> Done*). No fake checkmarks.
- **Smart DOM Insertion**: Injects directly into standard `<textarea>`, `<input>`, or rich-text `contenteditable` editors (ProseMirror, Lexical, DraftJS, Google Docs, Gmail) with automatic clipboard fallback.
- **Privacy & Security**: Zero telemetry, zero analytics, minimal permissions (`activeTab`, `storage`, `contextMenus`, `scripting`), pause switch, and full local history management.

---

## 🏗️ Architecture

```
query-intelligence-extension/
├── core/                        # Shared TypeScript package (zero browser dependencies)
│   ├── types/                   # Pipeline stages, settings, analysis, validation types
│   ├── engine/                  # Core pipeline, query analyzer, deterministic reconstructor
│   ├── providers/               # BaseProvider, OllamaProvider, OpenAICompatibleProvider, Registry
│   ├── validators/              # Preservation, causality, direction, and script sanitizers
│   └── prompts/                 # System prompt templates & few-shot instructions
├── extension/                   # Manifest V3 browser extension
│   ├── manifest.json            # MV3 configuration with minimal permissions
│   ├── background/              # Background service worker (shortcuts, menus, pipeline routing)
│   ├── content/                 # Content script (text capture, Shadow DOM overlay injection)
│   ├── overlay/                 # Floating Shadow DOM component (draggable, dark/light themes)
│   ├── insertion/               # Smart insertion engine (inputs, textareas, contenteditable)
│   ├── popup/                   # Compact status panel with pause/resume toggle
│   ├── options/                 # Options & History manager UI
│   └── icons/                   # 16x16, 48x48, 128x128 icons
├── tests/                       # Complete automated test suite (Vitest)
│   ├── unit/                    # Analyzer, Reconstructor, Validators, Providers, Insertion
│   └── regression/              # Engine rules regression tests for Section 9.A
├── docs/                        # Complete documentation
│   ├── INSTALL.md               # Developer Mode loading & onboarding guide
│   ├── MODEL_SETUP.md           # Ollama, LM Studio, vLLM, and model parameter guide
│   ├── TESTING.md               # Manual test checklist (ChatGPT, Claude, Gemini, Docs, Gmail)
│   ├── RELEASE.md               # Store listing, reviewer justifications & packaging guide
│   └── PRIVACY_POLICY.md        # Strict local-first privacy policy
├── scripts/                     # Tooling scripts
│   ├── build.mjs                # esbuild bundle compiler
│   ├── generate-icons.mjs       # Pure Node.js PNG icon generator
│   └── package.mjs              # Store ZIP package builder
├── dist/                        # Production extension bundle ready for "Load unpacked"
└── package.json
```

---

## 🚀 Quick Start

### 1. Build the Extension
```bash
npm install
npm test
npm run build
```

### 2. Load into Chrome or Edge
1. Navigate to `chrome://extensions` or `edge://extensions`.
2. Toggle on **Developer mode**.
3. Click **Load unpacked** and select the **`dist`** directory.
4. Pin the **QI** extension to your toolbar.

### 3. Usage
- Select any messy or shorthand text on any webpage.
- Press **`Ctrl + Shift + Space`** (or right-click -> **Reconstruct query**).
- Use **[Insert / Replace]**, **[Copy]**, or **[Ask AI]** directly from the floating panel!

---

## 🧪 Testing

Run the automated test suite covering all 9.A regression requirements:
```bash
npm test
```
All **35 tests** across 7 test suites pass with 100% success rate.
