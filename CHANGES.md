# Changes

## [1.2.1] - 2026-02-21

- Fixed `MODULE_NOT_FOUND` error in Docker container by moving several runtime dependencies (`@modelcontextprotocol/sdk`, `axios`, `better-sqlite3`, `dotenv`, `zod`) from `devDependencies` to `dependencies` in `package.json`.
- Updated `README.md` with instructions on how to build the Docker image locally from source.

## [1.2.0] - 2026-02-21

- Added support for **SSE (Server-Sent Events)** transport to enable compatibility with n8n and other remote MCP clients.
- Implemented `/sse` and `/messages` endpoints using `SSEServerTransport`.
- Added a `--sse` command-line flag and `MCP_TRANSPORT=sse` environment variable to switch between `stdio` and `sse` modes.
- Added a `start:sse` NPM script for easier deployment.
- Created a `Dockerfile` and `docker-compose.yml` for containerized deployment.
- Updated documentation with n8n integration guides.

## [1.1.0] - 2026-02-21

### Added

- Multi-layer token usage reduction pipeline in `src/utils.ts`.
- `sanitizeResponse`: Recursively removes `null`, `undefined`, empty strings, and empty arrays.
- `factorCommonFields`: Extracts redundant fields across list items into a top-level `common` object.
- XML Content Optimization: Automatically parses XML content to JSON, removes boilerplate, and flattens redundant `#text` wrappers.
- JSON minification: Removed indentation from all tool outputs.
- Unit tests for optimization utilities in `tests/utils.test.ts`.

## [1.0.0] - 2026-02-21

- Enhanced all 18 MCP tools with robust parameter hints to improve LLM accuracy:
  - Added strict Regex validation for `corp_code` (8 digits), `rcept_no` (14 digits), and dates (8 digits).
  - Implemented exhaustive `Enums` for `reprt_code` (Report Types), `idx_cl_code` (Indicators), and `sj_div` (XBRL Taxonomy).
  - Improved `describe()` strings for all parameters, providing clear format guidance (e.g., `YYYYMMDD`) and contextual examples.
  - This significantly reduces "parameter hallucination" by providing the LLM with both semantic and structural constraints in the MCP tool definitions.

- Improved cache reliability and portability:
  - Changed the default cache path to `~/.opendart-mcp/cache.db` to avoid "readonly database" or permission errors when the server is executed from restricted environments.
  - Made the SQLite cache initialization non-fatal; the MCP server will now gracefully continue even if the local database cannot be opened or written to.
  - Added a diagnostic log in `index.ts` to surface the resolved cache path for easier troubleshooting.

- Refactored `McpServer` tools API to use the new `registerTool` method instead of the deprecated `McpServer.tool` method. All 18 tools were migrated to explicitly use `z.object()` wrapped schemas inside a configuration object, improving type safety as per the updated `@modelcontextprotocol/sdk` documentation.

- Added 3 consolidated MCP tools covering the OpenDART DS004, DS005, and DS006 API groups:
  - `get_equity_disclosure_info` (DS004 - 2 APIs)
  - `get_major_issues_report_info` (DS005 - 36 APIs)
  - `get_registration_statement_info` (DS006 - 6 APIs)
  - These tools use a human-readable `target_api` Enum to route requests dynamically, significantly expanding the server's coverage of corporate actions and reports without protocol bloat.
- Added 6 new MCP tools to fully cover the OpenDART DS003 API group (Financial Statements):
  - `get_multiple_companies_major_accounts` (DS003)
  - `get_single_company_all_accounts` (DS003)
  - `get_xbrl_taxonomy` (DS003)
  - `get_single_company_major_indicators` (DS003)
  - `get_multiple_companies_major_indicators` (DS003)
  - `get_xbrl_original_file` (DS003)
  - Also mapped `get_financial_statement` to explicitly use `fnlttSinglAcnt.json` to properly fetch single company major accounts.
  - **Limitation Discovered:** For `get_xbrl_original_file`, the extracted XBRL files can include `.txt`, `.htm`, `.xsd`, and `.xbrl` file extensions alongside traditional XML. Adjusted parsing to ingest all these typical archive structures instead of relying only on `.xml`.
- Added `get_document` MCP tool to retrieve the full original disclosure document (in XML format) from OpenDART. Uses the 14-digit receipt number (`rcept_no`) to download and extract the ZIP archive in memory, returning the XML contents.
  - **Found Error:** `TypeError: () => ({ getEntries: ... }) is not a constructor` when running `vitest` for `adm-zip` mock.
  - **Cause:** `adm-zip` exports a constructor, but the mock was returning a function, causing test failure upon `new AdmZip(buffer)`.
  - **Successful Fix:** Refactored the Vitest mock to use a standard ES6 `class MockAdmZip` with a `getEntries` method.
  - **Found Error:** Failed to properly bubble the API error response when the `rcept_no` is invalid (the API returns JSON instead of a ZIP). The JSON parsing `try-catch` was mistakenly swallowing the validation error.
  - **Successful Fix:** Separated the JSON `try-catch` from the logical `status !== '000'` check to ensure errors bubble up correctly.
  - **Limitation Discovered:** The extracted `document.xml` file often contains raw HTML embedded directly inside the XML structure, meaning additional HTML stripping/parsing is needed if raw text is desired.
- Added `get_periodic_report_info` tool to support 27 additional APIs from the OpenDART DS002 group (Periodic Reports). This tool consolidates features like dividend details, treasury stock status, shareholder information, and executive compensations via an easy-to-use API categorization (`PeriodicReportApiType`).
  - **Found Error:** OpenDART API threw an error (Code: 101, "잘못된 URL입니다") when fetching the Employee Status.
  - **Cause:** The official OpenDART API guide documentation incorrectly lists `empStat` as the API target, but the actual endpoint is `empSttus.json`.
  - **Successful Fix:** Corrected the endpoint mapping in `src/index.ts` from `empStat` to `empSttus`, rebuilt the project, and successfully fetched LG Electronics' employee status.
  - **Limitation Discovered:** While OpenDART provides structured data APIs, deep unstructured text in specific disclosures (like board resolutions for dividends) cannot be fetched directly via these APIs. Such documents must be read directly from the DART viewer website (`dart.fss.or.kr`) using the receipt number (`rcpNo`).
- Added `search_corpcode` MCP tool to search for OpenDART corporate codes locally using SQLite persistence.
  - **Found Bug:** The `corp_code` and `stock_code` values stored in the local SQLite cache were missing their leading zeros if they happened to be parsed as numeric by the XML engine, breaking downstream API calls which require 8-digit and 6-digit strings respectively.
  - **Successful Fix:** Explicitly padded `corp_code` to 8 characters and `stock_code` to 6 characters prior to Database insertion. Additionally updated the cache query logic to allow searching strictly by 8-digit `corp_code` as well.
- Initial project setup.
