import { z } from "zod";

export const maturityAssessmentSchema = z.object({
  dimensions: z.array(z.object({
    dimensionId: z.string().min(1),
    proposedStage: z.number().int().min(1).max(5).nullable(),
    rationale: z.string().min(1),
    evidence: z.array(z.object({ quote: z.string().min(1), source: z.string().min(1) })),
    confidence: z.enum(["high", "medium", "low"]),
    unknowns: z.array(z.string()),
  })),
  narrative: z.string().min(1),
});
export type MaturityAssessment = z.infer<typeof maturityAssessmentSchema>;
