# Model Setup Guide

**AI Query Intelligence** is powered by an extensible model provider abstraction layer. It supports local inference via **Ollama**, local OpenAI-compatible runners (**LM Studio**, **vLLM**, **LocalAI**), and remote LLM endpoints.

---

## Recommended Models

| Model | Size / VRAM | Recommendation | Strengths |
| :--- | :--- | :--- | :--- |
| **Qwen 2.5 / 3 14B** | ~9 GB VRAM | **Default & Recommended** | State-of-the-art query understanding, strict adherence to technical terms, exceptional code & schema recognition. |
| **Qwen 2.5 / 3 7B / 8B** | ~5 GB VRAM | **Fast / Low VRAM** | Ultra-fast inference (<500ms on modern GPUs/Apple Silicon), great entity preservation. |
| **Llama 3.2 3B / 1B** | ~2.5 GB VRAM | **Ultra-Light** | Can run purely on CPU on laptops with minimal battery impact. |
| **Mistral NeMo 12B** | ~8 GB VRAM | **Alternative** | Excellent multilingual and technical structuring capabilities. |

---

## 1. Local Setup with Ollama (Default)

### Step 1: Install Ollama
Download and install Ollama from [https://ollama.com](https://ollama.com) for Windows, macOS, or Linux.

### Step 2: Pull the Recommended Model
Open your terminal (PowerShell or Bash) and run:
```bash
# Recommended 14B model (Qwen 2.5 / 3 14B)
ollama pull qwen2.5:14b

# Or lightweight 7B model
ollama pull qwen2.5:7b
```

### Step 3: Verify Ollama Service
Ensure Ollama is running in your system tray or background:
```bash
curl http://localhost:11434/api/tags
```
You should receive a JSON payload listing your installed models.

### Step 4: Configure the Extension
In the extension **Options** (`chrome-extension://<id>/options.html`):
- **Provider**: `Ollama (Local Default)`
- **Endpoint URL**: `http://localhost:11434`
- **Model Name**: `qwen2.5:14b` (or `qwen2.5:7b`)
- **Temperature**: `0.2` (Low temperature guarantees faithful preservation without hallucinating causes)
- **Timeout**: `15000` (15 seconds)
- Click **Test Connection**.

---

## 2. Local Setup with LM Studio

If you prefer a graphical desktop model manager:

1. Download and install [LM Studio](https://lmstudio.ai/).
2. In the Search tab, download `Qwen2.5-14B-Instruct-GGUF` or `Qwen2.5-7B-Instruct-GGUF`.
3. Go to the **Local Server** tab (the `<->` icon on the left sidebar).
4. Select your loaded model from the top dropdown.
5. Set Port to `1234` and click **Start Server**.
6. In **AI Query Intelligence Options**:
   - **Provider**: `OpenAI-Compatible`
   - **Endpoint URL**: `http://localhost:1234/v1`
   - **Model Name**: `qwen2.5-14b-instruct`
   - Click **Test Connection**.

---

## 3. High-Throughput Setup with vLLM

For multi-GPU workstations or local server clusters:
```bash
pip install vllm
python -m vllm.entrypoints.openai.api_server \
  --model Qwen/Qwen2.5-14B-Instruct \
  --port 8000 \
  --max-model-len 4096
```

In the extension:
- **Provider**: `OpenAI-Compatible`
- **Endpoint URL**: `http://localhost:8000/v1`
- **Model Name**: `Qwen/Qwen2.5-14B-Instruct`

---

## 4. Remote & Cloud Providers (Optional)

You can connect to remote OpenAI-compatible providers like **OpenRouter**, **Groq**, or **OpenAI**:

1. In the extension **Options**:
   - **Provider**: `OpenAI-Compatible`
   - **Endpoint URL**: e.g., `https://openrouter.ai/api/v1` or `https://api.groq.com/openai/v1`
   - **Model Name**: e.g., `qwen/qwen-2.5-72b-instruct` or `llama-3.3-70b-versatile`
   - **API Key**: Enter your provider API key.
2. **Privacy Notice**:
   - The extension will automatically detect that the endpoint is **REMOTE**.
   - A gold **REMOTE** badge will be displayed on the panel.
   - Before your first query is processed, an explicit warning modal will ask for your confirmation before sending data off-device.

---

## 5. Offline Fallback Engine

If Ollama is temporarily stopped or updating:
- The extension contains an embedded, deterministic rule-based reconstructor that automatically runs as a zero-downtime fallback.
- It fixes technical typos, removes speech fillers, structures implicit how-to inquiries, and preserves multi-issue problems without requiring an active network connection or model instance.
