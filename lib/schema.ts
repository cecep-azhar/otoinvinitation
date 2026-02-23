import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";
import { sql } from "drizzle-orm";

export const attendance = sqliteTable("attendance", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  nama: text("nama").notNull(),
  komunitas: text("komunitas").notNull(),
  whatsapp: text("whatsapp").notNull(),
  status: text("status").notNull().default("Hadir"),
  alasan: text("alasan"),
  invite_token: text("invite_token").unique(),
  checkin_at: text("checkin_at"),
  wa_sent: integer("wa_sent").default(0),
  created_at: text("created_at").default(sql`CURRENT_TIMESTAMP`),
});

export type Attendance = typeof attendance.$inferSelect;
export type NewAttendance = typeof attendance.$inferInsert;
