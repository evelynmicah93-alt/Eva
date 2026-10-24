import express, { Request, Response } from "express";
import { generateWithGemma, getProviderStatus } from "./llm-provider.ts";

export const apiRouter = express.Router();

apiRouter.use(express.json());

// Status endpoint
apiRouter.get(["/status", "/api/status"], (_req: Request, res: Response) => {
  try {
    const status = getProviderStatus();
    res.json({ success: true, status });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Generate comprehensive species distribution modeling guide
apiRouter.post(["/generate-guide", "/api/generate-guide"], async (req: Request, res: Response) => {
  try {
    const {
      speciesName = "Unknown Species",
      studyRegion = "Regional landscape",
      degreeLevel = "MSc",
      researchGoal = "Assess habitat suitability and distribution",
      dataAvailable = "Presence-only GPS field points and GBIF records",
      predictors = "WorldClim bioclimatic variables (Bio1-Bio19) and elevation",
      toolPreference = "R (biomod2 and terra)",
      providerOverride,
    } = req.body;

    const systemPrompt = `You are an expert quantitative ecologist and academic advisor specializing in Species Distribution Modeling (SDM) / Ecological Niche Modeling (ENM).
You are guiding an ${degreeLevel} research student.
Provide an academically rigorous, clear, comprehensive, and reproducible guide.
Format your output in clean Markdown with clear headings, bullet points, and code blocks.`;

    const userPrompt = `Please generate an in-depth, step-by-step Species Distribution Modeling & Data Analysis Guide for my ${degreeLevel} research thesis:

### Project Details:
- **Target Species:** ${speciesName}
- **Study Region / Geographic Extent:** ${studyRegion}
- **Primary Research Objective:** ${researchGoal}
- **Available Occurrence Data:** ${dataAvailable}
- **Candidate Environmental Predictors:** ${predictors}
- **Preferred Computational Framework:** ${toolPreference}

### Required Sections to Include:
1. **Methodological Framework & Study Design**: Summary of the ecological rationale, niche concept (Hutchinsonian realized vs fundamental niche), and spatial scale selection.
2. **Species Occurrence Data Curation & Standardized Recording**:
   - Standard Darwin Core field requirements for fieldwork data recording (species, decimalLatitude, decimalLongitude, coordinateUncertaintyInMeters, recordedBy, eventDate).
   - Addressing sampling bias, spatial autocorrelation, and spatial thinning protocols (e.g., thinning distance thresholds).
3. **Environmental Predictor Preparation & Multicollinearity Filtering**:
   - Sourcing and spatial alignment of raster layers.
   - Multicollinearity diagnostics: Pearson correlation coefficient (|r| > 0.70 threshold) and Variance Inflation Factor (VIF < 5 or 10).
4. **Model Selection & Tuning**:
   - Algorithm choices suitable for this data (e.g. MaxEnt / Random Forest / GLM / Ensemble).
   - Pseudo-absence / background point selection strategy (e.g., target-group background, buffered minimum convex polygon).
5. **Statistical Model Evaluation & Validation**:
   - Spatial cross-validation (e.g., spatial block or k-fold).
   - Metric interpretation: AUC-ROC, True Skill Statistic (TSS), and Continuous Boyce Index (CBI).
6. **Complete Reproducible Code Script**:
   - Provide a clean, robust, working ${toolPreference} script covering data loading, VIF filtering, model training, evaluation, and raster projection with prediction mapping.
7. **Field Recording Sheet Template & Thesis Analysis Checklist**:
   - Field data collection table layout and verification steps before modeling.
8. **Academic Literature & Canonical Citations**:
   - Essential methodological citations for the thesis bibliography (e.g., Phillips et al., Guisan & Zimmermann, Thuiller et al., Elith et al.).`;

    const result = await generateWithGemma({
      prompt: userPrompt,
      systemPrompt,
      providerOverride,
    });

    res.json({
      success: true,
      guide: result.text,
      metadata: {
        providerUsed: result.providerUsed,
        modelUsed: result.modelUsed,
        durationMs: result.durationMs,
      },
    });
  } catch (err: any) {
    console.error("Guide generation error:", err);
    res.status(500).json({
      success: false,
      error: err.message || "Failed to generate guide with Gemma 4.",
    });
  }
});

// Follow-up question endpoint
apiRouter.post(["/ask-species", "/api/ask-species"], async (req: Request, res: Response) => {
  try {
    const { question, context, providerOverride } = req.body;
    if (!question) {
      return res.status(400).json({ success: false, error: "Question is required." });
    }

    const systemPrompt = `You are an expert computational ecologist advising an MSc/PhD student on Species Distribution Modeling (SDM).
Answer their specific technical or statistical question clearly, concisely, and practically with academic rigor.`;

    const prompt = `Context of the student's research project:
${context || "General Species Distribution Modeling research"}

Student's Question:
"${question}"

Provide a direct, practical, and scientifically sound explanation.`;

    const result = await generateWithGemma({
      prompt,
      systemPrompt,
      providerOverride,
    });

    res.json({
      success: true,
      answer: result.text,
      metadata: {
        providerUsed: result.providerUsed,
        modelUsed: result.modelUsed,
        durationMs: result.durationMs,
      },
    });
  } catch (err: any) {
    console.error("Ask species error:", err);
    res.status(500).json({
      success: false,
      error: err.message || "Failed to process question with Gemma 4.",
    });
  }
});
