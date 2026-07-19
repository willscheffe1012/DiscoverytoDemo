import Link from "next/link";
import { and, desc, eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import { db } from "@/db";
import { artifacts, engagements, inputs } from "@/db/schema";
import { EngagementWorkspace } from "@/components/engagement-workspace";

export default function EngagementPage({ params }: { params: { id: string } }) {
  const engagementId = Number(params.id);
  const engagement = db.select().from(engagements).where(eq(engagements.id, engagementId)).get();
  if (!engagement) notFound();
  const inputRows = db.select().from(inputs).where(eq(inputs.engagementId, engagementId)).orderBy(desc(inputs.createdAt)).all();
  const artifactRows = db.select().from(artifacts).where(and(eq(artifacts.engagementId, engagementId), eq(artifacts.kind, "company_profile"))).orderBy(desc(artifacts.version)).all();
  return <><div className="px-6 pt-6"><Link href="/" className="text-sm text-cyan-300 hover:text-cyan-200">← Engagements</Link></div><EngagementWorkspace engagementId={engagementId} accountName={engagement.accountName} inputs={inputRows} artifacts={artifactRows} /></>;
}
