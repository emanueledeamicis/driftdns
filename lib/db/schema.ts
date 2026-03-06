import { sql } from "drizzle-orm";
import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";

// DNS providers configured by the user
export const providers = sqliteTable("providers", {
    id: text("id").primaryKey(),
    type: text("type", { enum: ["route53", "cloudflare"] }).notNull(),
    name: text("name").notNull(),
    encryptedCredentials: text("encrypted_credentials").notNull(),
    createdAt: integer("created_at")
        .notNull()
        .default(sql`(unixepoch())`),
});

// Records that have DDNS enabled
export const watchedRecords = sqliteTable("watched_records", {
    id: text("id").primaryKey(),
    providerId: text("provider_id")
        .notNull()
        .references(() => providers.id, { onDelete: "cascade" }),
    zoneId: text("zone_id").notNull(),
    zoneName: text("zone_name").notNull(),
    recordId: text("record_id").notNull(),
    recordName: text("record_name").notNull(),
    schedule: text("schedule").notNull().default("*/30 * * * *"),
    enabled: integer("enabled").notNull().default(1),
    lastKnownIp: text("last_known_ip"),
    createdAt: integer("created_at")
        .notNull()
        .default(sql`(unixepoch())`),
});

// Log of every update attempt
export const updateLogs = sqliteTable("update_logs", {
    id: text("id").primaryKey(),
    watchedRecordId: text("watched_record_id")
        .notNull()
        .references(() => watchedRecords.id, { onDelete: "cascade" }),
    timestamp: integer("timestamp")
        .notNull()
        .default(sql`(unixepoch())`),
    oldIp: text("old_ip"),
    newIp: text("new_ip"),
    success: integer("success").notNull(),
    message: text("message"),
});

export type Provider = typeof providers.$inferSelect;
export type NewProvider = typeof providers.$inferInsert;
export type WatchedRecord = typeof watchedRecords.$inferSelect;
export type NewWatchedRecord = typeof watchedRecords.$inferInsert;
export type UpdateLog = typeof updateLogs.$inferSelect;
export type NewUpdateLog = typeof updateLogs.$inferInsert;
