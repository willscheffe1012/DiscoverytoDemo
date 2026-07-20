import Link from "next/link";
import { desc } from "drizzle-orm";
import { db, rawSqlite } from "@/db";
import { engagements } from "@/db/schema";
import { loadMaturityConfig } from "@/lib/config";

const industries = [
  ["industrial_mfg", "Industrial manufacturing"],
  ["cpg", "CPG"],
  ["automotive", "Automotive"],
  ["med_device", "Medical device"],
  ["other", "Other"],
];

const stageColors: Record<number, string> = {
  1: "#ef4444",
  2: "#f97316",
  3: "#eab308",
  4: "#22c55e",
  5: "#0ea5e9",
};

interface CardStats {
  id: number;
  sessions: number;
  pains: number;
  highPains: number;
  lastActivity: number | null;
  processStage: number | null;
  dataStage: number | null;
  organizationStage: number | null;
  technologyStage: number | null;
}

export default function Home() {
  const rows = db
    .select()
    .from(engagements)
    .orderBy(desc(engagements.updatedAt))
    .all();
  const maturity = loadMaturityConfig();
  const statsRows = rawSqlite
    .prepare(
      `
    SELECT
      e.id,
      COUNT(DISTINCT s.id) sessions,
      COUNT(DISTINCT p.id) pains,
      COUNT(DISTINCT CASE WHEN p.severity = 'high' THEN p.id END) highPains,
      MAX(COALESCE(p.created_at, f.created_at, sl.created_at, oq.created_at, s.created_at, e.updated_at)) lastActivity,
      MAX(CASE WHEN ms.dimension_id = 'process' THEN ms.stage END) processStage,
      MAX(CASE WHEN ms.dimension_id = 'data' THEN ms.stage END) dataStage,
      MAX(CASE WHEN ms.dimension_id = 'organization' THEN ms.stage END) organizationStage,
      MAX(CASE WHEN ms.dimension_id = 'technology' THEN ms.stage END) technologyStage
    FROM engagements e
    LEFT JOIN sessions s ON s.engagement_id = e.id
    LEFT JOIN pain_points p ON p.engagement_id = e.id
    LEFT JOIN facts f ON f.engagement_id = e.id
    LEFT JOIN systems_landscape sl ON sl.engagement_id = e.id
    LEFT JOIN open_questions oq ON oq.engagement_id = e.id
    LEFT JOIN maturity_scores ms ON ms.engagement_id = e.id
    GROUP BY e.id
  `,
    )
    .all() as CardStats[];
  const stats = Object.fromEntries(statsRows.map((row) => [row.id, row]));
  return (
    <main className="mx-auto max-w-6xl px-6 py-10">
      <header className="mb-8 flex items-center justify-between">
        <div>
          <p className="text-sm uppercase tracking-[0.3em] text-[var(--accent)]">
            Discovery Engine
          </p>
          <h1 className="mt-2 text-3xl font-semibold">Deal dashboard</h1>
        </div>
      </header>
      <section className="grid gap-6 md:grid-cols-[1fr_360px]">
        <div className="rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-5">
          {rows.length === 0 ? (
            <div className="rounded-xl border border-dashed border-[var(--line)] p-8 text-[var(--ink-muted)]">
              <h2 className="text-xl font-semibold text-[var(--ink)]">
                Start a discovery workspace.
              </h2>
              <p className="mt-2">
                Create an engagement, collect messy notes, and let AI file the
                signal into maturity, pains, facts, systems, and questions.
              </p>
            </div>
          ) : (
            <div className="grid gap-4">
              {rows.map((row) => {
                const rowStats = stats[row.id];
                const stageValues = maturity.dimensions.map((dimension) => ({
                  id: dimension.id,
                  initial: dimension.name.slice(0, 1),
                  stage: rowStats?.[
                    `${dimension.id}Stage` as keyof CardStats
                  ] as number | null,
                }));
                return (
                  <Link
                    key={row.id}
                    href={`/engagements/${row.id}/discover`}
                    className="block rounded-xl border border-[var(--line)] p-4 hover:bg-[var(--accent-soft)]"
                  >
                    <div className="flex items-center gap-3">
                      <div className="font-medium text-[var(--ink)]">
                        {row.accountName}
                      </div>
                      <span className="rounded bg-[var(--accent-soft)] px-2 py-1 text-xs text-[var(--accent)]">
                        {row.industry}
                      </span>
                    </div>
                    <div className="mt-3 flex gap-2">
                      {stageValues.map((stage) => (
                        <span
                          key={stage.id}
                          className="grid h-8 w-8 place-items-center rounded text-xs font-semibold text-white"
                          style={{
                            background: stage.stage
                              ? stageColors[stage.stage]
                              : "#64748b",
                          }}
                        >
                          {stage.stage ?? "—"}
                          <span className="sr-only">{stage.initial}</span>
                        </span>
                      ))}
                    </div>
                    <div className="mt-3 text-sm text-[var(--ink-muted)]">
                      {rowStats?.pains ?? 0} pains ({rowStats?.highPains ?? 0}{" "}
                      high) · {rowStats?.sessions ?? 0} sessions · Last activity{" "}
                      {rowStats?.lastActivity
                        ? new Date(rowStats.lastActivity).toLocaleDateString()
                        : "none"}
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
        <form
          action="/api/engagements"
          method="post"
          className="rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-5 shadow-sm"
        >
          <h2 className="text-lg font-semibold">New engagement</h2>
          <label className="mt-5 block text-sm text-[var(--ink-muted)]">
            Account name
            <input
              name="accountName"
              required
              className="input-token mt-2 w-full"
            />
          </label>
          <label className="mt-4 block text-sm text-[var(--ink-muted)]">
            Industry
            <select name="industry" className="input-token mt-2 w-full">
              {industries.map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </label>
          <button className="btn-primary mt-5 w-full">Create engagement</button>
        </form>
      </section>
    </main>
  );
}
