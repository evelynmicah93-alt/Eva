import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

export interface GenerationRequest {
  prompt: string;
  systemPrompt?: string;
  providerOverride?: "api" | "local";
}

export interface GenerationResult {
  text: string;
  providerUsed: "api" | "local";
  modelUsed: string;
  durationMs: number;
}

export function getProviderStatus() {
  const activeProvider = (process.env.PROVIDER?.toLowerCase() === "local" ? "local" : "api") as "api" | "local";
  const apiModel = process.env.GEMMA_API_MODEL || "gemma-4-26b-a4b-it";
  const ollamaEndpoint = process.env.OLLAMA_ENDPOINT || "http://localhost:11434";
  const ollamaModel = process.env.OLLAMA_MODEL || "gemma4:e2b";
  const hasApiKey = Boolean(process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== "MY_GEMINI_API_KEY");

  return {
    activeProvider,
    apiModel,
    ollamaEndpoint,
    ollamaModel,
    hasApiKey,
  };
}

export async function generateWithGemma(req: GenerationRequest): Promise<GenerationResult> {
  const startTime = Date.now();
  const status = getProviderStatus();
  const provider = req.providerOverride || status.activeProvider;

  if (provider === "local") {
    // Local Ollama route
    const endpoint = status.ollamaEndpoint.replace(/\/$/, "");
    const model = status.ollamaModel;

    try {
      const fullPrompt = req.systemPrompt ? `${req.systemPrompt}\n\n${req.prompt}` : req.prompt;
      const res = await fetch(`${endpoint}/api/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model,
          prompt: fullPrompt,
          stream: false,
        }),
      });

      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(`Ollama request failed (${res.status}): ${errorText}`);
      }

      const data = (await res.json()) as { response?: string };
      return {
        text: data.response || "No response received from local Ollama model.",
        providerUsed: "local",
        modelUsed: model,
        durationMs: Date.now() - startTime,
      };
    } catch (err: any) {
      throw new Error(
        `Local Ollama fallback error: ${err.message}. Make sure Ollama is running at ${endpoint} with '${model}' pulled.`
      );
    }
  }

  // Google AI Studio (Gemini API) route
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === "MY_GEMINI_API_KEY") {
    throw new Error(
      "GEMINI_API_KEY is not configured. Please add your Gemini API Key in the environment or switch to PROVIDER=local."
    );
  }

  const ai = new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        "User-Agent": "aistudio-build",
      },
    },
  });

  const model = status.apiModel;

  try {
    const response = await ai.models.generateContent({
      model,
      contents: req.prompt,
      config: req.systemPrompt
        ? {
            systemInstruction: req.systemPrompt,
            temperature: 0.6,
          }
        : {
            temperature: 0.6,
          },
    });

    const text = response.text || "";
    return {
      text,
      providerUsed: "api",
      modelUsed: model,
      durationMs: Date.now() - startTime,
    };
  } catch (err: any) {
    // If the primary model fails, provide a helpful actionable message
    throw new Error(`Gemini API Gemma 4 generation error (${model}): ${err.message}`);
  }
}
