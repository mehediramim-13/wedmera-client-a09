import Link from "next/link";

import { SITE_NAME } from "@/lib/config";
import { cn } from "@/lib/utils";

type LogoProps = {
  variant?: "full" | "mark";
  size?: number;
  className?: string;
};

function LogoMark({ size }: { size: number }) {
  return (
    <svg
      aria-hidden="true"
      className="shrink-0"
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
    >
      <circle
        cx="18"
        cy="24"
        r="12"
        stroke="var(--primary)"
        strokeWidth="3"
      />
      <circle
        cx="30"
        cy="24"
        r="12"
        stroke="var(--accent)"
        strokeWidth="3"
      />
      <path
        d="m16 21 4 9 4-7 4 7 4-9"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
      />
    </svg>
  );
}

export function Logo({
  variant = "full",
  size = 40,
  className,
}: LogoProps) {
  return (
    <Link
      aria-label={SITE_NAME}
      className={cn("inline-flex items-center gap-2.5 text-foreground", className)}
      href="/"
    >
      <LogoMark size={size} />
      {variant === "full" ? (
        <span className="font-heading text-2xl font-semibold tracking-tight">
          <span>{SITE_NAME.slice(0, 3)}</span>
          <span className="text-primary">{SITE_NAME.slice(3)}</span>
        </span>
      ) : null}
    </Link>
  );
}
