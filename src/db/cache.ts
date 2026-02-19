import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

export class SqliteCache {
  private db: Database.Database;

  constructor(dbPath: string = 'cache.db') {
    const dir = path.dirname(dbPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    this.db = new Database(dbPath);
    this.init();
  }

  private init() {
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS cache (
        key TEXT PRIMARY KEY,
        value TEXT,
        expires_at INTEGER
      )
    `);
    
    // Create an index for expiry cleanups
    this.db.exec(`CREATE INDEX IF NOT EXISTS idx_expires_at ON cache(expires_at)`);
  }

  get(key: string): string | null {
    const stmt = this.db.prepare('SELECT value, expires_at FROM cache WHERE key = ?');
    const row = stmt.get(key) as { value: string; expires_at: number } | undefined;

    if (!row) return null;

    if (Date.now() > row.expires_at) {
      this.delete(key);
      return null;
    }

    return row.value;
  }

  set(key: string, value: string, ttlSeconds: number = 3600): void {
    const expiresAt = Date.now() + ttlSeconds * 1000;
    const stmt = this.db.prepare(`
      INSERT OR REPLACE INTO cache (key, value, expires_at)
      VALUES (?, ?, ?)
    `);
    stmt.run(key, value, expiresAt);
  }

  delete(key: string): void {
    const stmt = this.db.prepare('DELETE FROM cache WHERE key = ?');
    stmt.run(key);
  }

  clearExpired(): void {
    const stmt = this.db.prepare('DELETE FROM cache WHERE expires_at <= ?');
    stmt.run(Date.now());
  }
}
