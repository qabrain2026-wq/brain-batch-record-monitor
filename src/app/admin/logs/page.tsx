import { prisma } from "@/lib/db";
import { formatDate } from "@/lib/dates";

export const dynamic = "force-dynamic";

export default async function AdminLogsPage() {
  const [accessLogs, alertLogs] = await Promise.all([
    prisma.accessLog.findMany({
      include: { user: true, record: { include: { team: true } } },
      orderBy: { accessedAt: "desc" },
      take: 100
    }),
    prisma.alertLog.findMany({
      include: { team: true },
      orderBy: { sentAt: "desc" },
      take: 100
    })
  ]);

  return (
    <div className="space-y-8">
      <section>
        <h2 className="mb-3 text-sm font-semibold text-[var(--text-secondary)]">
          기한임박 메일 발송 이력 ({alertLogs.length})
        </h2>
        <div className="surface-card overflow-x-auto rounded-xl">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-[var(--gridline)] text-xs text-[var(--text-muted)]">
              <tr>
                <th className="px-4 py-3 font-medium">발송일시</th>
                <th className="px-4 py-3 font-medium">부서</th>
                <th className="px-4 py-3 font-medium">발송자</th>
                <th className="px-4 py-3 font-medium">수신자</th>
                <th className="px-4 py-3 font-medium">대상 건수</th>
              </tr>
            </thead>
            <tbody>
              {alertLogs.map((log) => (
                <tr key={log.id} className="border-b border-[var(--gridline)] last:border-0">
                  <td className="px-4 py-3 tabular">{formatDate(log.sentAt)}</td>
                  <td className="px-4 py-3">{log.team.nameEn}</td>
                  <td className="px-4 py-3">{log.sentBy}</td>
                  <td className="px-4 py-3 text-xs">{log.recipients}</td>
                  <td className="px-4 py-3 tabular">{log.recordIds.split(",").filter(Boolean).length}</td>
                </tr>
              ))}
              {alertLogs.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-6 text-center text-sm text-[var(--text-muted)]">
                    발송 이력이 없습니다.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section>
        <h2 className="mb-3 text-sm font-semibold text-[var(--text-secondary)]">
          제조번호 열람 로그 ({accessLogs.length})
        </h2>
        <div className="surface-card overflow-x-auto rounded-xl">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-[var(--gridline)] text-xs text-[var(--text-muted)]">
              <tr>
                <th className="px-4 py-3 font-medium">열람일시</th>
                <th className="px-4 py-3 font-medium">열람자</th>
                <th className="px-4 py-3 font-medium">부서</th>
                <th className="px-4 py-3 font-medium">문서번호</th>
              </tr>
            </thead>
            <tbody>
              {accessLogs.map((log) => (
                <tr key={log.id} className="border-b border-[var(--gridline)] last:border-0">
                  <td className="px-4 py-3 tabular">{formatDate(log.accessedAt)}</td>
                  <td className="px-4 py-3">{log.user.displayName}</td>
                  <td className="px-4 py-3">{log.record.team.nameEn}</td>
                  <td className="px-4 py-3 font-mono text-xs">{log.record.recordNo}</td>
                </tr>
              ))}
              {accessLogs.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-4 py-6 text-center text-sm text-[var(--text-muted)]">
                    열람 이력이 없습니다.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
