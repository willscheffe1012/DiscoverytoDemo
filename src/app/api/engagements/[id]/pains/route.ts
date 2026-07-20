import { NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import { painPoints } from "@/db/schema";
const createSchema = z.object({ sessionId: z.number().int().nullable().optional(), pain: z.string().trim().min(1), quote: z.string().optional().default(""), severity: z.enum(["high","medium","low"]).optional().default("medium") });
const updateSchema = z.object({ id: z.number().int(), pain: z.string().trim().min(1), quote: z.string().optional().default(""), severity: z.enum(["high","medium","low"]).optional().default("medium") });
export async function POST(request: Request, { params }: { params: { id: string } }) { const engagementId = Number(params.id); const parsed = createSchema.parse(await request.json()); const row = db.insert(painPoints).values({ engagementId, ...parsed, sessionId: parsed.sessionId ?? null, createdAt: Date.now() }).returning().get(); return NextResponse.json(row); }
export async function PATCH(request: Request, { params }: { params: { id: string } }) { const engagementId = Number(params.id); const { id, ...values } = updateSchema.parse(await request.json()); const row = db.update(painPoints).set(values).where(and(eq(painPoints.engagementId, engagementId), eq(painPoints.id, id))).returning().get(); return NextResponse.json(row); }
export async function DELETE(request: Request, { params }: { params: { id: string } }) { const engagementId = Number(params.id); const { id } = z.object({ id: z.number().int() }).parse(await request.json()); db.delete(painPoints).where(and(eq(painPoints.engagementId, engagementId), eq(painPoints.id, id))).run(); return NextResponse.json({ ok: true }); }
