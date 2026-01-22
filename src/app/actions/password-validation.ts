"use server";

import { getMinPasswordLength } from "@/lib/password-validation";

/**
 * Server action to get minimum password length for client-side validation.
 * This allows client components to use the same configurable value.
 */
export async function getMinPasswordLengthAction() {
  return getMinPasswordLength();
}
