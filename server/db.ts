import initSqlJs, { type Database as SqlJsDatabase } from "sql.js";
import { drizzle } from "drizzle-orm/sql-js";
import * as schema from "@shared/schema";
import path from "path";
import fs from "fs";

// Ensure data directory exists
const dataDir = path.resolve(process.cwd(), "data");
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const dbPath = path.join(dataDir, "cartrack.db");

// Initialize sql.js
const SQL = await initSqlJs();

// Load existing database or create new one
let sqliteDb: SqlJsDatabase;
if (fs.existsSync(dbPath)) {
  const fileBuffer = fs.readFileSync(dbPath);
  sqliteDb = new SQL.Database(fileBuffer);
} else {
  sqliteDb = new SQL.Database();
}

// Enable foreign keys
sqliteDb.run("PRAGMA foreign_keys = ON");

// Auto-save function
function saveDatabase() {
  const data = sqliteDb.export();
  const buffer = Buffer.from(data);
  fs.writeFileSync(dbPath, buffer);
}

// Save periodically and on process exit
const saveInterval = setInterval(saveDatabase, 5000);
process.on("exit", () => {
  clearInterval(saveInterval);
  saveDatabase();
});
process.on("SIGINT", () => {
  saveDatabase();
  process.exit(0);
});
process.on("SIGTERM", () => {
  saveDatabase();
  process.exit(0);
});

export const db = drizzle(sqliteDb, { schema });
export const sqlite = sqliteDb;
export { saveDatabase };