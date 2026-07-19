import { NextResponse } from "next/server";
import { rawSqlite } from "@/db";
import { complete } from "@/lib/ai/client";

export async function GET() {
  let dbOk = false;
  let ai = false;
  let aiError: string | undefined;
  try {
    rawSqlite.prepare("CREATE TABLE IF NOT EXISTS health_check (id integer PRIMARY KEY, checked_at integer NOT NULL)").run();
    rawSqlite.prepare("INSERT INTO health_check (checked_at) VALUES (?)").run(Date.now());
    rawSqlite.prepare("SELECT id FROM health_check ORDER BY id DESC LIMIT 1").get();
    dbOk = true;
  } catch {}
  try {
    const text = await complete({ system: "Reply with OK and no other text.", messages: [{ role: "user", content: "reply with OK" }], maxTokens: 16, temperature: 0 });
    ai = text.trim().toUpperCase() === "OK";
    if (!ai) aiError = `Unexpected LLM response: ${text.slice(0, 120)}`;
  } catch (error) { aiError = error instanceof Error ? error.message : String(error); }
  return NextResponse.json({ db: dbOk, ai, ...(aiError ? { aiError } : {}) });
}
