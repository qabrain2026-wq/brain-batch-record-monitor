export const STATUS_LABELS: Record<string, { ko: string; en: string }> = {
  REQUESTED: { ko: "발행요청", en: "Requested" },
  ISSUED: { ko: "발행완료", en: "Issued" },
  DISTRIBUTED: { ko: "배포완료", en: "Distributed" },
  WRITE_COMPLETE: { ko: "작성완료", en: "Write Complete" },
  RETURNED: { ko: "반납완료", en: "Returned" }
};

export type ReturnUrgency =
  | "NONE"
  | "SAFE"
  | "IMMINENT"
  | "OVERDUE"
  | "RETURNED_ON_TIME"
  | "RETURNED_LATE";

/**
 * dueDate/returnDate 대비 상태 계산.
 * - 반납완료 건은 실제 반납일이 기한을 넘겼는지로 "정시/지연"을 구분한다
 *   (반납이 끝났다고 해서 지연 이력 자체가 사라지는 건 아니므로 통계에도 반영).
 * - 작성완료 전(dueDate 없음)이면 NONE.
 */
export function getReturnUrgency(
  status: string,
  dueDate: Date | null,
  returnDate?: Date | null
): ReturnUrgency {
  if (status === "RETURNED") {
    if (!dueDate || !returnDate) return "RETURNED_ON_TIME";
    return startOfDay(new Date(returnDate)) > startOfDay(new Date(dueDate))
      ? "RETURNED_LATE"
      : "RETURNED_ON_TIME";
  }
  if (!dueDate) return "NONE";

  const today = startOfDay(new Date());
  const due = startOfDay(new Date(dueDate));
  const diffDays = Math.round((due.getTime() - today.getTime()) / 86400000);

  if (diffDays < 0) return "OVERDUE";
  if (diffDays <= 1) return "IMMINENT"; // D-day, D-1
  return "SAFE";
}

export function daysUntil(dueDate: Date | null): number | null {
  if (!dueDate) return null;
  const today = startOfDay(new Date());
  const due = startOfDay(new Date(dueDate));
  return Math.round((due.getTime() - today.getTime()) / 86400000);
}

function startOfDay(d: Date) {
  const copy = new Date(d);
  copy.setHours(0, 0, 0, 0);
  return copy;
}

export function addDays(base: Date, days: number): Date {
  const d = new Date(base);
  d.setDate(d.getDate() + days);
  return d;
}

export function formatDate(d: Date | null | undefined): string {
  if (!d) return "-";
  const date = new Date(d);
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function dDayLabel(days: number | null): string {
  if (days === null) return "-";
  if (days === 0) return "D-DAY";
  if (days > 0) return `D-${days}`;
  return `D+${Math.abs(days)}`;
}
