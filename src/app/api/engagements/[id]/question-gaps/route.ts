import { NextResponse } from "next/server";
import { and, desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { artifacts } from "@/db/schema";
import { completeJson } from "@/lib/ai/client";
import { buildEngagementContext } from "@/lib/ai/context";
import { questionGapsPrompt } from "@/lib/ai/prompts/question-gaps";
import { questionGapsSchema } from "@/lib/ai/schemas/question-gaps";

export async function POST(_request: Request, { params }: { params: { id: string } }) {
  try {
    const engagementId = Number(params.id);
    const content = await completeJson({
      system: questionGapsPrompt,
      messages: [{ role: "user", content: buildEngagementContext(engagementId) }],
      maxTokens: 2500,
      temperature: 0.2,
      schema: questionGapsSchema,
    });
    const latest = db.select().from(artifacts).where(and(eq(artifacts.engagementId, engagementId), eq(artifacts.kind, "question_gaps"))).orderBy(desc(artifacts.version)).get();
    const artifact = db.insert(artifacts).values({ engagementId, kind: "question_gaps", version: (latest?.version ?? 0) + 1, contentJson: JSON.stringify(content), modelUsed: process.env.AI_MODEL ?? "unknown", createdAt: Date.now() }).returning().get();
    return NextResponse.json({ artifact });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? `${error.message}${"bodySnippet" in error && error.bodySnippet ? `: ${error.bodySnippet}` : ""}` : "Question suggestions failed" }, { status: 500 });
  }
}
