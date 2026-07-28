import { prisma } from "@/lib/db";

export const PERIOD_PRESETS = [
  { value: "ALL", label: "전체" },
  { value: "THIS_MONTH", label: "이번 달" },
  { value: "LAST_3_MONTHS", label: "최근 3개월" },
  { value: "LAST_6_MONTHS", label: "최근 6개월" },
  { value: "THIS_YEAR", label: "올해" },
  { value: "CUSTOM", label: "직접 입력" }
] as const;

export type PeriodRange = { start: Date | null; end: Date | null; label: string };

function startOfMonth(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}
function startOfYear(d: Date) {
  return new Date(d.getFullYear(), 0, 1);
}
function monthsAgo(d: Date, n: number) {
  return new Date(d.getFullYear(), d.getMonth() - n, d.getDate());
}

// 대시보드 집계에 쓸 기간(발행요청일 기준)을 관리자 설정에서 읽어온다. 설정이 없으면 "전체".
export async function getActivePeriod(): Promise<PeriodRange> {
  const settings = await prisma.dashboardSettings.findUnique({ where: { id: "singleton" } });
  const periodType = settings?.periodType ?? "ALL";
  const now = new Date();

  switch (periodType) {
    case "THIS_MONTH":
      return { start: startOfMonth(now), end: null, label: "이번 달" };
    case "LAST_3_MONTHS":
      return { start: monthsAgo(now, 3), end: null, label: "최근 3개월" };
    case "LAST_6_MONTHS":
      return { start: monthsAgo(now, 6), end: null, label: "최근 6개월" };
    case "THIS_YEAR":
      return { start: startOfYear(now), end: null, label: "올해" };
    case "CUSTOM":
      return { start: settings?.customStart ?? null, end: settings?.customEnd ?? null, label: "직접 설정" };
    default:
      return { start: null, end: null, label: "전체" };
  }
}
