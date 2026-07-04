const BASE_URL = "https://sodeom.com/v1";
const MODEL = "gpt-4o";

export class SodeomError extends Error {
  constructor(
    message: string,
    public status?: number,
    public code?: string,
  ) {
    super(message);
    this.name = "SodeomError";
  }
}

export async function createCompletion(
  messages: { role: "system" | "user" | "assistant"; content: string }[],
  systemPrompt?: string,
): Promise<string> {
  const apiKey = process.env.SODEOM_API_KEY;

  if (!apiKey) {
    throw new SodeomError(
      "SODEOM_API_KEY is not configured",
      500,
      "missing_api_key",
    );
  }

  const body: Record<string, unknown> = {
    model: MODEL,
    messages: systemPrompt
      ? [{ role: "system" as const, content: systemPrompt }, ...messages]
      : messages,
    temperature: 0.7,
    max_tokens: 4096,
  };

  console.log(`[Sodeom] Sending request with ${messages.length} message(s)`);

  const response = await fetch(`${BASE_URL}/chat/completions`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    let errorBody: string | undefined;
    try {
      errorBody = await response.text();
    } catch {
      /* ignore parse failure */
    }
    console.error(
      `[Sodeom] API error: ${response.status}`,
      errorBody ?? "",
    );

    if (response.status === 429) {
      throw new SodeomError("Rate limit exceeded", 429, "rate_limit");
    }
    if (response.status === 401) {
      throw new SodeomError("Invalid API key", 401, "auth_error");
    }
    if (response.status >= 500) {
      throw new SodeomError(
        `Sodeom server error: ${response.status}`,
        response.status,
        "server_error",
      );
    }

    throw new SodeomError(
      `Request failed: ${response.status} ${errorBody ?? ""}`,
      response.status,
      "request_failed",
    );
  }

  const data: unknown = await response.json();

  if (!data || typeof data !== "object") {
    throw new SodeomError("Invalid response format", 500, "parse_error");
  }

  const responseData = data as Record<string, unknown>;
  const choices = responseData.choices;

  if (!Array.isArray(choices) || choices.length === 0) {
    throw new SodeomError("No choices in response", 500, "empty_choices");
  }

  const firstChoice = choices[0];
  if (!firstChoice || typeof firstChoice !== "object") {
    throw new SodeomError("Invalid choice format", 500, "parse_error");
  }

  const message = (firstChoice as Record<string, unknown>).message;
  if (!message || typeof message !== "object") {
    throw new SodeomError("No message in choice", 500, "parse_error");
  }

  const content = (message as Record<string, unknown>).content;
  if (typeof content !== "string") {
    throw new SodeomError("No text content in response", 500, "parse_error");
  }

  console.log(
    `[Sodeom] Response received: ${content.length} chars, tokens: ${(responseData.usage as Record<string, number>)?.total_tokens ?? "unknown"}`,
  );

  return content;
}

export async function createCompletionWithRetry(
  messages: { role: "system" | "user" | "assistant"; content: string }[],
  systemPrompt?: string,
  maxRetries = 1,
): Promise<string> {
  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      if (attempt > 0) {
        console.log(
          `[Sodeom] Retry attempt ${attempt}/${maxRetries}...`,
        );
        await new Promise((resolve) =>
          setTimeout(resolve, 1000 * attempt),
        );
      }
      return await createCompletion(messages, systemPrompt);
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      if (error instanceof SodeomError) {
        if (
          error.code === "auth_error" ||
          error.code === "missing_api_key"
        ) {
          throw error;
        }
        if (error.code === "rate_limit" && attempt < maxRetries) {
          const waitMs = 2000 * (attempt + 1);
          console.log(`[Sodeom] Rate limited, waiting ${waitMs}ms...`);
          await new Promise((resolve) => setTimeout(resolve, waitMs));
          continue;
        }
      }

      if (attempt < maxRetries) {
        console.log(
          `[Sodeom] Attempt ${attempt + 1} failed, retrying...`,
        );
        continue;
      }
    }
  }

  throw lastError ?? new SodeomError("Max retries exceeded", 500);
}
