"use client";

import { getCharCountDisplay, getRemainingChars } from "@/lib/text-limits";
import { cn } from "@/lib/utils";

type CharCounterProps = {
  current: number;
  max: number;
  className?: string;
};

export function CharCounter({ current, max, className }: CharCounterProps) {
  const remaining = getRemainingChars("", max);
  const isOverLimit = current > max;
  const isNearLimit = remaining < 20 && !isOverLimit;

  return (
    <div
      className={cn(
        "text-xs mt-1",
        isOverLimit && "text-red-400",
        isNearLimit && !isOverLimit && "text-yellow-500",
        !isOverLimit && !isNearLimit && "text-muted",
        className
      )}
    >
      {getCharCountDisplay(current, max)}
      {isOverLimit && (
        <span className="ml-2 text-red-400">
          (exceeds limit by {current - max})
        </span>
      )}
    </div>
  );
}
