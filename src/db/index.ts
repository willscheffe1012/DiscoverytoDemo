import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import { mkdirSync } from "fs";
import path from "path";
import * as schema from "./schema";

const dataDir = path.join(process.cwd(), "data");
mkdirSync(dataDir, { recursive: true });

const sqlite = new Database(path.join(dataDir, "discovery.db"));
sqlite.pragma("journal_mode = WAL");

sqlite.exec(`
CREATE TABLE IF NOT EXISTS engagements (
  id integer PRIMARY KEY AUTOINCREMENT,
  account_name text NOT NULL,
  industry text NOT NULL,
  status text NOT NULL DEFAULT 'active',
  created_at integer NOT NULL,
  updated_at integer NOT NULL
);
CREATE TABLE IF NOT EXISTS inputs (
  id integer PRIMARY KEY AUTOINCREMENT,
  engagement_id integer NOT NULL REFERENCES engagements(id),
  kind text NOT NULL,
  title text NOT NULL,
  content text NOT NULL,
  created_at integer NOT NULL
);
CREATE TABLE IF NOT EXISTS artifacts (
  id integer PRIMARY KEY AUTOINCREMENT,
  engagement_id integer NOT NULL REFERENCES engagements(id),
  kind text NOT NULL,
  version integer NOT NULL,
  content_json text NOT NULL,
  model_used text NOT NULL,
  created_at integer NOT NULL
) ;
CREATE TABLE IF NOT EXISTS sessions (id integer PRIMARY KEY AUTOINCREMENT, engagement_id integer NOT NULL REFERENCES engagements(id), title text NOT NULL, held_at integer NOT NULL, attendees text NOT NULL DEFAULT '', notes text NOT NULL DEFAULT '', created_at integer NOT NULL);
CREATE TABLE IF NOT EXISTS facts (id integer PRIMARY KEY AUTOINCREMENT, engagement_id integer NOT NULL REFERENCES engagements(id), session_id integer REFERENCES sessions(id), category text NOT NULL, content text NOT NULL, created_at integer NOT NULL);
CREATE TABLE IF NOT EXISTS systems_landscape (id integer PRIMARY KEY AUTOINCREMENT, engagement_id integer NOT NULL REFERENCES engagements(id), session_id integer REFERENCES sessions(id), system text NOT NULL, role text NOT NULL DEFAULT '', sentiment text NOT NULL DEFAULT 'unknown', created_at integer NOT NULL);
CREATE TABLE IF NOT EXISTS pain_points (id integer PRIMARY KEY AUTOINCREMENT, engagement_id integer NOT NULL REFERENCES engagements(id), session_id integer REFERENCES sessions(id), pain text NOT NULL, quote text NOT NULL DEFAULT '', severity text NOT NULL DEFAULT 'medium', created_at integer NOT NULL);
CREATE TABLE IF NOT EXISTS open_questions (id integer PRIMARY KEY AUTOINCREMENT, engagement_id integer NOT NULL REFERENCES engagements(id), session_id integer REFERENCES sessions(id), question text NOT NULL, status text NOT NULL DEFAULT 'open', answer text NOT NULL DEFAULT '', created_at integer NOT NULL);
CREATE TABLE IF NOT EXISTS maturity_scores (id integer PRIMARY KEY AUTOINCREMENT, engagement_id integer NOT NULL REFERENCES engagements(id), session_id integer REFERENCES sessions(id), dimension_id text NOT NULL, stage integer NOT NULL, evidence text NOT NULL DEFAULT '', created_at integer NOT NULL);
`);

export const db = drizzle(sqlite, { schema });
export const rawSqlite = sqlite;
