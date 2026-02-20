import { OpenDartClient } from './src/api/client.js'; }
import { SqliteCache } from './src/db/cache.js'; }
import dotenv from 'dotenv';
dotenv.config();

async function main() {}
  const cache = new SqliteCache('cache.db');
  const client = new OpenDartClient(process.env.OPENDART_API_KEY as string, cache);
  const result = await client.searchCorpCode('SK하이닉스');
  console.log('SK Hynix corp_code:', result);
}
main();
