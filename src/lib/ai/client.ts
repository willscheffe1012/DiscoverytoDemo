import { ZodSchema } from "zod";

type Message = { role: "user" | "assistant"; content: string };

type CompleteOpts = { system: string; messages: Message[]; maxTokens?: number; temperature?: number };

export class AiClientError extends Error {
  constructor(message: string, public status?: number, public bodySnippet?: string) { super(message); this.name = "AiClientError"; }
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
const trimSlash = (value: string) => value.replace(/\/+$/, "");

function config() {
  const provider = process.env.AI_PROVIDER;
  const baseUrl = process.env.AI_BASE_URL;
  const apiKey = process.env.AI_API_KEY;
  const model = process.env.AI_MODEL;
  if (provider !== "anthropic" && provider !== "openai_compatible") throw new AiClientError("AI_PROVIDER must be anthropic or openai_compatible");
  if (!baseUrl || !apiKey || !model) throw new AiClientError("AI_BASE_URL, AI_API_KEY, and AI_MODEL are required");
  let extraHeaders: Record<string, string> = {};
  const rawExtra = process.env.AI_EXTRA_HEADERS;
  if (rawExtra?.trim()) {
    try {
      const parsed = JSON.parse(rawExtra) as unknown;
      if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) throw new Error("AI_EXTRA_HEADERS must be a JSON object");
      extraHeaders = Object.fromEntries(Object.entries(parsed).map(([key, value]) => [key, String(value)]));
    } catch (error) {
      throw new AiClientError(`AI_EXTRA_HEADERS must be valid JSON object: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
  const authHeader = process.env.AI_AUTH_HEADER || "x-api-key";
  return { provider, baseUrl: trimSlash(baseUrl), apiKey, model, authHeader, extraHeaders };
}

async function postJson(url: string, headers: Record<string, string>, body: unknown, attempt = 0): Promise<unknown> {
  const res = await fetch(url, { method: "POST", headers: { "content-type": "application/json", ...headers }, body: JSON.stringify(body) });
  if (!res.ok) {
    const snippet = (await res.text()).slice(0, 800);
    if (attempt === 0 && (res.status === 429 || res.status >= 500)) { await sleep(2000); return postJson(url, headers, body, 1); }
    throw new AiClientError(`LLM request failed with status ${res.status}`, res.status, snippet);
  }
  return res.json();
}

function normalizeAnthropic(json: unknown): string {
  const content = (json as { content?: Array<{ type?: string; text?: string }> }).content;
  const text = content?.find((part) => part.type === "text" && typeof part.text === "string")?.text;
  if (!text) throw new AiClientError("Anthropic response did not include text content");
  return text;
}

function normalizeOpenAi(json: unknown): string {
  const choices = (json as { choices?: Array<{ message?: { content?: string } }> }).choices;
  const text = choices?.[0]?.message?.content;
  if (!text) throw new AiClientError("OpenAI-compatible response did not include message content");
  return text;
}

export async function complete(opts: CompleteOpts): Promise<string> {
  const { provider, baseUrl, apiKey, model, authHeader, extraHeaders } = config();
  const maxTokens = opts.maxTokens ?? 4000;
  const temperature = opts.temperature ?? 0.2;
  if (provider === "anthropic") {
    const anthropicAuthValue = authHeader.toLowerCase() === "authorization" ? `Bearer ${apiKey}` : apiKey;
    const json = await postJson(`${baseUrl}/v1/messages`, { ...extraHeaders, [authHeader]: anthropicAuthValue, "anthropic-version": "2023-06-01" }, { model, system: opts.system, messages: opts.messages, max_tokens: maxTokens, temperature });
    return normalizeAnthropic(json);
  }
  const json = await postJson(`${baseUrl}/chat/completions`, { ...extraHeaders, authorization: `Bearer ${apiKey}` }, { model, messages: [{ role: "system", content: opts.system }, ...opts.messages], max_tokens: maxTokens, temperature });
  return normalizeOpenAi(json);
}

const jsonShape = "Return a single JSON object matching the provided schema. Use strings for text fields and arrays for list fields.";
const stripFences = (value: string) => value.trim().replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "").trim();

export async function completeJson<T>(opts: CompleteOpts & { schema: ZodSchema<T> }): Promise<T> {
  const system = `${opts.system}\n\nRespond with only valid JSON matching this structure, no prose, no markdown fences. ${jsonShape}`;
  const first = await complete({ ...opts, system });
  try { return opts.schema.parse(JSON.parse(stripFences(first))); }
  catch (error) {
    const corrected = await complete({ ...opts, system, messages: [...opts.messages, { role: "assistant", content: first }, { role: "user", content: `The previous output was invalid JSON or failed schema validation. Error: ${String(error)}. Invalid output: ${first}. Return corrected JSON only.` }] });
    return opts.schema.parse(JSON.parse(stripFences(corrected)));
  }
}
