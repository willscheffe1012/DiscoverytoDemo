import { NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import { systemsLandscape } from "@/db/schema";
const bodySchema = z.object({
  sessionId: z.number().int().nullable().optional(),
  system: z.string().trim().min(1),
  role: z.string().optional().default(""),
  sentiment: z
    .enum(["pain", "neutral", "liked", "unknown"])
    .optional()
    .default("unknown"),
});
export async function POST(
  request: Request,
  { params }: { params: { id: string } },
) {
  const engagementId = Number(params.id);
  const parsed = bodySchema.parse(await request.json());
  const row = db
    .insert(systemsLandscape)
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
  db.delete(systemsLandscape)
    .where(
      and(
        eq(systemsLandscape.engagementId, engagementId),
        eq(systemsLandscape.id, id),
      ),
    )
    .run();
  return NextResponse.json({ ok: true });
}
