import { NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import { openQuestions } from "@/db/schema";
const createSchema = z.object({ sessionId: z.number().int().nullable().optional(), question: z.string().trim().min(1) });
export async function POST(request: Request, { params }: { params: { id: string } }) { const engagementId = Number(params.id); const parsed = createSchema.parse(await request.json()); const row = db.insert(openQuestions).values({ engagementId, ...parsed, sessionId: parsed.sessionId ?? null, status: "open", answer: "", createdAt: Date.now() }).returning().get(); return NextResponse.json(row); }
export async function PATCH(request: Request, { params }: { params: { id: string } }) { const engagementId = Number(params.id); const { id, answer } = z.object({ id: z.number().int(), answer: z.string().trim().min(1) }).parse(await request.json()); const row = db.update(openQuestions).set({ status: "answered", answer }).where(and(eq(openQuestions.engagementId, engagementId), eq(openQuestions.id, id))).returning().get(); return NextResponse.json(row); }
export async function DELETE(request: Request, { params }: { params: { id: string } }) { const engagementId = Number(params.id); const { id } = z.object({ id: z.number().int() }).parse(await request.json()); db.delete(openQuestions).where(and(eq(openQuestions.engagementId, engagementId), eq(openQuestions.id, id))).run(); return NextResponse.json({ ok: true }); }
