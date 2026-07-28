import Link from "next/link";
import { prisma } from "@/lib/db";
import { getReturnUrgency } from "@/lib/dates";
import { sendTeamAlert } from "./actions";

export const dynamic = "force-dynamic";

export default async function AdminOverviewPage() {
  const teams = await prisma.team.findMany({ orderBy: { nameEn: "asc" } });
  const records = await prisma.batchRecord.findMany();
  const people = await prisma.person.findMany({ where: { active: true } });

  const recipientCountByTeam = new Map<string, number>();
  for (const p of people) {
    recipientCountByTeam.set(p.teamId, (recipientCountByTeam.get(p.teamId) ?? 0) + 1);
  }

  const rows = teams.map((t) => {
    const teamRecords = records.filter((r) => r.teamId === t.id);
    const overdue = teamRecords.filter((r) => getReturnUrgency(r.status, r.dueDate) === "OVERDUE").length;
    const imminent = teamRecords.filter((r) => getReturnUrgency(r.status, r.dueDate) === "IMMINENT").length;
    return {
      team: t,
      overdue,
      imminent,
      needsAlert: overdue + imminent > 0,
      recipients: recipientCountByTeam.get(t.id) ?? 0
    };
  });

  const alertRows = rows.filter((r) => r.needsAlert).sort((a, b) => b.overdue - a.overdue);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <QuickLink
          href="/admin/records/new"
          title="제조기록서 발행 등록"
          desc="발행요청/발행 단계의 제조기록서를 한 번에 여러 건 등록"
        />
        <QuickLink href="/admin/people" title="알림 수신자 관리" desc="부서별 메일 수신 담당자 등록" />
        <QuickLink href="/admin/teams" title="팀/파트 관리" desc="조직 개편 시 팀명 변경" />
      </div>

      <div>
        <h2 className="mb-3 text-sm font-semibold text-[var(--text-secondary)]">
          반납기한 임박/지연 부서 ({alertRows.length})
        </h2>
        {alertRows.length === 0 ? (
          <p className="surface-card rounded-xl p-5 text-sm text-[var(--text-muted)]">
            현재 반납기한 임박·지연 건이 없습니다.
          </p>
        ) : (
          <div className="surface-card overflow-x-auto rounded-xl">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-[var(--gridline)] text-xs text-[var(--text-muted)]">
                <tr>
                  <th className="px-4 py-3 font-medium">부서</th>
                  <th className="px-4 py-3 font-medium">지연</th>
                  <th className="px-4 py-3 font-medium">임박</th>
                  <th className="px-4 py-3 font-medium">등록된 수신자</th>
                  <th className="px-4 py-3 font-medium"></th>
                </tr>
              </thead>
              <tbody>
                {alertRows.map((r) => (
                  <tr key={r.team.id} className="border-b border-[var(--gridline)] last:border-0">
                    <td className="px-4 py-3">
                      <Link href={`/team/${r.team.id}`} className="font-medium hover:underline">
                        {r.team.nameEn}
                      </Link>
                      <span className="ml-1 text-xs text-[var(--text-muted)]">{r.team.nameKo}</span>
                    </td>
                    <td className="px-4 py-3 tabular text-[var(--status-critical)]">{r.overdue}</td>
                    <td className="px-4 py-3 tabular" style={{ color: "#8a5a00" }}>
                      {r.imminent}
                    </td>
                    <td className="px-4 py-3 tabular">{r.recipients}명</td>
                    <td className="px-4 py-3 text-right">
                      {r.recipients === 0 ? (
                        <Link href="/admin/people" className="text-xs text-[var(--text-muted)] underline">
                          수신자 등록 필요
                        </Link>
                      ) : (
                        <form action={sendTeamAlert}>
                          <input type="hidden" name="teamId" value={r.team.id} />
                          <button
                            type="submit"
                            className="rounded-md bg-brand-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-brand-700"
                          >
                            기한임박 메일 발송
                          </button>
                        </form>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

function QuickLink({ href, title, desc }: { href: string; title: string; desc: string }) {
  return (
    <Link href={href} className="surface-card block rounded-xl p-4 hover:shadow-md">
      <p className="font-semibold">{title}</p>
      <p className="mt-1 text-xs text-[var(--text-muted)]">{desc}</p>
    </Link>
  );
}
