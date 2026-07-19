import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const engagements = sqliteTable("engagements", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  accountName: text("account_name").notNull(),
  industry: text("industry", { enum: ["industrial_mfg", "cpg", "automotive", "med_device", "other"] }).notNull(),
  status: text("status", { enum: ["active", "archived"] }).notNull().default("active"),
  createdAt: integer("created_at").notNull(),
  updatedAt: integer("updated_at").notNull(),
});

export const inputs = sqliteTable("inputs", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  engagementId: integer("engagement_id").notNull().references(() => engagements.id),
  kind: text("kind", { enum: ["discovery_notes", "transcript", "public_doc", "other"] }).notNull(),
  title: text("title").notNull(),
  content: text("content").notNull(),
  createdAt: integer("created_at").notNull(),
});

export const artifacts = sqliteTable("artifacts", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  engagementId: integer("engagement_id").notNull().references(() => engagements.id),
  kind: text("kind", { enum: ["company_profile"] }).notNull(),
  version: integer("version").notNull(),
  contentJson: text("content_json").notNull(),
  modelUsed: text("model_used").notNull(),
  createdAt: integer("created_at").notNull(),
});
