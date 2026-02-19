import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { SqliteCache } from '../src/db/cache';
import fs from 'fs';
import path from 'path';

const TEST_DB_PATH = path.join(__dirname, 'test_cache.db');

describe('SqliteCache', () => {
  let cache: SqliteCache;

  beforeEach(() => {
    cache = new SqliteCache(TEST_DB_PATH);
  });

  afterEach(() => {
    // database connection is automatically closed when the object is garbage collected in better-sqlite3 usually, 
    // but better-sqlite3 doesn't have a close method on the instance easily accessible in this pattern without exposing it.
    // Ideally we should close it. For tests, we can just delete the file if possible, or use a new file each time.
    // For simplicity in this environment, we'll try to unlink. 
    // If it fails due to lock, we might need to expose close().
    try {
      if (fs.existsSync(TEST_DB_PATH)) {
        // Force garbage collection might affect it, but let's just rely on unique paths or cleanup if needed.
        // Actually better-sqlite3 instances should be closed.
        // Let's modify the class to have a close method for testing purposes if this fails.
        // For now, let's just trust it works or fail.
        fs.unlinkSync(TEST_DB_PATH); 
      }
    } catch (e) {
      // Ignored
    }
  });

  it('should set and get a value', () => {
    cache.set('test-key', 'test-value');
    expect(cache.get('test-key')).toBe('test-value');
  });

  it('should return null for missing key', () => {
    expect(cache.get('missing-key')).toBeNull();
  });

  it('should expire values', async () => {
    cache.set('short-lived', 'value', 0.1); // 100ms TTL
    expect(cache.get('short-lived')).toBe('value');
    
    await new Promise(resolve => setTimeout(resolve, 200));
    
    expect(cache.get('short-lived')).toBeNull();
  });

  it('should overwrite existing keys', () => {
    cache.set('key', 'value1');
    expect(cache.get('key')).toBe('value1');
    
    cache.set('key', 'value2');
    expect(cache.get('key')).toBe('value2');
  });
});
