import { z } from "zod";

export const questionGapsSchema = z.object({
  suggestions: z.array(z.object({
    question: z.string().min(1),
    rationale: z.string().min(1),
    section: z.enum(["company", "maturity", "tools", "pains", "business_case"]),
  })).min(1).max(10),
  coverageNotes: z.string().min(1),
});
export type QuestionGaps = z.infer<typeof questionGapsSchema>;
