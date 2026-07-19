import Link from "next/link";
import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import { db } from "@/db";
import { engagements } from "@/db/schema";

export default function EngagementPage({ params }: { params: { id: string } }) {
  const engagement = db.select().from(engagements).where(eq(engagements.id, Number(params.id))).get();
  if (!engagement) notFound();
  return <main className="mx-auto max-w-4xl px-6 py-10">
    <Link href="/" className="text-sm text-cyan-300 hover:text-cyan-200">← Engagements</Link>
    <section className="mt-6 rounded-2xl border border-slate-800 bg-slate-900 p-8">
      <p className="text-sm uppercase tracking-[0.25em] text-slate-400">Workspace stub</p>
      <h1 className="mt-2 text-3xl font-semibold">{engagement.accountName}</h1>
      <p className="mt-3 text-slate-300">Phase 0 creates and opens engagements. Input management and profile generation are intentionally reserved for Phase 1.</p>
    </section>
  </main>;
}
