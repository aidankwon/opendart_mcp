# OpenDART API Analysis: DS004, DS005, DS006

This document contains a comprehensive analysis of the OpenDART API endpoints for Equity Disclosures, Major Issues Reports, and Registration Statements. This information was extracted from the OpenDART Developer Guide tabs on the official website.

## 1. Group DS004: 지분공시 (Equity Disclosure)

Contains 2 API endpoints focusing on equity holdings.

**Common Required Request Parameters:**

- `crtfc_key`: API Authentication Key
- `corp_code`: Unique company code (8 digits)

| API Title               | Endpoint URL           | Description                            | Possible Human-Friendly Enum |
| :---------------------- | :--------------------- | :------------------------------------- | :--------------------------- |
| 대량보유 상황보고       | `/api/majorstock.json` | Report on large stock holdings.        | `LARGE_HOLDINGS`             |
| 임원ㆍ주요주주 소유보고 | `/api/elestock.json`   | Executive/major shareholder ownership. | `EXEC_MAJOR_SHAREHOLDER`     |

---

## 2. Group DS005: 주요사항보고서 (Major Issues Report)

Contains 36 distinct API endpoints detailing significant corporate events.

**Common Required Request Parameters:**

- `crtfc_key`: API Authentication Key
- `corp_code`: Unique company code (8 digits)
- `bgn_de`: Search start date (YYYYMMDD)
- `end_de`: Search end date (YYYYMMDD)

| API Title                          | Endpoint URL                       | Possible Human-Friendly Enum       |
| :--------------------------------- | :--------------------------------- | :--------------------------------- |
| 자산양수도(기타), 풋백옵션         | `/api/astInhtrfEtcPtbkOpt.json`    | `ASSET_TRANSFER_PUTBACK`           |
| 부도발생                           | `/api/dfOcr.json`                  | `BANKRUPTCY`                       |
| 영업정지                           | `/api/bsnSp.json`                  | `BUSINESS_SUSPENSION`              |
| 회생절차 개시신청                  | `/api/ctrcvsBgrq.json`             | `REHABILITATION_PROCEEDING`        |
| 해산사유 발생                      | `/api/dsRsOcr.json`                | `DISSOLUTION_GROUNDS`              |
| 유상증자 결정                      | `/api/piicDecsn.json`              | `PAID_IN_CAPITAL_INCREASE`         |
| 무상증자 결정                      | `/api/fricDecsn.json`              | `FREE_ISSUE`                       |
| 유무상증자 결정                    | `/api/pifricDecsn.json`            | `PAID_FREE_ISSUE`                  |
| 감자 결정                          | `/api/crDecsn.json`                | `CAPITAL_REDUCTION`                |
| 채권은행 등의 관리절차 개시        | `/api/bnkMngtPcbg.json`            | `BANK_MGT_PROCEEDING_START`        |
| 소송 등의 제기                     | `/api/lwstLg.json`                 | `LAWSUITS_FILED`                   |
| 해외 증권시장 주권등 상장 결정     | `/api/ovLstDecsn.json`             | `OVERSEAS_LISTING_DECISION`        |
| 해외 증권시장 주권등 상장폐지 결정 | `/api/ovDlstDecsn.json`            | `OVERSEAS_DELISTING_DECISION`      |
| 해외 증권시장 주권등 상장          | `/api/ovLst.json`                  | `OVERSEAS_LISTING_COMPLETION`      |
| 해외 증권시장 주권등 상장폐지      | `/api/ovDlst.json`                 | `OVERSEAS_DELISTING_COMPLETION`    |
| 전환사채권 발행결정                | `/api/cvbdIsDecsn.json`            | `CONVERTIBLE_BOND_ISSUE`           |
| 신주인수권부사채권 발행결정        | `/api/bdwtIsDecsn.json`            | `BOND_WITH_WARRANT_ISSUE`          |
| 교환사채권 발행결정                | `/api/exbdIsDecsn.json`            | `EXCHANGEABLE_BOND_ISSUE`          |
| 채권은행 등의 관리절차 중단        | `/api/bnkMngtPcsp.json`            | `BANK_MGT_PROCEEDING_HALT`         |
| 상각형 조건부자본증권 발행결정     | `/api/wdCocobdIsDecsn.json`        | `WRITE_DOWN_COCO_BOND_ISSUE`       |
| 자기주식 취득 결정                 | `/api/tsstkAqDecsn.json`           | `TREASURY_STOCK_ACQUISITION`       |
| 자기주식 처분 결정                 | `/api/tsstkDpDecsn.json`           | `TREASURY_STOCK_DISPOSAL`          |
| 자기주식취득 신탁계약 체결 결정    | `/api/tsstkAqTrctrCnsDecsn.json`   | `TREASURY_STOCK_TRUST_CONTRACT`    |
| 자기주식취득 신탁계약 해지 결정    | `/api/tsstkAqTrctrCcDecsn.json`    | `TREASURY_STOCK_TRUST_TERMINATION` |
| 영업양수 결정                      | `/api/bsnInhDecsn.json`            | `BUSINESS_ACQUISITION`             |
| 영업양도 결정                      | `/api/bsnTrfDecsn.json`            | `BUSINESS_TRANSFER`                |
| 유형자산 양수 결정                 | `/api/tgastInhDecsn.json`          | `TANGIBLE_ASSET_ACQUISITION`       |
| 유형자산 양도 결정                 | `/api/tgastTrfDecsn.json`          | `TANGIBLE_ASSET_TRANSFER`          |
| 타법인 주식 및 출자증권 양수결정   | `/api/otcprStkInvscrInhDecsn.json` | `OTHER_CORP_STOCK_ACQUISITION`     |
| 타법인 주식 및 출자증권 양도결정   | `/api/otcprStkInvscrTrfDecsn.json` | `OTHER_CORP_STOCK_TRANSFER`        |
| 주권 관련 사채권 양수 결정         | `/api/stkrtbdInhDecsn.json`        | `STOCK_RELATED_BOND_ACQUISITION`   |
| 주권 관련 사채권 양도 결정         | `/api/stkrtbdTrfDecsn.json`        | `STOCK_RELATED_BOND_TRANSFER`      |
| 회사합병 결정                      | `/api/cmpMgDecsn.json`             | `MERGER_DECISION`                  |
| 회사분할 결정                      | `/api/cmpDvDecsn.json`             | `COMPANY_DIVISION_DECISION`        |
| 회사분할합병 결정                  | `/api/cmpDvmgDecsn.json`           | `DIVISION_MERGER_DECISION`         |
| 주식교환·이전 결정                 | `/api/stkExtrDecsn.json`           | `SHARE_EXCHANGE_TRANSFER_DECISION` |

---

## 3. Group DS006: 증권신고서 (Registration Statements)

Contains 6 API endpoints summarizing corporate registration statements.

**Common Required Request Parameters:**

- `crtfc_key`: API Authentication Key
- `corp_code`: Unique company code (8 digits)
- `bgn_de`: Search start date (YYYYMMDD)
- `end_de`: Search end date (YYYYMMDD)

| API Title             | Endpoint URL        | Description                | Possible Human-Friendly Enum |
| :-------------------- | :------------------ | :------------------------- | :--------------------------- |
| 지분증권              | `/api/estkRs.json`  | Equity securities summary  | `EQUITY_SECURITIES`          |
| 채무증권              | `/api/bdRs.json`    | Debt securities summary    | `DEBT_SECURITIES`            |
| 증권예탁증권          | `/api/stkdpRs.json` | Depositary Receipts (DR)   | `DEPOSITARY_RECEIPTS`        |
| 합병                  | `/api/mgRs.json`    | Merger statement summary   | `MERGER_STATEMENT`           |
| 주식의포괄적교환·이전 | `/api/extrRs.json`  | Comp. share exchange       | `SHARE_EXCHANGE_STATEMENT`   |
| 분할                  | `/api/dvRs.json`    | Division statement summary | `DIVISION_STATEMENT`         |

---

**Implementation Note:** We will map the "Possible Human-Friendly Enum" values directly to the corresponding endpoints in TypeScript to ensure the MCP tools are easy for LLMs and humans to use without memorizing raw URLs.
