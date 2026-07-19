/**
 * Phone number normalization utility for deduplication.
 *
 * Normalizes phone numbers by:
 * 1. Stripping all non-digit characters except leading +
 * 2. Applying default country code (+91 for India) to numbers without country code
 * 3. Returning a standardized E.164-like format for comparison
 *
 * This prevents false negatives from raw string matching (e.g., "+91 98765 43210" vs "9876543210")
 */

const DEFAULT_COUNTRY_CODE = '91'; // India — matches demo seed data context

/**
 * Normalize a phone number to a consistent format for comparison.
 * Returns null if the input is empty or has no digits.
 *
 * Examples:
 *   "+1 (555) 123-4567" → "+15551234567"
 *   "98765 43210"       → "+919876543210" (prepends default country code)
 *   "+91 98765-43210"   → "+919876543210"
 */
export function normalizePhone(phone: string | null | undefined): string | null {
  if (!phone || typeof phone !== 'string') return null;

  // Strip all whitespace
  let cleaned = phone.trim();

  if (cleaned.length === 0) return null;

  // Check if it starts with a +
  const hasPlus = cleaned.startsWith('+');

  // Remove all non-digit characters (but keep the leading + if present)
  const digitsOnly = cleaned.replace(/[^\d]/g, '');

  if (digitsOnly.length === 0) return null;

  let normalized: string;

  if (hasPlus) {
    // Already has country code — just prepend +
    normalized = '+' + digitsOnly;
  } else {
    // No country code — prepend default
    normalized = '+' + DEFAULT_COUNTRY_CODE + digitsOnly;
  }

  return normalized;
}

/**
 * Normalize phone for database storage (stripped format).
 * This is the format stored in the database for consistent matching.
 */
export function normalizePhoneForStorage(phone: string | null | undefined): string | null {
  const normalized = normalizePhone(phone);
  if (!normalized) return null;
  // Strip the + for DB storage to allow indexed lookups
  return normalized.replace(/^\+/, '');
}

/**
 * Check if two phone numbers are duplicates (after normalization).
 */
export function arePhonesDuplicate(phone1: string | null | undefined, phone2: string | null | undefined): boolean {
  const norm1 = normalizePhone(phone1);
  const norm2 = normalizePhone(phone2);
  if (!norm1 || !norm2) return false;
  return norm1 === norm2;
}
