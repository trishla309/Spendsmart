import React from "react";

interface FennoLogoProps {
  className?: string;
  size?: number;
}

export const FennoLogoMark: React.FC<FennoLogoProps> = ({ className = "h-8 w-8", size }) => {
  return (
    <svg
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      style={size ? { width: size, height: size } : undefined}
      aria-hidden="true"
    >
      {/* Deep Fenno blue container */}
      <rect width="32" height="32" rx="8" fill="#1E3A8A" />
      {/* Subtle inner highlight border for tactile depth */}
      <rect
        x="0.5"
        y="0.5"
        width="31"
        height="31"
        rx="7.5"
        stroke="white"
        strokeOpacity="0.14"
        strokeWidth="1"
      />
      {/* Bespoke architectural F monogram */}
      <path
        d="M8.5 7.5H23.5L20.8 11.2H12.2V14.6H19.2L17 18H12.2V24.5H8.5V7.5Z"
        fill="white"
      />
    </svg>
  );
};
