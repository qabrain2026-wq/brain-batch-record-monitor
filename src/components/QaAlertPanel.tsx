import Link from "next/link";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { TeamCounts } from "@/lib/teamCounts";
import { sendTeamAlert, sendAllTeamAlerts } from "@/app/admin/actions";

type TeamLite = { id: string; nameEn: string; nameKo: string };

export default async function QaAlertPanel({
  teams,
  countsMap
}: {
  teams: TeamLite[];
  countsMap: Map<string, TeamCounts>;
}) {
  const [session, people] = await Promise.all([
    getSession(),
    prisma.person.findMany({ where: { active: true } })
  ]);
  const isAdmin = session?.role === "admin";

  const recipientCountByTeam = new Map<string, number>();
  for (const p of people) {
    recipientCountByTeam.set(p.teamId, (recipientCountByTeam.get(p.teamId) ?? 0) + 1);
  }

  const rows = teams
    .map((t) => {
      const c = countsMap.get(t.id);
      return {
        team: t,
        overdue: c?.overdue ?? 0,
        imminent: c?.imminent ?? 0,
        recipients: recipientCountByTeam.get(t.id) ?? 0
      };
    })
    .filter((r) => r.overdue > 0 || r.imminent > 0)
    .sort((a, b) => b.overdue - a.overdue);

  return (
    <section className="surface-card rounded-2xl p-5">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-lg font-semibold text-[var(--ink)]">QA 알림 발송 — 발생부서별</h2>
        {isAdmin && rows.length > 0 && (
          <form action={sendAllTeamAlerts}>
            <button
              type="submit"
              className="rounded-full bg-[var(--navy)] px-3.5 py-1.5 text-sm font-semibold text-white hover:opacity-90"
            >
              전체 일괄 발송 ({rows.length}개 부서)
            </button>
          </form>
        )}
      </div>
      {rows.length === 0 ? (
        <p className="text-base text-[var(--ink-mute)]">현재 반납기한 임박·지연 부서가 없습니다.</p>
      ) : (
        <div className="space-y-2">
          {rows.map((r) => (
            <div
              key={r.team.id}
              className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-[var(--line)] px-4 py-2.5 text-base"
            >
              <div>
                <span className="font-medium text-[var(--ink)]">{r.team.nameEn}</span>
                <span className="ml-1.5 text-sm text-[var(--ink-mute)]">{r.team.nameKo}</span>
                <span className="tabular ml-3 text-sm text-[var(--status-critical)]">지연 {r.overdue}</span>
                <span className="tabular ml-2 text-sm text-[var(--status-warning)]">임박 {r.imminent}</span>
              </div>

              {isAdmin ? (
                r.recipients === 0 ? (
                  <Link href="/admin/people" className="text-sm text-[var(--ink-mute)] underline">
                    수신자 등록 필요
                  </Link>
                ) : (
                  <form action={sendTeamAlert}>
                    <input type="hidden" name="teamId" value={r.team.id} />
                    <button
                      type="submit"
                      className="rounded-full bg-brand-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-brand-700"
                    >
                      알람메일 발송
                    </button>
                  </form>
                )
              ) : (
                <Link
                  href="/login?next=/"
                  className="rounded-full border border-[var(--line)] px-3 py-1.5 text-sm text-[var(--ink-mute)] transition hover:text-[var(--navy)]"
                >
                  로그인 후 발송 가능
                </Link>
              )}
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
