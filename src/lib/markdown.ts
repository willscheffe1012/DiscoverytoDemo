import type { CompanyProfile } from "@/lib/ai/schemas/company-profile";

const esc = (value: string) => value.replaceAll("|", "\\|").replace(/\s+/g, " ").trim();
const bullets = (items: string[]) => items.length ? items.map((item) => `- ${item}`).join("\n") : "- not discussed";

export function artifactToMarkdown(profile: CompanyProfile): string {
  const segments = profile.businessSegments.length ? profile.businessSegments.map((s) => `- **${s.name}** — ${s.description} _Planning relevance:_ ${s.relevanceToPlanning}`).join("\n") : "- not discussed";
  const systems = profile.currentSystems.length ? profile.currentSystems.map((s) => `- **${s.system}** (${s.sentiment}) — ${s.role}`).join("\n") : "- not discussed";
  const pains = profile.statedPainPoints.length
    ? ["| Pain | Evidence | Source | Severity |", "|---|---|---|---|", ...profile.statedPainPoints.map((p) => `| ${esc(p.pain)} | ${esc(p.evidence)} | ${esc(p.source)} | ${p.severity} |`)].join("\n")
    : "No stated pain points discussed.";
  const stakeholders = profile.stakeholders.length ? profile.stakeholders.map((s) => `- **${s.name}** — ${s.role}; ${s.disposition}. ${s.notes}`).join("\n") : "- not discussed";

  return `# Company Profile\n\n## Company Overview\n${profile.companyOverview}\n\n## Business Segments\n${segments}\n\n## Manufacturing Footprint\n${profile.manufacturingFootprint}\n\n## Supply Chain Characteristics\n- **Demand pattern:** ${profile.supplyChainCharacteristics.demandPattern}\n- **Product complexity:** ${profile.supplyChainCharacteristics.productComplexity}\n- **Network complexity:** ${profile.supplyChainCharacteristics.networkComplexity}\n\n## Current Systems\n${systems}\n\n## Stated Pain Points\n${pains}\n\n## Strategic Priorities\n${bullets(profile.strategicPriorities)}\n\n## Stakeholders\n${stakeholders}\n\n## Open Questions\n${bullets(profile.openQuestions)}\n\n## Confidence Notes\n${profile.confidenceNotes}\n`;
}
