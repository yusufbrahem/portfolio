"use client";

import Image from "next/image";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { User } from "lucide-react";

export function Avatar({
  src,
  alt,
  className,
  priority,
}: {
  src: string;
  alt: string;
  className?: string;
  priority?: boolean;
}) {
  const [error, setError] = useState(false);

  // For user-uploaded images (in /uploads/), use regular img tag to support cache-busting query strings
  // For static assets, use Next.js Image component
  const isUserUploaded = src.startsWith("/uploads/");

  return (
    <div
      className={cn(
        "relative flex items-center justify-center overflow-hidden rounded-2xl border border-border bg-panel",
        "shadow-[0_14px_38px_rgba(0,0,0,0.45)]",
        className,
      )}
    >
      {error || !src ? (
        <div className="flex h-full w-full items-center justify-center bg-panel2">
          <User className="h-16 w-16 text-muted" aria-hidden="true" />
          <span className="sr-only">Profile photo placeholder</span>
        </div>
      ) : isUserUploaded ? (
        // Use regular img tag for user-uploaded images to support cache-busting query strings
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={src}
          alt={alt}
          className="h-full w-full object-cover"
          onError={() => setError(true)}
        />
      ) : (
        <Image
          src={src}
          alt={alt}
          width={600}
          height={600}
          priority={priority}
          className="h-full w-full object-cover"
          sizes="(max-width: 1024px) 280px, 360px"
          onError={() => setError(true)}
        />
      )}
    </div>
  );
}

