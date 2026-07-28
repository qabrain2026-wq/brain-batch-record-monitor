import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { RecordForm } from "@/components/RecordForm";
import { formatDate } from "@/lib/dates";
import { updateRecord } from "../../actions";

export const dynamic = "force-dynamic";

export default async function EditRecordPage({ params }: { params: { id: string } }) {
  const [record, teams, accessLogs] = await Promise.all([
    prisma.batchRecord.findUnique({ where: { id: params.id } }),
    prisma.team.findMany({ orderBy: { nameEn: "asc" } }),
    prisma.accessLog.findMany({
      where: { recordId: params.id },
      include: { user: true },
      orderBy: { accessedAt: "desc" },
      take: 20
    })
  ]);

  if (!record) notFound();

  return (
    <div className="space-y-6">
      <h2 className="text-sm font-semibold text-[var(--text-secondary)]">제조기록서 수정 — {record.recordNo}</h2>
      <RecordForm teams={teams} record={record} action={updateRecord} submitLabel="저장" />

      <div>
        <h3 className="mb-2 text-sm font-semibold text-[var(--text-secondary)]">
          열람 로그 ({accessLogs.length})
        </h3>
        <div className="surface-card max-w-2xl rounded-xl">
          {accessLogs.length === 0 ? (
            <p className="p-4 text-sm text-[var(--text-muted)]">아직 열람 기록이 없습니다.</p>
          ) : (
            <ul className="divide-y divide-[var(--gridline)] text-sm">
              {accessLogs.map((log) => (
                <li key={log.id} className="flex justify-between px-4 py-2">
                  <span>{log.user.displayName}</span>
                  <span className="tabular text-[var(--text-muted)]">{formatDate(log.accessedAt)}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
