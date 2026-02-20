import axios, { AxiosInstance } from 'axios';
import { SqliteCache } from '../db/cache.js';
import AdmZip from 'adm-zip';
import { XMLParser } from 'fast-xml-parser';
import {
  DisclosureSearchResponse,
  CompanyOverviewResponse,
  FinancialStatementResponse,
  MajorShareholderResponse,
  CapitalIncreaseResponse,
  EquitySecuritiesResponse,
  PeriodicReportResponse,
  CorpCode
} from './types.js';

export class OpenDartClient {
  private axios: AxiosInstance;
  private cache: SqliteCache;
  private apiKey: string;

  constructor(apiKey: string, cache: SqliteCache) {
    this.apiKey = apiKey;
    this.cache = cache;
    this.axios = axios.create({
      baseURL: 'https://opendart.fss.or.kr/api',
      timeout: 10000,
    });
  }

  private async fetch<T>(
    endpoint: string,
    params: Record<string, string | number | undefined>,
    ttlSeconds: number = 3600
  ): Promise<T> {
    const cleanParams: Record<string, string | number> = {};
    for (const [key, value] of Object.entries(params)) {
      if (value !== undefined) {
        cleanParams[key] = value;
      }
    }
    // Always add api key
    cleanParams['crtfc_key'] = this.apiKey;

    // Create a cache key based on endpoint and sorted params (excluding api key for security if logging, but needed for uniqueness)
    // Actually we should include api key in uniqueness if we support multiple keys, but here we only have one.
    // Let's rely on JSON stringify order stability or sort keys.
    const keys = Object.keys(cleanParams).sort();
    const cacheKey = `${endpoint}?${keys.map(k => `${k}=${cleanParams[k]}`).join('&')}`;

    console.error(`[DEBUG] Checking cache for key: ${cacheKey}`); 
    const cached = this.cache.get(cacheKey);
    if (cached) {
      console.error(`[DEBUG] Cache hit for ${cacheKey}`);
      return JSON.parse(cached) as T;
    }

    console.error(`[DEBUG] Cache miss. Fetching from API: ${endpoint}`);
    try {
      const response = await this.axios.get<T>(endpoint, { params: cleanParams });
      
      // Check for API level error (Open DART returns 200 even for logical errors, but with status != 000)
      const data = response.data as any; // Cast to any to check status field generic
      if (data.status && data.status !== '000') {
        throw new Error(`Open DART API Error: ${data.message} (Code: ${data.status})`);
      }

      this.cache.set(cacheKey, JSON.stringify(data), ttlSeconds);
      return data;
    } catch (error: any) {
        if (axios.isAxiosError(error)) {
            throw new Error(`HTTP Error: ${error.message} - ${JSON.stringify(error.response?.data)}`);
        }
        throw error;
    }
  }

  // DS001
  async getDisclosureList(params: {
    corp_code?: string;
    bgn_de?: string;
    end_de?: string;
    last_reprt_at?: 'Y' | 'N';
    pblntf_ty?: string;
    pblntf_detail_ty?: string;
    corp_cls?: 'Y' | 'K' | 'N' | 'E';
    sort?: 'date' | 'crp' | 'rpt';
    sort_mthd?: 'asc' | 'desc';
    page_no?: number;
    page_count?: number;
  }): Promise<DisclosureSearchResponse> {
    return this.fetch<DisclosureSearchResponse>('/list.json', params);
  }

  // DS001/DS002
  async getCompanyOverview(corpCode: string): Promise<CompanyOverviewResponse> {
    return this.fetch<CompanyOverviewResponse>('/company.json', { corp_code: corpCode });
  }

  // DS003
  async getFinancialStatement(params: {
    corp_code: string;
    bsns_year: string;
    reprt_code: string;
    fs_div: 'CFS' | 'OFS';
  }): Promise<FinancialStatementResponse> {
    return this.fetch<FinancialStatementResponse>('/fnlttSinglAcntAll.json', params);
  }

  // DS004
  async getMajorShareholders(corpCode: string): Promise<MajorShareholderResponse> {
    return this.fetch<MajorShareholderResponse>('/majorstock.json', { corp_code: corpCode });
  }

  // DS005
  async getCapitalIncrease(params: {
    corp_code: string;
    bgn_de?: string;
    end_de?: string;
  }): Promise<CapitalIncreaseResponse> {
    return this.fetch<CapitalIncreaseResponse>('/piicDecsn.json', params);
  }

  // DS006
  async getEquitySecurities(params: {
    corp_code: string;
    bgn_de?: string;
    end_de?: string;
  }): Promise<EquitySecuritiesResponse> {
    return this.fetch<EquitySecuritiesResponse>('/estkRs.json', params);
  }

  // DS002: Periodic Report Info
  async getPeriodicReportInfo(
    targetApi: string,
    params: {
      corp_code: string;
      bsns_year: string;
      reprt_code: string;
    }
  ): Promise<PeriodicReportResponse> {
    return this.fetch<PeriodicReportResponse>(`/${targetApi}.json`, params);
  }

  // search_corpcode
  async syncCorpCodes(): Promise<void> {
    if (this.cache.hasCorpCodes()) {
      return;
    }
    console.error('[DEBUG] Downloading CorpCode XML dictionary...');
    const response = await this.axios.get('/corpCode.xml', {
      params: { crtfc_key: this.apiKey },
      responseType: 'arraybuffer'
    });
    
    console.error('[DEBUG] Extracting CorpCode zip...');
    const zip = new AdmZip(Buffer.from(response.data));
    const zipEntries = zip.getEntries();
    const xmlEntry = zipEntries.find((entry) => entry.entryName === 'CORPCODE.xml');
    if (!xmlEntry) {
      throw new Error('CORPCODE.xml not found in the downloaded zip file.');
    }
    
    const xmlData = xmlEntry.getData().toString('utf8');
    console.error('[DEBUG] Parsing CorpCode XML...');
    
    const parser = new XMLParser({ parseTagValue: false });
    const parsed = parser.parse(xmlData);
    
    if (parsed.result && parsed.result.list) {
      console.error('[DEBUG] Storing CorpCodes into local SQLite cache...');
      let list = parsed.result.list;
      if (!Array.isArray(list)) list = [list];
      this.cache.insertCorpCodes(list);
      console.error(`[DEBUG] Successfully stored ${list.length} CorpCodes.`);
    } else {
      throw new Error('Failed to parse CorpCode XML list.');
    }
  }

  async searchCorpCode(query: string): Promise<CorpCode[]> {
    await this.syncCorpCodes();
    return this.cache.searchCorpCodes(query);
  }
}

