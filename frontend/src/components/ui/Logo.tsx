import { useState } from 'react';

const PALETTES = [
  { // Original Orange/Red
    c1: ['#FBBF24', '#F59E0B', '#F97316'],
    c2: ['#F59E0B', '#EA580C', '#D97706'],
    c3: ['#EA580C', '#991B1B', '#B91C1C'],
    c4: ['#FCD34D', '#F59E0B', '#FBBF24'],
    c5: ['#F97316', '#C2410C', '#EA580C'],
    c6: ['#EA580C', '#7F1D1D', '#991B1B'],
  },
  { // Ocean Blue/Indigo
    c1: ['#60A5FA', '#3B82F6', '#2563EB'],
    c2: ['#3B82F6', '#2563EB', '#1D4ED8'],
    c3: ['#2563EB', '#1E40AF', '#1E3A8A'],
    c4: ['#93C5FD', '#60A5FA', '#3B82F6'],
    c5: ['#3B82F6', '#1D4ED8', '#1E40AF'],
    c6: ['#2563EB', '#1E3A8A', '#172554'],
  },
  { // Forest Emerald/Teal
    c1: ['#34D399', '#10B981', '#059669'],
    c2: ['#10B981', '#059669', '#047857'],
    c3: ['#059669', '#065F46', '#064E3B'],
    c4: ['#6EE7B7', '#34D399', '#10B981'],
    c5: ['#10B981', '#047857', '#065F46'],
    c6: ['#059669', '#064E3B', '#022C22'],
  },
  { // Royal Purple/Violet
    c1: ['#A78BFA', '#8B5CF6', '#7C3AED'],
    c2: ['#8B5CF6', '#7C3AED', '#6D28D9'],
    c3: ['#7C3AED', '#5B21B6', '#4C1D95'],
    c4: ['#C4B5FD', '#A78BFA', '#8B5CF6'],
    c5: ['#8B5CF6', '#6D28D9', '#5B21B6'],
    c6: ['#7C3AED', '#4C1D95', '#2E1065'],
  },
  { // Sunset Rose/Amber
    c1: ['#FB7185', '#F43F5E', '#E11D48'],
    c2: ['#F43F5E', '#E11D48', '#BE123C'],
    c3: ['#E11D48', '#9F1239', '#881337'],
    c4: ['#FDA4AF', '#FB7185', '#F43F5E'],
    c5: ['#F43F5E', '#BE123C', '#9F1239'],
    c6: ['#E11D48', '#881337', '#4C0519'],
  }
];

export const Logo = ({ className = "", animated = false }: { className?: string; animated?: boolean }) => {
  const [isShattered, setIsShattered] = useState(false);

  const [paletteIndex, setPaletteIndex] = useState(0);

  const handleShatter = () => {
    if (isShattered) return;
    setIsShattered(true);
    // Cycle palette on shatter
    setPaletteIndex((prev) => (prev + 1) % PALETTES.length);
    setTimeout(() => setIsShattered(false), 1000);
  };

  const colors = PALETTES[paletteIndex];

  return (
    <div className={`flex flex-col items-center justify-center ${className}`}>
      {/* 3D-ish Logo Graphic */}
      <svg
        width="120"
        height="120"
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="mb-1 cursor-pointer"
        onClick={handleShatter}
      >
        <g style={{ transform: 'translate(10px, 10px) scale(0.8)' }}>
          {/* Top Left Cube - Yellow/Orange */}
          <g className={`${animated ? "animate-cube-1" : ""} ${isShattered ? "animate-shatter-1" : ""}`}>
            <g transform="translate(20, 10)">
              <path d="M 20 0 L 40 10 L 20 20 L 0 10 Z" fill={colors.c1[0]} />
              <path d="M 0 10 L 20 20 L 20 40 L 0 30 Z" fill={colors.c1[1]} />
              <path d="M 20 20 L 40 10 L 40 30 L 20 40 Z" fill={colors.c1[2]} />
            </g>
          </g>

          {/* Middle Left Cube - Orange */}
          <g className={`${animated ? "animate-cube-2" : ""} ${isShattered ? "animate-shatter-2" : ""}`}>
            <g transform="translate(20, 35)">
              <path d="M 20 0 L 40 10 L 20 20 L 0 10 Z" fill={colors.c2[0]} />
              <path d="M 0 10 L 20 20 L 20 40 L 0 30 Z" fill={colors.c2[1]} />
              <path d="M 20 20 L 40 10 L 40 30 L 20 40 Z" fill={colors.c2[2]} />
            </g>
          </g>

          {/* Bottom Left Cube - Dark Red/Orange */}
          <g className={`${animated ? "animate-cube-3" : ""} ${isShattered ? "animate-shatter-3" : ""}`}>
            <g transform="translate(20, 60)">
              <path d="M 20 0 L 40 10 L 20 20 L 0 10 Z" fill={colors.c3[0]} />
              <path d="M 0 10 L 20 20 L 20 40 L 0 30 Z" fill={colors.c3[1]} />
              <path d="M 20 20 L 40 10 L 40 30 L 20 40 Z" fill={colors.c3[2]} />
            </g>
          </g>

          {/* Top Right Arm Cube - Yellow */}
          <g className={`${animated ? "animate-cube-4" : ""} ${isShattered ? "animate-shatter-4" : ""}`}>
            <g transform="translate(50, 10)">
              <path d="M 20 0 L 40 10 L 20 20 L 0 10 Z" fill={colors.c4[0]} />
              <path d="M 0 10 L 20 20 L 20 40 L 0 30 Z" fill={colors.c4[1]} />
              <path d="M 20 20 L 40 10 L 40 30 L 20 40 Z" fill={colors.c4[2]} />
            </g>
          </g>

          {/* Bottom Right Arm Cube 1 - Orange */}
          <g className={`${animated ? "animate-cube-5" : ""} ${isShattered ? "animate-shatter-5" : ""}`}>
            <g transform="translate(45, 45)">
              <path d="M 20 0 L 40 10 L 20 20 L 0 10 Z" fill={colors.c5[0]} />
              <path d="M 0 10 L 20 20 L 20 40 L 0 30 Z" fill={colors.c5[1]} />
              <path d="M 20 20 L 40 10 L 40 30 L 20 40 Z" fill={colors.c5[2]} />
            </g>
          </g>

          {/* Bottom Right Arm Cube 2 - Red */}
          <g className={`${animated ? "animate-cube-6" : ""} ${isShattered ? "animate-shatter-6" : ""}`}>
            <g transform="translate(60, 60)">
              <path d="M 20 0 L 40 10 L 20 20 L 0 10 Z" fill={colors.c6[0]} />
              <path d="M 0 10 L 20 20 L 20 40 L 0 30 Z" fill={colors.c6[1]} />
              <path d="M 20 20 L 40 10 L 40 30 L 20 40 Z" fill={colors.c6[2]} />
            </g>
          </g>
        </g>
      </svg>

      {/* Text Logo */}
      <div className="flex flex-col items-center cursor-pointer select-none group" onClick={handleShatter}>
        <h1
          className={`text-[2.75rem] font-black leading-none tracking-tight transition-all duration-700 ${animated ? "animate-fade-in" : ""} ${isShattered ? "animate-bounce" : "group-hover:scale-105"}`}
          style={{
            fontFamily: "'Montserrat', sans-serif",
            letterSpacing: '0.05em',
            color: colors.c3[0]
          }}
        >
          KairiX
        </h1>
        <p
          className="text-[0.6rem] font-bold tracking-widest mt-1 opacity-60 transition-colors duration-700"
          style={{
            fontFamily: "'Montserrat', sans-serif",
            color: colors.c3[0]
          }}
        >
          PROJECT MANAGEMENT TOOL
        </p>
      </div>
    </div>
  );
};

/** Compact inline variant for the Sidebar — just the 3D cube icon + wordmark side by side */
export const LogoCompact = ({ className = "" }: { className?: string }) => {
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <svg
        width="36"
        height="36"
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="flex-shrink-0"
      >
        <g style={{ transform: 'translate(10px, 10px) scale(0.8)' }}>
          <g transform="translate(20, 10)">
            <path d="M 20 0 L 40 10 L 20 20 L 0 10 Z" fill="#FBBF24" />
            <path d="M 0 10 L 20 20 L 20 40 L 0 30 Z" fill="#F59E0B" />
            <path d="M 20 20 L 40 10 L 40 30 L 20 40 Z" fill="#F97316" />
          </g>
          <g transform="translate(20, 35)">
            <path d="M 20 0 L 40 10 L 20 20 L 0 10 Z" fill="#F59E0B" />
            <path d="M 0 10 L 20 20 L 20 40 L 0 30 Z" fill="#EA580C" />
            <path d="M 20 20 L 40 10 L 40 30 L 20 40 Z" fill="#D97706" />
          </g>
          <g transform="translate(20, 60)">
            <path d="M 20 0 L 40 10 L 20 20 L 0 10 Z" fill="#EA580C" />
            <path d="M 0 10 L 20 20 L 20 40 L 0 30 Z" fill="#991B1B" />
            <path d="M 20 20 L 40 10 L 40 30 L 20 40 Z" fill="#B91C1C" />
          </g>
          <g transform="translate(50, 10)">
            <path d="M 20 0 L 40 10 L 20 20 L 0 10 Z" fill="#FCD34D" />
            <path d="M 0 10 L 20 20 L 20 40 L 0 30 Z" fill="#F59E0B" />
            <path d="M 20 20 L 40 10 L 40 30 L 20 40 Z" fill="#FBBF24" />
          </g>
          <g transform="translate(45, 45)">
            <path d="M 20 0 L 40 10 L 20 20 L 0 10 Z" fill="#F97316" />
            <path d="M 0 10 L 20 20 L 20 40 L 0 30 Z" fill="#C2410C" />
            <path d="M 20 20 L 40 10 L 40 30 L 20 40 Z" fill="#EA580C" />
          </g>
          <g transform="translate(60, 60)">
            <path d="M 20 0 L 40 10 L 20 20 L 0 10 Z" fill="#EA580C" />
            <path d="M 0 10 L 20 20 L 20 40 L 0 30 Z" fill="#7F1D1D" />
            <path d="M 20 20 L 40 10 L 40 30 L 20 40 Z" fill="#991B1B" />
          </g>
        </g>
      </svg>

      <div className="flex flex-col leading-none">
        <span
          className="font-black text-base text-[#A5133C] tracking-wide"
          style={{ fontFamily: "'Montserrat', sans-serif" }}
        >
          KairiX
        </span>
        <span className="text-[9px] text-gray-400 dark:text-gray-500 font-medium tracking-widest uppercase mt-0.5">
          Team Workspace
        </span>
      </div>
    </div>
  );
};
