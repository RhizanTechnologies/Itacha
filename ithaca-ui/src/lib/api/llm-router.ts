/**
 * LLM Provider Abstraction
 *
 * Defines a common interface for LLM providers (Gemini, Groq, etc.)
 * and a router that falls back between them when rate limits are hit.
 */

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

export class GeminiProvider implements ILLMProvider {
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

    const url = `https://generativelanguage.googleapis.com/v1beta/models/${this.model}:generateContent?key=${this.apiKey}`;

    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
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

export class GroqProvider implements ILLMProvider {
  readonly name = "groq";
  readonly model: string;
  private apiKey: string;
  private rateLimiter: RateLimiter;

  constructor(apiKey: string, model = "llama-3.3-70b-versatile") {
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
      if (response.status === 429) {
        throw new Error("Groq rate limit reached");
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
}

// =============================================================================
// LLM ROUTER (Tries providers in order, falls back on rate limit)
// =============================================================================

export class LLMRouter {
  private providers: ILLMProvider[] = [];

  constructor(providers: ILLMProvider[]) {
    // Filter out providers without API keys
    this.providers = providers.filter((p) => p.isAvailable() || true);
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
        errors.push(`${provider.name}: ${msg}`);

        // If it's a rate limit error, try the next provider
        if (msg.includes("rate limit")) {
          continue;
        }

        // For other errors, also try the next provider
        continue;
      }
    }

    throw new Error(`All LLM providers exhausted:\n${errors.join("\n")}`);
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

    // Primary: Gemini (most generous free tier)
    const geminiKey = process.env.GEMINI_API_KEY;
    if (geminiKey) {
      providers.push(new GeminiProvider(geminiKey));
    }

    // Fallback: Groq
    const groqKey = process.env.GROQ_API_KEY;
    if (groqKey) {
      providers.push(new GroqProvider(groqKey));
    }

    if (providers.length === 0) {
      console.warn(
        "[LLM Router] No API keys configured. Set GEMINI_API_KEY or GROQ_API_KEY in .env",
      );
    }

    _router = new LLMRouter(providers);
  }

  return _router;
}
