import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { OpenDartClient } from '../src/api/client';
import { SqliteCache } from '../src/db/cache';
import axios from 'axios';

import AdmZip from 'adm-zip';

vi.mock('axios');
vi.mock('../src/db/cache');
vi.mock('adm-zip', () => {
  return {
    default: class MockAdmZip {
      getEntries() {
        return [
          {
            isDirectory: false,
            entryName: 'test.xml',
            getData: () => Buffer.from('<xml>data</xml>')
          },
          {
            isDirectory: false,
            entryName: 'ignore.txt',
            getData: () => Buffer.from('text')
          }
        ];
      }
    }
  };
});

describe('OpenDartClient', () => {
  let client: OpenDartClient;
  let mockCache: any;
  let mockAxios: any;

  beforeEach(() => {
    mockCache = {
      get: vi.fn(),
      set: vi.fn(),
    };
    (SqliteCache as any).mockImplementation(() => mockCache);

    mockAxios = {
      get: vi.fn(),
      create: vi.fn().mockReturnThis(),
    };
    (axios.create as any).mockReturnValue(mockAxios);

    client = new OpenDartClient('test-api-key', mockCache);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should return cached data if available', async () => {
    const cachedData = { status: '000', message: 'OK', list: [] };
    mockCache.get.mockReturnValue(JSON.stringify(cachedData));

    const result = await client.getDisclosureList({});
    
    expect(mockCache.get).toHaveBeenCalled();
    expect(mockAxios.get).not.toHaveBeenCalled();
    expect(result).toEqual(cachedData);
  });

  it('should fetch from API if cache miss', async () => {
    mockCache.get.mockReturnValue(null);
    const apiResponse = { data: { status: '000', message: 'OK', list: [] } };
    mockAxios.get.mockResolvedValue(apiResponse);

    const result = await client.getDisclosureList({});

    expect(mockAxios.get).toHaveBeenCalledWith('/list.json', expect.objectContaining({
      params: expect.objectContaining({ crtfc_key: 'test-api-key' })
    }));
    expect(mockCache.set).toHaveBeenCalled();
    expect(result).toEqual(apiResponse.data);
  });

  it('should throw error on API error response', async () => {
    mockCache.get.mockReturnValue(null);
    const apiResponse = { data: { status: '010', message: 'Unregistered API key' } };
    mockAxios.get.mockResolvedValue(apiResponse);

    await expect(client.getDisclosureList({})).rejects.toThrow('Open DART API Error: Unregistered API key');
  });

  describe('getPeriodicReportInfo', () => {
    it('should format the correct URL based on targetApi', async () => {
      mockCache.get.mockReturnValue(null);
      const apiResponse = { data: { status: '000', message: 'OK', list: [] } };
      mockAxios.get.mockResolvedValue(apiResponse);

      const result = await client.getPeriodicReportInfo('tesstkStatus', {
        corp_code: '00126380',
        bsns_year: '2023',
        reprt_code: '11011'
      });

      expect(mockAxios.get).toHaveBeenCalledWith('/tesstkStatus.json', expect.objectContaining({
        params: expect.objectContaining({
          corp_code: '00126380',
          bsns_year: '2023',
          reprt_code: '11011',
          crtfc_key: 'test-api-key'
        })
      }));
      expect(result).toEqual(apiResponse.data);
    });
  });

  describe('getDocument', () => {
    it('should parse AdmZip buffer and extract xml files', async () => {
      mockCache.get.mockReturnValue(null);
      const mockBuffer = Buffer.from('mock-zip-data');
      mockAxios.get.mockResolvedValue({ data: mockBuffer });

      const result = await client.getDocument('20230101000001');

      expect(mockAxios.get).toHaveBeenCalledWith('/document.xml', expect.objectContaining({
        params: { rcept_no: '20230101000001', crtfc_key: 'test-api-key' },
        responseType: 'arraybuffer'
      }));
      expect(result.status).toBe('000');
      expect(result.files).toHaveLength(1);
      expect(result.files[0].filename).toBe('test.xml');
      expect(result.files[0].content).toBe('<xml>data</xml>');
      expect(mockCache.set).toHaveBeenCalled();
    });

    it('should handle API JSON error inside arraybuffer', async () => {
      mockCache.get.mockReturnValue(null);
      const errJson = JSON.stringify({ status: '010', message: 'Unregistered API key' });
      const mockBuffer = Buffer.from(errJson, 'utf8');
      mockAxios.get.mockResolvedValue({ data: mockBuffer });

      await expect(client.getDocument('20230101000001')).rejects.toThrow('Open DART API Error: Unregistered API key');
    });
  });
});

