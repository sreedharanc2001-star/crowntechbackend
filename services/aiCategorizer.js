const OpenAI = require("openai");

const DEFAULT_CATEGORY = "general";
const CACHE_TTL_MS = 5 * 60 * 1000;
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
const CATEGORY_SET = new Set([
  "screen",
  "battery",
  "software",
  "water",
  "speaker",
  "camera",
  "network",
  "ports",
  "general",
]);
const resultCache = new Map();
const OPENAI_MODEL = process.env.OPENAI_MODEL || "gpt-4o-mini";
const openaiClient = process.env.OPENAI_API_KEY
  ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  : null;

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
      "Classify device repair issue into exactly one label: " +
      "screen, battery, software, water, speaker, camera, network, ports, general. " +
      "Return only the label text with no JSON and no extra words.",
  },
  {
    role: "user",
    content: `Issue description: ${issueText}`,
  },
];
const normalizeModelCategory = (text) => {
  const raw = String(text || "").toLowerCase().trim();
  if (CATEGORY_SET.has(raw)) {
    return raw;
  }
  const token = raw.split(/[\s,.:;!?()[\]{}"'`|/-]+/).find((part) => CATEGORY_SET.has(part));
  return token || "";
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

  if (!openaiClient) {
    return {
      category: findKeywordCategory(normalized),
      confidence: null,
      notes: "OPENAI_API_KEY not set; used keyword fallback.",
      source: "fallback",
    };
  }

  const cacheKey = normalized.toLowerCase();
  const cached = resultCache.get(cacheKey);
  if (cached && cached.expiresAt > Date.now()) {
    return cached.value;
  }

  try {
    const response = await openaiClient.responses.create({
      model: OPENAI_MODEL,
      input: buildPrompt(normalized),
      temperature: 0,
      max_output_tokens: 20,
    });

    const text = response.output_text || "";
    const category = normalizeModelCategory(text);
    const value = category
      ? {
          category,
          confidence: null,
          notes: "",
          source: "openai",
        }
      : {
          category: findKeywordCategory(normalized),
          confidence: null,
          notes: "Unable to parse model response; used keyword fallback.",
          source: "fallback",
        };
    resultCache.set(cacheKey, { value, expiresAt: Date.now() + CACHE_TTL_MS });

    return value;
  } catch (err) {
    console.error("OpenAI classify failed:", err?.message || err);
    return {
      category: findKeywordCategory(normalized),
      confidence: null,
      notes: "OpenAI request failed; used keyword fallback.",
      source: "fallback",
    };
  }
};

module.exports = { categorizeIssue, findKeywordCategory };
