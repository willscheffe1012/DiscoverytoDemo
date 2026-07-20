import type { CompanyProfile } from "@/lib/ai/schemas/company-profile";
import type { CapabilityCatalog } from "@/lib/config";

const esc = (value: string) =>
  value.replaceAll("|", "\\|").replace(/\s+/g, " ").trim();
const bullets = (items: string[]) =>
  items.length
    ? items.map((item) => `- ${item}`).join("\n")
    : "- not discussed";

export function artifactToMarkdown(profile: CompanyProfile): string {
  const segments = profile.businessSegments.length
    ? profile.businessSegments
        .map(
          (s) =>
            `- **${s.name}** — ${s.description} _Planning relevance:_ ${s.relevanceToPlanning}`,
        )
        .join("\n")
    : "- not discussed";
  const systems = profile.currentSystems.length
    ? profile.currentSystems
        .map((s) => `- **${s.system}** (${s.sentiment}) — ${s.role}`)
        .join("\n")
    : "- not discussed";
  const pains = profile.statedPainPoints.length
    ? [
        "| Pain | Evidence | Source | Severity |",
        "|---|---|---|---|",
        ...profile.statedPainPoints.map(
          (p) =>
            `| ${esc(p.pain)} | ${esc(p.evidence)} | ${esc(p.source)} | ${p.severity} |`,
        ),
      ].join("\n")
    : "No stated pain points discussed.";
  const stakeholders = profile.stakeholders.length
    ? profile.stakeholders
        .map((s) => `- **${s.name}** — ${s.role}; ${s.disposition}. ${s.notes}`)
        .join("\n")
    : "- not discussed";

  return `# Company Profile\n\n## Company Overview\n${profile.companyOverview}\n\n## Business Segments\n${segments}\n\n## Manufacturing Footprint\n${profile.manufacturingFootprint}\n\n## Supply Chain Characteristics\n- **Demand pattern:** ${profile.supplyChainCharacteristics.demandPattern}\n- **Product complexity:** ${profile.supplyChainCharacteristics.productComplexity}\n- **Network complexity:** ${profile.supplyChainCharacteristics.networkComplexity}\n\n## Current Systems\n${systems}\n\n## Stated Pain Points\n${pains}\n\n## Strategic Priorities\n${bullets(profile.strategicPriorities)}\n\n## Stakeholders\n${stakeholders}\n\n## Open Questions\n${bullets(profile.openQuestions)}\n\n## Confidence Notes\n${profile.confidenceNotes}\n`;
}

interface DiscoveryEngagement {
  accountName: string;
  industry: string;
}
interface DiscoverySession {
  id: number;
  title: string;
  heldAt: number;
  attendees: string;
}
interface DiscoveryFact {
  category: string;
  content: string;
}
interface DiscoverySystem {
  system: string;
  role: string;
  sentiment: string;
}
interface DiscoveryPain {
  pain: string;
  quote: string;
  severity: string;
  sessionId: number | null;
}
interface DiscoveryQuestion {
  question: string;
  status: string;
  answer: string;
}
interface DiscoveryScore {
  id: number;
  dimensionId: string;
  stage: number;
  evidence: string;
  origin?: string;
  createdAt: number;
}
interface DiscoveryEvidence {
  dimensionId: string;
  quote: string;
  note: string;
}
interface DiscoveryStage {
  stage: number;
  name: string;
}
interface DiscoveryDimension {
  id: string;
  name: string;
}
interface DiscoveryMaturity {
  stages: DiscoveryStage[];
  dimensions: DiscoveryDimension[];
}
interface DiscoveryAssessment {
  narrative?: string;
}
interface DiscoverySolutionFit {
  licensingContext: "legacy" | "new" | "unknown";
  needs: Array<{
    need: string;
    evidence: Array<{ quote: string; source: string }>;
    capabilities: Array<{
      capabilityId: string;
      fit: string;
      rationale: string;
      unknowns: string[];
      conversationAngle: string;
    }>;
  }>;
  cautions: string[];
  narrative: string;
}

type DiscoveryMarkdown = {
  engagement: DiscoveryEngagement;
  sessions: DiscoverySession[];
  facts: DiscoveryFact[];
  systems: DiscoverySystem[];
  pains: DiscoveryPain[];
  openQuestions: DiscoveryQuestion[];
  maturityScores: DiscoveryScore[];
  maturityEvidence?: DiscoveryEvidence[];
  maturity: DiscoveryMaturity;
  maturityAssessment?: DiscoveryAssessment | null;
  solutionFit?: DiscoverySolutionFit | null;
  capabilityCatalog?: CapabilityCatalog | null;
};
export function discoveryToMarkdown(d: DiscoveryMarkdown): string {
  const sessionName = (id: number | null) =>
    id
      ? (d.sessions.find((s) => s.id === id)?.title ?? "unknown session")
      : "No session";
  const stages = Object.fromEntries(d.maturity.stages.map((s) => [s.stage, s]));
  const current = Object.fromEntries(
    d.maturity.dimensions.map((dim) => [
      dim.id,
      [...d.maturityScores]
        .filter((s) => s.dimensionId === dim.id)
        .sort((a, b) => b.createdAt - a.createdAt)[0],
    ]),
  );
  const maturity = d.maturity.dimensions
    .map((dim) => {
      const row = current[dim.id];
      const prior = d.maturityScores.filter(
        (s) => s.dimensionId === dim.id && s.id !== row?.id,
      );
      return `### ${dim.name}\nCurrent: ${row ? `Stage ${row.stage} — ${stages[row.stage]?.name ?? "Unknown"}. Origin: ${row.origin ?? "manual"}. Evidence: ${row.evidence || "not discussed"}` : "not discussed"}${prior.length ? `\nPrior scores:\n${prior.map((p) => `- Stage ${p.stage} on ${new Date(p.createdAt).toLocaleDateString()} — ${p.origin ?? "manual"}: ${p.evidence || "not discussed"}`).join("\n")}` : ""}`;
    })
    .join("\n\n");

  const readout = d.maturityAssessment
    ? `## Maturity Readout\n${d.maturityAssessment.narrative}\n\n${d.maturity.dimensions
        .map((dim) => {
          const row = current[dim.id];
          return `### ${dim.name}\nCurrent: ${row ? `Stage ${row.stage} — ${stages[row.stage]?.name ?? "Unknown"} (${row.origin ?? "manual"}). Evidence: ${row.evidence || "not discussed"}` : "not discussed"}\n${
            (d.maturityEvidence ?? [])
              .filter((e) => e.dimensionId === dim.id)
              .map((e) => `- Evidence: “${e.quote}” — ${e.note}`)
              .join("\n") || "- Evidence rows: none"
          }`;
        })
        .join("\n\n")}\n\n`
    : "";
  const solutionFitMd = d.solutionFit
    ? `## Solution Fit\n${d.solutionFit.narrative}\n\n${d.solutionFit.needs
        .map((need) => {
          const evidence = need.evidence.map((e) => `- Evidence: “${e.quote}” — ${e.source}`).join("\n") || "- Evidence: not discussed";
          const capabilities = need.capabilities.length
            ? need.capabilities
                .map((capability) => {
                  const catalogCapability = d.capabilityCatalog?.capabilities.find((item) => item.id === capability.capabilityId);
                  const label = catalogCapability ? catalogCapability.name : capability.capabilityId;
                  return `- **${label}** (${capability.fit}): ${capability.rationale}\n  - Angle: ${capability.conversationAngle}\n  - Unknowns: ${capability.unknowns.join("; ") || "none"}`;
                })
                .join("\n")
            : "- No capability fit is ready from current evidence.";
          return `### ${need.need}\n${evidence}\n${capabilities}`;
        })
        .join("\n\n")}\n\n### Cautions\n${bullets(d.solutionFit.cautions)}\n\n`
    : "";
  const byCat = d.facts.reduce(
    (acc: Record<string, string[]>, f) => (
      (acc[f.category] ??= []).push(f.content), acc
    ),
    {},
  );
  const factsMd = Object.keys(byCat).length
    ? Object.entries(byCat)
        .map(([k, vals]) => `### ${k}\n${vals.map((v) => `- ${v}`).join("\n")}`)
        .join("\n\n")
    : "not discussed";
  const sessionsMd = d.sessions.length
    ? d.sessions
        .map(
          (s) =>
            `- ${s.title} — ${new Date(s.heldAt).toLocaleDateString()} — ${s.attendees || "attendees not discussed"}`,
        )
        .join("\n")
    : "- not discussed";
  const systemsMd = d.systems.length
    ? [
        "| System | Role | Sentiment |",
        "|---|---|---|",
        ...d.systems.map(
          (s) =>
            `| ${esc(s.system)} | ${esc(s.role || "not discussed")} | ${s.sentiment} |`,
        ),
      ].join("\n")
    : "not discussed";
  const painsMd = d.pains.length
    ? [
        "| Pain | Quote | Severity | Session |",
        "|---|---|---|---|",
        ...d.pains.map(
          (p) =>
            `| ${esc(p.pain)} | ${esc(p.quote || "not discussed")} | ${p.severity} | ${esc(sessionName(p.sessionId))} |`,
        ),
      ].join("\n")
    : "not discussed";
  const open = d.openQuestions.filter((q) => q.status === "open"),
    answered = d.openQuestions.filter((q) => q.status === "answered");
  const questionsMd = `${open.length ? open.map((q) => `- OPEN: ${q.question}`).join("\n") : "- No open questions"}\n${answered.length ? answered.map((q) => `- ANSWERED: ${q.question} — ${q.answer}`).join("\n") : "- No answered questions"}`;
  return `${readout}# Discovery Summary — ${d.engagement.accountName}\n\n## Engagement\n- **Account:** ${d.engagement.accountName}\n- **Industry:** ${d.engagement.industry}\n\n## Sessions Held\n${sessionsMd}\n\n## Maturity\n${maturity}\n\n## Facts\n${factsMd}\n\n## Systems\n${systemsMd}\n\n## Pain Points\n${painsMd}\n\n## Open Questions\n${questionsMd}\n`;
}
