export function Logo({ className = 'h-8 w-8' }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 40 40"
      fill="none"
      className={className}
    >
      {/* Shopping bag body */}
      <rect x="7" y="16" width="26" height="20" rx="3" fill="#14B8A6" />
      {/* Bag handles */}
      <path
        d="M14 16V11a6 6 0 0 1 12 0v5"
        stroke="#0D9488"
        strokeWidth="2.5"
        fill="none"
        strokeLinecap="round"
      />
      {/* Upward arrow (the "Go!") */}
      <path d="M20 30 L20 22" stroke="white" strokeWidth="2.5" strokeLinecap="round" />
      <path
        d="M16 25.5 L20 21.5 L24 25.5"
        stroke="white"
        strokeWidth="2.5"
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Plus badge */}
      <circle cx="28" cy="19" r="6" fill="#F59E0B" />
      <path d="M28 16v6M25 19h6" stroke="white" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}
