#!/usr/bin/env node

// Redirect console.log to console.error to avoid polluting MCP stdio JSON-RPC
console.log = console.error;

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import { createServer } from 'node:http';
import { z } from 'zod';
import { OpenDartClient } from './api/client.js';
import { SqliteCache } from './db/cache.js';
import { optimizeResponse } from './utils.js';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { randomUUID } from 'node:crypto';

// Load environment variables
dotenv.config();

const API_KEY = process.env.OPENDART_API_KEY;
if (!API_KEY) {
  console.error('Error: OPENDART_API_KEY is not set in environment variables.');
  process.exit(1);
}

import os from 'os';

// Initialize dependencies
const defaultCacheDir = path.join(os.homedir(), '.opendart-mcp');
if (!fs.existsSync(defaultCacheDir)) {
  fs.mkdirSync(defaultCacheDir, { recursive: true });
}

const cachePath = process.env.OPENDART_CACHE_DIR
  ? path.join(process.env.OPENDART_CACHE_DIR, 'cache.db')
  : path.join(defaultCacheDir, 'cache.db');
console.error(`[DEBUG] Resolved cache path: ${cachePath}`);
const cache = new SqliteCache(cachePath);
const client = new OpenDartClient(API_KEY, cache);

// Function to register all tools to an MCP server instance
function registerAllTools(server: McpServer) {
  // CorpCode: Search corporate codes locally
  server.registerTool(
    'search_corpcode',
    {
      inputSchema: z.object({
        query: z.string().describe('Search term for company name or stock code (e.g., "삼성전자" or "005930")'),
      })
    },
    async ({ query }) => {
      try {
        const result = await client.searchCorpCode(query);
        return {
          content: [{ type: 'text', text: JSON.stringify(optimizeResponse(result)) }],
        };
      } catch (error: any) {
        return {
          content: [{ type: 'text', text: `Error: ${error.message}` }],
          isError: true,
        };
      }
    }
  );

  // DS001: List Disclosures
  server.registerTool(
    'search_disclosures',
    {
      description: "Search and list corporate disclosures. For the most recent disclosures, specify sort='date' and sort_mthd='desc'.",
      inputSchema: z.object({
        corp_code: z.string().regex(/^\d{8}$/).optional().describe('8-digit unique company code. Use search_corpcode first to find this.'),
        bgn_de: z.string().regex(/^\d{8}$/).optional().describe('Start date in YYYYMMDD format (e.g., 20240101)'),
        end_de: z.string().regex(/^\d{8}$/).optional().describe('End date in YYYYMMDD format (e.g., 20241231). For latest data, use today\'s date.'),
        last_reprt_at: z.enum(['Y', 'N']).optional().describe('Search only the latest report (Y/N)'),
        pblntf_ty: z.string().optional().describe('Publication type code (e.g., A for Periodic, B for Fair Disclosure)'),
        pblntf_detail_ty: z.string().optional().describe('Detailed publication type code'),
        corp_cls: z.enum(['Y', 'K', 'N', 'E']).optional().describe('Corporation class: Y (KOSPI), K (KOSDAQ), N (KONEX), E (ETC)'),
        sort: z.enum(['date', 'crp', 'rpt']).optional().default('date').describe('Sort field: Use \'date\' for chronological order (essential for finding latest disclosures).'),
        sort_mthd: z.enum(['asc', 'desc']).optional().default('desc').describe('Sort method: Use \'desc\' to show the most recent disclosures first.'),
        page_no: z.number().optional().describe('Page number'),
        page_count: z.number().optional().describe('Number of items per page (max 100)'),
      })
    },
    async (params) => {
      try {
        const result = await client.getDisclosureList(params);
        return {
          content: [{ type: 'text', text: JSON.stringify(optimizeResponse(result)) }],
        };
      } catch (error: any) {
        return {
          content: [{ type: 'text', text: `Error: ${error.message}` }],
          isError: true,
        };
      }
    }
  );

  // DS001: Document Download
  server.registerTool(
    'get_document',
    {
      inputSchema: z.object({
        rcept_no: z.string().regex(/^\d{14}$/).describe('14-digit receipt number for the disclosure document (found in search_disclosures results)'),
      })
    },
    async ({ rcept_no }) => {
      try {
        const result = await client.getDocument(rcept_no);
        return {
          content: [{ type: 'text', text: JSON.stringify(optimizeResponse(result)) }],
        };
      } catch (error: any) {
        return {
          content: [{ type: 'text', text: `Error: ${error.message}` }],
          isError: true,
        };
      }
    }
  );

  // DS001/DS002: Company Overview
  server.registerTool(
    'get_company_overview',
    {
      inputSchema: z.object({
        corp_code: z.string().regex(/^\d{8}$/).describe('8-digit unique company code (e.g., 00126380)'),
      })
    },
    async ({ corp_code }) => {
      try {
        const result = await client.getCompanyOverview(corp_code);
        return {
          content: [{ type: 'text', text: JSON.stringify(optimizeResponse(result)) }],
        };
      } catch (error: any) {
        return {
          content: [{ type: 'text', text: `Error: ${error.message}` }],
          isError: true,
        };
      }
    }
  );

  // DS003: Financial Statement
  server.registerTool(
    'get_financial_statement',
    {
      inputSchema: z.object({
        corp_code: z.string().regex(/^\d{8}$/).describe('8-digit unique company code (e.g., 00126380)'),
        bsns_year: z.string().regex(/^\d{4}$/).describe('Business year in YYYY format (e.g., 2023)'),
        reprt_code: z.enum(['11013', '11012', '11014', '11011']).describe('Report code: 11011 (Annual), 11012 (Half-year), 11013 (Q1), 11014 (Q3). Use the most recent period for current data.'),
        fs_div: z.enum(['CFS', 'OFS']).describe('FS division: CFS (Consolidated), OFS (Separate)'),
      })
    },
    async (params) => {
      try {
        const result = await client.getFinancialStatement(params);
        return {
          content: [{ type: 'text', text: JSON.stringify(optimizeResponse(result)) }],
        };
      } catch (error: any) {
        return {
          content: [{ type: 'text', text: `Error: ${error.message}` }],
          isError: true,
        };
      }
    }
  );

  // DS003: Multiple Companies Major Accounts
  server.registerTool(
    'get_multiple_companies_major_accounts',
    {
      inputSchema: z.object({
        corp_code: z.string().describe('Up to 5 corporate codes separated by commas (e.g., "00126380,00164779")'),
        bsns_year: z.string().regex(/^\d{4}$/).describe('Business year in YYYY format (e.g., 2023)'),
        reprt_code: z.enum(['11013', '11012', '11014', '11011']).describe('Report code: 11011 (Annual), 11012 (Half-year), 11013 (Q1), 11014 (Q3). Use the most recent period for current data.'),
        fs_div: z.enum(['CFS', 'OFS']).optional().describe('FS division: CFS (Consolidated), OFS (Separate)'),
      })
    },
    async (params) => {
      try {
        const result = await client.getMultipleCompaniesMajorAccounts(params);
        return {
          content: [{ type: 'text', text: JSON.stringify(optimizeResponse(result)) }],
        };
      } catch (error: any) {
        return {
          content: [{ type: 'text', text: `Error: ${error.message}` }],
          isError: true,
        };
      }
    }
  );

  // DS003: Single Company All Accounts
  server.registerTool(
    'get_single_company_all_accounts',
    {
      inputSchema: z.object({
        corp_code: z.string().regex(/^\d{8}$/).describe('8-digit unique company code (e.g., 00126380)'),
        bsns_year: z.string().regex(/^\d{4}$/).describe('Business year in YYYY format (e.g., 2023)'),
        reprt_code: z.enum(['11013', '11012', '11014', '11011']).describe('Report code: 11011 (Annual), 11012 (Half-year), 11013 (Q1), 11014 (Q3). Use the most recent period for current data.'),
        fs_div: z.enum(['CFS', 'OFS']).describe('FS division: CFS (Consolidated), OFS (Separate)'),
      })
    },
    async (params) => {
      try {
        const result = await client.getSingleCompanyAllAccounts(params);
        return {
          content: [{ type: 'text', text: JSON.stringify(optimizeResponse(result)) }],
        };
      } catch (error: any) {
        return {
          content: [{ type: 'text', text: `Error: ${error.message}` }],
          isError: true,
        };
      }
    }
  );

  // DS003: XBRL Taxonomy
  server.registerTool(
    'get_xbrl_taxonomy',
    {
      inputSchema: z.object({
        sj_div: z.enum(['BS1', 'BS2', 'BS3', 'BS4', 'IS1', 'IS2', 'IS3', 'CIS1', 'CIS2', 'CIS3', 'CF1', 'CF2', 'CF3', 'SCE1', 'SCE2'])
          .describe('Statement type: BS (Balance Sheet), IS (Income Statement), CIS (Comp. Income), CF (Cash Flow), SCE (Equity Change). Suffixes: 1 (Gen-Industry), 2 (Fin-Industry), 3 (Combined), 4 (Other)'),
      })
    },
    async ({ sj_div }) => {
      try {
        const result = await client.getXbrlTaxonomy(sj_div);
        return {
          content: [{ type: 'text', text: JSON.stringify(optimizeResponse(result)) }],
        };
      } catch (error: any) {
        return {
          content: [{ type: 'text', text: `Error: ${error.message}` }],
          isError: true,
        };
      }
    }
  );

  // DS003: Single Company Major Indicators
  server.registerTool(
    'get_single_company_major_indicators',
    {
      inputSchema: z.object({
        corp_code: z.string().regex(/^\d{8}$/).describe('8-digit unique company code (e.g., 00126380)'),
        bsns_year: z.string().regex(/^\d{4}$/).describe('Business year in YYYY format (e.g., 2023)'),
        reprt_code: z.enum(['11013', '11012', '11014', '11011']).describe('Report code: 11011 (Annual), 11012 (Half-year), 11013 (Q1), 11014 (Q3). Use the most recent period for current data.'),
        idx_cl_code: z.enum(['M210000', 'M220000', 'M230000', 'M240000']).describe('Indicator classification code: M210000 (Profitability), M220000 (Stability), M230000 (Growth), M240000 (Activity)'),
      })
    },
    async (params) => {
      try {
        const result = await client.getSingleCompanyMajorIndicators(params);
        return {
          content: [{ type: 'text', text: JSON.stringify(optimizeResponse(result)) }],
        };
      } catch (error: any) {
        return {
          content: [{ type: 'text', text: `Error: ${error.message}` }],
          isError: true,
        };
      }
    }
  );

  // DS003: Multiple Companies Major Indicators
  server.registerTool(
    'get_multiple_companies_major_indicators',
    {
      inputSchema: z.object({
      corp_code: z.string().describe('Multiple 8-digit unique company codes separated by commas (max 5)'),
      bsns_year: z.string().describe('Business year (YYYY)'),
      reprt_code: z.string().describe('Report code: 11011 (Annual), 11012 (Half-year), 11013 (Q1), 11014 (Q3). Use the most recent period for current data.'),
      idx_cl_code: z.enum(['M210000', 'M220000', 'M230000', 'M240000']).describe('Indicator classification code (M210000: Profitability, M220000: Stability, M230000: Growth, M240000: Activity)'),
    })
    },
    async (params) => {
      try {
        const result = await client.getMultipleCompaniesMajorIndicators(params);
        return {
          content: [{ type: 'text', text: JSON.stringify(optimizeResponse(result)) }],
        };
      } catch (error: any) {
        return {
          content: [{ type: 'text', text: `Error: ${error.message}` }],
          isError: true,
        };
      }
    }
  );

  // DS003: XBRL Original File
  server.registerTool(
    'get_xbrl_original_file',
    {
      inputSchema: z.object({
        corp_code: z.string().regex(/^\d{8}$/).describe('8-digit unique company code (e.g., 00126380)'),
        bsns_year: z.string().regex(/^\d{4}$/).describe('Business year in YYYY format (e.g., 2023)'),
        reprt_code: z.enum(['11013', '11012', '11014', '11011']).describe('Report code: 11011 (Annual), 11012 (Half-year), 11013 (Q1), 11014 (Q3). Use the most recent period for current data.'),
      })
    },
    async (params) => {
      try {
        const result = await client.getXbrlOriginalFile(params);
        return {
          content: [{ type: 'text', text: JSON.stringify(optimizeResponse(result)) }],
        };
      } catch (error: any) {
        return {
          content: [{ type: 'text', text: `Error: ${error.message}` }],
          isError: true,
        };
      }
    }
  );

  // DS004: Major Shareholders
  server.registerTool(
    'get_major_shareholders',
    {
      inputSchema: z.object({
        corp_code: z.string().regex(/^\d{8}$/).describe('8-digit unique company code (e.g., 00126380)'),
      })
    },
    async ({ corp_code }) => {
      try {
        const result = await client.getMajorShareholders(corp_code);
        return {
          content: [{ type: 'text', text: JSON.stringify(optimizeResponse(result)) }],
        };
      } catch (error: any) {
        return {
          content: [{ type: 'text', text: `Error: ${error.message}` }],
          isError: true,
        };
      }
    }
  );

  // DS005: Capital Increase
  server.registerTool(
    'get_capital_increase_info',
    {
      inputSchema: z.object({
      corp_code: z.string().regex(/^\d{8}$/).describe('8-digit unique company code (e.g., 00126380)'),
      bgn_de: z.string().regex(/^\d{8}$/).optional().describe('Start date in YYYYMMDD format (e.g., 20240101)'),
      end_de: z.string().regex(/^\d{8}$/).optional().describe('End date in YYYYMMDD format (e.g., 20241231). For latest data, use today\'s date.'),
    })
    },
    async (params) => {
      try {
        const result = await client.getCapitalIncrease(params);
        return {
          content: [{ type: 'text', text: JSON.stringify(optimizeResponse(result)) }],
        };
      } catch (error: any) {
        return {
          content: [{ type: 'text', text: `Error: ${error.message}` }],
          isError: true,
        };
      }
    }
  );

  // DS006: Equity Securities
  server.registerTool(
    'get_equity_securities_info',
    {
      inputSchema: z.object({
      corp_code: z.string().regex(/^\d{8}$/).describe('8-digit unique company code (e.g., 00126380)'),
      bgn_de: z.string().optional().describe('Start date (YYYYMMDD)'),
      end_de: z.string().optional().describe('End date (YYYYMMDD). For latest data, use today\'s date.'),
    })
    },
    async (params) => {
      try {
        const result = await client.getEquitySecurities(params);
        return {
          content: [{ type: 'text', text: JSON.stringify(optimizeResponse(result)) }],
        };
      } catch (error: any) {
        return {
          content: [{ type: 'text', text: `Error: ${error.message}` }],
          isError: true,
        };
      }
    }
  );

  // DS002: Periodic Report Info
  const PERIODIC_REPORT_APIS = {
    DIVIDEND: 'alotMatter',
    TREASURY_STOCK: 'tesstkStatus',
    LARGEST_SHAREHOLDER: 'hyshrholdrStat',
    LARGEST_SHAREHOLDER_CHANGES: 'hyshrholdrChngStat',
    MINORITY_SHAREHOLDER: 'mrnshrholdrStat',
    EXECUTIVE_STATUS: 'exctvStat',
    EMPLOYEE_STATUS: 'empSttus',
    INDIVIDUAL_EXECUTIVE_COMPENSATION_OVER_500M: 'hmvIndvdlBusAdspec',
    TOTAL_EXECUTIVE_COMPENSATION: 'hmvAllBusAdspec',
    INDIVIDUAL_COMPENSATION_TOP_5: 'indvdlByBusAdspec',
    INVESTMENT_IN_OTHER_CORP: 'otrAdinvstStat',
    TOTAL_SHARES: 'stockTotqySttus',
    DEBT_SECURITIES_ISSUANCE: 'debsPblivSpec',
    CP_UNREDEEMED_BALANCE: 'cpUnredmpSttus',
    SHORT_TERM_BOND_UNREDEEMED_BALANCE: 'stbUnredmpSttus',
    CORP_BOND_UNREDEEMED_BALANCE: 'cbUnredmpSttus',
    HYBRID_SECURITIES_UNREDEEMED_BALANCE: 'hbdcapUnredmpSttus',
    CONTINGENT_CAPITAL_SECURITIES_BALANCE: 'cndlCapUnredmpSttus',
    AUDITOR_AND_OPINION: 'accnutAdtorNmAndAdtOpinion',
    AUDIT_SERVICE_CONTRACT: 'adtSvcCtrtSttus',
    NON_AUDIT_SERVICE_CONTRACT: 'nonAdtSvcCtrtSttus',
    OUTSIDE_DIRECTOR_CHANGES: 'outsdExctvChngStat',
    UNREGISTERED_EXECUTIVE_COMPENSATION: 'unregistExctvBusAdspec',
    EXECUTIVE_COMPENSATION_APPROVED: 'hmvGenalsmtAdtSttus',
    EXECUTIVE_COMPENSATION_BY_TYPE: 'drctrAdtAllMendngSttusMendngPymntamtTyCl',
    USE_OF_PUBLIC_OFFERING_FUNDS: 'pblmnyUsePlnAndActual',
    USE_OF_PRIVATE_PLACEMENT_FUNDS: 'prvsrpCptalUseDtls'
  } as const;

  type PeriodicReportApiType = keyof typeof PERIODIC_REPORT_APIS;

  server.registerTool(
    'get_periodic_report_info',
    {
      inputSchema: z.object({
        target_api: z.enum(Object.keys(PERIODIC_REPORT_APIS) as [PeriodicReportApiType, ...PeriodicReportApiType[]])
          .describe('Specific periodic report category to fetch (e.g., EMPLOYEE_STATUS, TOTAL_SHARES, DIVIDEND)'),
        corp_code: z.string().regex(/^\d{8}$/).describe('8-digit unique company code (e.g., 00126380)'),
        bsns_year: z.string().regex(/^\d{4}$/).describe('Business year in YYYY format (e.g., 2023)'),
        reprt_code: z.enum(['11013', '11012', '11014', '11011']).describe('Report code: 11011 (Annual), 11012 (Half-year), 11013 (Q1), 11014 (Q3).')
      })
    },
    async (params) => {
      try {
        const endpointStr = PERIODIC_REPORT_APIS[params.target_api as PeriodicReportApiType];
        const { target_api, ...clientParams } = params;
        const result = await client.getPeriodicReportInfo(endpointStr, clientParams);
        return {
          content: [{ type: 'text', text: JSON.stringify(optimizeResponse(result)) }],
        };
      } catch (error: any) {
        return {
          content: [{ type: 'text', text: `Error: ${error.message}` }],
          isError: true,
        };
      }
    }
  );

  // DS004: Equity Disclosure
  const EQUITY_DISCLOSURE_APIS = {
    LARGE_HOLDINGS: 'majorstock',
    EXEC_MAJOR_SHAREHOLDER: 'elestock'
  } as const;

  type EquityDisclosureApiType = keyof typeof EQUITY_DISCLOSURE_APIS;

  server.registerTool(
    'get_equity_disclosure_info',
    {
      inputSchema: z.object({
        target_api: z.enum(Object.keys(EQUITY_DISCLOSURE_APIS) as [EquityDisclosureApiType, ...EquityDisclosureApiType[]])
          .describe('Specific equity disclosure category (LARGE_HOLDINGS or EXEC_MAJOR_SHAREHOLDER)'),
        corp_code: z.string().regex(/^\d{8}$/).describe('8-digit unique company code (e.g., 00126380)')
      })
    },
    async (params) => {
      try {
        const endpointStr = EQUITY_DISCLOSURE_APIS[params.target_api as EquityDisclosureApiType];
        const { target_api, ...clientParams } = params;
        const result = await client.getEquityDisclosureInfo(endpointStr, clientParams);
        return {
          content: [{ type: 'text', text: JSON.stringify(optimizeResponse(result)) }],
        };
      } catch (error: any) {
        return {
          content: [{ type: 'text', text: `Error: ${error.message}` }],
          isError: true,
        };
      }
    }
  );

  // DS005: Major Issues Report
  const MAJOR_ISSUES_APIS = {
    ASSET_TRANSFER_PUTBACK: 'astInhtrfEtcPtbkOpt',
    BANKRUPTCY: 'dfOcr',
    BUSINESS_SUSPENSION: 'bsnSp',
    REHABILITATION_PROCEEDING: 'ctrcvsBgrq',
    DISSOLUTION_GROUNDS: 'dsRsOcr',
    PAID_IN_CAPITAL_INCREASE: 'piicDecsn',
    FREE_ISSUE: 'fricDecsn',
    PAID_FREE_ISSUE: 'pifricDecsn',
    CAPITAL_REDUCTION: 'crDecsn',
    BANK_MGT_PROCEEDING_START: 'bnkMngtPcbg',
    LAWSUITS_FILED: 'lwstLg',
    OVERSEAS_LISTING_DECISION: 'ovLstDecsn',
    OVERSEAS_DELISTING_DECISION: 'ovDlstDecsn',
    OVERSEAS_LISTING_COMPLETION: 'ovLst',
    OVERSEAS_DELISTING_COMPLETION: 'ovDlst',
    CONVERTIBLE_BOND_ISSUE: 'cvbdIsDecsn',
    BOND_WITH_WARRANT_ISSUE: 'bdwtIsDecsn',
    EXCHANGEABLE_BOND_ISSUE: 'exbdIsDecsn',
    BANK_MGT_PROCEEDING_HALT: 'bnkMngtPcsp',
    WRITE_DOWN_COCO_BOND_ISSUE: 'wdCocobdIsDecsn',
    TREASURY_STOCK_ACQUISITION: 'tsstkAqDecsn',
    TREASURY_STOCK_DISPOSAL: 'tsstkDpDecsn',
    TREASURY_STOCK_TRUST_CONTRACT: 'tsstkAqTrctrCnsDecsn',
    TREASURY_STOCK_TRUST_TERMINATION: 'tsstkAqTrctrCcDecsn',
    BUSINESS_ACQUISITION: 'bsnInhDecsn',
    BUSINESS_TRANSFER: 'bsnTrfDecsn',
    TANGIBLE_ASSET_ACQUISITION: 'tgastInhDecsn',
    TANGIBLE_ASSET_TRANSFER: 'tgastTrfDecsn',
    OTHER_CORP_STOCK_ACQUISITION: 'otcprStkInvscrInhDecsn',
    OTHER_CORP_STOCK_TRANSFER: 'otcprStkInvscrTrfDecsn',
    STOCK_RELATED_BOND_ACQUISITION: 'stkrtbdInhDecsn',
    STOCK_RELATED_BOND_TRANSFER: 'stkrtbdTrfDecsn',
    MERGER_DECISION: 'cmpMgDecsn',
    COMPANY_DIVISION_DECISION: 'cmpDvDecsn',
    DIVISION_MERGER_DECISION: 'cmpDvmgDecsn',
    SHARE_EXCHANGE_TRANSFER_DECISION: 'stkExtrDecsn'
  } as const;

  type MajorIssuesApiType = keyof typeof MAJOR_ISSUES_APIS;

  server.registerTool(
    'get_major_issues_report_info',
    {
      inputSchema: z.object({
        target_api: z.enum(Object.keys(MAJOR_ISSUES_APIS) as [MajorIssuesApiType, ...MajorIssuesApiType[]])
          .describe('Specific major issues report category (e.g., MERGER_DECISION, PAID_IN_CAPITAL_INCREASE, BANKRUPTCY)'),
        corp_code: z.string().regex(/^\d{8}$/).describe('8-digit unique company code (e.g., 00126380)'),
        bgn_de: z.string().regex(/^\d{8}$/).describe('Search start date in YYYYMMDD format (e.g., 20240101)'),
        end_de: z.string().regex(/^\d{8}$/).describe('Search end date in YYYYMMDD format (e.g., 20241231). For latest data, use today\'s date.')
      })
    },
    async (params) => {
      try {
        const endpointStr = MAJOR_ISSUES_APIS[params.target_api as MajorIssuesApiType];
        const { target_api, ...clientParams } = params;
        const result = await client.getMajorIssuesReportInfo(endpointStr, clientParams);
        return {
          content: [{ type: 'text', text: JSON.stringify(optimizeResponse(result)) }],
        };
      } catch (error: any) {
        return {
          content: [{ type: 'text', text: `Error: ${error.message}` }],
          isError: true,
        };
      }
    }
  );

  // DS006: Registration Statements
  const REGISTRATION_STATEMENT_APIS = {
    EQUITY_SECURITIES: 'estkRs',
    DEBT_SECURITIES: 'bdRs',
    DEPOSITARY_RECEIPTS: 'stkdpRs',
    MERGER_STATEMENT: 'mgRs',
    SHARE_EXCHANGE_STATEMENT: 'extrRs',
    DIVISION_STATEMENT: 'dvRs'
  } as const;

  type RegistrationStatementApiType = keyof typeof REGISTRATION_STATEMENT_APIS;

  server.registerTool(
    'get_registration_statement_info',
    {
      inputSchema: z.object({
        target_api: z.enum(Object.keys(REGISTRATION_STATEMENT_APIS) as [RegistrationStatementApiType, ...RegistrationStatementApiType[]])
          .describe('Specific registration statement category (e.g., EQUITY_SECURITIES, DEBT_SECURITIES, MERGER_STATEMENT)'),
        corp_code: z.string().regex(/^\d{8}$/).describe('8-digit unique company code (e.g., 00126380)'),
        bgn_de: z.string().regex(/^\d{8}$/).describe('Search start date in YYYYMMDD format (e.g., 20240101)'),
        end_de: z.string().regex(/^\d{8}$/).describe('Search end date in YYYYMMDD format (e.g., 20241231). For latest data, use today\'s date.')
      })
    },
    async (params) => {
      try {
        const endpointStr = REGISTRATION_STATEMENT_APIS[params.target_api as RegistrationStatementApiType];
        const { target_api, ...clientParams } = params;
        const result = await client.getRegistrationStatementInfo(endpointStr, clientParams);
        return {
          content: [{ type: 'text', text: JSON.stringify(optimizeResponse(result)) }],
        };
      } catch (error: any) {
        return {
          content: [{ type: 'text', text: `Error: ${error.message}` }],
          isError: true,
        };
      }
    }
  );
}

// Start server
async function main() {
  const isSse = process.argv.includes('--sse') || process.env.MCP_TRANSPORT === 'sse';

  if (isSse) {
    const port = process.env.PORT || 3000;
    
    // Map to store active sessions: sessionId -> { server, transport, lastAccess }
    const sessions = new Map<string, { 
      server: McpServer; 
      transport: StreamableHTTPServerTransport;
      lastAccess: number;
    }>();

    // Setup Node HTTP Server
    const httpServer = createServer(async (req, res) => {
      // Basic CORS handling
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, DELETE');
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type, mcp-session-id, mcp-protocol-version');

      if (req.method === 'OPTIONS') {
        res.writeHead(200);
        res.end();
        return;
      }

      const isMcpPath = req.url === '/mcp' || req.url?.startsWith('/mcp?');
      if (isMcpPath) {
        const sessionIdHeader = req.headers['mcp-session-id'] as string;
        console.error(`[DEBUG] Handling MCP request: ${req.method} ${req.url}, Session: ${sessionIdHeader || 'new'}`);
        
        try {
          let session = sessionIdHeader ? sessions.get(sessionIdHeader) : undefined;

          if (!session) {
            // Logic for new session or initialization
            // Create a dedicated transport and server for this session
            const transport = new StreamableHTTPServerTransport({
              sessionIdGenerator: () => randomUUID(),
              onsessionclosed: (id) => {
                console.error(`[DEBUG] Session closed by transport: ${id}`);
                sessions.delete(id);
              }
            });

            const server = new McpServer({
              name: 'opendart-mcp',
              version: '1.0.0',
            });
            registerAllTools(server);
            await server.connect(transport);

            // Handle the request. If it's initialize, transport.sessionId will be set.
            await transport.handleRequest(req, res);
            
            const newSessionId = transport.sessionId;
            if (newSessionId && !sessions.has(newSessionId)) {
              console.error(`[DEBUG] New session established: ${newSessionId}`);
              sessions.set(newSessionId, { 
                server, 
                transport,
                lastAccess: Date.now()
              });
            }
          } else {
            session.lastAccess = Date.now();
            await session.transport.handleRequest(req, res);
          }
          
          console.error(`[DEBUG] MCP request handled. Status: ${res.statusCode}`);
        } catch (error) {
          console.error('Error handling MCP request:', error);
          if (!res.headersSent) {
            res.writeHead(500);
            res.end('Internal Server Error');
          }
        }
      } else {
        res.writeHead(404);
        res.end('Not Found');
      }
    });

    // Cleanup interval for stale sessions (1 hour timeout)
    setInterval(() => {
      const now = Date.now();
      for (const [id, session] of sessions.entries()) {
        if (now - session.lastAccess > 60 * 60 * 1000) {
          console.error(`[DEBUG] Cleaning up stale session: ${id}`);
          session.transport.close().catch(() => {});
          sessions.delete(id);
        }
      }
    }, 5 * 60 * 1000);

    httpServer.listen(port, () => {
      console.error(`Open DART MCP Server running on Streamable HTTP at http://localhost:${port}/mcp`);
    });
  } else {
    const server = new McpServer({
      name: 'opendart-mcp',
      version: '1.0.0',
    });
    registerAllTools(server);
    const transport = new StdioServerTransport();
    await server.connect(transport);
    console.error('Open DART MCP Server running on stdio');
  }
}

main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
