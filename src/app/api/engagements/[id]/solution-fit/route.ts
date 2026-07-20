import { NextResponse } from "next/server";
import { and, desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { artifacts } from "@/db/schema";
import { completeJson } from "@/lib/ai/client";
import { buildEngagementContext } from "@/lib/ai/context";
import { solutionFitPrompt } from "@/lib/ai/prompts/solution-fit";
import { solutionFitSchema } from "@/lib/ai/schemas/solution-fit";
import { loadCapabilityCatalog } from "@/lib/config";

export async function POST(_request: Request, { params }: { params: { id: string } }) {
  try {
    const engagementId = Number(params.id);
    const { catalog, warning } = loadCapabilityCatalog();
    if (!catalog) {
      return NextResponse.json({ error: warning ?? "Capability catalog is unavailable." }, { status: 503 });
    }
    const context = JSON.stringify({
      engagementContext: JSON.parse(buildEngagementContext(engagementId)),
      capabilityCatalog: catalog,
    }, null, 2);
    const raw = await completeJson({
      system: `${solutionFitPrompt}\n\nLicensing note: ${catalog.licensingNote}`,
      messages: [{ role: "user", content: context }],
      maxTokens: 4000,
      temperature: 0.2,
      schema: solutionFitSchema,
    });
    const allowed = new Set(catalog.capabilities.map((capability) => capability.id));
    const content = {
      ...raw,
      needs: raw.needs.map((need) => ({
        ...need,
        capabilities: need.capabilities.filter((capability) =>
          allowed.has(capability.capabilityId),
        ),
      })),
    };
    const latest = db.select().from(artifacts).where(and(eq(artifacts.engagementId, engagementId), eq(artifacts.kind, "solution_fit"))).orderBy(desc(artifacts.version)).get();
    const artifact = db.insert(artifacts).values({ engagementId, kind: "solution_fit", version: (latest?.version ?? 0) + 1, contentJson: JSON.stringify(content), modelUsed: process.env.AI_MODEL ?? "unknown", createdAt: Date.now() }).returning().get();
    return NextResponse.json({ artifact });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? `${error.message}${"bodySnippet" in error && error.bodySnippet ? `: ${error.bodySnippet}` : ""}` : "Solution fit failed" }, { status: 500 });
  }
}
