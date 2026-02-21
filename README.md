# OpenDART MCP Server

An MCP (Model Context Protocol) server for interacting with the South Korean Financial Supervisory Service's (FSS) Open DART API.

This server provides tools to access Korean corporate filings, company overviews, financial statements, and shareholder information directly within your MCP-enabled AI assistant (like Claude or Cursor). It includes a built-in SQLite cache to optimize API usage and reduce latency.

## Features

- **Built-in Caching:** Uses SQLite to cache API responses locally and reduce redundant network calls.
- **Comprehensive API Coverage:** Exposes multiple Open DART API endpoints as easily consumable MCP tools.
- **TypeScript & Zod:** Strongly typed inputs and outputs for AI assistants.

## Exposed MCP Tools

The server provides the following tools:

1. **`search_disclosures`** (DS001)
   - Search for corporate public filings.
   - Filters by company code, date range, report type, etc.
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
    - Get missing features from the DS002 group, consolidated into a single generic tool for periodic reports. Fetch information such as: dividends, treasury stock, largest shareholders, minority shareholders, executive and employee statuses, executive compensations, debt securities issuance, unredeemed CP/bond balances, auditor names, audit service contracts, and usage of public/private funds.
14. **`search_corpcode`**
    - Search for a company's 8-digit unique `corp_code` by company name or stock code.
    - Downloads the full Corporate Code XML dictionary on the first run, stores it in SQLite, and queries locally for subsequent searches.
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

For n8n instances (especially those running in Docker or remotely), it is recommended to use the **SSE (Server-Sent Events)** transport.

### 1. Run using Docker (SSE)

The easiest way to deploy is using the pre-built image from GitHub Container Registry (GHCR):

```bash
# Pull the latest image
docker pull ghcr.io/aidankwon/opendart_mcp:latest

# Run the container (set your API key)
docker run -d \
  -p 3000:3000 \
  -e OPENDART_API_KEY=your_api_key_here \
  -v opendart-cache:/app/data \
  --name opendart-mcp \
  ghcr.io/aidankwon/opendart_mcp:latest
```

Alternatively, you can use Docker Compose with the provided `docker-compose.yml`. The project is configured with CI/CD to automatically build and push new images to GHCR on every push to `main`.

### 2. Manual SSE Startup

If you prefer to run it manually:

```bash
npm run build
npm run start:sse
```

### 3. Register in n8n

1.  In your n8n workflow, add an **MCP Client Tool** node.
2.  Set **Server Transport** to `SSE`.
3.  Set **SSE URL** to `http://your-host-ip:3000/sse`.
4.  Configure any necessary authentication if you've added a proxy (this server has no built-in auth for the SSE endpoint itself).

## License

ISC
