import { Logo } from "./logo";

interface LoadingSplashProps {
  fullScreen?: boolean;
}

export function LoadingSplash({ fullScreen = true }: LoadingSplashProps) {
  const containerClass = fullScreen ? "min-h-screen w-full" : "flex-1 w-full";

  return (
    <div
      className={`${containerClass} bg-[#0e0e12] flex items-center justify-center relative overflow-hidden`}
    >
      {/* Ambient gradient orbs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div
          className="absolute w-[600px] h-[600px] rounded-full opacity-[0.03] blur-[120px] animate-drift-slow"
          style={{
            background: "radial-gradient(circle, oklch(62% 0.18 232), transparent 70%)",
            top: "-20%",
            left: "-10%",
          }}
        />
        <div
          className="absolute w-[500px] h-[500px] rounded-full opacity-[0.025] blur-[100px] animate-drift-slow-reverse"
          style={{
            background: "radial-gradient(circle, oklch(45% 0.16 280), transparent 70%)",
            bottom: "-15%",
            right: "-5%",
          }}
        />
      </div>

      {/* Main content */}
      <div className="relative flex flex-col items-center gap-6">
        {/* Logo with glow */}
        <div className="relative animate-fade-in-up">
          {/* Glow effect behind logo */}
          <div
            className="absolute inset-0 blur-2xl opacity-40 scale-150 animate-pulse-subtle"
            style={{
              background: "radial-gradient(circle, oklch(62% 0.18 232 / 0.5), transparent 60%)",
            }}
          />

          {/* Logo container with subtle float */}
          <div className="relative animate-float">
            <div className="w-16 h-16 rounded-2xl bg-[#0e0e12]/80 border border-white/8 backdrop-blur-sm flex items-center justify-center shadow-2xl shadow-black/50">
              <Logo size={40} />
            </div>
          </div>
        </div>

        {/* Brand name with staggered animation */}
        <div className="flex flex-col items-center gap-3 animate-fade-in-up animation-delay-150">
          <h1
            className="text-[22px] font-semibold tracking-tight text-white/90"
            style={{
              fontFamily:
                "'SF Pro Display', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
            }}
          >
            Memoria
          </h1>

          {/* Loading indicator - elegant dots */}
          <div className="flex items-center gap-1.5">
            <span
              className="w-1.5 h-1.5 rounded-full bg-white/40 animate-loading-dot"
              style={{ animationDelay: "0ms" }}
            />
            <span
              className="w-1.5 h-1.5 rounded-full bg-white/40 animate-loading-dot"
              style={{ animationDelay: "150ms" }}
            />
            <span
              className="w-1.5 h-1.5 rounded-full bg-white/40 animate-loading-dot"
              style={{ animationDelay: "300ms" }}
            />
          </div>
        </div>
      </div>

      {/* Subtle noise texture overlay */}
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.015]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
        }}
      />
    </div>
  );
}
