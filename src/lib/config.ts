import { readFileSync } from "fs";
import path from "path";
import { z } from "zod";

const maturitySchema = z.object({
  scaleName: z.string(),
  dimensions: z.array(z.object({ id: z.string().min(1), name: z.string().min(1) })),
  stages: z.array(z.object({ stage: z.number().int().min(1).max(5), name: z.string(), description: z.string(), tells: z.array(z.string()) })),
});
const sectionSchema = z.enum(["company", "maturity", "tools", "pains", "business_case"]);
const industryPackSchema = z.object({
  industry: z.string(), displayName: z.string(), valueDrivers: z.array(z.string()),
  painArchetypes: z.array(z.object({ name: z.string(), description: z.string(), listenFor: z.array(z.string()) })),
  discoveryQuestions: z.array(z.object({ section: sectionSchema, question: z.string(), why: z.string() })),
});
export type MaturityConfig = z.infer<typeof maturitySchema>;
export type IndustryPack = z.infer<typeof industryPackSchema>;
export function loadMaturityConfig(): MaturityConfig { return maturitySchema.parse(JSON.parse(readFileSync(path.join(process.cwd(), "config/maturity.json"), "utf8"))); }
export function loadIndustryPack(industry: string): { pack: IndustryPack | null; warning?: string } {
  try {
    const pack = industryPackSchema.parse(JSON.parse(readFileSync(path.join(process.cwd(), `config/industry-packs/${industry}.json`), "utf8")));
    if (pack.industry !== industry) return { pack: null, warning: `Industry pack ${industry}.json has mismatched industry.` };
    return { pack };
  } catch (error) { return { pack: null, warning: `Industry guide for ${industry} is missing or invalid.` }; }
}
