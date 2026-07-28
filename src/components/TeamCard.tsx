import Link from "next/link";
import { TeamCounts } from "@/lib/teamCounts";

export type { TeamCounts };

function tierOf(counts: TeamCounts): "critical" | "warning" | "good" | "neutral" {
  if (counts.overdue > 0) return "critical";
  if (counts.imminent > 0) return "warning";
  // "사용중"도 "여유"와 같은 뜻(당장 신경 쓸 게 없음)으로 보므로 둘 다 green 처리
  if (counts.safe > 0 || counts.inProgress > 0) return "good";
  return "neutral";
}

export function TeamCard({
  id,
  nameEn,
  nameKo,
  counts
}: {
  id: string;
  nameEn: string;
  nameKo: string;
  counts: TeamCounts;
}) {
  const tier = tierOf(counts);
  const completed = counts.returnedOnTime + counts.returnedLate;
  // 지연율은 현재 지연 중인 건 + 이미 반납했지만 늦게 반납한 건까지 합쳐서, 누적 기준으로 계산
  const lifetimeLate = counts.overdue + counts.returnedLate;
  const overdueRate = counts.total > 0 ? Math.round((lifetimeLate / counts.total) * 100) : 0;

  return (
    <Link
      href={`/team/${id}`}
      className={`tile-${tier} group relative block overflow-hidden rounded-2xl p-4 transition hover:-translate-y-0.5 hover:shadow-lg hover:shadow-black/10`}
    >
      <div>
        <p className="text-base font-semibold text-[var(--ink)]">{nameEn}</p>
        <p className="text-sm text-[var(--ink-soft)]">{nameKo}</p>
      </div>

      <div className="mt-2.5 grid grid-cols-2 gap-2">
        <Stat label="지연" value={counts.overdue} textCls="text-[var(--status-critical)]" />
        <Stat label="임박" value={counts.imminent} textCls="text-[var(--status-warning)]" />
      </div>

      {/* 호버 시 세부 현황 오버레이 */}
      <div className="pointer-events-none absolute inset-0 z-10 flex flex-col items-center justify-center gap-1.5 rounded-2xl bg-[var(--card)]/95 p-4 text-center opacity-0 backdrop-blur-sm transition-opacity duration-150 group-hover:opacity-100">
        <p className="text-sm font-semibold text-[var(--ink)]">{nameEn}</p>
        <p className="tabular text-xs text-[var(--ink-soft)]">
          총 {counts.total}건 중 완료 {completed}건
          <span className="text-[var(--ink-mute)]"> (정시 {counts.returnedOnTime} · 지연반납 {counts.returnedLate})</span>
        </p>
        <p className="tabular text-xs">
          <span className="text-[var(--status-critical)]">현재 지연 {counts.overdue}건</span>
          <span className="mx-1 text-[var(--ink-mute)]">·</span>
          <span className="text-[var(--ink-soft)]">누적 지연율 {overdueRate}%</span>
        </p>
      </div>
    </Link>
  );
}

function Stat({ label, value, textCls }: { label: string; value: number; textCls: string }) {
  return (
    <div className="tile-chip flex items-center justify-center gap-1.5 rounded-lg py-1.5">
      <span className={`tabular text-base font-semibold ${textCls}`}>{value}</span>
      <span className="text-sm text-[var(--ink-soft)]">{label}</span>
    </div>
  );
}
