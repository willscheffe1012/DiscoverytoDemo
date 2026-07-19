import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import { engagements, inputs } from "@/db/schema";

const inputSchema = z.object({ kind: z.enum(["discovery_notes", "transcript", "public_doc", "other"]), title: z.string().trim().min(1), content: z.string().trim().min(1) });

export async function POST(request: Request, { params }: { params: { id: string } }) {
  const engagementId = Number(params.id);
  const formData = await request.formData();
  const parsed = inputSchema.parse({ kind: formData.get("kind"), title: formData.get("title"), content: formData.get("content") });
  const now = Date.now();
  db.insert(inputs).values({ ...parsed, engagementId, createdAt: now }).run();
  db.update(engagements).set({ updatedAt: now }).where(eq(engagements.id, engagementId)).run();
  return NextResponse.redirect(new URL(`/engagements/${engagementId}`, request.url), 303);
}
