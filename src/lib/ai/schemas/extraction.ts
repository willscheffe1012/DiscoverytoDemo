import { z } from "zod";

export const extractionSchema = z.object({
  pains: z.array(z.object({ pain: z.string(), quote: z.string(), severity: z.enum(["high", "medium", "low"]) })),
  facts: z.array(z.object({ category: z.enum(["segment", "footprint", "demand_pattern", "product_complexity", "network_complexity", "volume", "other"]), content: z.string() })),
  systems: z.array(z.object({ system: z.string(), role: z.string(), sentiment: z.enum(["pain", "neutral", "liked", "unknown"]) })),
  openQuestions: z.array(z.object({ question: z.string() })),
  maturityEvidence: z.array(z.object({ dimensionId: z.string(), quote: z.string(), note: z.string() })),
});

export type ExtractionResult = z.infer<typeof extractionSchema>;
