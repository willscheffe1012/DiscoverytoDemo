import Link from "next/link";
import { desc } from "drizzle-orm";
import { db, rawSqlite } from "@/db";
import { engagements } from "@/db/schema";

const industries = [
  ["industrial_mfg", "Industrial manufacturing"], ["cpg", "CPG"], ["automotive", "Automotive"], ["med_device", "Medical device"], ["other", "Other"],
];

export default function Home() {
  const rows = db.select().from(engagements).orderBy(desc(engagements.updatedAt)).all();
  const countRows = rawSqlite.prepare(`SELECT e.id, COUNT(DISTINCT s.id) sessions, COUNT(DISTINCT p.id) pains, COUNT(DISTINCT CASE WHEN q.status = 'open' THEN q.id END) openQuestions FROM engagements e LEFT JOIN sessions s ON s.engagement_id=e.id LEFT JOIN pain_points p ON p.engagement_id=e.id LEFT JOIN open_questions q ON q.engagement_id=e.id GROUP BY e.id`).all() as Array<{id:number;sessions:number;pains:number;openQuestions:number}>;
  const counts = Object.fromEntries(countRows.map((r) => [r.id, r]));
  return <main className="mx-auto max-w-5xl px-6 py-10">
    <header className="mb-8"><p className="text-sm uppercase tracking-[0.3em] text-cyan-300">Discovery Engine</p><h1 className="mt-2 text-3xl font-semibold">Engagements</h1></header>
    <section className="grid gap-6 md:grid-cols-[1fr_360px]">
      <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5">
        {rows.length === 0 ? <div className="rounded-xl border border-dashed border-slate-700 p-8 text-slate-300"><h2 className="text-xl font-semibold text-white">Welcome.</h2><p className="mt-2">Create your first customer engagement to begin collecting discovery intelligence.</p></div> :
          <div className="divide-y divide-slate-800">{rows.map((row) => <Link key={row.id} href={`/engagements/${row.id}/discover`} className="block py-4 hover:bg-slate-800/40"><div className="font-medium text-white">{row.accountName}</div><div className="mt-1 text-sm text-slate-400">{row.industry} · {row.status}</div><div className="mt-2 text-xs text-slate-500">{counts[row.id]?.sessions ?? 0} sessions · {counts[row.id]?.pains ?? 0} pains · {counts[row.id]?.openQuestions ?? 0} open questions</div></Link>)}</div>}
      </div>
      <form action="/api/engagements" method="post" className="rounded-2xl border border-slate-800 bg-slate-900 p-5 shadow-xl">
        <h2 className="text-lg font-semibold">New Engagement</h2>
        <label className="mt-5 block text-sm text-slate-300">Account name<input name="accountName" required className="mt-2 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-white" /></label>
        <label className="mt-4 block text-sm text-slate-300">Industry<select name="industry" className="mt-2 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-white">{industries.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
        <button className="mt-5 w-full rounded-lg bg-cyan-400 px-4 py-2 font-semibold text-slate-950 hover:bg-cyan-300">Create engagement</button>
      </form>
    </section>
  </main>;
}
