import { XMLParser } from 'fast-xml-parser';

const xmlParser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: "@_",
  parseTagValue: true,
  trimValues: true,
});

/**
 * Sanitizes the response by recursively removing null, undefined, and empty strings.
 * Also prunes redundant OpenDART metadata status fields.
 */
export function sanitizeResponse(data: any): any {
  if (typeof data === 'string') {
    const trimmed = data.trim();
    // Basic detection for XML content
    if (trimmed.startsWith('<') && trimmed.endsWith('>')) {
      try {
        const parsed = xmlParser.parse(trimmed);
        return sanitizeResponse(parsed);
      } catch (e) {
        // Fallback to original string if parsing fails
        return trimmed === "" ? null : trimmed;
      }
    }
    return trimmed === "" ? null : trimmed;
  }

  if (Array.isArray(data)) {
    const sanitizedArray = data
      .map(v => sanitizeResponse(v))
      .filter(v => v !== null && v !== undefined && v !== "");
    return sanitizedArray.length > 0 ? sanitizedArray : null;
  }

  if (data !== null && typeof data === 'object') {
    const sanitized: any = {};
    for (const [key, value] of Object.entries(data)) {
      // Prune redundant OpenDART metadata
      if ((key === 'status' && value === '000') || (key === 'message' && value === '정상')) {
        continue;
      }

      const val = sanitizeResponse(value);
      if (val !== null && val !== undefined && val !== "") {
        sanitized[key] = val;
      }
    }
    
    // Flatten objects that only contain a #text field (common in XML-to-JSON)
    const keys = Object.keys(sanitized);
    if (keys.length === 1 && keys[0] === '#text') {
      return sanitized['#text'];
    }

    return keys.length > 0 ? sanitized : null;
  }

  return data;
}

/**
 * Identifies common fields in an array of objects and factors them out to a 'common' object.
 * This reduces redundant keys and values across the list.
 */
export function factorCommonFields(data: any): any {
  if (!data || typeof data !== 'object' || !Array.isArray(data.list) || data.list.length <= 1) {
    return data;
  }

  const list = data.list;
  const firstItem = list[0];
  if (typeof firstItem !== 'object' || firstItem === null) {
      return data;
  }
  
  const commonFields: Record<string, any> = {};
  const keys = Object.keys(firstItem);

  for (const key of keys) {
    const value = firstItem[key];
    const isCommon = list.every((item: any) => item[key] === value);

    if (isCommon) {
      commonFields[key] = value;
    }
  }

  if (Object.keys(commonFields).length > 0) {
    const optimizedList = list.map((item: any) => {
      const newItem = { ...item };
      for (const key of Object.keys(commonFields)) {
        delete newItem[key];
      }
      return newItem;
    });

    return {
      ...data,
      common: commonFields,
      list: optimizedList,
    };
  }

  return data;
}

/**
 * Combined optimization pipeline.
 */
export function optimizeResponse(data: any): any {
  // First factor common fields to preserve structure
  let optimized = factorCommonFields(data);
  // Then sanitize to remove nulls/empties/metadata/XML boilerplate
  optimized = sanitizeResponse(optimized);
  return optimized;
}
