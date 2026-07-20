import { z } from "zod";

export const solutionFitSchema = z.object({
  licensingContext: z.enum(["legacy", "new", "unknown"]),
  needs: z.array(
    z.object({
      need: z.string().min(1),
      evidence: z.array(
        z.object({ quote: z.string().min(1), source: z.string().min(1) }),
      ),
      capabilities: z.array(
        z.object({
          capabilityId: z.string().min(1),
          fit: z.enum(["strong", "possible", "premature", "disqualified"]),
          rationale: z.string().min(1),
          unknowns: z.array(z.string()),
          conversationAngle: z.string().min(1),
        }),
      ),
    }),
  ),
  cautions: z.array(z.string()),
  narrative: z.string().min(1),
});
export type SolutionFit = z.infer<typeof solutionFitSchema>;
