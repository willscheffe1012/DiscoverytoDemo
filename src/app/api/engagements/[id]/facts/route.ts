import { NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import { facts } from "@/db/schema";
const bodySchema = z.object({ sessionId: z.number().int().nullable().optional(), category: z.enum(["segment","footprint","demand_pattern","product_complexity","network_complexity","volume","other"]), content: z.string().trim().min(1) });
export async function POST(request: Request, { params }: { params: { id: string } }) { const engagementId = Number(params.id); const parsed = bodySchema.parse(await request.json()); const row = db.insert(facts).values({ engagementId, ...parsed, sessionId: parsed.sessionId ?? null, createdAt: Date.now() }).returning().get(); return NextResponse.json(row); }
export async function DELETE(request: Request, { params }: { params: { id: string } }) { const engagementId = Number(params.id); const { id } = z.object({ id: z.number().int() }).parse(await request.json()); db.delete(facts).where(and(eq(facts.engagementId, engagementId), eq(facts.id, id))).run(); return NextResponse.json({ ok: true }); }
