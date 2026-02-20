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
