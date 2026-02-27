import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

async function runClient(id: number) {
  const transport = new StreamableHTTPClientTransport(new URL("http://localhost:3001/mcp"));
  const client = new Client({ name: `test-client-${id}`, version: "1.0.0" }, { capabilities: {} });
  
  try {
    console.log(`[Client ${id}] Connecting...`);
    await client.connect(transport);
    console.log(`[Client ${id}] Connected!`);
    
    console.log(`[Client ${id}] Calling search_corpcode...`);
    const result = await client.callTool({ name: "search_corpcode", arguments: { query: "삼성전자" } });
    console.log(`[Client ${id}] Success! Result length: ${JSON.stringify(result).length}`);
    
    console.log(`[Client ${id}] Closing...`);
    await client.close();
    console.log(`[Client ${id}] Closed.`);
    return { id, success: true };
  } catch (err: any) {
    const msg = err.message || err;
    console.error(`[Client ${id}] FAILED: ${msg}`);
    return { id, success: false, error: msg };
  }
}

async function main() {
  const numClients = 5;
  console.log(`Starting ${numClients} clients with 200ms stagger...`);
  
  const clientPromises = [];
  for (let i = 0; i < numClients; i++) {
    clientPromises.push(runClient(i + 1));
    await delay(200); 
  }
  
  const results = await Promise.allSettled(clientPromises);
  
  let failures = 0;
  results.forEach((res, i) => {
    if (res.status === 'fulfilled') {
      if (!res.value.success) {
        failures++;
      }
    } else {
      console.error(`[Client ${i+1}] Core crash:`, res.reason);
      failures++;
    }
  });

  if (failures === 0) {
    console.log("\n✅ ALL CLIENTS COMPLETED SUCCESSFULLY!");
  } else {
    console.error(`\n❌ TEST FAILED: ${failures} clients failed.`);
    process.exit(1);
  }
}

main().catch(err => {
    console.error("Fatal test error:", err);
    process.exit(1);
});
