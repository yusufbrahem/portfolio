"use client";

import { motion, type Variants, useReducedMotion } from "framer-motion";

const variants: Variants = {
  hidden: { opacity: 0, y: 10 },
  show: { opacity: 1, y: 0 },
};

export function Motion({
  children,
  delay = 0,
  className,
}: {
  children: React.ReactNode;
  delay?: number;
  className?: string;
}) {
  const reduced = useReducedMotion();
  if (reduced) return <div className={className}>{children}</div>;

  return (
    <motion.div
      className={className}
      initial="hidden"
      animate="show"
      transition={{ duration: 0.28, ease: "easeOut", delay }}
      variants={variants}
    >
      {children}
    </motion.div>
  );
}

