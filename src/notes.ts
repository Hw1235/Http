import { bigint, mysqlTable, text, timestamp } from "drizzle-orm/mysql-core";
import { eq } from "drizzle-orm";
import { migrate } from "drizzle-orm/mysql2/migrator";

import { db } from "./db";

const TABLE_NAME = "notes";

export const notesSchema = mysqlTable(TABLE_NAME, {
  id: bigint("id", { mode: "number" }).primaryKey().autoincrement(),
  text: text("text").notNull(),
  date: timestamp("date").defaultNow().notNull(),
});

export type Note = typeof notesSchema.$inferSelect;

const filename = "notes.json";

export async function createNote(note: Partial<Note>): Promise<Note> {
  if (!note.date || !note.text) {
    throw new Error("note date & text required");
  }

  await db.insert(notesSchema).values({
    text: note.text,
    date: note.date,
  });
  return (
    await db
      .select()
      .from(notesSchema)
      .where(eq(notesSchema.text, note.text))
      .limit(1)
  )[0];
}

export async function getAll() {
  return await db.select().from(notesSchema).limit(10);
}

export async function deleteNote(id: number) {
  console.log(await db.delete(notesSchema).where(eq(notesSchema.id, id)));
}

export async function getNote(id: number): Promise<Note | undefined> {
  return (
    await db.select().from(notesSchema).where(eq(notesSchema.id, id)).limit(1)
  )[0];
}

export async function updateNote(id: number, note: Partial<Note>) {
  const found = await getNote(id);

  if (!found) {
    return;
  }

  // db.prepare(`update ${TABLE_NAME} set where id=?`).run(note.date.getTime(), id)
  await db
    .update(notesSchema)
    .set({
      date: note.date,
      text: note.text,
    })
    .where(eq(notesSchema.id, id));
}

migrate(db, { migrationsFolder: "./drizzle" });
