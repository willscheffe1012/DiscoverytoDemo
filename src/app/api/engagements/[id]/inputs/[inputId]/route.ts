import { NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import { engagements, inputs } from "@/db/schema";

const inputSchema = z.object({ kind: z.enum(["discovery_notes", "transcript", "public_doc", "other"]), title: z.string().trim().min(1), content: z.string().trim().min(1) });

export async function POST(request: Request, { params }: { params: { id: string; inputId: string } }) {
  const engagementId = Number(params.id);
  const inputId = Number(params.inputId);
  const formData = await request.formData();
  const intent = formData.get("intent");
  if (intent === "delete") db.delete(inputs).where(and(eq(inputs.id, inputId), eq(inputs.engagementId, engagementId))).run();
  else {
    const parsed = inputSchema.parse({ kind: formData.get("kind"), title: formData.get("title"), content: formData.get("content") });
    db.update(inputs).set(parsed).where(and(eq(inputs.id, inputId), eq(inputs.engagementId, engagementId))).run();
  }
  db.update(engagements).set({ updatedAt: Date.now() }).where(eq(engagements.id, engagementId)).run();
  return NextResponse.redirect(new URL(`/engagements/${engagementId}`, request.url), 303);
}
