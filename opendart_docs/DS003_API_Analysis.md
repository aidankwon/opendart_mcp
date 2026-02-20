# OpenDART DS003 (Financial Statement) API Analysis

Based on the [DS003 Development Guide](https://opendart.fss.or.kr/guide/main.do?apiGrpCd=DS003), there are 7 API endpoints available. They have been saved locally in the `opendart_docs/DS003/` directory for reference.

## Identified Endpoints & Potential Tools

### 1. 단일회사 주요계정 (Single Company Major Accounts)

- **Endpoint**: `https://opendart.fss.or.kr/api/fnlttSinglAcnt.json`
- **Current Status**: Already implemented as the `get_financial_statement` tool in `index.ts`.
- **Potential New Tool**: N/A (We may simply rename the existing tool to be more specific, e.g., `get_single_company_major_accounts`).

### 2. 다중회사 주요계정 (Multiple Companies Major Accounts)

- **Endpoint**: `https://opendart.fss.or.kr/api/fnlttMultiAcnt.json`
- **Description**: Fetches major account financial data for multiple companies concurrently.
- **Potential Tool**: `get_multiple_companies_major_accounts`
- **Parameters**: `corp_code` (multiple comma-separated max 5), `bsns_year`, `reprt_code`, `fs_div`.

### 3. 재무제표 원본파일(XBRL) (XBRL Original File)

- **Endpoint**: `https://opendart.fss.or.kr/api/fnlttXbrl.xml`
- **Description**: Downloads the raw XBRL financial statement ZIP file (similar to the DS001 `get_document` ZIP flow).
- **Potential Tool**: `get_xbrl_original_file`
- **Parameters**: `corp_code`, `bsns_year`, `reprt_code`.

### 4. 단일회사 전체 재무제표 (Single Company All Accounts)

- **Endpoint**: `https://opendart.fss.or.kr/api/fnlttSinglAcntAll.json`
- **Description**: Fetches the complete set of financial statement accounts for a single company instead of just major ones.
- **Potential Tool**: `get_single_company_all_accounts`
- **Parameters**: `corp_code`, `bsns_year`, `reprt_code`, `fs_div`.

### 5. XBRL택사노미재무제표양식 (XBRL Taxonomy Form)

- **Endpoint**: `https://opendart.fss.or.kr/api/xbrlTaxonomy.json`
- **Description**: Provides the standard IFRS-based XBRL taxonomy and account format guidelines.
- **Potential Tool**: `get_xbrl_taxonomy`
- **Parameters**: `sj_div` (e.g. Statement of financial position, Income statement).

### 6. 단일회사 주요 재무지표 (Single Company Major Indicators)

- **Endpoint**: `https://opendart.fss.or.kr/api/fnlttSinglIndx.json`
- **Description**: Fetches computed major financial indicators (e.g., ROE, ROA, Debt ratio) for a single company.
- **Potential Tool**: `get_single_company_major_indicators`
- **Parameters**: `corp_code`, `bsns_year`, `reprt_code`.

### 7. 다중회사 주요 재무지표 (Multiple Companies Major Indicators)

- **Endpoint**: `https://opendart.fss.or.kr/api/fnlttCmpnyIndx.json`
- **Description**: Fetches completed major financial indicators for multiple companies.
- **Potential Tool**: `get_multiple_companies_major_indicators`
- **Parameters**: `corp_code` (multiple comma-separated max 5), `bsns_year`, `reprt_code`.

## Tool Development Strategy

We can expose these as individual MCP tools with distinct Zod schemas, or consolidate similar ones (e.g., a consolidated `get_financial_indicators` tool taking an array of corp codes) similar to the DS002 refactor.
