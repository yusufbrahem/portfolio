"use client";

import { useState, useRef, useEffect, ReactNode } from "react";
import { ChevronDown } from "lucide-react";

type AccordionProps = {
  title: string;
  children: ReactNode;
  defaultOpen?: boolean;
  icon?: ReactNode;
  className?: string;
};

export function Accordion({
  title,
  children,
  defaultOpen = false,
  icon,
  className = "",
}: AccordionProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const [contentHeight, setContentHeight] = useState<number>(0);
  const contentRef = useRef<HTMLDivElement>(null);
  const innerRef = useRef<HTMLDivElement>(null);

  // Update height when open state changes or content changes
  useEffect(() => {
    if (contentRef.current && innerRef.current) {
      if (isOpen) {
        // Set to actual height for smooth animation
        const height = innerRef.current.scrollHeight;
        setContentHeight(height);
      } else {
        // Set to 0 for collapse animation
        setContentHeight(0);
      }
    }
  }, [isOpen, children]);

  // Use ResizeObserver to handle dynamic content changes
  useEffect(() => {
    if (!innerRef.current || !isOpen) return;

    const resizeObserver = new ResizeObserver(() => {
      if (innerRef.current) {
        setContentHeight(innerRef.current.scrollHeight);
      }
    });

    resizeObserver.observe(innerRef.current);

    return () => {
      resizeObserver.disconnect();
    };
  }, [isOpen]);

  const toggle = () => {
    setIsOpen(!isOpen);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      toggle();
    }
  };

  // Generate a unique ID for accessibility
  const contentId = `accordion-content-${title.replace(/\s+/g, "-").toLowerCase()}`;

  return (
    <div className={`border border-border bg-panel rounded-lg overflow-hidden ${className}`}>
      <button
        type="button"
        onClick={toggle}
        onKeyDown={handleKeyDown}
        aria-expanded={isOpen}
        aria-controls={contentId}
        className="w-full flex items-center justify-between p-4 text-left hover:bg-panel2 transition-colors focus:outline-none focus:ring-2 focus:ring-accent focus:ring-inset"
      >
        <div className="flex items-center gap-2">
          {icon && <span className="flex-shrink-0">{icon}</span>}
          <h2 className="text-lg font-semibold text-foreground">{title}</h2>
        </div>
        <ChevronDown
          className={`h-5 w-5 text-muted transition-transform duration-300 flex-shrink-0 ${
            isOpen ? "rotate-180" : "rotate-0"
          }`}
          aria-hidden="true"
        />
      </button>
      <div
        id={contentId}
        ref={contentRef}
        style={{
          height: `${contentHeight}px`,
          overflow: "hidden",
          transition: "height 300ms ease-in-out",
        }}
        aria-hidden={!isOpen}
      >
        <div ref={innerRef} className="p-4 pt-0">
          {children}
        </div>
      </div>
    </div>
  );
}
