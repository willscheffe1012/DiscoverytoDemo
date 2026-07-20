import { NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import { maturityEvidence } from "@/db/schema";

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  const engagementId = Number(params.id);
  const { id } = z.object({ id: z.number().int() }).parse(await request.json());
  db.delete(maturityEvidence).where(and(eq(maturityEvidence.engagementId, engagementId), eq(maturityEvidence.id, id))).run();
  return NextResponse.json({ ok: true });
}
