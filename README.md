# EcoNiche Gemma - Species Modeling Guide

A simple, practical AI web app that guides MSc and PhD research students step-by-step through **Species Distribution Modeling (SDM)**, field data recording, and statistical analysis.

Powered by **Gemma 4** through Google AI Studio, with an automatic local fallback using **Ollama** (`gemma4:e2b`).

---

## 1. What This App Does

When you enter your target species, study region, and research goals, this app creates a complete academic research guide:
- **How to record field data properly**: Using global standards (Darwin Core fields like coordinates, accuracy, dates, and sampling notes).
- **How to clean your data**: Handling duplicates, spatial clustering (thinning), and survey bias.
- **Which climate and environmental layers to use**: WorldClim / CHELSA bioclimatic variables, terrain elevation, and checking for redundant variables (multicollinearity tests like VIF and Pearson correlation).
- **Which algorithms to choose**: MaxEnt, Random Forest, or ensemble models (`biomod2`).
- **How to evaluate your model**: Explaining True Skill Statistic (TSS), AUC-ROC, and Continuous Boyce Index.
- **Ready-to-run code**: Generates a complete R script you can run in RStudio or Python script in Jupyter.
- **Key scientific papers to cite**: Standard references to include in your thesis literature review.
- **Live Q&A**: Ask follow-up questions if you get stuck on an error or low score.

---

## 2. Quick Setup

1. Copy the example environment file:
   ```bash
   cp .env.example .env
   ```

2. Open `.env` and set your preferred provider (`api` or `local`).

---

## 3. How to Run with Google AI Studio API (Default)

1. Get your free API key from [Google AI Studio](https://aistudio.google.com).
2. In your `.env` file, set:
   ```env
   PROVIDER=api
   GEMINI_API_KEY="your-actual-api-key-here"
   GEMMA_API_MODEL="gemma-4-26b-a4b-it"
   ```
3. Start the application:
   ```bash
   npm run dev
   ```
4. Open your browser at `http://localhost:3000`.

*(Note: In Google AI Studio Build, the API key is automatically securely supplied on the server side and never exposed to the web browser.)*

---

## 4. How to Run with Local Ollama (Offline Fallback)

If you want to run completely on your own computer without an internet connection or API key:

1. Download and install [Ollama](https://ollama.com).
2. Pull the Gemma 4 lightweight model:
   ```bash
   ollama pull gemma4:e2b
   ```
3. In your `.env` file, switch the provider:
   ```env
   PROVIDER=local
   OLLAMA_ENDPOINT="http://localhost:11434"
   OLLAMA_MODEL="gemma4:e2b"
   ```
4. Start the app:
   ```bash
   npm run dev
   ```
5. Open your browser at `http://localhost:3000`. The app will now communicate directly with your local Ollama instance.

---

## 5. Run the Smoke Test

To verify that your active provider is working properly:

```bash
npm run smoke
```

The smoke test will send a realistic graduate research sample (Snow Leopard distribution under climate scenarios) through your active provider and print either:
- **`PASS`** (everything works and Gemma 4 returned valid guidance)
- **`FAIL`** (with a plain explanation of what went wrong)

---

## 6. Project Structure

- `src/App.tsx` - Clean single-page user interface with presets, parameter form, and guide viewer.
- `server/llm-provider.ts` - Server-side connector that routes requests to either Google AI Studio Gemma 4 or local Ollama. Keeps your API key safe.
- `server/api-router.ts` - Express API routes (`/api/status`, `/api/generate-guide`, `/api/ask-species`).
- `smoke-test.ts` - Automated verification test script that prints `PASS` or `FAIL`.
- `server.ts` - Standalone full-stack Node.js server.
- `.env.example` - Template for environment variables.
- `.gitignore` - Protects secrets and prevents `.env` from being shared.
