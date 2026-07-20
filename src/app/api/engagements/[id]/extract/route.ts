import { NextResponse } from "next/server";
import { desc, eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import {
  facts,
  maturityEvidence,
  openQuestions,
  painPoints,
  sessions,
  systemsLandscape,
} from "@/db/schema";
import { completeJson } from "@/lib/ai/client";
import { extractionPrompt } from "@/lib/ai/prompts/extraction";
import { extractionSchema } from "@/lib/ai/schemas/extraction";
import { loadIndustryPack, loadMaturityConfig } from "@/lib/config";
import { engagements } from "@/db/schema";

const bodySchema = z.object({ sessionId: z.number().int() });

export async function POST(
  request: Request,
  { params }: { params: { id: string } },
) {
  try {
    const engagementId = Number(params.id);
    const { sessionId } = bodySchema.parse(await request.json());
    const engagement = db
      .select()
      .from(engagements)
      .where(eq(engagements.id, engagementId))
      .get();
    const session = db
      .select()
      .from(sessions)
      .where(eq(sessions.id, sessionId))
      .get();
    if (!engagement || !session || session.engagementId !== engagementId) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }
    const { pack, warning } = loadIndustryPack(engagement.industry);
    const context = {
      sessionNotes: session.notes,
      existing: {
        pains: db
          .select()
          .from(painPoints)
          .where(eq(painPoints.engagementId, engagementId))
          .orderBy(desc(painPoints.createdAt))
          .all(),
        facts: db
          .select()
          .from(facts)
          .where(eq(facts.engagementId, engagementId))
          .orderBy(desc(facts.createdAt))
          .all(),
        systems: db
          .select()
          .from(systemsLandscape)
          .where(eq(systemsLandscape.engagementId, engagementId))
          .orderBy(desc(systemsLandscape.createdAt))
          .all(),
        openQuestions: db
          .select()
          .from(openQuestions)
          .where(eq(openQuestions.engagementId, engagementId))
          .orderBy(desc(openQuestions.createdAt))
          .all(),
        maturityEvidence: db
          .select()
          .from(maturityEvidence)
          .where(eq(maturityEvidence.engagementId, engagementId))
          .orderBy(desc(maturityEvidence.createdAt))
          .all(),
      },
      maturityConfig: loadMaturityConfig(),
      painArchetypes: pack?.painArchetypes ?? [],
      packWarning: warning,
    };
    const extracted = await completeJson({
      system: extractionPrompt,
      messages: [{ role: "user", content: JSON.stringify(context, null, 2) }],
      maxTokens: 3000,
      temperature: 0.1,
      schema: extractionSchema,
    });
    const now = Date.now();
    const rows = {
      pains: extracted.pains.map((row) =>
        db
          .insert(painPoints)
          .values({
            engagementId,
            sessionId,
            ...row,
            origin: "ai",
            createdAt: now,
          })
          .returning()
          .get(),
      ),
      facts: extracted.facts.map((row) =>
        db
          .insert(facts)
          .values({
            engagementId,
            sessionId,
            ...row,
            origin: "ai",
            createdAt: now,
          })
          .returning()
          .get(),
      ),
      systems: extracted.systems.map((row) =>
        db
          .insert(systemsLandscape)
          .values({
            engagementId,
            sessionId,
            ...row,
            origin: "ai",
            createdAt: now,
          })
          .returning()
          .get(),
      ),
      openQuestions: extracted.openQuestions.map((row) =>
        db
          .insert(openQuestions)
          .values({
            engagementId,
            sessionId,
            ...row,
            status: "open",
            answer: "",
            origin: "ai",
            createdAt: now,
          })
          .returning()
          .get(),
      ),
      maturityEvidence: extracted.maturityEvidence.map((row) =>
        db
          .insert(maturityEvidence)
          .values({
            engagementId,
            sessionId,
            ...row,
            origin: "ai",
            createdAt: now,
          })
          .returning()
          .get(),
      ),
    };
    return NextResponse.json({
      created: Object.fromEntries(
        Object.entries(rows).map(([key, value]) => [key, value.length]),
      ),
      rows,
    });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? `${error.message}${"bodySnippet" in error && error.bodySnippet ? `: ${error.bodySnippet}` : ""}`
            : "Extraction failed",
      },
      { status: 500 },
    );
  }
}
