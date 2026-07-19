import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/db";
import { engagements } from "@/db/schema";

const engagementSchema = z.object({ accountName: z.string().trim().min(1), industry: z.enum(["industrial_mfg", "cpg", "automotive", "med_device", "other"]) });

export async function POST(request: Request) {
  const formData = await request.formData();
  const parsed = engagementSchema.parse({ accountName: formData.get("accountName"), industry: formData.get("industry") });
  const now = Date.now();
  const inserted = db.insert(engagements).values({ ...parsed, createdAt: now, updatedAt: now }).returning({ id: engagements.id }).get();
  return NextResponse.redirect(new URL(`/engagements/${inserted.id}`, request.url), 303);
}
