import { useId } from "react";

export default function Logo() {
  const gradientId = useId();

  return (
    <span className="inline-flex items-center gap-2 text-foreground">
      <svg viewBox="0 0 64 64" aria-hidden="true" className="size-8 shrink-0">
        <defs>
          <linearGradient
            id={gradientId}
            x1="0"
            y1="0"
            x2="64"
            y2="64"
            gradientUnits="userSpaceOnUse"
          >
            <stop offset="0" stopColor="#6366f1" />
            <stop offset="1" stopColor="#a855f7" />
          </linearGradient>
        </defs>
        <rect width="64" height="64" rx="14" fill={`url(#${gradientId})`} />
        <path
          d="M16 33l16-13 16 13"
          stroke="#fff"
          strokeWidth="4.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />
        <path
          d="M22 30v15h20V30"
          stroke="#fff"
          strokeWidth="4.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />
      </svg>
      <span className="font-heading text-base font-semibold tracking-tight">
        ECTS Housing
      </span>
    </span>
  );
}
