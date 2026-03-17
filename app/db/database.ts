import * as SQLite from "expo-sqlite";
import { Page, Block } from "@/store/pages";

const DATABASE_NAME = "blocknote.db";

let db: SQLite.SQLiteDatabase | null = null;

async function getDatabase(): Promise<SQLite.SQLiteDatabase> {
  if (db) return db;
  db = await SQLite.openDatabaseAsync(DATABASE_NAME);
  return db;
}

type RawBlock = {
  id: string;
  pageId: string;
  type: "text";
  content: string;
  order: number;
  format?: Block["format"];
  isBold?: number;
  isItalic?: number;
  isUnderline?: number;
};

function mapRawBlock(raw: RawBlock): Block {
  return {
    id: raw.id,
    pageId: raw.pageId,
    type: raw.type,
    content: raw.content ?? "",
    order: raw.order,
    format: raw.format ?? "paragraph",
    isBold: Boolean(raw.isBold),
    isItalic: Boolean(raw.isItalic),
    isUnderline: Boolean(raw.isUnderline),
  };
}

async function ensureBlocksColumns(database: SQLite.SQLiteDatabase) {
  const columns = await database.getAllAsync<{ name: string }>(
    "PRAGMA table_info(blocks);",
  );
  const existingColumnNames = new Set(columns.map((col) => col.name));

  if (!existingColumnNames.has("format")) {
    await database.execAsync(
      "ALTER TABLE blocks ADD COLUMN format TEXT NOT NULL DEFAULT 'paragraph';",
    );
  }

  if (!existingColumnNames.has("isBold")) {
    await database.execAsync(
      "ALTER TABLE blocks ADD COLUMN isBold INTEGER NOT NULL DEFAULT 0;",
    );
  }

  if (!existingColumnNames.has("isItalic")) {
    await database.execAsync(
      "ALTER TABLE blocks ADD COLUMN isItalic INTEGER NOT NULL DEFAULT 0;",
    );
  }

  if (!existingColumnNames.has("isUnderline")) {
    await database.execAsync(
      "ALTER TABLE blocks ADD COLUMN isUnderline INTEGER NOT NULL DEFAULT 0;",
    );
  }
}

export async function initializeDatabase(): Promise<void> {
  const database = await getDatabase();

  // Enable foreign keys
  await database.execAsync("PRAGMA foreign_keys = ON;");

  // Create pages table
  await database.execAsync(`
    CREATE TABLE IF NOT EXISTS pages (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // Create blocks table
  await database.execAsync(`
    CREATE TABLE IF NOT EXISTS blocks (
      id TEXT PRIMARY KEY,
      pageId TEXT NOT NULL,
      type TEXT NOT NULL DEFAULT 'text',
      content TEXT,
      "order" INTEGER NOT NULL,
      format TEXT NOT NULL DEFAULT 'paragraph',
      isBold INTEGER NOT NULL DEFAULT 0,
      isItalic INTEGER NOT NULL DEFAULT 0,
      isUnderline INTEGER NOT NULL DEFAULT 0,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (pageId) REFERENCES pages(id)
    );
  `);

  await ensureBlocksColumns(database);
}

export async function getAllPages(): Promise<Page[]> {
  const database = await getDatabase();
  const result = await database.getAllAsync(
    "SELECT id, title FROM pages ORDER BY created_at DESC;",
  );
  return result as Page[];
}

export async function getPageBlocks(pageId: string): Promise<Block[]> {
  const database = await getDatabase();
  const result = await database.getAllAsync<RawBlock>(
    'SELECT id, pageId, type, content, "order", format, isBold, isItalic, isUnderline FROM blocks WHERE pageId = ? ORDER BY "order" ASC;',
    [pageId],
  );
  return result.map(mapRawBlock);
}

export async function getAllBlocks(): Promise<Block[]> {
  const database = await getDatabase();
  const result = await database.getAllAsync<RawBlock>(
    'SELECT id, pageId, type, content, "order", format, isBold, isItalic, isUnderline FROM blocks ORDER BY pageId, "order" ASC;',
  );
  return result.map(mapRawBlock);
}

export async function insertPage(page: Page): Promise<void> {
  const database = await getDatabase();
  await database.runAsync("INSERT INTO pages (id, title) VALUES (?, ?);", [
    page.id,
    page.title,
  ]);
}

export async function updatePageTitle(
  id: string,
  title: string,
): Promise<void> {
  const database = await getDatabase();
  await database.runAsync("UPDATE pages SET title = ? WHERE id = ?;", [
    title,
    id,
  ]);
}

export async function deletePage(id: string): Promise<void> {
  const database = await getDatabase();
  // Delete all blocks for this page first
  await database.runAsync("DELETE FROM blocks WHERE pageId = ?;", [id]);
  // Then delete the page
  await database.runAsync("DELETE FROM pages WHERE id = ?;", [id]);
}

export async function insertBlock(block: Block): Promise<void> {
  const database = await getDatabase();
  await database.runAsync(
    'INSERT INTO blocks (id, pageId, type, content, "order", format, isBold, isItalic, isUnderline) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?);',
    [
      block.id,
      block.pageId,
      block.type,
      block.content,
      block.order,
      block.format,
      block.isBold ? 1 : 0,
      block.isItalic ? 1 : 0,
      block.isUnderline ? 1 : 0,
    ],
  );
}

export async function updateBlockContent(
  id: string,
  content: string,
): Promise<void> {
  const database = await getDatabase();
  await database.runAsync("UPDATE blocks SET content = ? WHERE id = ?;", [
    content,
    id,
  ]);
}

export async function updateBlockStyle(
  id: string,
  updates: Partial<
    Pick<Block, "format" | "isBold" | "isItalic" | "isUnderline">
  >,
): Promise<void> {
  const database = await getDatabase();

  const fields: string[] = [];
  const values: Array<string | number> = [];

  if (updates.format !== undefined) {
    fields.push("format = ?");
    values.push(updates.format);
  }
  if (updates.isBold !== undefined) {
    fields.push("isBold = ?");
    values.push(updates.isBold ? 1 : 0);
  }
  if (updates.isItalic !== undefined) {
    fields.push("isItalic = ?");
    values.push(updates.isItalic ? 1 : 0);
  }
  if (updates.isUnderline !== undefined) {
    fields.push("isUnderline = ?");
    values.push(updates.isUnderline ? 1 : 0);
  }

  if (fields.length === 0) return;

  values.push(id);
  await database.runAsync(
    `UPDATE blocks SET ${fields.join(", ")} WHERE id = ?;`,
    values,
  );
}

export async function deleteBlock(id: string): Promise<void> {
  const database = await getDatabase();
  await database.runAsync("DELETE FROM blocks WHERE id = ?;", [id]);
}

export async function clearAllData(): Promise<void> {
  const database = await getDatabase();
  await database.execAsync("DELETE FROM blocks; DELETE FROM pages;");
}
