import Link from "next/link";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth";

const TABS = [
  { href: "/admin", label: "개요" },
  { href: "/admin/records", label: "제조기록서" },
  { href: "/admin/teams", label: "팀/파트" },
  { href: "/admin/people", label: "알림 수신자" },
  { href: "/admin/users", label: "로그인 계정" },
  { href: "/admin/period", label: "집계 기간 설정" },
  { href: "/admin/logs", label: "열람/발송 로그" }
];

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const admin = await requireAdmin();
  if (!admin) {
    redirect("/login?next=/admin");
  }

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <div>
        <h1 className="text-xl font-bold">관리자</h1>
        <p className="text-sm text-[var(--text-muted)]">
          팀명/담당자/계정은 조직 개편 시 자주 바뀌므로 이 화면에서 직접 관리합니다.
        </p>
      </div>
      <nav className="flex flex-wrap gap-2 border-b border-[var(--gridline)] pb-2 text-sm">
        {TABS.map((t) => (
          <Link
            key={t.href}
            href={t.href}
            className="rounded-md px-3 py-1.5 text-[var(--text-secondary)] hover:bg-[var(--surface-1)] hover:text-[var(--text-primary)]"
          >
            {t.label}
          </Link>
        ))}
      </nav>
      <div>{children}</div>
    </div>
  );
}
