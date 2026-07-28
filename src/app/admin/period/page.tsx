import { prisma } from "@/lib/db";
import { PERIOD_PRESETS } from "@/lib/dashboardPeriod";
import { formatDate } from "@/lib/dates";
import { updateDashboardPeriod } from "../actions";

export const dynamic = "force-dynamic";

function toInputDate(d: Date | null | undefined) {
  if (!d) return "";
  return new Date(d).toISOString().slice(0, 10);
}

export default async function DashboardPeriodPage() {
  const settings = await prisma.dashboardSettings.findUnique({ where: { id: "singleton" } });
  const currentType = settings?.periodType ?? "ALL";

  return (
    <div className="max-w-xl space-y-4">
      <p className="text-sm text-[var(--text-muted)]">
        대시보드(홈)와 전체부서 현황의 집계 수치는 발행요청일 기준으로 이 기간 안의 제조기록서만
        모아서 계산됩니다. "전체"를 선택하면 기간 제한 없이 전부 집계합니다.
      </p>

      <form action={updateDashboardPeriod} className="surface-card space-y-4 rounded-2xl p-5">
        <div className="flex flex-wrap gap-2">
          {PERIOD_PRESETS.map((p) => (
            <label
              key={p.value}
              className="flex items-center gap-1.5 rounded-full border border-[var(--gridline)] px-3 py-1.5 text-sm has-[:checked]:border-[var(--navy)] has-[:checked]:bg-[var(--navy)] has-[:checked]:text-white"
            >
              <input
                type="radio"
                name="periodType"
                value={p.value}
                defaultChecked={currentType === p.value}
                className="sr-only"
              />
              {p.label}
            </label>
          ))}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <label className="flex flex-col gap-1">
            <span className="text-xs text-[var(--text-muted)]">직접 입력 — 시작일</span>
            <input
              type="date"
              name="customStart"
              defaultValue={toInputDate(settings?.customStart)}
              className="rounded-md border border-[var(--gridline)] bg-[var(--surface-1)] px-2 py-1.5 text-sm"
            />
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-xs text-[var(--text-muted)]">직접 입력 — 종료일</span>
            <input
              type="date"
              name="customEnd"
              defaultValue={toInputDate(settings?.customEnd)}
              className="rounded-md border border-[var(--gridline)] bg-[var(--surface-1)] px-2 py-1.5 text-sm"
            />
          </label>
        </div>

        <button
          type="submit"
          className="rounded-md bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700"
        >
          저장
        </button>

        {settings?.updatedByName && (
          <p className="text-xs text-[var(--text-muted)]">
            최근 수정: {settings.updatedByName} · {formatDate(settings.updatedAt)}
          </p>
        )}
      </form>
    </div>
  );
}
