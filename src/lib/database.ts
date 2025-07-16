
import sqlite3 from 'sqlite3';
import { open, Database } from 'sqlite';

let db: Database | null = null;

export async function getDb(): Promise<Database> {
  if (!db) {
    db = await open({
      filename: './database.sqlite',
      driver: sqlite3.Database,
    });
  }
  return db;
}
