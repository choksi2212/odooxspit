import { customAlphabet } from 'nanoid';

/**
 * Utility functions used across the application
 */

/**
 * Generate a 6-digit numeric OTP
 * Time complexity: O(1)
 */
export function generateOTP(): string {
  const nanoid = customAlphabet('0123456789', 6);
  return nanoid();
}

/**
 * Generate operation reference based on type
 * Format: WH/{TYPE}/{SEQUENCE}
 * Examples: WH/IN/0001, WH/OUT/0002, WH/INT/0003
 */
export function generateOperationReference(type: string, sequence: number): string {
  const typeMap: Record<string, string> = {
    RECEIPT: 'IN',
    DELIVERY: 'OUT',
    TRANSFER: 'INT',
    ADJUSTMENT: 'ADJ',
  };
  
  const shortType = typeMap[type] || 'OPR';
  const paddedSequence = sequence.toString().padStart(4, '0');
  
  return `WH/${shortType}/${paddedSequence}`;
}

/**
 * Parse pagination parameters with defaults
 */
export function parsePaginationParams(query: {
  page?: string | number;
  limit?: string | number;
  cursor?: string;
}) {
  return {
    page: query.page ? parseInt(query.page.toString(), 10) : 1,
    limit: Math.min(
      query.limit ? parseInt(query.limit.toString(), 10) : 20,
      100
    ), // Max 100 items per page
    cursor: query.cursor,
  };
}

/**
 * Sleep utility for testing and rate limiting
 */
export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Validate email format
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Validate loginId format (6-12 alphanumeric characters)
 */
export function isValidLoginId(loginId: string): boolean {
  const loginIdRegex = /^[a-zA-Z0-9]{6,12}$/;
  return loginIdRegex.test(loginId);
}

/**
 * Mask sensitive data for logging
 */
export function maskSensitiveData(data: string, visibleChars = 4): string {
  if (data.length <= visibleChars) {
    return '***';
  }
  return data.slice(0, visibleChars) + '*'.repeat(data.length - visibleChars);
}

/**
 * Format decimal for display
 */
export function formatDecimal(value: number | string, decimals = 2): string {
  return parseFloat(value.toString()).toFixed(decimals);
}

/**
 * Get correlation ID from request or generate new one
 */
export function getCorrelationId(): string {
  const nanoid = customAlphabet('abcdefghijklmnopqrstuvwxyz0123456789', 16);
  return nanoid();
}

/**
 * Safe JSON parse with fallback
 */
export function safeJsonParse<T>(json: string, fallback: T): T {
  try {
    return JSON.parse(json) as T;
  } catch {
    return fallback;
  }
}

