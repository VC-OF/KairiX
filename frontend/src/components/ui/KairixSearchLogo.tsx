import React from 'react';

export default function KairixSearchLogo() {
  return (
    <div className="flex items-center justify-center">
      <svg width="40" height="40" viewBox="0 0 128 128" fill="none" xmlns="http://www.w3.org/2000/svg">
        {/* Chat Bubble */}
        <path d="M18 25C18 18.4 23.4 13 30 13H74C80.6 13 86 18.4 86 25V60C86 66.6 80.6 72 74 72H50L38 84V72H30C23.4 72 18 66.6 18 60V25Z"
              fill="#3BA4FF"/>

        {/* Magnifying Glass Circle */}
        <circle cx="72" cy="55" r="30"
                fill="#DFF5FF"
                stroke="#0D6EFD"
                stroke-width="6"/>

        {/* Arrow Inside */}
        <path d="M58 62L80 40M80 40H67M80 40V53"
              stroke="#2196F3"
              stroke-width="6"
              stroke-linecap="round"
              stroke-linejoin="round"/>

        {/* Handle */}
        <rect x="88" y="78"
              width="12"
              height="28"
              rx="4"
              transform="rotate(-45 88 78)"
              fill="#0D6EFD"/>

        {/* Sparkles */}
        <path d="M22 18L24 24L30 26L24 28L22 34L20 28L14 26L20 24L22 18Z"
              fill="#FFFFFF"/>

        <path d="M96 18L98 22L102 24L98 26L96 30L94 26L90 24L94 22L96 18Z"
              fill="#FFFFFF"/>
      </svg>
    </div>
  );
}

export function KairixSearchButton({ onClick }: { onClick?: () => void }) {
  return (
    <button onClick={onClick} className="kairix-search-btn" title="Search (Ctrl+K)">
      <KairixSearchLogo />
    </button>
  );
}
