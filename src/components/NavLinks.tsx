"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const TABS = [
  { href: "/", label: "대시보드" },
  { href: "/teams", label: "전체부서 현황" }
];

export default function NavLinks() {
  const pathname = usePathname();

  return (
    <div className="flex items-center gap-1 rounded-full border border-[var(--line)] bg-[var(--card)] p-0.5 text-sm shadow-md">
      {TABS.map((tab) => {
        const active = pathname === tab.href;
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={`rounded-full px-3 py-1.5 font-medium transition ${
              active ? "bg-[var(--navy)] text-white" : "text-[var(--text-secondary)] hover:text-[var(--navy)]"
            }`}
          >
            {tab.label}
          </Link>
        );
      })}
    </div>
  );
}
