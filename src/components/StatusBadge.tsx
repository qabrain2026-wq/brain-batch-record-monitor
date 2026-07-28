import { STATUS_LABELS, ReturnUrgency, dDayLabel, daysUntil } from "@/lib/dates";

export function ProcessStatusBadge({ status }: { status: string }) {
  const label = STATUS_LABELS[status] ?? { ko: status, en: status };
  return (
    <span className="status-pill status-muted" title={label.en}>
      {label.ko}
    </span>
  );
}

// NONE(작성완료 전, 아직 반납기한이 없음)과 SAFE(작성완료 후 기한 여유 있음)는 사용자 입장에서
// "지금 특별히 신경 쓸 게 없다"는 같은 뜻이라 둘 다 "여유"로 표시한다. 다만 SAFE는 실제 반납기한이
// 있으니 D-day를 같이 보여주고, NONE은 기한 자체가 없어 D-day가 나오지 않는다.
const URGENCY_META: Record<ReturnUrgency, { cls: string; label: string }> = {
  NONE: { cls: "status-good", label: "여유" },
  SAFE: { cls: "status-good", label: "여유" },
  IMMINENT: { cls: "status-warning", label: "임박" },
  OVERDUE: { cls: "status-critical", label: "지연" },
  RETURNED_ON_TIME: { cls: "status-good", label: "반납완료(기한준수)" },
  RETURNED_LATE: { cls: "status-critical", label: "반납완료(지연)" }
};

export function ReturnUrgencyBadge({
  urgency,
  dueDate
}: {
  urgency: ReturnUrgency;
  dueDate: Date | null;
}) {
  const meta = URGENCY_META[urgency];
  const isReturned = urgency === "RETURNED_ON_TIME" || urgency === "RETURNED_LATE";
  const days = isReturned ? null : daysUntil(dueDate);
  return (
    <span className={`status-pill ${meta.cls}`}>
      <span>{meta.label}</span>
      {days !== null && <span className="tabular">{dDayLabel(days)}</span>}
    </span>
  );
}
