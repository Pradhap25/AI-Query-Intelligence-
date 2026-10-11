# Privacy Policy - AI Query Intelligence

**Effective Date:** October 2026  
**Last Updated:** October 2026

## Core Principle: Local-First & Zero Data Collection

AI Query Intelligence was designed from the ground up to respect user privacy and adhere to the highest security standards. We believe that your thoughts, queries, and working notes belong strictly to you.

---

## 1. No Telemetry, No Analytics, No Tracking

- **Zero Analytics**: AI Query Intelligence contains no analytics frameworks (such as Google Analytics, Segment, Mixpanel, or Amplitude).
- **Zero Tracking**: We do not assign you an advertising identifier, fingerprint your browser, or track your browsing activity across websites.
- **No Third-Party Scripts**: The extension contains no remote code or external scripts. All code is bundled locally within the extension package in compliance with Chrome Web Store Manifest V3 guidelines.

---

## 2. On-Device Inference by Default

- By default, AI Query Intelligence communicates exclusively with your local machine (`http://localhost:11434` for Ollama or `http://localhost:1234` for LM Studio).
- **Your text never leaves your device**: All query analysis, restructuring, and validation occur locally on your hardware.

---

## 3. Remote Inference with Explicit Consent

- If you choose to configure a remote or third-party OpenAI-compatible endpoint (such as OpenRouter, Groq, or OpenAI), the extension clearly indicates this with an amber **REMOTE** badge.
- Before your first request is sent to any external endpoint, the extension displays an explicit confirmation dialog informing you that text will leave your device.
- The extension will never contact a remote server without your explicit configuration and acknowledgment.

---

## 4. Local History Storage

- If enabled, your reconstructed queries are saved strictly to your browser's private local storage (`chrome.storage.local`).
- Query history is **never synchronized** to the cloud or transmitted to external servers.
- You have complete control over your history:
  - You can disable history recording at any time in **Options**.
  - You can search, inspect, or delete individual history entries.
  - You can erase your entire history with one click using the **Clear All History** button.

---

## 5. Minimum Necessary Browser Permissions

AI Query Intelligence requests only the minimum permissions necessary to perform its core function:
- `activeTab`: Used to capture selected text and position the floating panel when invoked by you.
- `storage`: Used to save your local configuration and optional query history on your machine.
- `contextMenus`: Used to provide the right-click "Reconstruct query" shortcut.
- `scripting`: Used to inject the content script onto pages when triggered via keyboard shortcuts.
- `notifications`: Used to alert you if an action cannot be performed (e.g. on restricted browser internal pages).
- `host_permissions` (`http://localhost:*`, `http://127.0.0.1:*`): Used solely to send requests to your local model runner (Ollama or LM Studio).

---

## 6. Contact & Open Source Auditing

The full source code of AI Query Intelligence is open and inspectable. You can audit every network request and storage operation directly within your browser's developer tools.
