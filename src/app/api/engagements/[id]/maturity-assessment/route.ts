import { NextResponse } from "next/server";
import { and, desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { artifacts } from "@/db/schema";
import { completeJson } from "@/lib/ai/client";
import { buildEngagementContext } from "@/lib/ai/context";
import { maturityAssessmentPrompt } from "@/lib/ai/prompts/maturity-assessment";
import { maturityAssessmentSchema } from "@/lib/ai/schemas/maturity-assessment";
import { loadMaturityConfig } from "@/lib/config";

export async function POST(_request: Request, { params }: { params: { id: string } }) {
  try {
    const engagementId = Number(params.id);
    const config = loadMaturityConfig();
    const raw = await completeJson({
      system: maturityAssessmentPrompt,
      messages: [{ role: "user", content: buildEngagementContext(engagementId, true) }],
      maxTokens: 3500,
      temperature: 0.2,
      schema: maturityAssessmentSchema,
    });
    const byDim = Object.fromEntries(raw.dimensions.map((d) => [d.dimensionId, d]));
    const content = { ...raw, dimensions: config.dimensions.map((d) => byDim[d.id] ?? { dimensionId: d.id, proposedStage: null, rationale: "No evidence was provided for this dimension.", evidence: [], confidence: "low", unknowns: ["Capture evidence for this maturity dimension."] }) };
    const latest = db.select().from(artifacts).where(and(eq(artifacts.engagementId, engagementId), eq(artifacts.kind, "maturity_assessment"))).orderBy(desc(artifacts.version)).get();
    const artifact = db.insert(artifacts).values({ engagementId, kind: "maturity_assessment", version: (latest?.version ?? 0) + 1, contentJson: JSON.stringify(content), modelUsed: process.env.AI_MODEL ?? "unknown", createdAt: Date.now() }).returning().get();
    return NextResponse.json({ artifact });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? `${error.message}${"bodySnippet" in error && error.bodySnippet ? `: ${error.bodySnippet}` : ""}` : "Maturity assessment failed" }, { status: 500 });
  }
}
