import { cookies } from "next/headers";
import { prisma } from "@/lib/db";
import { getTeamCountsMap, emptyCounts } from "@/lib/teamCounts";
import { getActivePeriod } from "@/lib/dashboardPeriod";
import { TeamCard } from "@/components/TeamCard";
import WriterGuidance from "@/components/WriterGuidance";
import QaAlertPanel from "@/components/QaAlertPanel";
import { VIEW_MODE_COOKIE } from "@/components/ViewModeToggle";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const period = await getActivePeriod();
  const [teams, countsMap] = await Promise.all([
    prisma.team.findMany({ orderBy: { nameEn: "asc" } }),
    getTeamCountsMap(period)
  ]);
  const viewMode = cookies().get(VIEW_MODE_COOKIE)?.value === "qa" ? "qa" : "writer";

  // 발행 이력이 있는 부서만 메인 대시보드에 노출 (이력 없는 부서는 "전체부서 현황"에서만 확인)
  const activeTeams = teams.filter((t) => (countsMap.get(t.id)?.total ?? 0) > 0);

  const totals = activeTeams.reduce(
    (acc, t) => {
      const c = countsMap.get(t.id) ?? emptyCounts();
      acc.overdue += c.overdue;
      acc.imminent += c.imminent;
      return acc;
    },
    { overdue: 0, imminent: 0 }
  );

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <section>
        <div className="mb-3 flex flex-wrap items-center gap-2">
          <h2 className="text-lg font-semibold text-[var(--text-secondary)]">공장 전체 현황</h2>
          <span className="status-pill status-muted">집계 기간: {period.label}</span>
        </div>
        <div className="grid max-w-md grid-cols-2 gap-3">
          <HeroStat label="반납 지연" value={totals.overdue} />
          <HeroStat label="반납 임박 (D-1 이내)" value={totals.imminent} />
        </div>
      </section>

      <section>
        <h2 className="mb-3 text-lg font-semibold text-[var(--text-secondary)]">부서별 현황</h2>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {activeTeams.map((t) => (
            <TeamCard
              key={t.id}
              id={t.id}
              nameEn={t.nameEn}
              nameKo={t.nameKo}
              counts={countsMap.get(t.id) ?? emptyCounts()}
            />
          ))}
        </div>
      </section>

      {viewMode === "writer" ? (
        <WriterGuidance
          overdueTeams={activeTeams
            .map((t) => ({ id: t.id, nameEn: t.nameEn, overdue: countsMap.get(t.id)?.overdue ?? 0 }))
            .filter((t) => t.overdue > 0)
            .sort((a, b) => b.overdue - a.overdue)}
        />
      ) : (
        <QaAlertPanel teams={activeTeams} countsMap={countsMap} />
      )}
    </div>
  );
}

function HeroStat({ label, value }: { label: string; value: number }) {
  return (
    <div className="surface-card p-4">
      <p className="text-base font-medium text-[var(--text-secondary)]">{label}</p>
      <p className="mt-1 text-[var(--text-primary)]">
        <span className="tabular text-2xl font-semibold">{value}</span>
        <span className="ml-1 text-sm font-medium text-[var(--text-muted)]">건</span>
      </p>
    </div>
  );
}
