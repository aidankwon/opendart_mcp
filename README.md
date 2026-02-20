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
2. **`get_company_overview`** (DS001/DS002)
   - Retrieve basic profile information for a specific company (CEO name, address, website, etc.).
3. **`get_financial_statement`** (DS003)
   - Get key financial statement data (balance sheet, income statement) for a specific business year and report type.
4. **`get_major_shareholders`** (DS004)
   - Retrieve information about major shareholders and executives.
5. **`get_capital_increase_info`** (DS005)
   - Get details about capital increases or decreases over a time period.
6. **`get_equity_securities_info`** (DS006)
   - Retrieve information about issued equity securities.
7. **`get_periodic_report_info`** (DS002 consolidator)
   - Get missing features from the DS002 group, consolidated into a single generic tool for periodic reports. Fetch information such as: dividends, treasury stock, largest shareholders, minority shareholders, executive and employee statuses, executive compensations, debt securities issuance, unredeemed CP/bond balances, auditor names, audit service contracts, and usage of public/private funds.
8. **`search_corpcode`**
   - Search for a company's 8-digit unique `corp_code` by company name or stock code.
   - Downloads the full Corporate Code XML dictionary on the first run, stores it in SQLite, and queries locally for subsequent searches.

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

## License

ISC
