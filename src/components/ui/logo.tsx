import { useId } from "react";

interface LogoProps {
  size?: number;
}

export const Logo = ({ size = 28 }: LogoProps) => {
  const id = useId();

  return (
    <svg width={size} height={size} viewBox="0 0 32 32" style={{ display: "block", flexShrink: 0 }}>
      <defs>
        <linearGradient id={`bg-${id}`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="oklch(62% 0.18 232)" />
          <stop offset="55%" stopColor="oklch(62% 0.18 232)" stopOpacity="0.85" />
          <stop offset="100%" stopColor="oklch(45% 0.16 280)" />
        </linearGradient>
        <radialGradient id={`shine-${id}`} cx="0.3" cy="0.2" r="0.7">
          <stop offset="0%" stopColor="white" stopOpacity="0.35" />
          <stop offset="60%" stopColor="white" stopOpacity="0" />
        </radialGradient>
        <filter id={`glow-${id}`} x="-30%" y="-30%" width="160%" height="160%">
          <feGaussianBlur stdDeviation="0.5" />
        </filter>
      </defs>

      <rect x="0" y="0" width="32" height="32" rx="9" fill={`url(#bg-${id})`} />
      <rect x="0" y="0" width="32" height="32" rx="9" fill={`url(#shine-${id})`} />
      <rect
        x="0.5"
        y="0.5"
        width="31"
        height="31"
        rx="8.5"
        fill="none"
        stroke="rgba(255,255,255,0.18)"
        strokeWidth="1"
      />
      <g
        fill="none"
        stroke="white"
        strokeLinecap="round"
        strokeLinejoin="round"
        filter={`url(#glow-${id})`}
      >
        <path d="M7 23 L7 11 L16 19 L25 11 L25 23" strokeWidth="3" opacity="0.9" />
      </g>
      <g fill="none" stroke="white" strokeLinecap="round" strokeLinejoin="round">
        <path d="M7 23 L7 11 L16 19 L25 11 L25 23" strokeWidth="2.6" />
      </g>
      <circle cx="16" cy="22.5" r="1.4" fill="white" opacity="0.95" />
    </svg>
  );
};
