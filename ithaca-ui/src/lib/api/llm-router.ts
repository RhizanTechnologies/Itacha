/**
 * LLM Provider Abstraction
 *
 * Defines a common interface for LLM providers (Gemini, Groq, etc.)
 * and a router that falls back between them when rate limits are hit.
 */

import {
  analyzeStance,
  cleanCitationSentence,
  LOCAL_PROVIDER_NAME,
  LOCAL_MODEL_NAME,
} from "./local-classifier";

// =============================================================================
// TYPES
// =============================================================================

export interface LLMMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface LLMResponse {
  content: string;
  model: string;
  provider: string;
}

export interface LLMProviderConfig {
  name: string;
  apiKey: string;
  model: string;
  baseUrl: string;
  /** Max requests per minute for this provider */
  rpm: number;
  /** Max requests per day for this provider */
  rpd: number;
}

export interface ILLMProvider {
  readonly name: string;
  readonly model: string;
  chat(messages: LLMMessage[], jsonMode?: boolean): Promise<LLMResponse>;
  isAvailable(): boolean;
}

// =============================================================================
// RATE LIMITER (Simple sliding window)
// =============================================================================

class RateLimiter {
  private timestamps: number[] = [];
  private dailyCount = 0;
  private lastDayReset = Date.now();

  constructor(
    private rpm: number,
    private rpd: number,
  ) {}

  canProceed(): boolean {
    const now = Date.now();

    // Reset daily counter at midnight
    if (now - this.lastDayReset > 86_400_000) {
      this.dailyCount = 0;
      this.lastDayReset = now;
    }

    // Check daily limit
    if (this.rpd > 0 && this.dailyCount >= this.rpd) {
      return false;
    }

    // Check per-minute limit (sliding window)
    const oneMinuteAgo = now - 60_000;
    this.timestamps = this.timestamps.filter((t) => t > oneMinuteAgo);
    if (this.rpm > 0 && this.timestamps.length >= this.rpm) {
      return false;
    }

    return true;
  }

  record(): void {
    this.timestamps.push(Date.now());
    this.dailyCount++;
  }

  get remaining(): { minute: number; daily: number } {
    const now = Date.now();
    const oneMinuteAgo = now - 60_000;
    const recentCount = this.timestamps.filter((t) => t > oneMinuteAgo).length;
    return {
      minute: Math.max(0, this.rpm - recentCount),
      daily: Math.max(0, this.rpd - this.dailyCount),
    };
  }
}

// =============================================================================
// GEMINI PROVIDER (Primary — 1,500 req/day free)
// =============================================================================

class GeminiProvider implements ILLMProvider {
  readonly name = "gemini";
  readonly model: string;
  private apiKey: string;
  private rateLimiter: RateLimiter;

  constructor(apiKey: string, model = "gemini-2.0-flash") {
    this.apiKey = apiKey;
    this.model = model;
    // Free tier: 15 RPM, 1,500 RPD
    this.rateLimiter = new RateLimiter(14, 1450); // Leave slight buffer
  }

  isAvailable(): boolean {
    return !!this.apiKey && this.rateLimiter.canProceed();
  }

  async chat(messages: LLMMessage[], jsonMode = false): Promise<LLMResponse> {
    if (!this.rateLimiter.canProceed()) {
      throw new Error("Gemini rate limit reached");
    }

    // Convert OpenAI-style messages to Gemini format
    const systemInstruction = messages.find((m) => m.role === "system");
    const userMessages = messages.filter((m) => m.role !== "system");

    const body: Record<string, unknown> = {
      contents: userMessages.map((m) => ({
        role: m.role === "assistant" ? "model" : "user",
        parts: [{ text: m.content }],
      })),
    };

    if (systemInstruction) {
      body.systemInstruction = {
        parts: [{ text: systemInstruction.content }],
      };
    }

    // Generation config
    const generationConfig: Record<string, unknown> = {
      temperature: 0,
      maxOutputTokens: 256,
    };

    if (jsonMode) {
      generationConfig.responseMimeType = "application/json";
    }

    body.generationConfig = generationConfig;

    const url = `https://generativelanguage.googleapis.com/v1beta/models/${this.model}:generateContent`;

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": this.apiKey,
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const error = await response.text();
      if (response.status === 429) {
        throw new Error("Gemini rate limit reached");
      }
      throw new Error(`Gemini API error (${response.status}): ${error}`);
    }

    const data = await response.json();
    const content = data.candidates?.[0]?.content?.parts?.[0]?.text || "";

    this.rateLimiter.record();

    return {
      content,
      model: this.model,
      provider: this.name,
    };
  }
}

// =============================================================================
// GROQ PROVIDER (Fallback — ~30 RPM free)
// =============================================================================

class GroqProvider implements ILLMProvider {
  readonly name = "groq";
  readonly model: string;
  private apiKey: string;
  private rateLimiter: RateLimiter;

  constructor(
    apiKey: string,
    model = process.env.GROQ_MODEL || "qwen/qwen3.8-27b",
  ) {
    this.apiKey = apiKey;
    this.model = model;
    // Free tier: ~30 RPM, ~14,400 RPD (varies)
    this.rateLimiter = new RateLimiter(25, 14000);
  }

  isAvailable(): boolean {
    return !!this.apiKey && this.rateLimiter.canProceed();
  }

  async chat(messages: LLMMessage[], jsonMode = false): Promise<LLMResponse> {
    if (!this.rateLimiter.canProceed()) {
      throw new Error("Groq rate limit reached");
    }

    const body: Record<string, unknown> = {
      model: this.model,
      messages,
      temperature: 0,
      max_tokens: 256,
    };

    if (jsonMode) {
      body.response_format = { type: "json_object" };
    }

    const maxRetries = 2;
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      const response = await fetch(
        "https://api.groq.com/openai/v1/chat/completions",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${this.apiKey}`,
          },
          body: JSON.stringify(body),
        },
      );

      if (!response.ok) {
        const error = await response.text();
        if (
          (response.status === 429 || response.status === 503) &&
          attempt < maxRetries
        ) {
          const waitMs = 1500 * (attempt + 1);
          await new Promise((r) => setTimeout(r, waitMs));
          continue;
        }
        if (response.status === 429) {
          throw new Error(`Groq rate limit reached: ${error}`);
        }
        throw new Error(`Groq API error (${response.status}): ${error}`);
      }

      const data = await response.json();
      const content = data.choices?.[0]?.message?.content || "";

      this.rateLimiter.record();

      return {
        content,
        model: this.model,
        provider: this.name,
      };
    }

    throw new Error("Groq API failed after retries");
  }
}

// =============================================================================
// LOCAL SOVEREIGN MOAT PROVIDER (Zero FX, 100% Offline, sub-15ms)
// =============================================================================

export class LocalMoatProvider implements ILLMProvider {
  readonly name = LOCAL_PROVIDER_NAME;
  readonly model = LOCAL_MODEL_NAME;

  isAvailable(): boolean {
    return true; // Always available locally on CPU
  }

  async chat(messages: LLMMessage[], jsonMode = false): Promise<LLMResponse> {
    const userMessage = messages.find((m) => m.role === "user")?.content || "";

    // Extract citation context if present
    let claim = "";
    const contextMatch = userMessage.match(
      /CITATION CONTEXT SENTENCES[^\n]*\n([\s\S]*?)(?:\n\n|\n[A-Z]|$)/i,
    );
    if (contextMatch) {
      claim = cleanCitationSentence(contextMatch[1]);
    } else {
      const abstractMatch = userMessage.match(/Abstract:\s*([^\n]+)/i);
      if (abstractMatch) {
        claim = cleanCitationSentence(abstractMatch[1]);
      }
    }

    const citingTitleMatch = userMessage.match(/CITING PAPER:\s*"([^"]+)"/i);
    const citingTitle = citingTitleMatch ? citingTitleMatch[1] : "";

    const intents: string[] = [];
    if (userMessage.includes("ResultComparison"))
      intents.push("ResultComparison");
    if (userMessage.includes("Methodology")) intents.push("Methodology");
    if (userMessage.includes("Background")) intents.push("Background");

    const analysis = analyzeStance(claim, citingTitle, userMessage, intents);

    if (jsonMode) {
      return {
        content: JSON.stringify({
          edgeType: analysis.stance,
          confidence: analysis.confidence,
          snippet: analysis.snippet,
        }),
        model: this.model,
        provider: this.name,
      };
    }

    return {
      content: analysis.snippet,
      model: this.model,
      provider: this.name,
    };
  }
}

// =============================================================================
// LLM ROUTER (Tries providers in order, falls back on rate limit)
// =============================================================================

export class LLMRouter {
  private providers: ILLMProvider[] = [];

  constructor(providers: ILLMProvider[]) {
    // Filter out providers that are unavailable
    this.providers = providers.filter((p) => p.isAvailable());
  }

  /**
   * Try each provider in order. If one hits a rate limit, fall back to the next.
   */
  async chat(messages: LLMMessage[], jsonMode = false): Promise<LLMResponse> {
    const errors: string[] = [];

    for (const provider of this.providers) {
      if (!provider.isAvailable()) {
        errors.push(`${provider.name}: rate limit reached (skipped)`);
        continue;
      }

      try {
        return await provider.chat(messages, jsonMode);
      } catch (error) {
        const msg = error instanceof Error ? error.message : "Unknown error";
        console.warn(
          `[LLM Router] Provider "${provider.name}" failed: ${msg}. Trying next provider in chain...`,
        );
        errors.push(`${provider.name}: ${msg}`);

        // If it's a rate limit error or any other error, try the next provider
        continue;
      }
    }

    throw new Error(`All LLM providers exhausted:\n${errors.join("\n")}`);
  }

  /** Check if at least one provider is configured and available */
  isAvailable(): boolean {
    return this.providers.some((p) => p.isAvailable());
  }

  /** Get status of all providers */
  getStatus(): { name: string; model: string; available: boolean }[] {
    return this.providers.map((p) => ({
      name: p.name,
      model: p.model,
      available: p.isAvailable(),
    }));
  }
}

// =============================================================================
// SINGLETON (Create once, reuse across API routes)
// =============================================================================

let _router: LLMRouter | null = null;

export function getLLMRouter(): LLMRouter {
  if (!_router) {
    const providers: ILLMProvider[] = [];

    const preferLocal =
      process.env.CLASSIFIER_MODE === "local" ||
      process.env.AI_PROVIDER_PREFERENCE === "local";

    const localProvider = new LocalMoatProvider();

    if (preferLocal) {
      providers.push(localProvider);
    }

    // Primary external: Gemini (most generous free tier)
    const geminiKey = process.env.GEMINI_API_KEY;
    if (geminiKey) {
      providers.push(new GeminiProvider(geminiKey));
    }

    // Fallback external: Groq
    const groqKey = process.env.GROQ_API_KEY;
    if (groqKey) {
      providers.push(new GroqProvider(groqKey));
    }

    // If local was not prioritized first, append it as guaranteed sovereign fallback
    if (!preferLocal) {
      providers.push(localProvider);
    }

    _router = new LLMRouter(providers);
  }

  return _router;
}

export function resetLLMRouterForTesting(): void {
  _router = null;
}
