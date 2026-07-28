import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { formatDate } from "@/lib/dates";
import { DocumentNoInput } from "@/components/DocumentNoInput";
import { upsertProcessDurationRule, deleteProcessDurationRule } from "./actions";

export const dynamic = "force-dynamic";

export default async function ProcessDurationPage({
  searchParams
}: {
  searchParams: { team?: string };
}) {
  const session = await getSession();
  if (!session) {
    redirect("/login?next=/process-duration");
  }

  const [teams, rules] = await Promise.all([
    prisma.team.findMany({ orderBy: { nameEn: "asc" } }),
    prisma.processDurationRule.findMany({ orderBy: { updatedAt: "desc" } })
  ]);

  const activeTeamId = teams.some((t) => t.id === searchParams.team) ? searchParams.team! : teams[0]?.id;
  const visibleRules = rules.filter((r) => r.teamId === activeTeamId);

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <h1 className="text-xl font-semibold tracking-tight">BR 정보등록</h1>
        <p className="mt-1 text-sm text-[var(--text-muted)]">
          문서번호(제조기록서 번호)별로 제품명과, 제조일자로부터 공정완료일까지 며칠이 걸리는지 등록합니다.
          공정소요일은 음수(예: -1)도 입력할 수 있습니다. 등록되면 해당 문서번호를 쓰는 제조기록서의
          공정완료일·반납기한이 자동으로 계산되고, 제조기록서 발행 등록 화면에서 문서번호만 입력해도
          제품명이 자동으로 채워집니다. QA 계정과 제조부서 계정 모두 등록할 수 있습니다.
        </p>
      </div>

      <div className="flex flex-wrap gap-2 border-b border-[var(--line)] pb-2 text-sm">
        {teams.map((t) => {
          const active = t.id === activeTeamId;
          const count = rules.filter((r) => r.teamId === t.id).length;
          return (
            <Link
              key={t.id}
              href={`/process-duration?team=${t.id}`}
              className={`rounded-md px-3 py-1.5 font-medium transition ${
                active ? "bg-[var(--navy)] text-white" : "text-[var(--text-secondary)] hover:bg-[var(--ground)]"
              }`}
            >
              {t.nameEn}
              {count > 0 && <span className="tabular ml-1 opacity-70">({count})</span>}
            </Link>
          );
        })}
      </div>

      <form
        action={upsertProcessDurationRule}
        className="surface-card flex flex-wrap items-end gap-3 rounded-2xl p-5"
      >
        <label className="flex flex-col gap-1">
          <span className="text-xs text-[var(--text-muted)]">부서</span>
          <select
            name="teamId"
            required
            defaultValue={activeTeamId}
            className="w-48 rounded-md border border-[var(--gridline)] bg-[var(--surface-1)] px-2 py-1.5 text-sm"
          >
            {teams.map((t) => (
              <option key={t.id} value={t.id}>
                {t.nameEn}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-xs text-[var(--text-muted)]">문서번호</span>
          <DocumentNoInput name="documentNoSuffix" inputProps={{ required: true }} />
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-xs text-[var(--text-muted)]">제품명</span>
          <input
            name="productName"
            required
            placeholder="예: 인플루엔자 백신 원액"
            className="w-56 rounded-md border border-[var(--gridline)] bg-[var(--surface-1)] px-2 py-1.5 text-sm"
          />
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-xs text-[var(--text-muted)]">공정소요일 (제조일자 기준, ± 가능)</span>
          <input
            name="offsetDays"
            type="number"
            step="1"
            required
            placeholder="예: 3 또는 -1"
            className="w-40 rounded-md border border-[var(--gridline)] bg-[var(--surface-1)] px-2 py-1.5 text-sm"
          />
        </label>
        <button
          type="submit"
          className="rounded-md bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700"
        >
          등록/수정
        </button>
      </form>

      <div className="surface-card overflow-x-auto rounded-2xl">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-[var(--gridline)] text-xs text-[var(--text-muted)]">
            <tr>
              <th className="px-4 py-3 font-medium">문서번호</th>
              <th className="px-4 py-3 font-medium">제품명</th>
              <th className="px-4 py-3 font-medium">공정소요일</th>
              <th className="px-4 py-3 font-medium">최근 수정자</th>
              <th className="px-4 py-3 font-medium">수정일시</th>
              <th className="px-4 py-3 font-medium"></th>
            </tr>
          </thead>
          <tbody>
            {visibleRules.map((rule) => (
              <tr key={rule.id} className="border-b border-[var(--gridline)] last:border-0">
                <td className="px-4 py-3 font-mono text-xs">{rule.documentNo}</td>
                <td className="px-4 py-3">{rule.productName}</td>
                <td className="tabular px-4 py-3">
                  {rule.offsetDays >= 0 ? `+${rule.offsetDays}일` : `${rule.offsetDays}일`}
                </td>
                <td className="px-4 py-3">{rule.updatedByName}</td>
                <td className="tabular px-4 py-3">{formatDate(rule.updatedAt)}</td>
                <td className="px-4 py-3 text-right">
                  <div className="flex items-center justify-end gap-3">
                    <Link
                      href={`/process-duration/${encodeURIComponent(rule.documentNo)}`}
                      className="inline-block text-xs leading-none text-brand-600 hover:underline"
                    >
                      변경내역
                    </Link>
                    <form action={deleteProcessDurationRule}>
                      <input type="hidden" name="id" value={rule.id} />
                      <button
                        type="submit"
                        className="inline-block p-0 text-xs leading-none text-[var(--status-critical)] hover:underline"
                      >
                        삭제
                      </button>
                    </form>
                  </div>
                </td>
              </tr>
            ))}
            {visibleRules.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-sm text-[var(--text-muted)]">
                  이 부서에 등록된 문서번호가 없습니다.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
