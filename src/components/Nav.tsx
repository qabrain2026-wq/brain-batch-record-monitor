import Link from "next/link";
import { getSession } from "@/lib/auth";
import ThemeToggle from "@/components/ThemeToggle";
import PageHeading from "@/components/PageHeading";
import NavLinks from "@/components/NavLinks";
import HelpButton from "@/components/HelpButton";
import ViewModeToggle from "@/components/ViewModeToggle";

export default async function Nav() {
  const session = await getSession();

  return (
    <header className="sticky top-0 z-30 border-b border-[var(--line)] bg-[var(--card)]/85 backdrop-blur-md">
      <div className="grid w-full grid-cols-[1fr_auto_1fr] items-center gap-4 px-6 py-3">
        <Link href="/" className="flex flex-col leading-tight">
          <span className="text-xl font-medium tracking-tight text-[var(--navy)]">BRAiN</span>
          <span className="text-xs text-[var(--text-muted)]">Batch Record Return Monitor</span>
        </Link>
        <PageHeading />
        <nav className="flex items-center justify-self-end gap-3 text-sm">
          <Link
            href="/process-duration"
            className="rounded-full border border-[var(--line)] px-3.5 py-1.5 font-medium text-[var(--text-secondary)] transition hover:border-[var(--navy)] hover:text-[var(--navy)]"
          >
            BR 정보등록
          </Link>
          {session ? (
            <form action="/api/auth/logout" method="post" className="flex items-center gap-2">
              <span className="text-[var(--text-muted)]">{session.displayName}님</span>
              <button
                type="submit"
                className="rounded-full border border-[var(--line)] px-3.5 py-1.5 text-[var(--text-secondary)] transition hover:border-[var(--navy)] hover:text-[var(--navy)]"
              >
                로그아웃
              </button>
            </form>
          ) : (
            <Link
              href="/login"
              className="rounded-full bg-brand-600 px-4 py-1.5 font-medium text-white shadow-sm transition hover:bg-brand-700"
            >
              로그인
            </Link>
          )}
          <ThemeToggle />
          <HelpButton />
        </nav>
      </div>

      <div className="flex w-full items-center justify-between gap-3 border-t border-[var(--line)] px-6 py-2 text-sm">
        <NavLinks />
        <div className="flex items-center gap-3">
          {session?.role === "admin" && (
            <Link
              href="/admin"
              className="rounded-full border border-[var(--line)] bg-[var(--card)] px-3 py-1.5 font-medium text-[var(--text-secondary)] shadow-sm transition hover:text-[var(--navy)]"
            >
              관리자
            </Link>
          )}
          <ViewModeToggle />
        </div>
      </div>
    </header>
  );
}
