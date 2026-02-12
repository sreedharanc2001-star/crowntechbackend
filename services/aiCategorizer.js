const OpenAI = require("openai");

const DEFAULT_CATEGORY = "general";
const CATEGORY_KEYWORDS = [
  { category: "screen", keywords: ["screen", "display", "crack", "cracked", "touch"] },
  { category: "battery", keywords: ["battery", "charging", "charge", "power"] },
  { category: "software", keywords: ["software", "update", "boot", "os", "virus", "hang"] },
  { category: "water", keywords: ["water", "liquid", "spill", "dropped in water"] },
  { category: "speaker", keywords: ["speaker", "sound", "audio"] },
  { category: "camera", keywords: ["camera", "lens", "blur"] },
  { category: "network", keywords: ["wifi", "network", "signal", "sim"] },
  { category: "ports", keywords: ["port", "charging port", "usb", "jack"] },
];

const findKeywordCategory = (text) => {
  const lower = text.toLowerCase();
  for (const entry of CATEGORY_KEYWORDS) {
    if (entry.keywords.some((kw) => lower.includes(kw))) {
      return entry.category;
    }
  }
  return DEFAULT_CATEGORY;
};

const buildPrompt = (issueText) => [
  {
    role: "system",
    content:
      "You are an assistant that classifies device repair issues into a single category. " +
      "Return JSON only with keys: category, confidence, notes. " +
      "Allowed categories: screen, battery, software, water, speaker, camera, network, ports, general.",
  },
  {
    role: "user",
    content: `Issue description: ${issueText}`,
  },
];

const parseJson = (text) => {
  try {
    return JSON.parse(text);
  } catch (_err) {
    return null;
  }
};

const normalizeResult = (payload) => {
  if (!payload || typeof payload !== "object") {
    return null;
  }
  const category = String(payload.category || "").toLowerCase().trim();
  const confidence = Number(payload.confidence);
  if (!category) {
    return null;
  }
  return {
    category,
    confidence: Number.isFinite(confidence) ? confidence : null,
    notes: typeof payload.notes === "string" ? payload.notes.trim() : "",
  };
};

const categorizeIssue = async (issueText) => {
  const normalized = String(issueText || "").trim();
  if (!normalized) {
    return {
      category: DEFAULT_CATEGORY,
      confidence: null,
      notes: "No issue text provided.",
      source: "fallback",
    };
  }

  if (!process.env.OPENAI_API_KEY) {
    return {
      category: findKeywordCategory(normalized),
      confidence: null,
      notes: "OPENAI_API_KEY not set; used keyword fallback.",
      source: "fallback",
    };
  }

  const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  const model = process.env.OPENAI_MODEL || "gpt-4.1-mini";

  try {
    const response = await client.responses.create({
      model,
      input: buildPrompt(normalized),
      temperature: 0,
      max_output_tokens: 100,
    });

    const text = response.output_text || "";
    const parsed = normalizeResult(parseJson(text));
    if (!parsed) {
      return {
        category: findKeywordCategory(normalized),
        confidence: null,
        notes: "Unable to parse model response; used keyword fallback.",
        source: "fallback",
      };
    }

    return {
      category: parsed.category,
      confidence: parsed.confidence,
      notes: parsed.notes,
      source: "openai",
    };
  } catch (_err) {
    return {
      category: findKeywordCategory(normalized),
      confidence: null,
      notes: "OpenAI request failed; used keyword fallback.",
      source: "fallback",
    };
  }
};

module.exports = { categorizeIssue };
