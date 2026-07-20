import { desc, eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import { db } from "@/db";
import { engagements, facts, maturityScores, openQuestions, painPoints, sessions, systemsLandscape } from "@/db/schema";
import { loadIndustryPack, loadMaturityConfig } from "@/lib/config";
import { DiscoveryWorkspace } from "@/components/discovery-workspace";

export default function DiscoverPage({ params }: { params: { id: string } }) {
  const engagementId = Number(params.id);
  const engagement = db.select().from(engagements).where(eq(engagements.id, engagementId)).get();
  if (!engagement) notFound();
  const { pack, warning } = loadIndustryPack(engagement.industry);
  const maturity = loadMaturityConfig();
  const initial = {
    sessions: db.select().from(sessions).where(eq(sessions.engagementId, engagementId)).orderBy(desc(sessions.heldAt)).all(),
    facts: db.select().from(facts).where(eq(facts.engagementId, engagementId)).orderBy(desc(facts.createdAt)).all(),
    systems: db.select().from(systemsLandscape).where(eq(systemsLandscape.engagementId, engagementId)).orderBy(desc(systemsLandscape.createdAt)).all(),
    pains: db.select().from(painPoints).where(eq(painPoints.engagementId, engagementId)).orderBy(desc(painPoints.createdAt)).all(),
    openQuestions: db.select().from(openQuestions).where(eq(openQuestions.engagementId, engagementId)).orderBy(desc(openQuestions.createdAt)).all(),
    maturityScores: db.select().from(maturityScores).where(eq(maturityScores.engagementId, engagementId)).orderBy(desc(maturityScores.createdAt)).all(),
  };
  return <DiscoveryWorkspace engagement={engagement} pack={pack} packWarning={warning} maturity={maturity} initial={initial} />;
}
