import { desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { artifacts, engagements, facts, inputs, maturityScores, openQuestions, painPoints, sessions, systemsLandscape } from "@/db/schema";
import { loadIndustryPack, loadMaturityConfig } from "@/lib/config";

export function buildEngagementContext(engagementId: number, includeMaturityConfig = false) {
  const engagement = db.select().from(engagements).where(eq(engagements.id, engagementId)).get();
  if (!engagement) throw new Error("Engagement not found");
  const { pack, warning } = loadIndustryPack(engagement.industry);
  const maturity = loadMaturityConfig();
  const rows = {
    engagement,
    industryPack: pack ?? { warning },
    sessions: db.select().from(sessions).where(eq(sessions.engagementId, engagementId)).orderBy(desc(sessions.heldAt)).all(),
    facts: db.select().from(facts).where(eq(facts.engagementId, engagementId)).orderBy(desc(facts.createdAt)).all(),
    systems: db.select().from(systemsLandscape).where(eq(systemsLandscape.engagementId, engagementId)).orderBy(desc(systemsLandscape.createdAt)).all(),
    pains: db.select().from(painPoints).where(eq(painPoints.engagementId, engagementId)).orderBy(desc(painPoints.createdAt)).all(),
    openQuestions: db.select().from(openQuestions).where(eq(openQuestions.engagementId, engagementId)).orderBy(desc(openQuestions.createdAt)).all(),
    maturityScores: db.select().from(maturityScores).where(eq(maturityScores.engagementId, engagementId)).orderBy(desc(maturityScores.createdAt)).all(),
    pastedInputs: db.select().from(inputs).where(eq(inputs.engagementId, engagementId)).orderBy(desc(inputs.createdAt)).all(),
    profileArtifacts: db.select().from(artifacts).where(eq(artifacts.engagementId, engagementId)).orderBy(desc(artifacts.createdAt)).all().filter((a) => a.kind === "company_profile"),
    ...(includeMaturityConfig ? { maturityConfig: maturity } : {}),
  };
  return JSON.stringify(rows, null, 2);
}
