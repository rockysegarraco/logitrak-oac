import { createOpenAI } from "@ai-sdk/openai";
import { Output, streamText } from "ai";
import { z } from "zod";

const GATEWAY = "https://ai.gateway.lovable.dev/v1";
const MODEL = "openai/gpt-6-astra";

export const extractionSchema = z.object({
  current_status: z.string().describe("One short line describing where the shipment stands right now"),
  key_events: z
    .array(
      z.object({
        date: z.string().nullable().describe("Date/time as written, or null if none given"),
        event: z.string(),
      }),
    )
    .describe("Notable events mentioned, in chronological order"),
  follow_ups: z
    .array(
      z.object({
        action: z.string(),
        owner: z.string().nullable().describe("Who should do it, if stated"),
        due: z.string().nullable().describe("Due date if stated"),
      }),
    )
    .describe("Concrete follow-up actions someone needs to take"),
});

export type Extraction = z.infer<typeof extractionSchema>;

const INSTRUCTIONS = `You help trade-show freight managers. Read a free-text shipment update and extract:
- current_status: a concise current status (e.g. "In transit, arriving at show dock Thursday").
- key_events: each notable event with its date if mentioned.
- follow_ups: concrete actions still needed.
Only use facts in the update. Do not invent dates, people or events. Use empty arrays when nothing applies.`;

export async function extractShipmentUpdate(text: string, context: string): Promise<Extraction> {
  const apiKey = process.env.LOVABLE_API_KEY;
  if (!apiKey) throw new Error("AI is not configured for this app.");
  const provider = createOpenAI({
    baseURL: GATEWAY,
    apiKey,
    headers: { "Lovable-API-Key": apiKey, "X-Lovable-AIG-SDK": "vercel-ai-sdk" },
  });
  const result = streamText({
    model: provider.responses(MODEL),
    system: INSTRUCTIONS,
    messages: [{ role: "user", content: `Shipment: ${context}\n\nUpdate:\n${text}` }],
    output: Output.object({ schema: extractionSchema }),
    maxRetries: 0,
    providerOptions: {
      openai: {
        forceReasoning: true,
        reasoningEffort: "low",
        reasoningSummary: "auto",
        store: false,
        include: ["reasoning.encrypted_content"],
      },
    },
  });
  try {
    return await result.output;
  } catch (err) {
    const status = (err as { statusCode?: number })?.statusCode;
    if (status === 402) throw new Error("AI credits are used up. Add credits in Settings → Plans & credits.");
    if (status === 429) throw new Error("Too many AI requests right now. Please wait a moment and try again.");
    if (status === 403) throw new Error("AI access is blocked for this workspace.");
    throw new Error("Couldn't read that update. Please try again.");
  }
}
