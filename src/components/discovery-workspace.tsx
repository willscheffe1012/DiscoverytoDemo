"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { discoveryToMarkdown } from "@/lib/markdown";
import type { CapabilityCatalog, IndustryPack, MaturityConfig } from "@/lib/config";

type Origin = "manual" | "ai";
type Severity = "high" | "medium" | "low";
type Sentiment = "pain" | "neutral" | "liked" | "unknown";
type FactCategory =
  | "segment"
  | "footprint"
  | "demand_pattern"
  | "product_complexity"
  | "network_complexity"
  | "volume"
  | "other";
interface BaseRow {
  id: number;
  engagementId: number;
  sessionId: number | null;
  createdAt: number;
  origin?: Origin | "ai_accepted";
}
interface Engagement {
  id: number;
  accountName: string;
  industry: string;
}
interface SessionRow {
  id: number;
  engagementId: number;
  title: string;
  heldAt: number;
  attendees: string;
  notes: string;
  createdAt: number;
}
interface FactRow extends BaseRow {
  category: FactCategory;
  content: string;
}
interface SystemRow extends BaseRow {
  system: string;
  role: string;
  sentiment: Sentiment;
}
interface PainRow extends BaseRow {
  pain: string;
  quote: string;
  severity: Severity;
}
interface QuestionRow extends BaseRow {
  question: string;
  status: string;
  answer: string;
}
interface ScoreRow extends BaseRow {
  dimensionId: string;
  stage: number;
  evidence: string;
  origin: "manual" | "ai_accepted";
}
interface EvidenceRow extends BaseRow {
  dimensionId: string;
  quote: string;
  note: string;
}
interface ArtifactRow {
  id: number;
  kind: string;
  version: number;
  contentJson: string;
  modelUsed: string;
  createdAt: number;
}
type FitRating = "strong" | "possible" | "premature" | "disqualified";
interface SolutionFit {
  licensingContext: "legacy" | "new" | "unknown";
  needs: Array<{
    need: string;
    evidence: Array<{ quote: string; source: string }>;
    capabilities: Array<{
      capabilityId: string;
      fit: FitRating;
      rationale: string;
      unknowns: string[];
      conversationAngle: string;
    }>;
  }>;
  cautions: string[];
  narrative: string;
}
interface InitialRows {
  sessions: SessionRow[];
  facts: FactRow[];
  systems: SystemRow[];
  pains: PainRow[];
  openQuestions: QuestionRow[];
  maturityScores: ScoreRow[];
  maturityEvidence: EvidenceRow[];
  artifacts: ArtifactRow[];
}

const factCats: FactCategory[] = [
  "segment",
  "footprint",
  "demand_pattern",
  "product_complexity",
  "network_complexity",
  "volume",
  "other",
];
const sentiments: Sentiment[] = ["unknown", "pain", "neutral", "liked"];
const fitClasses: Record<FitRating, string> = {
  strong: "border-indigo-200 bg-indigo-50 text-indigo-800",
  possible: "border-slate-200 bg-slate-50 text-slate-700",
  premature: "border-amber-200 bg-amber-50 text-amber-800",
  disqualified: "border-red-300 bg-red-50 text-red-800 line-through",
};

const stageColors: Record<number, string> = {
  1: "#ef4444",
  2: "#f97316",
  3: "#eab308",
  4: "#22c55e",
  5: "#0ea5e9",
};

async function api<T>(
  engagementId: number,
  path: string,
  method: string,
  body: unknown,
): Promise<T> {
  const response = await fetch(`/api/engagements/${engagementId}/${path}`, {
    method,
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
  const json = await response.json();
  if (!response.ok) throw new Error(json.error ?? "Request failed");
  return json as T;
}

function StaleChip() {
  return (
    <span className="rounded border border-amber-300 bg-amber-50 px-2 py-1 text-xs font-semibold text-amber-800">
      Data has changed since this assessment — re-run Draft assessment
    </span>
  );
}

function AiChip({ origin }: { origin?: string }) {
  return origin === "ai" ? (
    <span className="rounded bg-indigo-100 px-2 py-0.5 text-xs font-semibold text-indigo-700">
      AI
    </span>
  ) : null;
}

function Panel({
  title,
  count,
  children,
  open = false,
}: {
  title: string;
  count: number;
  children: React.ReactNode;
  open?: boolean;
}) {
  return (
    <details className="token-card p-4" open={open}>
      <summary className="cursor-pointer text-lg font-semibold">
        {title}{" "}
        <span className="text-sm text-[var(--ink-muted)]">({count})</span>
      </summary>
      <div className="mt-3 space-y-3">{children}</div>
    </details>
  );
}

function NotesStream({
  session,
  engagementId,
  onExtract,
}: {
  session?: SessionRow;
  engagementId: number;
  onExtract: () => void;
}) {
  const [notes, setNotes] = useState(session?.notes ?? "");
  const [status, setStatus] = useState<
    ""
    | "Saved"
    | "Saving…"
    | "Autosave failed"
    | "Autosave failed — no active session"
  >("");
  const ref = useRef<HTMLTextAreaElement>(null);
  useEffect(() => {
    setNotes(session?.notes ?? "");
    setStatus("");
  }, [session?.id, session?.notes]);
  useEffect(() => {
    const focus = (event: KeyboardEvent) => {
      if (event.key === "/" && document.activeElement !== ref.current) {
        event.preventDefault();
        ref.current?.focus();
      }
    };
    window.addEventListener("keydown", focus);
    return () => window.removeEventListener("keydown", focus);
  }, []);
  const saveNotes = useCallback(
    async (value: string) => {
      if (!session) {
        setStatus("Autosave failed — no active session");
        return;
      }
      setStatus("Saving…");
      try {
        await api<SessionRow>(engagementId, "sessions", "PATCH", {
          id: session.id,
          notes: value,
        });
        setStatus("Saved");
      } catch {
        setStatus("Autosave failed");
      }
    },
    [engagementId, session],
  );

  useEffect(() => {
    const id = window.setTimeout(() => saveNotes(notes), 1500);
    return () => window.clearTimeout(id);
  }, [notes, saveNotes]);
  return (
    <section className="token-card p-5">
      <p className="text-sm text-[var(--ink-muted)]">
        Call notes — just type what you hear
      </p>
      <textarea
        ref={ref}
        className="input-token mt-3 min-h-[220px] w-full resize-y font-mono"
        value={notes}
        onBlur={() => saveNotes(notes)}
        onKeyDown={(e) => {
          if ((e.metaKey || e.ctrlKey) && e.key === "Enter") onExtract();
        }}
        onChange={(e) => setNotes(e.target.value)}
      />
      <div className="mt-3 flex items-center gap-3">
        <button className="btn-primary" onClick={onExtract} disabled={!session}>
          {session ? "Extract" : "Create a session to extract"}
        </button>
        <span
          className={
            status.startsWith("Autosave failed")
              ? "text-red-700"
              : "text-[var(--ink-muted)]"
          }
        >
          {status}
        </span>
      </div>
    </section>
  );
}

export function DiscoveryWorkspace({
  engagement,
  pack,
  packWarning,
  maturity,
  capabilityCatalog,
  catalogWarning,
  initial,
}: {
  engagement: Engagement;
  pack: IndustryPack | null;
  packWarning?: string;
  maturity: MaturityConfig;
  capabilityCatalog: CapabilityCatalog | null;
  catalogWarning?: string;
  initial: InitialRows;
}) {
  const [sessions, setSessions] = useState(initial.sessions);
  const [active, setActive] = useState<number | null>(sessions[0]?.id ?? null);
  const [facts, setFacts] = useState(initial.facts);
  const [systems, setSystems] = useState(initial.systems);
  const [pains, setPains] = useState(initial.pains);
  const [questions, setQuestions] = useState(initial.openQuestions);
  const [scores, setScores] = useState(initial.maturityScores);
  const [evidence, setEvidence] = useState(initial.maturityEvidence);
  const [artifacts, setArtifacts] = useState(initial.artifacts);
  const [extracting, setExtracting] = useState(false);
  const [summary, setSummary] = useState("");
  const [error, setError] = useState("");
  const session = sessions.find((s) => s.id === active);
  const mArtifacts = artifacts.filter((a) => a.kind === "maturity_assessment");
  const qArtifacts = artifacts.filter((a) => a.kind === "question_gaps");
  const fitArtifacts = artifacts.filter((a) => a.kind === "solution_fit");
  const [selectedFitId, setSelectedFitId] = useState<number | null>(fitArtifacts[0]?.id ?? null);
  const selectedFitArtifact = fitArtifacts.find((a) => a.id === selectedFitId) ?? fitArtifacts[0];
  const latestDataChange = Math.max(0, ...facts.map((r) => r.createdAt), ...systems.map((r) => r.createdAt), ...pains.map((r) => r.createdAt), ...questions.map((r) => r.createdAt), ...scores.map((r) => r.createdAt), ...evidence.map((r) => r.createdAt));
  const assessmentArtifact = mArtifacts[0];
  const questionArtifact = qArtifacts[0];
  const assessment = assessmentArtifact ? JSON.parse(assessmentArtifact.contentJson) : null;
  const gaps = questionArtifact ? JSON.parse(questionArtifact.contentJson) : null;
  const solutionFit: SolutionFit | null = selectedFitArtifact ? JSON.parse(selectedFitArtifact.contentJson) : null;
  const current = useMemo(
    () =>
      Object.fromEntries(
        maturity.dimensions.map((d) => [
          d.id,
          scores
            .filter((s) => s.dimensionId === d.id)
            .sort((a, b) => b.createdAt - a.createdAt)[0],
        ]),
      ),
    [scores, maturity.dimensions],
  );
  async function save<Row>(
    path: string,
    setter: React.Dispatch<React.SetStateAction<Row[]>>,
    body: Record<string, unknown>,
  ) {
    const row = await api<Row>(engagement.id, path, "POST", {
      sessionId: active,
      ...body,
    });
    setter((rows) => [row, ...rows]);
  }
  async function del(
    path: string,
    id: number,
    setter: React.Dispatch<React.SetStateAction<BaseRow[]>>,
  ) {
    await api(engagement.id, path, "DELETE", { id });
    setter((rows) => rows.filter((row) => row.id !== id));
  }
  async function extract() {
    if (!active) {
      setError("Create a session to extract");
      return;
    }
    setExtracting(true);
    setError("");
    try {
      const result = await api<{
        created: Record<string, number>;
        rows: {
          pains: PainRow[];
          facts: FactRow[];
          systems: SystemRow[];
          openQuestions: QuestionRow[];
          maturityEvidence: EvidenceRow[];
        };
      }>(engagement.id, "extract", "POST", { sessionId: active });
      setPains((x) => [...result.rows.pains, ...x]);
      setFacts((x) => [...result.rows.facts, ...x]);
      setSystems((x) => [...result.rows.systems, ...x]);
      setQuestions((x) => [...result.rows.openQuestions, ...x]);
      setEvidence((x) => [...result.rows.maturityEvidence, ...x]);
      setSummary(
        `Filed ${result.created.pains} pains, ${result.created.facts} facts, ${result.created.systems} systems, ${result.created.openQuestions} questions, ${result.created.maturityEvidence} maturity evidence`,
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : "Extraction failed");
    } finally {
      setExtracting(false);
    }
  }
  async function runAi(kind: "question-gaps" | "maturity-assessment" | "solution-fit") {
    const json = await api<{ artifact: ArtifactRow }>(
      engagement.id,
      kind,
      "POST",
      {},
    );
    setArtifacts((rows) => [json.artifact, ...rows]);
    if (kind === "solution-fit") setSelectedFitId(json.artifact.id);
  }
  async function newSession() {
    const row = await api<SessionRow>(engagement.id, "sessions", "POST", {
      title: `Session ${sessions.length + 1}`,
      heldAt: Date.now(),
    });
    setSessions((rows) => [row, ...rows]);
    setActive(row.id);
  }
  return (
    <main className="mx-auto max-w-[1600px] space-y-5 px-6 py-5 text-[var(--ink)]">
      <header className="token-card p-4">
        <div className="flex flex-wrap items-center gap-3">
          <a className="text-[var(--accent)]" href="/">
            ← Engagements
          </a>
          <h1 className="mr-auto text-2xl font-semibold">
            {engagement.accountName}
          </h1>
          <span className="rounded bg-[var(--accent-soft)] px-2 py-1 text-sm text-[var(--accent)]">
            {engagement.industry}
          </span>
          <select
            className="input-token"
            value={active ?? ""}
            onChange={(e) => setActive(Number(e.target.value))}
          >
            {sessions.map((s) => (
              <option key={s.id} value={s.id}>
                {s.title}
              </option>
            ))}
          </select>
          <button className="btn-secondary" onClick={newSession}>
            New session
          </button>
          <button className="btn-primary" onClick={() => runAi("solution-fit")}>
            Solution fit
          </button>
          <button
            className="btn-secondary"
            onClick={() =>
              navigator.clipboard.writeText(
                discoveryToMarkdown({
                  engagement,
                  sessions,
                  facts,
                  systems,
                  pains,
                  openQuestions: questions,
                  maturityScores: scores,
                  maturityEvidence: evidence,
                  maturity,
                  maturityAssessment: assessment,
                  solutionFit,
                  capabilityCatalog,
                }),
              )
            }
          >
            Copy Discovery Summary
          </button>
        </div>
      </header>
      <NotesStream
        session={session}
        engagementId={engagement.id}
        onExtract={extract}
      />
      {extracting && (
        <p className="text-sm text-[var(--accent)]">Extracting…</p>
      )}
      {summary && <p className="text-sm text-[var(--accent)]">{summary}</p>}
      {error && (
        <p className="rounded border border-red-300 bg-red-50 p-2 text-sm text-red-800">
          {error}{" "}
          <button className="underline" onClick={extract}>
            Retry
          </button>
        </p>
      )}
      <MaturityBand
        maturity={maturity}
        current={current}
        evidence={evidence}
        scores={scores}
        assessment={assessment}
        isStale={Boolean(assessmentArtifact && latestDataChange > assessmentArtifact.createdAt)}
        save={save}
        del={del}
        runDraft={() => runAi("maturity-assessment")}
        setScores={setScores}
        setEvidence={setEvidence}
      />{" "}
      <SolutionFitPanel
        catalog={capabilityCatalog}
        warning={catalogWarning}
        fit={solutionFit}
        artifact={selectedFitArtifact}
        artifacts={fitArtifacts}
        isStale={Boolean(selectedFitArtifact && latestDataChange > selectedFitArtifact.createdAt)}
        onSelect={setSelectedFitId}
        ask={(question) => save<QuestionRow>("open-questions", setQuestions, { question })}
      />
      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_420px]">
        <PainsPanel pains={pains} save={save} del={del} setPains={setPains} />
        <aside className="space-y-4">
          <FactsPanel facts={facts} save={save} del={del} setFacts={setFacts} />
          <SystemsPanel
            systems={systems}
            save={save}
            del={del}
            setSystems={setSystems}
          />
          <QuestionsPanel
            questions={questions}
            save={save}
            del={del}
            setQuestions={setQuestions}
          />
          {gaps && (
            <Panel title="Suggested questions" count={gaps.suggestions.length}>
              {questionArtifact && latestDataChange > questionArtifact.createdAt && <StaleChip />}
              <p className="text-sm text-[var(--ink-muted)]">
                {gaps.coverageNotes}
              </p>
              {gaps.suggestions.map(
                (g: { question: string; rationale: string }) => (
                  <div
                    key={g.question}
                    className="rounded border border-[var(--line)] p-3"
                  >
                    <b>{g.question}</b>
                    <p>{g.rationale}</p>
                    <button
                      className="btn-secondary mt-2"
                      onClick={() =>
                        save<QuestionRow>("open-questions", setQuestions, {
                          question: g.question,
                        })
                      }
                    >
                      Add to open questions
                    </button>
                  </div>
                ),
              )}
            </Panel>
          )}
          <button
            className="btn-primary w-full"
            onClick={() => runAi("question-gaps")}
          >
            Suggest questions
          </button>
          <Panel
            title="Industry guide"
            count={
              (pack?.painArchetypes.length ?? 0) +
              (pack?.valueDrivers.length ?? 0)
            }
          >
            {packWarning && <p>{packWarning}</p>}
            <h3 className="font-semibold">Pain archetypes</h3>
            {pack?.painArchetypes.map((p) => (
              <p key={p.name}>
                <b>{p.name}</b>: {p.description}
              </p>
            ))}
            <h3 className="font-semibold">Value drivers</h3>
            <ul className="list-disc pl-5">
              {pack?.valueDrivers.map((v) => <li key={v}>{v}</li>)}
            </ul>
          </Panel>
        </aside>
      </div>
    </main>
  );
}

function MaturityBand({
  maturity,
  current,
  evidence,
  scores,
  assessment,
  isStale,
  save,
  del,
  runDraft,
  setScores,
  setEvidence,
}: {
  maturity: MaturityConfig;
  current: Record<string, ScoreRow | undefined>;
  evidence: EvidenceRow[];
  scores: ScoreRow[];
  assessment: {
    narrative?: string;
    dimensions?: Array<{
      dimensionId: string;
      proposedStage: number | null;
      rationale: string;
      confidence: string;
    }>;
  } | null;
  isStale: boolean;
  save: <Row>(
    path: string,
    setter: React.Dispatch<React.SetStateAction<Row[]>>,
    body: Record<string, unknown>,
  ) => Promise<void>;
  del: (
    path: string,
    id: number,
    setter: React.Dispatch<React.SetStateAction<BaseRow[]>>,
  ) => Promise<void>;
  runDraft: () => void;
  setScores: React.Dispatch<React.SetStateAction<ScoreRow[]>>;
  setEvidence: React.Dispatch<React.SetStateAction<EvidenceRow[]>>;
}) {
  return (
    <section className="token-card p-4">
      <div className="grid gap-3 md:grid-cols-4">
        {maturity.dimensions.map((dim) => {
          const row = current[dim.id];
          const rows = evidence.filter((item) => item.dimensionId === dim.id);
          const proposal = assessment?.dimensions?.find(
            (item) => item.dimensionId === dim.id,
          );
          return (
            <details
              key={dim.id}
              className="rounded border border-[var(--line)] p-3"
              open
            >
              <summary className="cursor-pointer">
                <div className="flex items-center justify-between">
                  <b>{dim.name}</b>
                  <span className="text-xs">{rows.length} evidence</span>
                </div>
                <div
                  className="mt-2 text-4xl font-semibold"
                  style={{ color: row ? stageColors[row.stage] : undefined }}
                >
                  {row?.stage ?? "—"}
                </div>
                <p className="text-sm text-[var(--ink-muted)]">
                  {maturity.stages.find((stage) => stage.stage === row?.stage)
                    ?.name ?? "Unscored"}
                </p>
              </summary>
              <div className="mt-3 space-y-3">
                {rows.map((item) => (
                  <div
                    key={item.id}
                    className="rounded bg-slate-50 p-2 text-sm"
                  >
                    <p className="verbatim">“{item.quote}”</p>
                    <p>{item.note}</p>
                    <button
                      className="text-red-700"
                      onClick={() =>
                        del(
                          "maturity-evidence",
                          item.id,
                          setEvidence as React.Dispatch<
                            React.SetStateAction<BaseRow[]>
                          >,
                        )
                      }
                    >
                      Delete
                    </button>
                  </div>
                ))}
                <form
                  className="flex gap-2"
                  onSubmit={(event) => {
                    event.preventDefault();
                    const data = new FormData(event.currentTarget);
                    save<ScoreRow>("maturity-scores", setScores, {
                      dimensionId: dim.id,
                      stage: Number(data.get("stage")),
                      evidence: String(data.get("evidence") ?? ""),
                      origin: "manual",
                    });
                    event.currentTarget.reset();
                  }}
                >
                  <input
                    className="input-token min-w-0 flex-1"
                    name="evidence"
                    placeholder="Evidence"
                  />
                  <select className="input-token" name="stage">
                    {maturity.stages.map((stage) => (
                      <option key={stage.stage}>{stage.stage}</option>
                    ))}
                  </select>
                  <button className="btn-secondary">Save</button>
                </form>
                {proposal && (
                  <div className="rounded border border-[var(--line)] p-2 text-sm">
                    <div className="flex flex-wrap items-center gap-2">
                      <b>
                        AI proposal: {proposal.proposedStage ?? "insufficient"}
                      </b>
                      {isStale && <StaleChip />}
                    </div>
                    <p>{proposal.rationale}</p>
                    {proposal.proposedStage && (
                      <button
                        className="btn-primary mt-2"
                        onClick={() =>
                          save<ScoreRow>("maturity-scores", setScores, {
                            dimensionId: dim.id,
                            stage: proposal.proposedStage,
                            evidence: proposal.rationale,
                            origin: "ai_accepted",
                          })
                        }
                      >
                        Accept
                      </button>
                    )}
                  </div>
                )}
                <div className="text-xs text-[var(--ink-muted)]">
                  History:{" "}
                  {scores
                    .filter((score) => score.dimensionId === dim.id)
                    .map((score) => `S${score.stage} ${score.origin}`)
                    .join(" · ") || "none"}
                </div>
              </div>
            </details>
          );
        })}
      </div>
      <div className="mt-4 space-y-3">
        {isStale && <StaleChip />}
        <button className="btn-primary" onClick={runDraft}>
          Draft assessment
        </button>
        {assessment?.narrative && (
          <p className="mt-3">{assessment.narrative}</p>
        )}
      </div>
    </section>
  );
}

function PainsPanel({
  pains,
  save,
  del,
  setPains,
}: {
  pains: PainRow[];
  save: <Row>(
    path: string,
    setter: React.Dispatch<React.SetStateAction<Row[]>>,
    body: Record<string, unknown>,
  ) => Promise<void>;
  del: (
    path: string,
    id: number,
    setter: React.Dispatch<React.SetStateAction<BaseRow[]>>,
  ) => Promise<void>;
  setPains: React.Dispatch<React.SetStateAction<PainRow[]>>;
}) {
  return (
    <Panel title="Pains and needs" count={pains.length} open>
      <form
        className="grid gap-2 md:grid-cols-[1fr_1fr_120px_auto]"
        onSubmit={(e) => {
          e.preventDefault();
          const f = new FormData(e.currentTarget);
          save<PainRow>("pains", setPains, {
            pain: String(f.get("pain")),
            quote: String(f.get("quote") ?? ""),
            severity: f.get("severity"),
          });
          e.currentTarget.reset();
        }}
      >
        <input
          className="input-token"
          name="pain"
          required
          placeholder="Pain"
        />
        <input className="input-token" name="quote" placeholder="Quote" />
        <select className="input-token" name="severity">
          <option>medium</option>
          <option>high</option>
          <option>low</option>
        </select>
        <button className="btn-primary">Save</button>
      </form>
      {pains.map((p) => (
        <div key={p.id} className="rounded border border-[var(--line)] p-3">
          <div className="flex gap-2">
            <b>{p.severity}</b>
            <AiChip origin={p.origin} />
            <button
              className="ml-auto text-red-700"
              onClick={() =>
                del(
                  "pains",
                  p.id,
                  setPains as React.Dispatch<React.SetStateAction<BaseRow[]>>,
                )
              }
            >
              Delete
            </button>
          </div>
          <p>{p.pain}</p>
          {p.quote && <p className="verbatim mt-2">“{p.quote}”</p>}
        </div>
      ))}
    </Panel>
  );
}
function FactsPanel({
  facts,
  save,
  del,
  setFacts,
}: {
  facts: FactRow[];
  save: <Row>(
    path: string,
    setter: React.Dispatch<React.SetStateAction<Row[]>>,
    body: Record<string, unknown>,
  ) => Promise<void>;
  del: (
    path: string,
    id: number,
    setter: React.Dispatch<React.SetStateAction<BaseRow[]>>,
  ) => Promise<void>;
  setFacts: React.Dispatch<React.SetStateAction<FactRow[]>>;
}) {
  return (
    <Panel title="Facts" count={facts.length}>
      <form
        className="flex gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          const f = new FormData(e.currentTarget);
          save<FactRow>("facts", setFacts, {
            category: f.get("category"),
            content: String(f.get("content")),
          });
          e.currentTarget.reset();
        }}
      >
        <select className="input-token" name="category">
          {factCats.map((cat) => (
            <option key={cat}>{cat}</option>
          ))}
        </select>
        <input className="input-token flex-1" name="content" required />
        <button className="btn-primary">Save</button>
      </form>
      {facts.map((f) => (
        <div key={f.id} className="rounded border border-[var(--line)] p-2">
          <AiChip origin={f.origin} /> <b>{f.category}</b> {f.content}
          <button
            className="float-right text-red-700"
            onClick={() =>
              del(
                "facts",
                f.id,
                setFacts as React.Dispatch<React.SetStateAction<BaseRow[]>>,
              )
            }
          >
            Delete
          </button>
        </div>
      ))}
    </Panel>
  );
}
function SystemsPanel({
  systems,
  save,
  del,
  setSystems,
}: {
  systems: SystemRow[];
  save: <Row>(
    path: string,
    setter: React.Dispatch<React.SetStateAction<Row[]>>,
    body: Record<string, unknown>,
  ) => Promise<void>;
  del: (
    path: string,
    id: number,
    setter: React.Dispatch<React.SetStateAction<BaseRow[]>>,
  ) => Promise<void>;
  setSystems: React.Dispatch<React.SetStateAction<SystemRow[]>>;
}) {
  return (
    <Panel title="Systems" count={systems.length}>
      <form
        className="grid gap-2 md:grid-cols-[1fr_1fr_120px_auto]"
        onSubmit={(e) => {
          e.preventDefault();
          const f = new FormData(e.currentTarget);
          save<SystemRow>("systems", setSystems, {
            system: String(f.get("system")),
            role: String(f.get("role") ?? ""),
            sentiment: f.get("sentiment"),
          });
          e.currentTarget.reset();
        }}
      >
        <input className="input-token" name="system" required />
        <input className="input-token" name="role" />
        <select className="input-token" name="sentiment">
          {sentiments.map((s) => (
            <option key={s}>{s}</option>
          ))}
        </select>
        <button className="btn-primary">Save</button>
      </form>
      {systems.map((s) => (
        <div key={s.id} className="rounded border border-[var(--line)] p-2">
          <AiChip origin={s.origin} /> <b>{s.system}</b> {s.role}{" "}
          <i>{s.sentiment}</i>
          <button
            className="float-right text-red-700"
            onClick={() =>
              del(
                "systems",
                s.id,
                setSystems as React.Dispatch<React.SetStateAction<BaseRow[]>>,
              )
            }
          >
            Delete
          </button>
        </div>
      ))}
    </Panel>
  );
}
function QuestionsPanel({
  questions,
  save,
  del,
  setQuestions,
}: {
  questions: QuestionRow[];
  save: <Row>(
    path: string,
    setter: React.Dispatch<React.SetStateAction<Row[]>>,
    body: Record<string, unknown>,
  ) => Promise<void>;
  del: (
    path: string,
    id: number,
    setter: React.Dispatch<React.SetStateAction<BaseRow[]>>,
  ) => Promise<void>;
  setQuestions: React.Dispatch<React.SetStateAction<QuestionRow[]>>;
}) {
  return (
    <Panel title="Open questions" count={questions.length}>
      <form
        className="flex gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          const f = new FormData(e.currentTarget);
          save<QuestionRow>("open-questions", setQuestions, {
            question: String(f.get("question")),
          });
          e.currentTarget.reset();
        }}
      >
        <input className="input-token flex-1" name="question" required />
        <button className="btn-primary">Save</button>
      </form>
      {questions.map((q) => (
        <div key={q.id} className="rounded border border-[var(--line)] p-2">
          <AiChip origin={q.origin} /> {q.question}
          <button
            className="float-right text-red-700"
            onClick={() =>
              del(
                "open-questions",
                q.id,
                setQuestions as React.Dispatch<React.SetStateAction<BaseRow[]>>,
              )
            }
          >
            Delete
          </button>
        </div>
      ))}
    </Panel>
  );
}

function moduleName(
  catalog: CapabilityCatalog,
  capabilityId: string,
  context: SolutionFit["licensingContext"],
) {
  const capability = catalog.capabilities.find((item) => item.id === capabilityId);
  if (!capability) return capabilityId;
  if (context === "legacy") return `${capability.name} — ${capability.moduleLegacy}`;
  if (context === "new") return `${capability.name} — ${capability.moduleNew}`;
  return `${capability.name} — ${capability.moduleLegacy} / ${capability.moduleNew}`;
}

function SolutionFitPanel({
  catalog,
  warning,
  fit,
  artifact,
  artifacts,
  isStale,
  onSelect,
  ask,
}: {
  catalog: CapabilityCatalog | null;
  warning?: string;
  fit: SolutionFit | null;
  artifact?: ArtifactRow;
  artifacts: ArtifactRow[];
  isStale: boolean;
  onSelect: (id: number) => void;
  ask: (question: string) => Promise<void>;
}) {
  // DECISION: Render Solution Fit inline below pains context so the bridge from insight to action is visible without a slide-over.
  if (warning) {
    return (
      <section className="token-card border-amber-200 bg-amber-50 p-4 text-amber-900">
        {warning}
      </section>
    );
  }
  if (!catalog) return null;
  return (
    <section className="token-card space-y-4 p-4">
      <div className="flex flex-wrap items-center gap-3">
        <h2 className="mr-auto text-lg font-semibold">Solution Fit</h2>
        {isStale && <StaleChip />}
        {artifacts.length > 0 && (
          <select
            className="input-token"
            value={artifact?.id ?? ""}
            onChange={(event) => onSelect(Number(event.target.value))}
          >
            {artifacts.map((item) => (
              <option key={item.id} value={item.id}>
                v{item.version} · {new Date(item.createdAt).toLocaleString()}
              </option>
            ))}
          </select>
        )}
      </div>
      {!fit && (
        <p className="text-sm text-[var(--ink-muted)]">
          Run Solution fit to translate captured needs into evidence-grounded IBP conversation guidance.
        </p>
      )}
      {fit && artifact && (
        <>
          <p className="text-sm text-[var(--ink-muted)]">
            v{artifact.version} · {artifact.modelUsed} · {new Date(artifact.createdAt).toLocaleString()} · licensing: {fit.licensingContext}
          </p>
          <p className="rounded bg-indigo-50 p-3">{fit.narrative}</p>
          {fit.cautions.length > 0 && (
            <div className="rounded border border-amber-200 bg-amber-50 p-3">
              <b>Cautions</b>
              <ul className="list-disc pl-5">
                {fit.cautions.map((caution) => (
                  <li key={caution}>{caution}</li>
                ))}
              </ul>
            </div>
          )}
          <div className="space-y-3">
            {fit.needs.map((need) => (
              <article key={need.need} className="rounded border border-[var(--line)] p-3">
                <h3 className="font-semibold">{need.need}</h3>
                <div className="mt-2 space-y-1">
                  {need.evidence.map((item) => (
                    <p key={`${item.source}-${item.quote}`} className="verbatim text-sm">
                      “{item.quote}” — {item.source}
                    </p>
                  ))}
                </div>
                <div className="mt-3 space-y-3">
                  {need.capabilities.map((capability) => (
                    <div
                      key={capability.capabilityId}
                      className={`rounded border p-3 ${capability.fit === "disqualified" ? "border-red-200" : "border-[var(--line)]"}`}
                    >
                      <div className="flex flex-wrap items-center gap-2">
                        <b>{moduleName(catalog, capability.capabilityId, fit.licensingContext)}</b>
                        <span className={`rounded border px-2 py-0.5 text-xs font-semibold ${fitClasses[capability.fit]}`}>
                          {capability.fit}
                        </span>
                      </div>
                      <p className="mt-2">{capability.rationale}</p>
                      {capability.unknowns.length > 0 && (
                        <ul className="mt-2 space-y-1">
                          {capability.unknowns.map((unknown) => (
                            <li key={unknown} className="flex flex-wrap items-center gap-2 text-sm">
                              <span>Unknown: {unknown}</span>
                              <button className="btn-secondary" onClick={() => ask(unknown)}>
                                Ask this
                              </button>
                            </li>
                          ))}
                        </ul>
                      )}
                      <p className="mt-2 rounded bg-slate-50 p-2 font-semibold">
                        Conversation angle: {capability.conversationAngle}
                      </p>
                    </div>
                  ))}
                  {need.capabilities.length === 0 && (
                    <p className="text-sm text-[var(--ink-muted)]">No capability fit is ready from the current evidence.</p>
                  )}
                </div>
              </article>
            ))}
          </div>
        </>
      )}
    </section>
  );
}
