/**
 * Smoke Test Script for EcoNiche Gemma 4 Web App
 *
 * Sends a realistic graduate-level Species Distribution Modeling (SDM)
 * request through the active provider (Google AI Studio Gemma 4 API or local Ollama).
 * Prints PASS or FAIL based on the result.
 */

import dotenv from "dotenv";
import { generateWithGemma, getProviderStatus } from "./server/llm-provider.ts";

dotenv.config();

async function runSmokeTest() {
  const status = getProviderStatus();
  console.log("============================================================");
  console.log("🧪 EcoNiche Gemma 4 - Smoke Test");
  console.log(`Active Provider : ${status.activeProvider.toUpperCase()}`);
  if (status.activeProvider === "api") {
    console.log(`Target Model    : ${status.apiModel}`);
    console.log(`API Key Detected: ${status.hasApiKey ? "YES" : "NO (missing GEMINI_API_KEY)"}`);
  } else {
    console.log(`Ollama Endpoint : ${status.ollamaEndpoint}`);
    console.log(`Ollama Model    : ${status.ollamaModel}`);
  }
  console.log("============================================================\n");

  // Realistic MSc / PhD research scenario
  const sampleInput = {
    speciesName: "Snow Leopard (Panthera uncia)",
    studyRegion: "Himalayas and Qinghai-Tibetan Plateau (elevation > 3,000m)",
    degreeLevel: "PhD",
    researchGoal: "Assess habitat suitability shifts and connectivity under future climate scenarios (SSP2-4.5 & SSP5-8.5) by 2070",
    dataAvailable: "385 GPS camera-trap presence points and 5,000 spatial pseudo-absence points",
    predictors: "WorldClim bioclimatic variables (Bio1, Bio4, Bio12, Bio15), SRTM 30m elevation DEM, Terrain Ruggedness Index (TRI)",
    toolPreference: "R (biomod2 and terra packages)",
  };

  const prompt = `Provide a concise verification outline for this PhD Species Distribution Modeling research:
Species: ${sampleInput.speciesName}
Study Area: ${sampleInput.studyRegion}
Objective: ${sampleInput.researchGoal}
Data: ${sampleInput.dataAvailable}
Predictors: ${sampleInput.predictors}
Environment: ${sampleInput.toolPreference}

Please include:
1. Spatial thinning protocol
2. Multicollinearity filtering rule (VIF threshold)
3. Model evaluation metric (AUC and TSS)
4. A minimal reproducible R code snippet`;

  try {
    console.log("Sending sample request through active provider...");
    const result = await generateWithGemma({
      prompt,
      systemPrompt: "You are an expert computational ecologist advising a graduate research student.",
    });

    const text = result.text.trim();
    if (!text || text.length < 150) {
      throw new Error(`Response too short (${text.length} chars). Expected substantial guidance.`);
    }

    console.log("\nSample Response Excerpt (first 350 chars):");
    console.log("------------------------------------------------------------");
    console.log(text.slice(0, 350) + "...\n------------------------------------------------------------");
    console.log(`Provider Used: ${result.providerUsed}`);
    console.log(`Model Used   : ${result.modelUsed}`);
    console.log(`Duration     : ${result.durationMs}ms`);
    console.log(`Total Length : ${text.length} characters`);
    console.log("\n============================================================");
    console.log("PASS");
    console.log("============================================================");
    process.exit(0);
  } catch (err: any) {
    console.error("\n============================================================");
    console.error("FAIL");
    console.error(`Reason: ${err.message}`);
    console.error("============================================================");
    process.exit(1);
  }
}

runSmokeTest();
