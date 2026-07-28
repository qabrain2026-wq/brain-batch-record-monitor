import Link from "next/link";
import { cookies } from "next/headers";
import { prisma } from "@/lib/db";
import { getTeamCountsMap, emptyCounts } from "@/lib/teamCounts";
import { getActivePeriod } from "@/lib/dashboardPeriod";
import { VIEW_MODE_COOKIE } from "@/components/ViewModeToggle";

export const dynamic = "force-dynamic";

export default async function AllTeamsPage() {
  const period = await getActivePeriod();
  const [allTeams, countsMap] = await Promise.all([
    prisma.team.findMany({ orderBy: { nameEn: "asc" } }),
    getTeamCountsMap(period)
  ]);
  const viewMode = cookies().get(VIEW_MODE_COOKIE)?.value === "qa" ? "qa" : "writer";

  // 작성자용: 발행 이력 없는 부서는 아예 노출하지 않음. QA용: 이력 없는 부서까지 전부 노출.
  const teams =
    viewMode === "qa" ? allTeams : allTeams.filter((t) => (countsMap.get(t.id)?.total ?? 0) > 0);

  return (
    <div className="mx-auto max-w-7xl space-y-4">
      <div>
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="text-xl font-semibold tracking-tight">전체부서 현황</h1>
          <span className="status-pill status-muted">집계 기간: {period.label}</span>
        </div>
        <p className="mt-1 text-sm text-[var(--text-muted)]">
          {viewMode === "qa"
            ? `발행 이력이 없는 부서까지 포함한 전체 목록입니다. 총 ${teams.length}개 부서.`
            : `발행 이력이 있는 부서 목록입니다. 총 ${teams.length}개 부서.`}
        </p>
      </div>

      <div className="surface-card overflow-x-auto rounded-2xl">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-[var(--line)] text-xs text-[var(--ink-mute)]">
            <tr>
              <th className="px-4 py-3 font-medium">부서</th>
              <th className="px-4 py-3 font-medium">지연</th>
              <th className="px-4 py-3 font-medium">임박</th>
              <th className="px-4 py-3 font-medium">총 건수</th>
              <th className="px-4 py-3 font-medium">완료(정시)</th>
              <th className="px-4 py-3 font-medium">완료(지연)</th>
            </tr>
          </thead>
          <tbody>
            {teams.map((t) => {
              const c = countsMap.get(t.id) ?? emptyCounts();
              return (
                <tr key={t.id} className="border-b border-[var(--line)] last:border-0 hover:bg-[var(--ground)]">
                  <td className="px-4 py-3">
                    <Link href={`/team/${t.id}`} className="font-medium text-[var(--ink)] hover:text-[var(--navy)]">
                      {t.nameEn}
                    </Link>
                    <span className="ml-1.5 text-xs text-[var(--ink-mute)]">{t.nameKo}</span>
                  </td>
                  {c.total === 0 ? (
                    <td colSpan={5} className="px-4 py-3 text-[var(--ink-mute)]">
                      발행된 제조기록서가 없습니다.
                    </td>
                  ) : (
                    <>
                      <td className="tabular px-4 py-3 text-[var(--status-critical)]">{c.overdue}</td>
                      <td className="tabular px-4 py-3 text-[var(--status-warning)]">{c.imminent}</td>
                      <td className="tabular px-4 py-3">{c.total}</td>
                      <td className="tabular px-4 py-3 text-[var(--status-good)]">{c.returnedOnTime}</td>
                      <td className="tabular px-4 py-3 text-[var(--status-critical)]">{c.returnedLate}</td>
                    </>
                  )}
                </tr>
              );
            })}
            {teams.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-sm text-[var(--ink-mute)]">
                  표시할 부서가 없습니다.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
