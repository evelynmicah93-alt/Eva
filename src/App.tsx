import React, { useState, useEffect } from "react";
import {
  GraduationCap,
  Sparkles,
  Compass,
  FileText,
  Copy,
  Check,
  Download,
  Terminal,
  RefreshCw,
  Cpu,
  Layers,
  Globe,
  AlertCircle,
  CheckCircle2,
  Send,
  MessageSquare,
  HelpCircle,
  ExternalLink,
  ChevronDown,
  ChevronUp,
} from "lucide-react";

interface StatusResponse {
  activeProvider: "api" | "local";
  apiModel: string;
  ollamaEndpoint: string;
  ollamaModel: string;
  hasApiKey: boolean;
}

interface Preset {
  id: string;
  title: string;
  species: string;
  region: string;
  degree: "MSc" | "PhD";
  goal: string;
  data: string;
  predictors: string;
  tool: string;
}

const PRESETS: Preset[] = [
  {
    id: "snow-leopard",
    title: "Snow Leopard Climate Range",
    species: "Snow Leopard (Panthera uncia)",
    region: "Tibetan Plateau & Himalayan Range (elevation > 3,000m)",
    degree: "PhD",
    goal: "Project habitat suitability shifts under future climate scenarios (SSP2-4.5 & SSP5-8.5 by 2070) and assess connectivity corridors.",
    data: "385 GPS camera-trap occurrences and 5,000 environmental background pseudo-absences.",
    predictors: "WorldClim 19 Bioclimatic variables (Bio1, Bio4, Bio12, Bio15), SRTM 30m DEM elevation, Terrain Ruggedness Index (TRI), and human footprint.",
    tool: "R (biomod2 and terra)",
  },
  {
    id: "tiger-mosquito",
    title: "Invasive Tiger Mosquito Vector",
    species: "Asian Tiger Mosquito (Aedes albopictus)",
    region: "Southern & Central Europe (temperate transition zones)",
    degree: "MSc",
    goal: "Model urban dispersal and climate suitability for viral transmission risk (Dengue/Chikungunya).",
    data: "820 citizen science surveillance records and regional ovitrap presence points.",
    predictors: "WorldClim winter minimum temperature (Bio6), precipitation seasonality (Bio15), urban land cover percentage, human population density.",
    tool: "R (sdm and raster)",
  },
  {
    id: "alpine-flora",
    title: "Alpine Edelweiss Altitudinal Shift",
    species: "Alpine Edelweiss (Leontopodium nivale)",
    region: "European Alps (limestone subalpine & alpine meadows, 1,800m - 3,000m)",
    degree: "MSc",
    goal: "Assess high-altitude summit trapping and altitudinal retreat under rising summer temperatures.",
    data: "210 herbarium voucher specimens + GLORIA long-term monitoring plots.",
    predictors: "CHELSA microclimate layers, soil pH, snow cover duration, slope aspect, solar radiation index.",
    tool: "R (biomod2)",
  },
];

export default function App() {
  // Provider and system status
  const [status, setStatus] = useState<StatusResponse | null>(null);
  const [statusLoading, setStatusLoading] = useState<boolean>(true);
  const [providerOverride, setProviderOverride] = useState<"api" | "local" | "auto">("auto");

  // Form inputs
  const [speciesName, setSpeciesName] = useState<string>("Snow Leopard (Panthera uncia)");
  const [studyRegion, setStudyRegion] = useState<string>("Himalayan range and Tibetan Plateau");
  const [degreeLevel, setDegreeLevel] = useState<"MSc" | "PhD">("MSc");
  const [researchGoal, setResearchGoal] = useState<string>(
    "Assess habitat suitability and vulnerability under climate change scenarios (SSP2-4.5 and SSP5-8.5 by 2070)"
  );
  const [dataAvailable, setDataAvailable] = useState<string>(
    "Camera-trap GPS coordinates (presence-only) combined with GBIF records"
  );
  const [predictors, setPredictors] = useState<string>(
    "WorldClim bioclimatic variables (Bio1-Bio19), 30m SRTM elevation, slope, and terrain ruggedness (TRI)"
  );
  const [toolPreference, setToolPreference] = useState<string>("R (biomod2 and terra)");

  // Generation state
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [guideOutput, setGuideOutput] = useState<string>("");
  const [metaInfo, setMetaInfo] = useState<{ provider: string; model: string; duration: number } | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [copied, setCopied] = useState<boolean>(false);

  // Follow-up question state
  const [question, setQuestion] = useState<string>("");
  const [isAsking, setIsAsking] = useState<boolean>(false);
  const [qaHistory, setQaHistory] = useState<Array<{ q: string; a: string; time: string }>>([]);

  // Fetch initial system status
  const fetchStatus = async () => {
    setStatusLoading(true);
    try {
      const res = await fetch("/api/status");
      const data = await res.json();
      if (data.success && data.status) {
        setStatus(data.status);
      }
    } catch (e) {
      console.error("Failed to load status:", e);
    } finally {
      setStatusLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();
  }, []);

  const handleApplyPreset = (preset: Preset) => {
    setSpeciesName(preset.species);
    setStudyRegion(preset.region);
    setDegreeLevel(preset.degree);
    setResearchGoal(preset.goal);
    setDataAvailable(preset.data);
    setPredictors(preset.predictors);
    setToolPreference(preset.tool);
  };

  const handleGenerate = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setIsGenerating(true);
    setErrorMessage(null);

    try {
      const payload: Record<string, any> = {
        speciesName,
        studyRegion,
        degreeLevel,
        researchGoal,
        dataAvailable,
        predictors,
        toolPreference,
      };

      if (providerOverride !== "auto") {
        payload.providerOverride = providerOverride;
      }

      const res = await fetch("/api/generate-guide", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Generation failed. Please check provider settings.");
      }

      setGuideOutput(data.guide);
      setMetaInfo({
        provider: data.metadata.providerUsed,
        model: data.metadata.modelUsed,
        duration: data.metadata.durationMs,
      });
    } catch (err: any) {
      setErrorMessage(err.message || "An unexpected error occurred.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleAskQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!question.trim()) return;

    setIsAsking(true);
    const currentQ = question.trim();
    setQuestion("");

    try {
      const res = await fetch("/api/ask-species", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question: currentQ,
          context: `Species: ${speciesName}, Region: ${studyRegion}, Degree: ${degreeLevel}, Goal: ${researchGoal}`,
          providerOverride: providerOverride !== "auto" ? providerOverride : undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to get response.");
      }

      setQaHistory((prev) => [
        ...prev,
        {
          q: currentQ,
          a: data.answer,
          time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        },
      ]);
    } catch (err: any) {
      alert(`Error asking question: ${err.message}`);
    } finally {
      setIsAsking(false);
    }
  };

  const copyToClipboard = () => {
    if (!guideOutput) return;
    navigator.clipboard.writeText(guideOutput);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const downloadGuide = () => {
    if (!guideOutput) return;
    const blob = new Blob([guideOutput], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${speciesName.replace(/[^a-zA-Z0-9]/g, "_")}_SDM_Guide.md`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const activeProviderName =
    providerOverride !== "auto"
      ? providerOverride
      : status?.activeProvider || "api";

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-emerald-500/30 selection:text-emerald-200">
      {/* Top Navigation Bar */}
      <header className="border-b border-slate-800 bg-slate-900/80 backdrop-blur sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-400 flex items-center justify-center shadow-lg shadow-emerald-500/20">
              <Compass className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-bold text-lg text-white tracking-tight">EcoNiche Gemma</span>
                <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-950/80 text-emerald-400 border border-emerald-800/80">
                  Gemma 4
                </span>
              </div>
              <p className="text-xs text-slate-400">Species Distribution Modeling Guide for MSc & PhD Research</p>
            </div>
          </div>

          {/* Provider status badge */}
          <div className="flex items-center space-x-3">
            <div className="hidden md:flex items-center space-x-2 bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-xs">
              <span className="text-slate-400">Provider:</span>
              <span className="inline-flex items-center font-mono font-medium text-slate-200">
                <span
                  className={`w-2 h-2 rounded-full mr-1.5 ${
                    activeProviderName === "api"
                      ? status?.hasApiKey
                        ? "bg-emerald-400 animate-pulse"
                        : "bg-amber-400"
                      : "bg-cyan-400"
                  }`}
                />
                {activeProviderName === "api"
                  ? `Google AI Studio (${status?.apiModel || "gemma-4-26b-a4b-it"})`
                  : `Local Ollama (${status?.ollamaModel || "gemma4:e2b"})`}
              </span>
            </div>

            <button
              onClick={fetchStatus}
              title="Refresh provider status"
              className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition"
            >
              <RefreshCw className={`w-4 h-4 ${statusLoading ? "animate-spin" : ""}`} />
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Academic Intro Banner */}
        <div className="mb-8 rounded-2xl bg-gradient-to-r from-emerald-950/40 via-slate-900 to-slate-900 border border-emerald-900/40 p-6 relative overflow-hidden">
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center space-x-2 text-emerald-400 text-sm font-semibold uppercase tracking-wider">
                <GraduationCap className="w-4 h-4" />
                <span>Graduate Research Assistant</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                Design & Analyze Your Species Distribution Model
              </h1>
              <p className="text-slate-300 text-sm max-w-3xl leading-relaxed">
                Step-by-step academic protocols powered by Google DeepMind's <strong>Gemma 4</strong>. Get
                standardized Darwin Core field data recording templates, spatial autocorrelation & thinning tests,
                multicollinearity filtering (VIF & Pearson |r| &gt; 0.7), cross-validation metrics (AUC, TSS, Boyce
                Index), and publication-ready R scripts.
              </p>
            </div>

            {/* Provider Switcher Selector */}
            <div className="bg-slate-950/80 border border-slate-800 p-3 rounded-xl flex flex-col space-y-2 shrink-0">
              <label className="text-xs text-slate-400 font-medium flex items-center space-x-1">
                <Cpu className="w-3.5 h-3.5 text-emerald-400" />
                <span>Active Engine:</span>
              </label>
              <select
                value={providerOverride}
                onChange={(e) => setProviderOverride(e.target.value as any)}
                className="bg-slate-900 border border-slate-700 text-slate-200 text-xs rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-emerald-500 font-medium"
              >
                <option value="auto">Default (from .env)</option>
                <option value="api">Google AI Studio API (gemma-4-26b-a4b-it)</option>
                <option value="local">Local Ollama (gemma4:e2b fallback)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Quick Example Presets */}
        <div className="mb-6">
          <div className="flex items-center space-x-2 text-xs text-slate-400 mb-2 font-medium">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>Load a representative graduate research case study:</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {PRESETS.map((preset) => (
              <button
                key={preset.id}
                onClick={() => handleApplyPreset(preset)}
                className="text-left p-3 rounded-xl bg-slate-900/60 border border-slate-800/80 hover:border-emerald-500/50 hover:bg-slate-800/40 transition group"
              >
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-xs text-slate-200 group-hover:text-emerald-300">
                    {preset.title}
                  </span>
                  <span className="text-[10px] uppercase font-bold px-1.5 py-0.5 rounded bg-slate-800 text-emerald-400">
                    {preset.degree}
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 mt-1 line-clamp-1 italic">{preset.species}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Two-Column Layout: Input Form & Output */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Column: Model Parameters Form */}
          <div className="lg:col-span-5 bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-5">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h2 className="text-base font-bold text-white flex items-center space-x-2">
                <FileText className="w-4 h-4 text-emerald-400" />
                <span>Research Project Parameters</span>
              </h2>
              <span className="text-xs text-slate-400 font-mono">Darwin Core / SDM</span>
            </div>

            <form onSubmit={handleGenerate} className="space-y-4">
              {/* Target Species */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Target Species (Scientific & Common Name)
                </label>
                <input
                  type="text"
                  required
                  value={speciesName}
                  onChange={(e) => setSpeciesName(e.target.value)}
                  placeholder="e.g. Panthera uncia (Snow Leopard) or Aedes albopictus"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              {/* Degree Level & Tools in 2 cols */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Academic Degree</label>
                  <select
                    value={degreeLevel}
                    onChange={(e) => setDegreeLevel(e.target.value as any)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="MSc">Master of Science (M.Sc.)</option>
                    <option value="PhD">Doctor of Philosophy (Ph.D.)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Preferred Environment</label>
                  <select
                    value={toolPreference}
                    onChange={(e) => setToolPreference(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="R (biomod2 and terra)">R (biomod2 & terra)</option>
                    <option value="R (sdm and raster)">R (sdm & raster)</option>
                    <option value="R (dismo and MaxEnt)">R (dismo & MaxEnt)</option>
                    <option value="Python (scikit-learn and rasterio)">Python (scikit-learn)</option>
                    <option value="MaxEnt Standalone Java GUI">MaxEnt Standalone GUI</option>
                  </select>
                </div>
              </div>

              {/* Study Region */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Study Region / Geographic Scope
                </label>
                <input
                  type="text"
                  required
                  value={studyRegion}
                  onChange={(e) => setStudyRegion(e.target.value)}
                  placeholder="e.g. Eastern Himalayas, Mediterranean Basin, Albertine Rift"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              {/* Research Goal */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Primary Research Objective / Hypothesis
                </label>
                <textarea
                  rows={2}
                  value={researchGoal}
                  onChange={(e) => setResearchGoal(e.target.value)}
                  placeholder="e.g. Quantify climate change impact on altitudinal habitat shifts under SSP scenarios by 2070"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none"
                />
              </div>

              {/* Available Occurrence Data */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Occurrence Data & Sampling Strategy
                </label>
                <textarea
                  rows={2}
                  value={dataAvailable}
                  onChange={(e) => setDataAvailable(e.target.value)}
                  placeholder="e.g. 350 GPS camera trap locations (presence-only), GBIF herbarium records, field transects"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none"
                />
              </div>

              {/* Candidate Environmental Predictors */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Candidate Environmental & Spatial Predictors
                </label>
                <textarea
                  rows={2}
                  value={predictors}
                  onChange={(e) => setPredictors(e.target.value)}
                  placeholder="e.g. WorldClim Bio1-Bio19, CHELSA, 30m DEM elevation, slope, aspect, NDVI, human footprint"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none"
                />
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isGenerating}
                className={`w-full py-3 px-4 rounded-xl font-semibold text-sm flex items-center justify-center space-x-2 transition shadow-lg ${
                  isGenerating
                    ? "bg-slate-800 text-slate-400 cursor-not-allowed"
                    : "bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-600/20 active:scale-[0.99]"
                }`}
              >
                {isGenerating ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Analyzing & Synthesizing SDM Protocols with Gemma 4...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 text-emerald-200" />
                    <span>Generate Complete SDM & Analysis Guide</span>
                  </>
                )}
              </button>
            </form>

            {/* Error Banner */}
            {errorMessage && (
              <div className="p-4 rounded-xl bg-red-950/50 border border-red-800/80 text-red-200 text-xs flex items-start space-x-3">
                <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <div className="font-semibold text-red-300">Generation Notice</div>
                  <p className="leading-relaxed">{errorMessage}</p>
                </div>
              </div>
            )}

            {/* Smoke test info box */}
            <div className="pt-2 border-t border-slate-800/80 text-xs text-slate-400 flex items-center justify-between">
              <span className="flex items-center space-x-1.5">
                <Terminal className="w-3.5 h-3.5 text-slate-500" />
                <span>Smoke test verification script:</span>
              </span>
              <code className="bg-slate-950 px-2 py-0.5 rounded text-[11px] text-emerald-400 border border-slate-800">
                npm run smoke
              </code>
            </div>
          </div>

          {/* Right Column: Output & Guide Display */}
          <div className="lg:col-span-7 space-y-6">
            {/* Guide Card */}
            <div className="bg-slate-900/90 border border-slate-800 rounded-2xl shadow-xl overflow-hidden flex flex-col min-h-[580px]">
              {/* Output Header */}
              <div className="border-b border-slate-800 px-6 py-4 bg-slate-900/50 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center space-x-2">
                  <FileText className="w-4 h-4 text-emerald-400" />
                  <span className="font-bold text-sm text-white">Species Distribution Modeling Protocol</span>
                  {metaInfo && (
                    <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-emerald-950/80 text-emerald-400 border border-emerald-800/60">
                      {metaInfo.model} ({Math.round(metaInfo.duration / 100) / 10}s)
                    </span>
                  )}
                </div>

                {guideOutput && (
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={copyToClipboard}
                      className="px-3 py-1.5 text-xs font-medium rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 flex items-center space-x-1.5 transition"
                      title="Copy guide markdown"
                    >
                      {copied ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                          <span>Copied!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          <span>Copy</span>
                        </>
                      )}
                    </button>

                    <button
                      onClick={downloadGuide}
                      className="px-3 py-1.5 text-xs font-medium rounded-lg bg-emerald-950/80 hover:bg-emerald-900/80 text-emerald-300 border border-emerald-800/80 flex items-center space-x-1.5 transition"
                      title="Download Markdown file"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Download .md</span>
                    </button>
                  </div>
                )}
              </div>

              {/* Output Body */}
              <div className="p-6 flex-1 flex flex-col">
                {isGenerating ? (
                  <div className="flex-1 flex flex-col items-center justify-center py-16 text-center space-y-4">
                    <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center animate-pulse">
                      <Sparkles className="w-6 h-6 text-emerald-400 animate-spin" />
                    </div>
                    <div className="space-y-1">
                      <h3 className="font-semibold text-white">Generating Research Protocol with Gemma 4</h3>
                      <p className="text-xs text-slate-400 max-w-sm">
                        Synthesizing Darwin Core field data recording formats, VIF multicollinearity thresholds, spatial
                        thinning protocols, and reproducible R code...
                      </p>
                    </div>
                  </div>
                ) : guideOutput ? (
                  <div className="prose prose-invert prose-slate max-w-none text-sm leading-relaxed overflow-y-auto max-h-[700px] pr-2">
                    {guideOutput.split("\n").map((line, idx) => {
                      if (line.startsWith("### ")) {
                        return (
                          <h3 key={idx} className="text-base font-bold text-emerald-400 mt-5 mb-2 flex items-center">
                            {line.replace("### ", "")}
                          </h3>
                        );
                      }
                      if (line.startsWith("## ")) {
                        return (
                          <h2
                            key={idx}
                            className="text-lg font-extrabold text-white mt-6 mb-3 pb-1 border-b border-slate-800"
                          >
                            {line.replace("## ", "")}
                          </h2>
                        );
                      }
                      if (line.startsWith("# ")) {
                        return (
                          <h1 key={idx} className="text-xl font-black text-white mt-4 mb-3">
                            {line.replace("# ", "")}
                          </h1>
                        );
                      }
                      if (line.startsWith("```")) {
                        return (
                          <div key={idx} className="text-xs font-mono text-emerald-300 py-1 font-semibold">
                            {line}
                          </div>
                        );
                      }
                      if (line.trim().startsWith("- ") || line.trim().startsWith("* ")) {
                        return (
                          <li key={idx} className="text-slate-300 ml-4 my-1">
                            {line.trim().replace(/^[-*]\s+/, "")}
                          </li>
                        );
                      }
                      return (
                        <p key={idx} className="text-slate-300 my-2 whitespace-pre-wrap">
                          {line}
                        </p>
                      );
                    })}
                  </div>
                ) : (
                  <div className="flex-1 flex flex-col items-center justify-center py-16 text-center space-y-4">
                    <div className="w-14 h-14 rounded-2xl bg-slate-800/60 border border-slate-700/60 flex items-center justify-center text-slate-400">
                      <Compass className="w-7 h-7 text-emerald-400" />
                    </div>
                    <div className="space-y-1">
                      <h3 className="font-semibold text-white">No Protocol Generated Yet</h3>
                      <p className="text-xs text-slate-400 max-w-md">
                        Enter your species research details on the left, or pick one of the case study presets above,
                        then click <strong>Generate Complete SDM & Analysis Guide</strong>.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Follow-up Question Assistant */}
            <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-white flex items-center space-x-2">
                  <MessageSquare className="w-4 h-4 text-emerald-400" />
                  <span>Ask Gemma 4 a Follow-up Question</span>
                </h3>
                <span className="text-[11px] text-slate-400">Statistical & Technical Advice</span>
              </div>

              <p className="text-xs text-slate-400">
                Stuck on a low AUC/TSS score, spatial thinning distance, or resolving high VIF among bioclimatic
                variables? Ask Gemma 4 for instant clarification.
              </p>

              <form onSubmit={handleAskQuestion} className="flex gap-2">
                <input
                  type="text"
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                  placeholder="e.g. How do I choose between TSS and AUC for presence-only data?"
                  className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
                <button
                  type="submit"
                  disabled={isAsking || !question.trim()}
                  className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center space-x-1.5 transition ${
                    isAsking || !question.trim()
                      ? "bg-slate-800 text-slate-500 cursor-not-allowed"
                      : "bg-emerald-600 hover:bg-emerald-500 text-white"
                  }`}
                >
                  {isAsking ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                  <span>Ask</span>
                </button>
              </form>

              {/* Q&A Thread */}
              {qaHistory.length > 0 && (
                <div className="space-y-3 pt-2 max-h-64 overflow-y-auto">
                  {qaHistory.map((item, index) => (
                    <div key={index} className="bg-slate-950 border border-slate-800/80 rounded-xl p-3 text-xs space-y-2">
                      <div className="font-semibold text-emerald-300 flex items-center justify-between">
                        <span>Q: {item.q}</span>
                        <span className="text-[10px] text-slate-500 font-mono">{item.time}</span>
                      </div>
                      <div className="text-slate-300 whitespace-pre-wrap leading-relaxed border-t border-slate-800/60 pt-2">
                        {item.a}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-900 bg-slate-950 py-6 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <div>
            EcoNiche Gemma &bull; Powered by Google Gemma 4 &bull; Tailored for MSc & PhD Research in Ecology
          </div>
          <div className="flex items-center space-x-4">
            <span>Provider: {activeProviderName}</span>
            <span>&bull;</span>
            <span>Local Fallback: Ollama ({status?.ollamaModel || "gemma4:e2b"})</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
