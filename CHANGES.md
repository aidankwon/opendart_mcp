# Changes

## [Unreleased]

- Added `get_periodic_report_info` tool to support 27 additional APIs from the OpenDART DS002 group (Periodic Reports). This tool consolidates features like dividend details, treasury stock status, shareholder information, and executive compensations via an easy-to-use API categorization (`PeriodicReportApiType`).
  - **Found Error:** OpenDART API threw an error (Code: 101, "잘못된 URL입니다") when fetching the Employee Status.
  - **Cause:** The official OpenDART API guide documentation incorrectly lists `empStat` as the API target, but the actual endpoint is `empSttus.json`.
  - **Successful Fix:** Corrected the endpoint mapping in `src/index.ts` from `empStat` to `empSttus`, rebuilt the project, and successfully fetched LG Electronics' employee status.
  - **Limitation Discovered:** While OpenDART provides structured data APIs, deep unstructured text in specific disclosures (like board resolutions for dividends) cannot be fetched directly via these APIs. Such documents must be read directly from the DART viewer website (`dart.fss.or.kr`) using the receipt number (`rcpNo`).
- Added `search_corpcode` MCP tool to search for OpenDART corporate codes locally using SQLite persistence.
- Initial project setup.
