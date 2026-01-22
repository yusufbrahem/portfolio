"use client";

import { useState, useRef, useEffect } from "react";
import { ChevronLeft, ChevronRight, Calendar } from "lucide-react";

type CustomMonthPickerProps = {
  value: string | null; // Format: "YYYY-MM" or null
  onChange: (value: string | null) => void;
  placeholder?: string;
  required?: boolean;
  maxDate?: Date;
  minDate?: Date;
  disabled?: boolean;
};

export function CustomMonthPicker({
  value,
  onChange,
  placeholder = "Select month",
  required = false,
  maxDate,
  minDate,
  disabled = false,
}: CustomMonthPickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [viewYear, setViewYear] = useState(() => {
    if (value) {
      return parseInt(value.split("-")[0]);
    }
    return new Date().getFullYear();
  });
  const containerRef = useRef<HTMLDivElement>(null);

  // Parse current value
  const currentDate = value ? new Date(value + "-01") : null;
  const currentYear = currentDate ? currentDate.getFullYear() : null;
  const currentMonth = currentDate ? currentDate.getMonth() : null;

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  const months = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  const handleMonthSelect = (month: number) => {
    const selectedDate = new Date(viewYear, month, 1);
    
    // Validate against maxDate
    if (maxDate && selectedDate > maxDate) {
      return;
    }
    
    // Validate against minDate
    if (minDate && selectedDate < minDate) {
      return;
    }

    const year = selectedDate.getFullYear();
    const monthStr = String(month + 1).padStart(2, "0");
    onChange(`${year}-${monthStr}`);
    setIsOpen(false);
  };

  const handleYearChange = (delta: number) => {
    setViewYear(prev => prev + delta);
  };

  const isMonthDisabled = (month: number) => {
    const testDate = new Date(viewYear, month, 1);
    if (maxDate && testDate > maxDate) return true;
    if (minDate && testDate < minDate) return true;
    return false;
  };

  const displayValue = currentDate
    ? `${months[currentDate.getMonth()]} ${currentDate.getFullYear()}`
    : "";

  return (
    <div ref={containerRef} className="relative w-full">
      {/* Input field */}
      <button
        type="button"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        className={`w-full px-4 py-2 border border-border bg-background text-foreground rounded-lg focus:outline-none focus:ring-2 focus:ring-accent focus:border-accent transition-all h-[2.5rem] flex items-center justify-between ${
          disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer hover:border-border/80"
        } ${!displayValue ? "text-muted" : ""}`}
      >
        <span className="flex items-center gap-2">
          <Calendar className="h-4 w-4 text-muted" />
          <span>{displayValue || placeholder}</span>
        </span>
        <ChevronRight className={`h-4 w-4 text-muted transition-transform ${isOpen ? "rotate-90" : ""}`} />
      </button>

      {/* Calendar popup */}
      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-background border border-border rounded-lg shadow-lg z-50 overflow-hidden">
          {/* Header with year navigation */}
          <div className="bg-panel border-b border-border px-4 py-3 flex items-center justify-between">
            <button
              type="button"
              onClick={() => handleYearChange(-1)}
              className="p-1.5 rounded hover:bg-panel2 transition-colors"
              disabled={minDate && viewYear <= minDate.getFullYear()}
            >
              <ChevronLeft className="h-4 w-4 text-foreground" />
            </button>
            <div className="text-foreground font-semibold text-base">{viewYear}</div>
            <button
              type="button"
              onClick={() => handleYearChange(1)}
              className="p-1.5 rounded hover:bg-panel2 transition-colors"
              disabled={maxDate && viewYear >= maxDate.getFullYear()}
            >
              <ChevronRight className="h-4 w-4 text-foreground" />
            </button>
          </div>

          {/* Month grid */}
          <div className="p-3 grid grid-cols-3 gap-2">
            {months.map((month, index) => {
              const isSelected = currentYear === viewYear && currentMonth === index;
              const isDisabled = isMonthDisabled(index);
              
              return (
                <button
                  key={index}
                  type="button"
                  onClick={() => handleMonthSelect(index)}
                  disabled={isDisabled}
                  className={`px-3 py-2 text-sm rounded-lg transition-all ${
                    isSelected
                      ? "bg-accent text-white font-semibold shadow-md"
                      : isDisabled
                      ? "text-muted-disabled opacity-50 cursor-not-allowed"
                      : "text-foreground hover:bg-panel2"
                  }`}
                >
                  {month.slice(0, 3)}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
