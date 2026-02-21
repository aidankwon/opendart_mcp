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
    try {
      this.db.exec(`
        CREATE TABLE IF NOT EXISTS cache (
          key TEXT PRIMARY KEY,
          value TEXT,
          expires_at INTEGER
        )
      `);
      
      // Create an index for expiry cleanups
      this.db.exec(`CREATE INDEX IF NOT EXISTS idx_expires_at ON cache(expires_at)`);

      this.db.exec(`
        CREATE TABLE IF NOT EXISTS corp_codes (
          corp_code TEXT PRIMARY KEY,
          corp_name TEXT,
          stock_code TEXT,
          modify_date TEXT
        )
      `);

      this.db.exec(`CREATE INDEX IF NOT EXISTS idx_corp_name ON corp_codes(corp_name)`);
    } catch (error: any) {
      console.error(`[WARNING] Failed to initialize SQLite cache: ${error.message}. Caching will be disabled.`);
    }
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

  hasCorpCodes(): boolean {
    const stmt = this.db.prepare('SELECT COUNT(*) as count FROM corp_codes');
    const row = stmt.get() as { count: number };
    return row.count > 0;
  }

  insertCorpCodes(codes: { corp_code: string; corp_name: string; stock_code: string; modify_date: string }[]): void {
    const insert = this.db.prepare(`
      INSERT OR REPLACE INTO corp_codes (corp_code, corp_name, stock_code, modify_date)
      VALUES (@corp_code, @corp_name, @stock_code, @modify_date)
    `);
    
    const insertMany = this.db.transaction((items) => {
      for (const item of items) {
        // fast-xml-parser might return empty strings or arrays for empty tags, ensure they are strings
        let corpCode = String(item.corp_code || '').trim();
        if (corpCode.length > 0) {
            corpCode = corpCode.padStart(8, '0');
        }
        
        let stockCode = String(item.stock_code || '').trim();
        if (stockCode.length > 0) {
            stockCode = stockCode.padStart(6, '0');
        }

        insert.run({
          corp_code: corpCode,
          corp_name: String(item.corp_name || ''),
          stock_code: stockCode,
          modify_date: String(item.modify_date || '')
        });
      }
    });

    insertMany(codes);
  }

  searchCorpCodes(query: string): { corp_code: string; corp_name: string; stock_code: string; modify_date: string }[] {
    // Basic search on name, stock_code, or corp_code
    const stmt = this.db.prepare(`
      SELECT corp_code, corp_name, stock_code, modify_date 
      FROM corp_codes 
      WHERE corp_name LIKE ? OR stock_code = ? OR corp_code = ?
      ORDER BY corp_name ASC
      LIMIT 50
    `);
    const searchTerm = `%${query}%`;
    return stmt.all(searchTerm, query, query) as { corp_code: string; corp_name: string; stock_code: string; modify_date: string }[];
  }
}
