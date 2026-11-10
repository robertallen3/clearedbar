import Link from "next/link";

export default function Logo() {
  return (
    <Link href="/" className="logo" aria-label="ClearedBar home">
      <svg viewBox="0 0 32 32" fill="none" aria-hidden="true">
        <rect x="3" y="6" width="3" height="22" rx="1" fill="#f5f1e8" />
        <rect x="26" y="6" width="3" height="22" rx="1" fill="#f5f1e8" />
        <rect x="3" y="10" width="26" height="3" rx="1.5" fill="#e4572e" />
        <path d="M8 26 C 12 14, 20 6, 25 17" stroke="#f3a07f" strokeWidth="2" strokeLinecap="round" strokeDasharray="2 3" />
      </svg>
      ClearedBar
    </Link>
  );
}
