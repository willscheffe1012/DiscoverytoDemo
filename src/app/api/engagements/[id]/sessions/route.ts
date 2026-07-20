import { NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import { sessions } from "@/db/schema";

const patchSchema = z.object({
  id: z.number().int(),
  notes: z.string(),
});
const bodySchema = z.object({
  title: z.string().trim().min(1),
  heldAt: z.number().int(),
  attendees: z.string().optional().default(""),
  notes: z.string().optional().default(""),
});
export async function POST(
  request: Request,
  { params }: { params: { id: string } },
) {
  const engagementId = Number(params.id);
  const parsed = bodySchema.parse(await request.json());
  const row = db
    .insert(sessions)
    .values({ engagementId, ...parsed, createdAt: Date.now() })
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
  db.delete(sessions)
    .where(and(eq(sessions.engagementId, engagementId), eq(sessions.id, id)))
    .run();
  return NextResponse.json({ ok: true });
}

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } },
) {
  const engagementId = Number(params.id);
  const { id, notes } = patchSchema.parse(await request.json());
  const row = db
    .update(sessions)
    .set({ notes })
    .where(and(eq(sessions.engagementId, engagementId), eq(sessions.id, id)))
    .returning()
    .get();
  return NextResponse.json(row);
}
