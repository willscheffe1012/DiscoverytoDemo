import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const engagements = sqliteTable("engagements", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  accountName: text("account_name").notNull(),
  industry: text("industry", {
    enum: ["industrial_mfg", "cpg", "automotive", "med_device", "other"],
  }).notNull(),
  status: text("status", { enum: ["active", "archived"] })
    .notNull()
    .default("active"),
  createdAt: integer("created_at").notNull(),
  updatedAt: integer("updated_at").notNull(),
});

export const inputs = sqliteTable("inputs", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  engagementId: integer("engagement_id")
    .notNull()
    .references(() => engagements.id),
  kind: text("kind", {
    enum: ["discovery_notes", "transcript", "public_doc", "other"],
  }).notNull(),
  title: text("title").notNull(),
  content: text("content").notNull(),
  origin: text("origin", { enum: ["manual", "ai"] })
    .notNull()
    .default("manual"),
  createdAt: integer("created_at").notNull(),
});

export const artifacts = sqliteTable("artifacts", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  engagementId: integer("engagement_id")
    .notNull()
    .references(() => engagements.id),
  kind: text("kind", {
    enum: ["company_profile", "question_gaps", "maturity_assessment"],
  }).notNull(),
  version: integer("version").notNull(),
  contentJson: text("content_json").notNull(),
  modelUsed: text("model_used").notNull(),
  createdAt: integer("created_at").notNull(),
});

export const sessions = sqliteTable("sessions", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  engagementId: integer("engagement_id")
    .notNull()
    .references(() => engagements.id),
  title: text("title").notNull(),
  heldAt: integer("held_at").notNull(),
  attendees: text("attendees").notNull().default(""),
  notes: text("notes").notNull().default(""),
  createdAt: integer("created_at").notNull(),
});
export const facts = sqliteTable("facts", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  engagementId: integer("engagement_id")
    .notNull()
    .references(() => engagements.id),
  sessionId: integer("session_id").references(() => sessions.id),
  category: text("category", {
    enum: [
      "segment",
      "footprint",
      "demand_pattern",
      "product_complexity",
      "network_complexity",
      "volume",
      "other",
    ],
  }).notNull(),
  content: text("content").notNull(),
  origin: text("origin", { enum: ["manual", "ai"] })
    .notNull()
    .default("manual"),
  createdAt: integer("created_at").notNull(),
});
export const systemsLandscape = sqliteTable("systems_landscape", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  engagementId: integer("engagement_id")
    .notNull()
    .references(() => engagements.id),
  sessionId: integer("session_id").references(() => sessions.id),
  system: text("system").notNull(),
  role: text("role").notNull().default(""),
  sentiment: text("sentiment", {
    enum: ["pain", "neutral", "liked", "unknown"],
  })
    .notNull()
    .default("unknown"),
  origin: text("origin", { enum: ["manual", "ai"] })
    .notNull()
    .default("manual"),
  createdAt: integer("created_at").notNull(),
});
export const painPoints = sqliteTable("pain_points", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  engagementId: integer("engagement_id")
    .notNull()
    .references(() => engagements.id),
  sessionId: integer("session_id").references(() => sessions.id),
  pain: text("pain").notNull(),
  quote: text("quote").notNull().default(""),
  severity: text("severity", { enum: ["high", "medium", "low"] })
    .notNull()
    .default("medium"),
  origin: text("origin", { enum: ["manual", "ai"] })
    .notNull()
    .default("manual"),
  createdAt: integer("created_at").notNull(),
});
export const openQuestions = sqliteTable("open_questions", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  engagementId: integer("engagement_id")
    .notNull()
    .references(() => engagements.id),
  sessionId: integer("session_id").references(() => sessions.id),
  question: text("question").notNull(),
  status: text("status", { enum: ["open", "answered"] })
    .notNull()
    .default("open"),
  answer: text("answer").notNull().default(""),
  origin: text("origin", { enum: ["manual", "ai"] })
    .notNull()
    .default("manual"),
  createdAt: integer("created_at").notNull(),
});
export const maturityScores = sqliteTable("maturity_scores", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  engagementId: integer("engagement_id")
    .notNull()
    .references(() => engagements.id),
  sessionId: integer("session_id").references(() => sessions.id),
  dimensionId: text("dimension_id").notNull(),
  stage: integer("stage").notNull(),
  evidence: text("evidence").notNull().default(""),
  origin: text("origin", { enum: ["manual", "ai_accepted"] })
    .notNull()
    .default("manual"),
  createdAt: integer("created_at").notNull(),
});

export const maturityEvidence = sqliteTable("maturity_evidence", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  engagementId: integer("engagement_id")
    .notNull()
    .references(() => engagements.id),
  sessionId: integer("session_id").references(() => sessions.id),
  dimensionId: text("dimension_id").notNull(),
  quote: text("quote").notNull(),
  note: text("note").notNull().default(""),
  origin: text("origin", { enum: ["manual", "ai"] })
    .notNull()
    .default("ai"),
  createdAt: integer("created_at").notNull(),
});
