# API Guide — Adaptive Federated Threat Detection

This guide documents the HTTP endpoints provided by the Flask dashboard / model server in `api_deployment/app.py`, how to call them from PowerShell / JavaScript, and recommended patterns for integrating an LLM such as Gemini as a secondary opinion.

**Quick start**
- Start the server:
```powershell
cd 'c:\Users\Deepa\Downloads\project_root\api_deployment'
python .\app.py
```
The app runs on port `7000` by default (`http://127.0.0.1:7000`).

---

## Endpoints

1) `POST /predict`
- Purpose: Main UI endpoint used by the dashboard to get a model score + label for a domain.
- Request (JSON):
  - `{"domain": "www.example.com"}`
- Response (JSON):
  - `{"domain": "www.example.com", "malicious_score": 0.5223, "label": "Suspicious", "is_malicious": false}`
  - `malicious_score` is a float in 0..1
  - `label` is one of `Safe` / `Suspicious` / `Malicious`
  - `is_malicious` is a boolean (true only when label == `Malicious`)

Example curl (PowerShell friendly):
```powershell
Invoke-RestMethod -Uri http://127.0.0.1:7000/predict -Method POST -ContentType 'application/json' -Body (@{domain='www.gmail.com'} | ConvertTo-Json)
```

JavaScript fetch example (browser):
```js
const res = await fetch('/predict', {
  method: 'POST',
  headers: {'Content-Type': 'application/json'},
  body: JSON.stringify({domain: 'www.gmail.com'})
});
const data = await res.json();
console.log(data);
```

2) `POST /api/check-domain`
- Purpose: Programmatic API meant for external integrations (returns `action` and `reason` in policy terms).
- Request (JSON): `{ "domain": "example.com" }`
- Response (JSON):
  - `{"domain": "example.com", "confidence": 0.7234, "action": "WARN", "reason": "Domain shows partially suspicious patterns.", "verdict": "malicious/suspicious"}`
  - `action` is one of `ALLOW`, `WARN`, `BLOCK`.

Example PowerShell:
```powershell
Invoke-RestMethod -Uri http://127.0.0.1:7000/api/check-domain -Method POST -ContentType 'application/json' -Body (@{domain='goagle.com'} | ConvertTo-Json)
```

3) `GET /history`
- Purpose: Returns recent scan history maintained in memory by the running server.
- Response: `{ "history": [ ... ] }` (array of latest predictions; server stores up to 25 entries)

4) `GET /metrics`
- Purpose: Quick evaluation metrics created by the app (`compute_real_metrics()` uses a small dataset by default).
- Response: `{ "accuracy": 0.989, "precision": 0.98, "recall": 0.974, "f1": 0.98, "roc_auc": 0.99 }` (values are computed and clamped in `app.py`)

5) `GET /filter?domain=...`
- Purpose: Simulates the website integration UI (returns different templates for ALLOW/WARN/BLOCK).
- Example: `http://127.0.0.1:7000/filter?domain=www.gmail.com`

6) `GET /health`
- Purpose: Simple health check for orchestration: `{"status": "running", "model_loaded": true}`

---

## Notes on model inputs and preprocessing
- The server and training pipeline must use the same preprocessing. The server's `preprocess_domain()` now uses `clean_domain()` and `encode_domain()` from `single_machine_federation/data_preprocessing.py`.
- `clean_domain()` strips `www.` and performs consistent padding/truncation used during training.
- If you change `vocab_size`, `seq_len`, or input normalization in `common` code, update both training and inference code consistently.

---

## When to call the LLM (Gemini) as a second opinion
Using a large language model as an auxiliary signal can help in edge cases, but there are trade-offs.

Recommended pattern (safe default): call the LLM only for low-confidence model outputs — for example when 0.4 <= score <= 0.7.
- Benefits: reduces cost and latency by calling LLMs selectively.
- Use the LLM to produce an explanation, a probability estimate (0..100), or extract human-readable signals (brand names, suspicious tokens).
- Combine model_score and llm_score with a simple rule (average, weighted average, or rule-based override for high LLM probability).

Privacy & security: Do not send sensitive user data to external LLMs unless you have consent and proper controls. For domain strings this is typically low-risk, but still consider policy and legal constraints.

---

## Example: simple Gemini integration (pseudo-code)
This is a simple approach that calls an external LLM service (replace endpoint/auth with your provider details). The example shows a small wrapper that only calls the LLM when `0.4 <= score <= 0.7`.

```python
import requests

def call_llm_for_domain(domain, model_score, api_key):
    # Only call when low confidence
    if model_score < 0.4 or model_score > 0.7:
        return None

    prompt = (
        f"Domain: {domain}\nModel score: {model_score:.3f}\n"
        "Is this domain likely phishing? Give a probability (0-100) and 1-2 short reasons."
    )

    headers = {"Authorization": f"Bearer {api_key}", "Content-Type": "application/json"}
    payload = {"prompt": prompt, "max_tokens": 150}

    resp = requests.post("https://your-llm-endpoint.example/v1/generate", headers=headers, json=payload, timeout=10)
    resp.raise_for_status()
    j = resp.json()

    # The exact parse depends on your LLM provider; ideally receive structured fields.
    # Try to parse a numeric probability from `j` or fallback to manual parsing of the text.
    llm_text = j.get('text') or j.get('output') or ''
    # extract percent if available, naive parse:
    import re
    m = re.search(r"(\d{1,3})%", llm_text)
    llm_prob = float(m.group(1))/100.0 if m else None

    return {"llm_prob": llm_prob, "text": llm_text}
```

Combining scores (simple):
```python
combined_score = model_score
if llm_result and llm_result['llm_prob'] is not None:
    combined_score = (model_score + llm_result['llm_prob']) / 2.0
```

---

## Example: call `predict` from PowerShell (full example)
```powershell
# Query predict
$result = Invoke-RestMethod -Uri http://127.0.0.1:7000/predict -Method POST -ContentType 'application/json' -Body (@{domain='goagle.com'} | ConvertTo-Json)
Write-Host "Domain: $($result.domain)"
Write-Host "Score: $($result.malicious_score)"
Write-Host "Label: $($result.label)"
Write-Host "IsMalicious: $($result.is_malicious)"
```

---

## Implementation notes and tips
- UI and backend consistency: make the UI use the server label rather than re-applying thresholds client-side (the repo's dashboard now does this).
- Long-running LLM calls: run LLM calls asynchronously or behind a queue if you expect high traffic. Consider caching LLM responses for repeated queries.
- Logging: log both model_score and llm response (if used) for audit and error analysis.
- Rate limits & cost: treat LLM calls as expensive — invoke only when they add value.

---

## Troubleshooting
- If scores look odd for a known domain (e.g., `gmail.com` vs `goagle.com`): ensure server preprocessing matches training (the `clean_domain()` + `encode_domain()` functions are used by the server by default).
- Model file not found: `model_loader.py` looks for `federated_transformer.h5` in the repo root and `api_deployment/`. Place the model file accordingly.

---

## "NA" / Not applicable notes
- The repo uses an illustrative comparison chart (Random Forest / LSTM / BiLSTM / Proposed) with hard-coded accuracy numbers in `generate_dashboard_images()`; these are illustrative and not produced by retraining all those models here. Treat those bars as illustrative unless you replace them with real training/evaluation code.

---

If you'd like, I can:
- Add a server-side Gemini stub and wire it into `/predict` for low-confidence cases (requires you to provide the API key or guidance how to configure it).
- Add a small `requirements.txt` or `README` entry with the exact PowerShell / curl examples pasted above into `PROJECT_DOCUMENTATION.md`.

Tell me which follow-up you'd like and I'll implement it.

---

## Gemini / LLM integration (server stub)
The repository now includes an optional server-side helper that can call an external LLM (Gemini) for low-confidence predictions.

How to enable:
- Set `GEMINI_API_KEY` in your environment to your provider API key.
- Set `GEMINI_API_URL` to the full URL of the LLM generation endpoint (the code posts JSON with `prompt`, `max_tokens`, and `temperature`).

Common misconfiguration warning:
- If you set your API key into `GEMINI_API_URL` by mistake (for example pasting the raw key into the URL env var), the server will treat that value as an invalid URL and you will see errors like `Invalid URL '...': No scheme supplied`.
- To avoid this, set the API key in `GEMINI_API_KEY` and the HTTP endpoint (if needed) in `GEMINI_API_URL` which must start with `http://` or `https://`.
- The server now detects and normalizes this mistake by moving a non-URL `GEMINI_API_URL` value into `GEMINI_API_KEY` (so a session-only incorrectly-set key will still work). However, it's best to correct the env vars as shown above.

Google GenAI (Gemini) usage
- The server additionally attempts to use the `google.genai` client if `GEMINI_API_KEY` is set and `GEMINI_API_URL` is not provided. The client is optional — install `google-genai` if you want to use the Google client directly.
- Example usage (Python snippet):
```python
from google import genai
client = genai.Client(api_key="YOUR_KEY")
resp = client.models.generate_content(model="gemini-3-pro-preview", contents="Explain how AI works in a few words")
print(getattr(resp, 'text', resp))
```

Security note: DO NOT hard-code API keys into source code or commit them. Use env vars or a secrets manager. If you paste the key into your shell for testing, prefer session-only environment variables (PowerShell example below).

PowerShell set example (session only):
```powershell
$env:GEMINI_API_KEY = 'AIzaSy...'
# If you want to force HTTP mode (instead of google client), also set GEMINI_API_URL
$env:GEMINI_API_URL = 'https://api.your-llm-provider.example/v1/generate'
```

Local untracked secret file (safer alternative to hard-coding)
-----------------------------------------------------------
If you prefer to keep the key on the local machine and *not* in environment variables, create a file named `local_secrets.py` next to `app.py` with the following content:

```python
# local_secrets.py  (DO NOT commit this file)
GEMINI_API_KEY = "your_actual_api_key_here"
```

Then add `local_secrets.py` to your `.gitignore` so it never gets committed. The server will automatically load this key at startup and attempt to configure the `genai` client if available.

Important: I will not add any real API keys to the repository. If you want, I can create `.gitignore` and a `local_secrets.example.py` (without keys) to make this workflow easier.

Example (PowerShell) to set env vars for the current session:
```powershell
$env:GEMINI_API_KEY = 'sk-...'
$env:GEMINI_API_URL = 'https://api.your-llm-provider.example/v1/generate'
```

Behavior:
- The server will call the LLM only when the model score is in the low-confidence band (`0.4 <= score <= 0.7`).
- If the LLM returns a parsable probability (like `85%`) the server will compute a `combined_score = average(model_score, llm_prob)` and include `combined_score` and `llm_explanation` in the `/predict` response.
- If the LLM call fails the server continues to return the model score and label; LLM errors are not exposed as failures (but are included in the explanation field when present).

Security and cost notes:
- Do not store or send sensitive user data to external LLMs unless permitted.
- LLM calls are executed synchronously in the current stub — for production consider async tasks or a queue.

If you want, I can add a small configuration file (`.env.example`) and a server flag to toggle LLM calls on/off.
