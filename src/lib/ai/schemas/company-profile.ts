import { z } from "zod";

export const companyProfileSchema = z.object({
  companyOverview: z.string(),
  businessSegments: z.array(z.object({ name: z.string(), description: z.string(), relevanceToPlanning: z.string() })),
  manufacturingFootprint: z.string(),
  supplyChainCharacteristics: z.object({ demandPattern: z.string(), productComplexity: z.string(), networkComplexity: z.string() }),
  currentSystems: z.array(z.object({ system: z.string(), role: z.string(), sentiment: z.enum(["pain", "neutral", "liked", "unknown"]) })),
  statedPainPoints: z.array(z.object({ pain: z.string(), evidence: z.string(), source: z.string(), severity: z.enum(["high", "medium", "low"]) })),
  strategicPriorities: z.array(z.string()),
  stakeholders: z.array(z.object({ name: z.string(), role: z.string(), disposition: z.string(), notes: z.string() })),
  openQuestions: z.array(z.string()),
  confidenceNotes: z.string(),
});

export type CompanyProfile = z.infer<typeof companyProfileSchema>;
