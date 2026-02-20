import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { OpenDartClient } from '../src/api/client.js';
import { SqliteCache } from '../src/db/cache.js';
import AdmZip from 'adm-zip';
import fs from 'fs';
import path from 'path';

// This is an integration test since it hits the real API if not mocked, 
// but we will mock the Axios call.
describe('OpenDartClient - CorpCode', () => {
  let cache: SqliteCache;
  let client: OpenDartClient;
  const dbPath = path.join(__dirname, 'test-corpcode.db');

  beforeEach(() => {
    if (fs.existsSync(dbPath)) fs.unlinkSync(dbPath);
    cache = new SqliteCache(dbPath);
    client = new OpenDartClient('test-api-key', cache);
  });

  afterEach(() => {
    cache['db'].close();
    if (fs.existsSync(dbPath)) fs.unlinkSync(dbPath);
    vi.restoreAllMocks();
  });

  it('should sync corp codes and search them', async () => {
    // Generate a dummy valid zip with a dummy XML inside
    const zip = new AdmZip();
    const xmlContent = `
      <?xml version="1.0" encoding="UTF-8"?>
      <result>
          <status>000</status>
          <message>정상</message>
          <list>
              <corp_code>00126380</corp_code>
              <corp_name>삼성전자</corp_name>
              <stock_code>005930</stock_code>
              <modify_date>20230101</modify_date>
          </list>
          <list>
              <corp_code>00164742</corp_code>
              <corp_name>현대자동차</corp_name>
              <stock_code>005380</stock_code>
              <modify_date>20230101</modify_date>
          </list>
      </result>
    `;
    zip.addFile('CORPCODE.xml', Buffer.from(xmlContent, 'utf8'));
    const zipBuffer = zip.toBuffer();

    // Mock axios get
    vi.spyOn(client['axios'], 'get').mockResolvedValue({
      data: zipBuffer,
      status: 200,
      statusText: 'OK',
      headers: {},
      config: {} as any,
    });

    const results = await client.searchCorpCode('삼성전자');
    expect(client['axios'].get).toHaveBeenCalledTimes(1);
    
    expect(results).toHaveLength(1);
    expect(results[0].corp_name).toBe('삼성전자');
    expect(results[0].corp_code).toBe('00126380');
    expect(results[0].stock_code).toBe('005930');

    // Second search should hit local cache, not trigger axios again
    const results2 = await client.searchCorpCode('현대자동차');
    expect(client['axios'].get).toHaveBeenCalledTimes(1); 
    
    expect(results2).toHaveLength(1);
    expect(results2[0].corp_name).toBe('현대자동차');
    expect(results2[0].corp_code).toBe('00164742');
  });
});
