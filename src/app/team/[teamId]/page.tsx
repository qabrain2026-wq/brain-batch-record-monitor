import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { getReturnUrgency, formatDate } from "@/lib/dates";
import { maskCode, maskProductName } from "@/lib/masking";
import { ReturnUrgencyBadge } from "@/components/StatusBadge";
import { updateProcessDates } from "@/app/admin/actions";

export const dynamic = "force-dynamic";

function toInputDate(d: Date | null) {
  if (!d) return "";
  return new Date(d).toISOString().slice(0, 10);
}

export default async function TeamPage({ params }: { params: { teamId: string } }) {
  const team = await prisma.team.findUnique({ where: { id: params.teamId } });
  if (!team) notFound();

  const session = await getSession();
  const isAdmin = session?.role === "admin";
  const records = await prisma.batchRecord.findMany({
    where: { teamId: team.id },
    orderBy: [{ status: "asc" }, { dueDate: "asc" }]
  });

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs text-[var(--text-muted)]">
          <Link href="/">대시보드</Link> / {team.nameEn}
        </p>
        <h1 className="text-xl font-bold">{team.nameEn}</h1>
        <p className="text-sm text-[var(--text-muted)]">{team.nameKo}</p>
      </div>

      {!session && (
        <div className="surface-card rounded-lg p-3 text-sm text-[var(--text-secondary)]">
          제조번호/제품명은 보안을 위해 마스킹되어 있습니다.{" "}
          <Link href={`/login?next=/team/${team.id}`} className="font-medium text-brand-600">
            로그인
          </Link>
          하면 전체 내용을 열람할 수 있으며, 열람 이력이 기록됩니다.
        </div>
      )}

      <div className="surface-card overflow-x-auto rounded-xl">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-[var(--gridline)] text-xs text-[var(--text-muted)]">
            <tr>
              <th className="px-4 py-3 font-medium">문서번호</th>
              <th className="px-4 py-3 font-medium">제품명</th>
              <th className="px-4 py-3 font-medium">제조번호</th>
              <th className="px-4 py-3 font-medium">발행일자</th>
              <th className="px-4 py-3 font-medium">제조일자</th>
              <th className="px-4 py-3 font-medium">공정완료일</th>
              <th className="px-4 py-3 font-medium">반납기한</th>
              <th className="px-4 py-3 font-medium">반납일</th>
              <th className="px-4 py-3 font-medium">상태</th>
              <th className="px-4 py-3 font-medium"></th>
            </tr>
          </thead>
          <tbody>
            {records.map((r) => {
              const urgency = getReturnUrgency(r.status, r.dueDate, r.returnDate);
              const detailHref = session
                ? `/record/${r.id}`
                : `/login?next=${encodeURIComponent(`/record/${r.id}`)}`;
              return (
                <tr key={r.id} className="border-b border-[var(--gridline)] last:border-0">
                  <td className="px-4 py-3 font-mono text-xs">{r.recordNo}</td>
                  <td className="px-4 py-3">{session ? r.productName : maskProductName(r.productName)}</td>
                  <td className="px-4 py-3 font-mono text-xs">{session ? r.batchNo : maskCode(r.batchNo)}</td>
                  <td className="px-4 py-3 tabular">{formatDate(r.issueDate)}</td>
                  <td className="px-4 py-3">
                    {isAdmin ? (
                      <>
                        <form id={`pd-${r.id}`} action={updateProcessDates}>
                          <input type="hidden" name="id" value={r.id} />
                          <input type="hidden" name="teamId" value={team.id} />
                        </form>
                        <input
                          type="date"
                          name="processStartDate"
                          form={`pd-${r.id}`}
                          defaultValue={toInputDate(r.processStartDate)}
                          className="tabular w-[9.5rem] rounded-md border border-[var(--gridline)] bg-[var(--surface-1)] px-2 py-1 text-xs"
                        />
                      </>
                    ) : (
                      <span className="tabular">{formatDate(r.processStartDate)}</span>
                    )}
                  </td>
                  <td className="px-4 py-3 tabular">
                    {r.processStartDate && !r.writeCompleteDate ? (
                      <span className="text-[var(--ink-mute)]" title="이 문서번호의 공정소요일이 등록되어 있지 않습니다">
                        소요일 미등록
                      </span>
                    ) : (
                      formatDate(r.writeCompleteDate)
                    )}
                  </td>
                  <td className="px-4 py-3 tabular">{formatDate(r.dueDate)}</td>
                  <td className="px-4 py-3">
                    {isAdmin ? (
                      <div className="flex items-center gap-1.5">
                        <input
                          type="date"
                          name="returnDate"
                          form={`pd-${r.id}`}
                          defaultValue={toInputDate(r.returnDate)}
                          className="tabular w-[9.5rem] rounded-md border border-[var(--gridline)] bg-[var(--surface-1)] px-2 py-1 text-xs"
                        />
                        <button
                          type="submit"
                          form={`pd-${r.id}`}
                          className="rounded-md bg-brand-600 px-2 py-1 text-xs font-semibold text-white hover:bg-brand-700"
                        >
                          저장
                        </button>
                      </div>
                    ) : (
                      <span className="tabular">{formatDate(r.returnDate)}</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <ReturnUrgencyBadge urgency={urgency} dueDate={r.dueDate} />
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link
                      href={detailHref}
                      prefetch={false}
                      className="text-xs font-medium text-brand-600 hover:underline"
                    >
                      상세보기
                    </Link>
                  </td>
                </tr>
              );
            })}
            {records.length === 0 && (
              <tr>
                <td colSpan={10} className="px-4 py-8 text-center text-sm text-[var(--text-muted)]">
                  발행된 제조기록서가 없습니다.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
