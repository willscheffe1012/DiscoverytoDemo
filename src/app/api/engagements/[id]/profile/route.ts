import { NextResponse } from "next/server";
import { and, desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { artifacts, inputs } from "@/db/schema";
import { completeJson } from "@/lib/ai/client";
import { companyProfilePrompt } from "@/lib/ai/prompts/company-profile";
import { companyProfileSchema } from "@/lib/ai/schemas/company-profile";

export async function POST(_request: Request, { params }: { params: { id: string } }) {
  try {
    const engagementId = Number(params.id);
    const rows = db.select().from(inputs).where(eq(inputs.engagementId, engagementId)).orderBy(inputs.createdAt).all();
    if (rows.length === 0) return NextResponse.json({ error: "Add at least one pasted input before generating a profile." }, { status: 400 });
    const material = rows.map((row) => `=== INPUT: ${row.title} (${row.kind}, ${new Date(row.createdAt).toISOString()}) ===\n${row.content}`).join("\n\n");
    const profile = await completeJson({ system: companyProfilePrompt, messages: [{ role: "user", content: material }], maxTokens: 4000, temperature: 0.2, schema: companyProfileSchema });
    const latest = db.select().from(artifacts).where(and(eq(artifacts.engagementId, engagementId), eq(artifacts.kind, "company_profile"))).orderBy(desc(artifacts.version)).get();
    const inserted = db.insert(artifacts).values({ engagementId, kind: "company_profile", version: (latest?.version ?? 0) + 1, contentJson: JSON.stringify(profile), modelUsed: process.env.AI_MODEL ?? "unknown", createdAt: Date.now() }).returning().get();
    return NextResponse.json({ artifact: inserted });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Profile generation failed" }, { status: 500 });
  }
}
