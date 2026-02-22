# OpenDART MCP Server

An MCP (Model Context Protocol) server for interacting with the South Korean Financial Supervisory Service's (FSS) Open DART API.

This server provides tools to access Korean corporate filings, company overviews, financial statements, and shareholder information directly within your MCP-enabled AI assistant (like Claude or Cursor). It includes a built-in SQLite cache to optimize API usage and reduce latency.

## Features

- **Built-in Caching:** Uses SQLite to cache API responses locally and reduce redundant network calls.
- **Modern HTTP Transport:** Powered by `StreamableHTTPServerTransport`, providing a robust and scalable HTTP/SSE connection model.
- **Concurrent Multi-Client Support:** Seamlessly handles multiple simultaneous client connections by dynamically allocating isolated session states and transports.
- **Session Continuity:** Features session routing via `mcp-session-id` and automatic cleanup of stale sessions.
- **Comprehensive API Coverage:** Exposes 18+ Open DART API endpoints as easily consumable MCP tools with optimized schemas for LLMs.
- **TypeScript & Zod:** Strongly typed inputs and outputs with strict parameter validation and descriptive hints.

## Exposed MCP Tools

The server provides the following tools:

1. **`search_disclosures`** (DS001)
   - Search for corporate public filings.
   - Filters by company code, date range, report type, etc.
   - **Manual Sorting:** Results are automatically sorted by date (descending) by the server to ensure accuracy, even when the upstream API sorting is inconsistent. Use `sort` and `sort_mthd` for custom ordering.
   - _Note: This API returns metadata and receipt numbers (`rcept_no`). You can use the `get_document` tool with this receipt number to download the actual disclosure document._
2. **`get_company_overview`** (DS001/DS002)
   - Retrieve basic profile information for a specific company (CEO name, address, website, etc.).
3. **`get_financial_statement`** (DS003)
   - Get key financial statement data (balance sheet, income statement) for a single company.
4. **`get_multiple_companies_major_accounts`** (DS003)
   - Get key financial statement data for multiple companies (max 5).
5. **`get_single_company_all_accounts`** (DS003)
   - Get the complete set of financial statement accounts for a single company.
6. **`get_xbrl_taxonomy`** (DS003)
   - Get the standard IFRS-based XBRL taxonomy and account format guidelines.
7. **`get_single_company_major_indicators`** (DS003)
   - Get computed major financial indicators (e.g., ROE, ROA, Debt ratio) for a single company.
8. **`get_multiple_companies_major_indicators`** (DS003)
   - Get computed major financial indicators for multiple companies (max 5).
9. **`get_xbrl_original_file`** (DS003)
   - Downloads the raw XBRL financial statement ZIP file, extracting XML, XSD, TXT, and HTM components.
10. **`get_major_shareholders`** (DS004)
    - Retrieve information about major shareholders and executives.
11. **`get_capital_increase_info`** (DS005)
    - Get details about capital increases or decreases over a time period.
12. **`get_equity_securities_info`** (DS006)
    - Retrieve information about issued equity securities.
13. **`get_periodic_report_info`** (DS002 consolidator)
    - A powerful consolidated tool for the DS002 group, providing access to 27+ periodic report features. Fetch information such as: dividends, treasury stock, largest shareholders, minority shareholders, executive and employee statuses, executive compensations, debt securities issuance, unredeemed CP/bond balances, auditor names, audit service contracts, and usage of public/private funds.
14. **`search_corpcode`**
    - Search for a company's 8-digit unique `corp_code` by company name or stock code.
    - **Self-Initializing:** Downloads the full Corporate Code XML dictionary (~100k+ entries) on the first run, stores it in a local SQLite database, and queries locally for sub-second searches.
15. **`get_document`** (DS001)
    - Downloads the full disclosure document (XML format) for a specific filing.
    - Requires a 14-digit receipt number (`rcept_no`), which can be obtained from the `search_disclosures` tool.
16. **`get_equity_disclosure_info`** (DS004)
    - Consolidated tool for DS004 API to retrieve large holdings or executive/major shareholder ownership reports.
17. **`get_major_issues_report_info`** (DS005)
    - Consolidated tool for DS005 to access 36 major corporate issues (e.g., bankruptcy, M&A, capital increases, lawsuits).
18. **`get_registration_statement_info`** (DS006)
    - Consolidated tool for DS006 summarizing registration statements for equity/debt securities, mergers, divisions, etc.

## Setup & Local Development

1. **Clone the repository**
2. **Install dependencies:**
   ```bash
   npm install
   ```
3. **Configure API Key:**
   Create a `.env` file in the root directory and add your Open DART API key (which you can get from [https://opendart.fss.or.kr/](https://opendart.fss.or.kr/)):
   ```env
   OPENDART_API_KEY=your_api_key_here
   ```
4. **Build the project:**
   ```bash
   npm run build
   ```
   _Note: This must be run before the MCP server can be used by an AI client._

## Usage with MCP Clients

### Claude Desktop

To use this with Claude Desktop, add the following to your `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "opendart": {
      "command": "node",
      "args": ["/absolute/path/to/opendart_mcp/dist/index.js"],
      "env": {
        "OPENDART_API_KEY": "your_api_key_here"
      }
    }
  }
}
```

### Cursor IDE

To use this with Cursor, go to `Cursor Settings > MCP` and add a new server:

- **Type:** `command`
- **Command:** `node /absolute/path/to/opendart_mcp/dist/index.js`

_Note: You may need to export the `OPENDART_API_KEY` in your shell profile or modify the start command to inject the environment variable if Cursor doesn't pick up the local `.env` file._

### Gemini CLI (Antigravity)

To run this server with Gemini CLI, you can simply add it to your `~/.gemini/mcp/mcp.json` file. The schema is identical to Claude Desktop's config:

```json
{
  "mcpServers": {
    "opendart": {
      "command": "node",
      "args": ["/absolute/path/to/opendart_mcp/dist/index.js"],
      "env": {
        "OPENDART_API_KEY": "your_api_key_here"
      }
    }
  }
}
```

## Deployment to n8n

For n8n instances (especially those running in Docker or remotely), it is recommended to use the **Streamable HTTP (SSE)** transport. This modern transport supports multiple concurrent sessions reliably.

### 1. Using Docker (Pre-built Image)

The fastest way to deploy is using the image from GitHub Container Registry (GHCR):

```bash
docker run -d \
  -p 3000:3000 \
  -e OPENDART_API_KEY=your_api_key_here \
  -v opendart-cache:/app/data \
  --name opendart-mcp \
  ghcr.io/aidankwon/opendart_mcp:latest
```

### 2. Using Docker Compose

Use the provided `docker-compose.yml` for a more managed setup. This ensures the cache is persisted and the container restarts automatically.

```bash
# Create a .env file with your key first
echo "OPENDART_API_KEY=your_key_here" > .env

# Start the service
docker-compose up -d
```

### 3. Building from Source

If you prefer to build and run locally:

```bash
# Build the image
docker build -t opendart-mcp:latest .

# Run it
docker run -d -p 3000:3000 -e OPENDART_API_KEY=your_key_here opendart-mcp:latest
```

### 4. Manual Startup (No Docker)

Running directly on a server:

```bash
npm run build
npm run start:sse
```

### 5. Register in n8n

1.  In your n8n workflow, add an **MCP Client Tool** node.
2.  Set **Server Transport** to `HTTP Streamable`.
3.  Set **Server URL** to `http://<your-host-ip>:3000/mcp`.
    - **Crucial:** Ensure the path ends in `/mcp`.
4.  **Session Routing:** The server uses the `mcp-session-id` header to handle multiple clients. n8n handles this automatically.
5.  **Auto-Cleanup:** Stale sessions are purged after 1 hour of inactivity.
6.  Configure any necessary firewall rules or proxies to allow n8n to reach port `3000`.

## License

ISC
