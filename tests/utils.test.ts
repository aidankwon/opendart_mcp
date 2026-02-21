import { describe, it, expect } from 'vitest';
import { sanitizeResponse, factorCommonFields, optimizeResponse } from '../src/utils';

describe('utils', () => {
  describe('sanitizeResponse', () => {
    it('should remove null, undefined, and empty strings', () => {
      const input = {
        a: 1,
        b: null,
        c: undefined,
        d: "",
        e: {
          f: null,
          g: "value"
        },
        h: [null, "item", ""]
      };
      const output = sanitizeResponse(input);
      expect(output).toEqual({
        a: 1,
        e: {
          g: "value"
        },
        h: ["item"]
      });
    });

    it('should remove OpenDART success metadata', () => {
      const input = {
        status: "000",
        message: "정상",
        list: [{ id: 1 }]
      };
      const output = sanitizeResponse(input);
      expect(output).toEqual({
        list: [{ id: 1 }]
      });
    });

    it('should keep metadata if status is not 000', () => {
      const input = {
        status: "010",
        message: "Error",
        list: []
      };
      const output = sanitizeResponse(input);
      expect(output).toEqual({
        status: "010",
        message: "Error"
      });
    });
  });

  describe('factorCommonFields', () => {
    it('should factor out fields common to all items in the list', () => {
      const input = {
        list: [
          { corp_code: "123", bsns_year: "2023", value: "A" },
          { corp_code: "123", bsns_year: "2023", value: "B" }
        ]
      };
      const output = factorCommonFields(input);
      expect(output).toEqual({
        common: { corp_code: "123", bsns_year: "2023" },
        list: [
          { value: "A" },
          { value: "B" }
        ]
      });
    });

    it('should not factor out fields that are different', () => {
      const input = {
        list: [
          { corp_code: "123", value: "A" },
          { corp_code: "456", value: "B" }
        ]
      };
      const output = factorCommonFields(input);
      expect(output).toEqual(input);
    });

    it('should handle list with single item', () => {
      const input = {
        list: [{ corp_code: "123", value: "A" }]
      };
      const output = factorCommonFields(input);
      expect(output).toEqual(input);
    });
  });

  describe('optimizeResponse', () => {
    it('should apply both factoring and sanitization', () => {
      const input = {
        status: "000",
        message: "정상",
        list: [
          { corp_code: "123", bsns_year: "2023", note: "", value: "A" },
          { corp_code: "123", bsns_year: "2023", note: null, value: "B" }
        ]
      };
      const output = optimizeResponse(input);
      expect(output).toEqual({
        common: { corp_code: "123", bsns_year: "2023" },
        list: [
          { value: "A" },
          { value: "B" }
        ]
      });
    });

    it('should sanitize and flatten XML content strings', () => {
      const input = {
        files: [
          {
            filename: "doc.xml",
            content: "<root><item>Value</item><empty></empty><with_attr id='1'>Text</with_attr></root>"
          }
        ]
      };
      const output = optimizeResponse(input);
      expect(output).toEqual({
        files: [
          {
            filename: "doc.xml",
            content: {
              root: {
                item: "Value",
                with_attr: {
                  "@_id": "1",
                  "#text": "Text"
                }
              }
            }
          }
        ]
      });
    });
  });
});
