"use client";

import { useMagneticEffect } from "@/hooks/useMagneticEffect";
import { cn } from "@/lib/utils";

interface MagneticButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  strength?: number;
  className?: string;
  as?: "button" | "a";
  href?: string;
}

export function MagneticButton({
  children,
  strength = 0.3,
  className,
  as = "button",
  href,
  ...props
}: MagneticButtonProps) {
  const { ref, handleMouseMove, handleMouseLeave } =
    useMagneticEffect(strength);

  const baseClasses = cn(
    "relative inline-flex items-center justify-center gap-2",
    "px-8 py-4 rounded-full font-medium",
    "transition-colors duration-300",
    className
  );

  if (as === "a" && href) {
    return (
      <a
        ref={ref as React.RefObject<HTMLAnchorElement>}
        href={href}
        className={baseClasses}
        onMouseMove={handleMouseMove as unknown as React.MouseEventHandler<HTMLAnchorElement>}
        onMouseLeave={handleMouseLeave as unknown as React.MouseEventHandler<HTMLAnchorElement>}
      >
        {children}
      </a>
    );
  }

  return (
    <button
      ref={ref as React.RefObject<HTMLButtonElement>}
      className={baseClasses}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      {...props}
    >
      {children}
    </button>
  );
}
