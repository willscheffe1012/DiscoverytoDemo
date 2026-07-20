import { NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import { maturityScores } from "@/db/schema";
const bodySchema = z.object({
  sessionId: z.number().int().nullable().optional(),
  dimensionId: z.string().trim().min(1),
  stage: z.number().int().min(1).max(5),
  evidence: z.string().optional().default(""),
  origin: z.enum(["manual", "ai_accepted"]).optional().default("manual"),
});
export async function POST(
  request: Request,
  { params }: { params: { id: string } },
) {
  const engagementId = Number(params.id);
  const parsed = bodySchema.parse(await request.json());
  const row = db
    .insert(maturityScores)
    .values({
      engagementId,
      ...parsed,
      sessionId: parsed.sessionId ?? null,
      createdAt: Date.now(),
    })
    .returning()
    .get();
  return NextResponse.json(row);
}
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } },
) {
  const engagementId = Number(params.id);
  const { id } = z.object({ id: z.number().int() }).parse(await request.json());
  db.delete(maturityScores)
    .where(
      and(
        eq(maturityScores.engagementId, engagementId),
        eq(maturityScores.id, id),
      ),
    )
    .run();
  return NextResponse.json({ ok: true });
}
