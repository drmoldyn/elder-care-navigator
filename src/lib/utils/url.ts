/**
 * Normalize external URLs for facility website links.
 * Ensures we always return an absolute https:// URL or null if invalid.
 */
export function ensureAbsoluteUrl(rawUrl: string | null | undefined): string | null {
  if (!rawUrl) {
    return null;
  }

  const trimmed = rawUrl.trim();
  if (!trimmed) {
    return null;
  }

  const candidate = /^(https?:)?\/\//i.test(trimmed)
    ? trimmed.startsWith("//")
      ? `https:${trimmed}`
      : trimmed
    : `https://${trimmed}`;

  try {
    const normalized = new URL(candidate);
    return normalized.toString();
  } catch {
    return null;
  }
}

/**
 * Basic phone normalization for display.
 * Returns (XXX) XXX-XXXX when possible, otherwise the original string.
 */
export function formatPhoneNumber(rawPhone: string | null | undefined): string | null {
  if (!rawPhone) {
    return null;
  }

  const digits = rawPhone.replace(/[^0-9]/g, "");
  if (digits.length === 10) {
    return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
  }

  return rawPhone.trim() || null;
}
