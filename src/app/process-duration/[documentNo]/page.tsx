import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";

export const dynamic = "force-dynamic";

function formatDateTime(d: Date) {
  const date = new Date(d);
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const hh = String(date.getHours()).padStart(2, "0");
  const mm = String(date.getMinutes()).padStart(2, "0");
  return `${y}-${m}-${day} ${hh}:${mm}`;
}

export default async function ProcessDurationHistoryPage({
  params
}: {
  params: { documentNo: string };
}) {
  const documentNo = decodeURIComponent(params.documentNo);

  const session = await getSession();
  if (!session) {
    redirect(`/login?next=${encodeURIComponent(`/process-duration/${params.documentNo}`)}`);
  }

  const logs = await prisma.processDurationRuleLog.findMany({
    where: { documentNo },
    orderBy: { changedAt: "desc" }
  });

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <div>
        <p className="text-xs text-[var(--text-muted)]">
          <Link href="/process-duration">공정소요일 등록</Link> / 변경내역
        </p>
        <h1 className="font-mono text-xl font-semibold tracking-tight">{documentNo}</h1>
      </div>

      <div className="surface-card overflow-x-auto rounded-2xl">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-[var(--gridline)] text-xs text-[var(--text-muted)]">
            <tr>
              <th className="px-4 py-3 font-medium">일시</th>
              <th className="px-4 py-3 font-medium">변경자</th>
              <th className="px-4 py-3 font-medium">내용</th>
            </tr>
          </thead>
          <tbody>
            {logs.map((log) => (
              <tr key={log.id} className="border-b border-[var(--gridline)] last:border-0">
                <td className="tabular px-4 py-3">{formatDateTime(log.changedAt)}</td>
                <td className="px-4 py-3">{log.changedByName}</td>
                <td className="px-4 py-3">
                  {log.action === "DELETE" ? (
                    <span className="text-[var(--status-critical)]">규칙 삭제</span>
                  ) : (
                    <span>
                      공정소요일{" "}
                      <span className="tabular font-medium">
                        {log.offsetDays !== null && log.offsetDays >= 0 ? `+${log.offsetDays}` : log.offsetDays}
                        일
                      </span>
                      로 등록/수정
                    </span>
                  )}
                </td>
              </tr>
            ))}
            {logs.length === 0 && (
              <tr>
                <td colSpan={3} className="px-4 py-8 text-center text-sm text-[var(--text-muted)]">
                  변경 이력이 없습니다.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
