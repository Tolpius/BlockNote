import * as SQLite from "expo-sqlite";
import { Page, Block } from "@/store/pages";

const DATABASE_NAME = "blocknote.db";

let db: SQLite.SQLiteDatabase | null = null;

async function getDatabase(): Promise<SQLite.SQLiteDatabase> {
  if (db) return db;
  db = await SQLite.openDatabaseAsync(DATABASE_NAME);
  return db;
}

export async function initializeDatabase(): Promise<void> {
  const database = await getDatabase();

  await database.execAsync("PRAGMA foreign_keys = ON;");

  await database.execAsync(`
    CREATE TABLE IF NOT EXISTS pages (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `);

  await database.execAsync(`
    CREATE TABLE IF NOT EXISTS blocks (
      id TEXT PRIMARY KEY,
      pageId TEXT NOT NULL,
      type TEXT NOT NULL DEFAULT 'text',
      content TEXT,
      "order" INTEGER NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (pageId) REFERENCES pages(id)
    );
  `);
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
  const result = await database.getAllAsync<Block>(
    'SELECT id, pageId, type, content, "order" FROM blocks WHERE pageId = ? ORDER BY "order" ASC;',
    [pageId],
  );
  return result;
}

export async function getAllBlocks(): Promise<Block[]> {
  const database = await getDatabase();
  const result = await database.getAllAsync<Block>(
    'SELECT id, pageId, type, content, "order" FROM blocks ORDER BY pageId, "order" ASC;',
  );
  return result;
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
  await database.runAsync("DELETE FROM blocks WHERE pageId = ?;", [id]);
  await database.runAsync("DELETE FROM pages WHERE id = ?;", [id]);
}

export async function insertBlock(block: Block): Promise<void> {
  const database = await getDatabase();
  await database.runAsync(
    'INSERT INTO blocks (id, pageId, type, content, "order") VALUES (?, ?, ?, ?, ?);',
    [block.id, block.pageId, block.type, block.content, block.order],
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

export async function deleteBlock(id: string): Promise<void> {
  const database = await getDatabase();
  await database.runAsync("DELETE FROM blocks WHERE id = ?;", [id]);
}

export async function clearAllData(): Promise<void> {
  const database = await getDatabase();
  await database.execAsync("DELETE FROM blocks; DELETE FROM pages;");
}
