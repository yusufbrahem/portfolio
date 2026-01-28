import type { CountryCode } from "libphonenumber-js";
import { isValidPhoneNumber, parsePhoneNumber } from "libphonenumber-js";

/**
 * Validate email format
 */
export function validateEmail(email: string | null | undefined): { isValid: boolean; error: string | null } {
  if (!email || email.trim() === "") {
    return { isValid: true, error: null }; // Empty is valid (optional field)
  }
  
  const trimmed = email.trim();
  if (trimmed === "") {
    return { isValid: false, error: "Email cannot be empty" };
  }
  
  // Basic email format validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(trimmed)) {
    return { isValid: false, error: "Invalid email format" };
  }
  
  return { isValid: true, error: null };
}

/**
 * Validate phone number for a specific country
 * @param phone - Phone number (can be national format or international format with +)
 * @param countryCode - Country code (e.g., "US", "GB") - used as fallback if phone doesn't have country code
 */
export function validatePhone(
  phone: string | null | undefined,
  countryCode: string
): { isValid: boolean; error: string | null } {
  if (!phone || phone.trim() === "") {
    return { isValid: true, error: null }; // Empty is valid (optional field)
  }
  
  const trimmed = phone.trim();
  if (trimmed === "") {
    return { isValid: false, error: "Phone number cannot be empty" };
  }
  
  // Remove any spaces from the phone number for validation
  const cleaned = trimmed.replace(/\s/g, "");
  
  try {
    // If phone starts with +, it's already in international format
    if (cleaned.startsWith("+")) {
      // Parse as international format (don't pass country code)
      try {
        const parsed = parsePhoneNumber(cleaned);
        if (parsed && isValidPhoneNumber(parsed.number)) {
          return { isValid: true, error: null };
        }
        return { isValid: false, error: "Invalid phone number format" };
      } catch {
        // If parsing fails, try direct validation
        if (isValidPhoneNumber(cleaned)) {
          return { isValid: true, error: null };
        }
        return { isValid: false, error: "Invalid phone number format" };
      }
    } else {
      // Parse as national format with country code
      try {
        const parsed = parsePhoneNumber(cleaned, countryCode as CountryCode);
        if (parsed && isValidPhoneNumber(parsed.number, countryCode as CountryCode)) {
          return { isValid: true, error: null };
        }
        return { isValid: false, error: "Invalid phone number format" };
      } catch {
        // If parsing fails, try direct validation with country code
        if (isValidPhoneNumber(cleaned, countryCode as CountryCode)) {
          return { isValid: true, error: null };
        }
        return { isValid: false, error: "Invalid phone number format" };
      }
    }
  } catch {
    return { isValid: false, error: "Invalid phone number format" };
  }
}

/**
 * Format phone number to E.164 format
 */
export function formatPhoneToE164(phone: string, countryCode: string): string | null {
  if (!phone || phone.trim() === "") {
    return null;
  }
  
  const trimmed = phone.trim();
  if (trimmed === "") {
    return null;
  }
  
  try {
    const parsed = parsePhoneNumber(trimmed, countryCode as CountryCode);
    return parsed ? parsed.number : null;
  } catch {
    // Try parsing as international format
    try {
      const parsed = parsePhoneNumber(trimmed);
      return parsed ? parsed.number : null;
    } catch {
      return null;
    }
  }
}

/**
 * Trim and validate that string is not empty/whitespace
 */
export function trimAndValidate(value: string | null | undefined): { trimmed: string; isValid: boolean } {
  if (!value) {
    return { trimmed: "", isValid: true }; // Empty is valid for optional fields
  }
  
  const trimmed = value.trim();
  return { trimmed, isValid: trimmed.length > 0 || value === "" };
}
