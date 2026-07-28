import Link from "next/link";
import { prisma } from "@/lib/db";
import { formatDate, getReturnUrgency, STATUS_LABELS } from "@/lib/dates";
import { ReturnUrgencyBadge } from "@/components/StatusBadge";
import { deleteRecord } from "../actions";

export const dynamic = "force-dynamic";

export default async function AdminRecordsPage() {
  const records = await prisma.batchRecord.findMany({
    include: { team: true },
    orderBy: [{ status: "asc" }, { dueDate: "asc" }]
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-[var(--text-muted)]">전체 {records.length}건</p>
        <Link
          href="/admin/records/new"
          className="rounded-md bg-brand-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-brand-700"
        >
          + 발행 등록
        </Link>
      </div>

      <div className="surface-card overflow-x-auto rounded-xl">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-[var(--gridline)] text-xs text-[var(--text-muted)]">
            <tr>
              <th className="px-4 py-3 font-medium">문서번호</th>
              <th className="px-4 py-3 font-medium">부서</th>
              <th className="px-4 py-3 font-medium">제품명</th>
              <th className="px-4 py-3 font-medium">진행상태</th>
              <th className="px-4 py-3 font-medium">반납기한</th>
              <th className="px-4 py-3 font-medium">반납일</th>
              <th className="px-4 py-3 font-medium">상태</th>
              <th className="px-4 py-3 font-medium"></th>
            </tr>
          </thead>
          <tbody>
            {records.map((r) => {
              const urgency = getReturnUrgency(r.status, r.dueDate, r.returnDate);
              return (
                <tr key={r.id} className="border-b border-[var(--gridline)] last:border-0">
                  <td className="px-4 py-3 font-mono text-xs">{r.recordNo}</td>
                  <td className="px-4 py-3">{r.team.nameEn}</td>
                  <td className="px-4 py-3">{r.productName}</td>
                  <td className="px-4 py-3">{STATUS_LABELS[r.status]?.ko ?? r.status}</td>
                  <td className="px-4 py-3 tabular">{formatDate(r.dueDate)}</td>
                  <td className="px-4 py-3 tabular">{formatDate(r.returnDate)}</td>
                  <td className="px-4 py-3">
                    <ReturnUrgencyBadge urgency={urgency} dueDate={r.dueDate} />
                  </td>
                  <td className="px-4 py-3 text-right text-xs">
                    <Link href={`/admin/records/${r.id}`} className="text-brand-600 hover:underline">
                      수정
                    </Link>
                    <form action={deleteRecord} className="inline">
                      <input type="hidden" name="id" value={r.id} />
                      <button
                        type="submit"
                        className="ml-3 text-[var(--status-critical)] hover:underline"
                      >
                        삭제
                      </button>
                    </form>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
