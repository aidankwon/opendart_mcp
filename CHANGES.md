# Changes

## [Unreleased]

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
- Initial project setup.
