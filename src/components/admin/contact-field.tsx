"use client";

import { useState, useEffect } from "react";
import { Eye, EyeOff } from "lucide-react";
import { validateEmail, validatePhone, trimAndValidate } from "@/lib/contact-validation";
import { ItemVisibilityToggle } from "./item-visibility-toggle";

type ContactFieldProps = {
  type: "email1" | "email2" | "phone1" | "phone2" | "whatsapp";
  label: string;
  value: string;
  countryCode?: string; // Required for phone fields
  onChange: (value: string) => void;
  onVisibilityChange: (isVisible: boolean) => void;
  isVisible: boolean;
  isRequired?: boolean;
  isReadOnly?: boolean;
  placeholder?: string;
};

export function ContactField({
  type,
  label,
  value,
  countryCode = "US",
  onChange,
  onVisibilityChange,
  isVisible,
  isRequired = false,
  isReadOnly = false,
  placeholder,
}: ContactFieldProps) {
  const [error, setError] = useState<string | null>(null);
  const [isValidating, setIsValidating] = useState(false);

  // Real-time validation on change
  useEffect(() => {
    if (!value || value.trim() === "") {
      if (isRequired) {
        setError("This field is required");
      } else {
        setError(null);
      }
      return;
    }

    setIsValidating(true);
    
    // Debounce validation
    const timeoutId = setTimeout(() => {
      const trimmed = value.trim();
      
      if (trimmed === "" && isRequired) {
        setError("This field is required");
        setIsValidating(false);
        return;
      }
      
      if (trimmed === "") {
        setError(null);
        setIsValidating(false);
        return;
      }

      let validation;
      if (type === "email1" || type === "email2") {
        validation = validateEmail(trimmed);
      } else {
        // Phone fields
        validation = validatePhone(trimmed, countryCode);
      }

      setError(validation.error);
      setIsValidating(false);
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [value, countryCode, type, isRequired]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    onChange(newValue);
  };

  const handleBlur = () => {
    // Trim whitespace on blur
    const trimmed = value.trim();
    if (trimmed !== value) {
      onChange(trimmed);
    }
  };

  const isPhoneField = type === "phone1" || type === "phone2" || type === "whatsapp";
  const inputType = isPhoneField ? "tel" : "email";

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="block text-sm font-medium text-foreground">
          {label}
          {isRequired && <span className="text-red-400 ml-1">*</span>}
        </label>
        <div className="flex items-center gap-2">
          {isVisible ? (
            <Eye className="h-4 w-4 text-green-400" />
          ) : (
            <EyeOff className="h-4 w-4 text-muted" />
          )}
          <button
            type="button"
            onClick={() => onVisibilityChange(!isVisible)}
            disabled={isReadOnly}
            className={`relative inline-flex h-5 w-9 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-1 disabled:opacity-50 disabled:cursor-not-allowed ${
              isVisible ? "bg-green-500" : "bg-gray-300"
            }`}
            role="switch"
            aria-checked={isVisible}
            aria-label={`Toggle ${label} visibility`}
            title={isVisible ? "Visible on portfolio" : "Hidden from portfolio"}
          >
            <span
              className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                isVisible ? "translate-x-4" : "translate-x-0"
              }`}
            />
          </button>
        </div>
      </div>
      <input
        type={inputType}
        value={value}
        onChange={handleChange}
        onBlur={handleBlur}
        placeholder={placeholder}
        className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 transition-colors ${
          error
            ? "border-red-500 bg-red-500/10 focus:ring-red-500 focus:border-red-500"
            : "border-border bg-background text-foreground focus:ring-accent focus:border-accent"
        }`}
        disabled={isReadOnly || isValidating}
      />
      {error && (
        <p className="text-xs text-red-400 mt-1">{error}</p>
      )}
      {isValidating && !error && (
        <p className="text-xs text-muted mt-1">Validating...</p>
      )}
    </div>
  );
}
