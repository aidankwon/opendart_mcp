#!/usr/bin/env node

// Redirect console.log to console.error to avoid polluting MCP stdio JSON-RPC
console.log = console.error;

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';
import { OpenDartClient } from './api/client.js';
import { SqliteCache } from './db/cache.js';
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables
dotenv.config();

const API_KEY = process.env.OPENDART_API_KEY;
if (!API_KEY) {
  console.error('Error: OPENDART_API_KEY is not set in environment variables.');
  process.exit(1);
}

// Initialize dependencies
const cachePath = process.env.OPENDART_CACHE_DIR
  ? path.join(process.env.OPENDART_CACHE_DIR, 'cache.db')
  : path.join(__dirname, '..', 'cache.db');
const cache = new SqliteCache(cachePath);
const client = new OpenDartClient(API_KEY, cache);

// Create MCP Server
const server = new McpServer({
  name: 'opendart-mcp',
  version: '1.0.0',
});

// CorpCode: Search corporate codes locally
server.tool(
  'search_corpcode',
  {
    query: z.string().describe('Search term for company name or stock code'),
  },
  async ({ query }) => {
    try {
      const result = await client.searchCorpCode(query);
      return {
        content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
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
server.tool(
  'search_disclosures',
  {
    corp_code: z.string().optional().describe('8-digit unique company code'),
    bgn_de: z.string().optional().describe('Start date (YYYYMMDD)'),
    end_de: z.string().optional().describe('End date (YYYYMMDD)'),
    last_reprt_at: z.enum(['Y', 'N']).optional().describe('Search only last report'),
    pblntf_ty: z.string().optional().describe('Publication type'),
    pblntf_detail_ty: z.string().optional().describe('Detailed publication type'),
    corp_cls: z.enum(['Y', 'K', 'N', 'E']).optional().describe('Corporation class'),
    sort: z.enum(['date', 'crp', 'rpt']).optional(),
    sort_mthd: z.enum(['asc', 'desc']).optional(),
    page_no: z.number().optional(),
    page_count: z.number().optional(),
  },
  async (params) => {
    try {
      const result = await client.getDisclosureList(params);
      return {
        content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
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
server.tool(
  'get_document',
  {
    rcept_no: z.string().describe('14-digit receipt number for the disclosure document'),
  },
  async ({ rcept_no }) => {
    try {
      const result = await client.getDocument(rcept_no);
      return {
        content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
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
server.tool(
  'get_company_overview',
  {
    corp_code: z.string().describe('8-digit unique company code'),
  },
  async ({ corp_code }) => {
    try {
      const result = await client.getCompanyOverview(corp_code);
      return {
        content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
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
server.tool(
  'get_financial_statement',
  {
    corp_code: z.string().describe('8-digit unique company code'),
    bsns_year: z.string().describe('Business year (YYYY)'),
    reprt_code: z.string().describe('Report code (e.g., 11011 for Annual)'),
    fs_div: z.enum(['CFS', 'OFS']).describe('FS division (CFS: Consolidated, OFS: Separate)'),
  },
  async (params) => {
    try {
      const result = await client.getFinancialStatement(params);
      return {
        content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
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
server.tool(
  'get_multiple_companies_major_accounts',
  {
    corp_code: z.string().describe('Multiple 8-digit unique company codes separated by commas (max 5)'),
    bsns_year: z.string().describe('Business year (YYYY)'),
    reprt_code: z.string().describe('Report code (e.g., 11011 for Annual)'),
    fs_div: z.enum(['CFS', 'OFS']).optional().describe('FS division (CFS: Consolidated, OFS: Separate)'),
  },
  async (params) => {
    try {
      const result = await client.getMultipleCompaniesMajorAccounts(params);
      return {
        content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
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
server.tool(
  'get_single_company_all_accounts',
  {
    corp_code: z.string().describe('8-digit unique company code'),
    bsns_year: z.string().describe('Business year (YYYY)'),
    reprt_code: z.string().describe('Report code (e.g., 11011 for Annual)'),
    fs_div: z.enum(['CFS', 'OFS']).describe('FS division (CFS: Consolidated, OFS: Separate)'),
  },
  async (params) => {
    try {
      const result = await client.getSingleCompanyAllAccounts(params);
      return {
        content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
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
server.tool(
  'get_xbrl_taxonomy',
  {
    sj_div: z.string().describe('Statement type (BS1, BS2, BS3, BS4, IS1, IS2, IS3, CIS1, CIS2, CIS3, CF1, CF2, CF3, SCE1, SCE2)'),
  },
  async ({ sj_div }) => {
    try {
      const result = await client.getXbrlTaxonomy(sj_div);
      return {
        content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
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
server.tool(
  'get_single_company_major_indicators',
  {
    corp_code: z.string().describe('8-digit unique company code'),
    bsns_year: z.string().describe('Business year (YYYY)'),
    reprt_code: z.string().describe('Report code (e.g., 11011 for Annual)'),
    idx_cl_code: z.enum(['M210000', 'M220000', 'M230000', 'M240000']).describe('Indicator classification code (M210000: Profitability, M220000: Stability, M230000: Growth, M240000: Activity)'),
  },
  async (params) => {
    try {
      const result = await client.getSingleCompanyMajorIndicators(params);
      return {
        content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
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
server.tool(
  'get_multiple_companies_major_indicators',
  {
    corp_code: z.string().describe('Multiple 8-digit unique company codes separated by commas (max 5)'),
    bsns_year: z.string().describe('Business year (YYYY)'),
    reprt_code: z.string().describe('Report code (e.g., 11011 for Annual)'),
    idx_cl_code: z.enum(['M210000', 'M220000', 'M230000', 'M240000']).describe('Indicator classification code (M210000: Profitability, M220000: Stability, M230000: Growth, M240000: Activity)'),
  },
  async (params) => {
    try {
      const result = await client.getMultipleCompaniesMajorIndicators(params);
      return {
        content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
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
server.tool(
  'get_xbrl_original_file',
  {
    corp_code: z.string().describe('8-digit unique company code'),
    bsns_year: z.string().describe('Business year (YYYY)'),
    reprt_code: z.string().describe('Report code (e.g., 11011 for Annual)'),
  },
  async (params) => {
    try {
      const result = await client.getXbrlOriginalFile(params);
      return {
        content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
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
server.tool(
  'get_major_shareholders',
  {
    corp_code: z.string().describe('8-digit unique company code'),
  },
  async ({ corp_code }) => {
    try {
      const result = await client.getMajorShareholders(corp_code);
      return {
        content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
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
server.tool(
  'get_capital_increase_info',
  {
    corp_code: z.string().describe('8-digit unique company code'),
    bgn_de: z.string().optional().describe('Start date (YYYYMMDD)'),
    end_de: z.string().optional().describe('End date (YYYYMMDD)'),
  },
  async (params) => {
    try {
      const result = await client.getCapitalIncrease(params);
      return {
        content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
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
server.tool(
  'get_equity_securities_info',
  {
    corp_code: z.string().describe('8-digit unique company code'),
    bgn_de: z.string().optional().describe('Start date (YYYYMMDD)'),
    end_de: z.string().optional().describe('End date (YYYYMMDD)'),
  },
  async (params) => {
    try {
      const result = await client.getEquitySecurities(params);
      return {
        content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
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

server.tool(
  'get_periodic_report_info',
  {
    target_api: z.enum(Object.keys(PERIODIC_REPORT_APIS) as [PeriodicReportApiType, ...PeriodicReportApiType[]])
      .describe('The specific periodic report category to fetch (e.g. TOTAL_SHARES for 주식총수, DIVIDEND for 배당등)'),
    corp_code: z.string().describe('8-digit unique company code'),
    bsns_year: z.string().describe('Business year (YYYY)'),
    reprt_code: z.string().describe('Report type code (11013: Q1, 11012: Half-year, 11014: Q3, 11011: Annual)')
  },
  async (params) => {
    try {
      const endpointStr = PERIODIC_REPORT_APIS[params.target_api as PeriodicReportApiType];
      const { target_api, ...clientParams } = params;
      const result = await client.getPeriodicReportInfo(endpointStr, clientParams);
      return {
        content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
      };
    } catch (error: any) {
      return {
        content: [{ type: 'text', text: `Error: ${error.message}` }],
        isError: true,
      };
    }
  }
);

// Start server
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('Open DART MCP Server running on stdio');
}

main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
