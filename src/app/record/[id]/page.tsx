import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { getReturnUrgency, formatDate, STATUS_LABELS } from "@/lib/dates";
import { ProcessStatusBadge, ReturnUrgencyBadge } from "@/components/StatusBadge";

export const dynamic = "force-dynamic";

export default async function RecordDetailPage({ params }: { params: { id: string } }) {
  const session = await getSession();
  if (!session) {
    redirect(`/login?next=${encodeURIComponent(`/record/${params.id}`)}`);
  }

  const record = await prisma.batchRecord.findUnique({
    where: { id: params.id },
    include: { team: true }
  });
  if (!record) notFound();

  // 본인인증 후 열람 로그 기록
  await prisma.accessLog.create({
    data: { recordId: record.id, userId: session!.id }
  });

  const urgency = getReturnUrgency(record.status, record.dueDate, record.returnDate);

  const fields: { label: string; value: string }[] = [
    { label: "문서번호", value: record.recordNo },
    { label: "제품명", value: record.productName },
    { label: "제조번호", value: record.batchNo },
    { label: "발행요청일 (G-net)", value: formatDate(record.requestDate) },
    { label: "발행일 (Veeva-EDMS)", value: formatDate(record.issueDate) },
    { label: "배포일", value: formatDate(record.distributeDate) },
    { label: "제조일자", value: formatDate(record.processStartDate) },
    { label: "공정완료일", value: formatDate(record.writeCompleteDate) },
    { label: "반납기한 (공정완료일+5일)", value: formatDate(record.dueDate) },
    { label: "실반납일", value: formatDate(record.returnDate) }
  ];

  return (
    <div className="max-w-2xl space-y-6">
      <p className="text-xs text-[var(--text-muted)]">
        <Link href="/">대시보드</Link> / <Link href={`/team/${record.teamId}`}>{record.team.nameEn}</Link> / 상세
      </p>

      <div className="flex items-center gap-2">
        <h1 className="text-xl font-bold">{record.recordNo}</h1>
        <ProcessStatusBadge status={record.status} />
        <ReturnUrgencyBadge urgency={urgency} dueDate={record.dueDate} />
      </div>

      <div className="surface-card rounded-xl p-5">
        <dl className="grid grid-cols-1 gap-x-6 gap-y-3 sm:grid-cols-2">
          {fields.map((f) => (
            <div key={f.label}>
              <dt className="text-xs text-[var(--text-muted)]">{f.label}</dt>
              <dd className="tabular text-sm font-medium">{f.value}</dd>
            </div>
          ))}
        </dl>
      </div>

      <p className="text-xs text-[var(--text-muted)]">
        {session!.displayName}님의 열람 기록이 남았습니다 ({formatDate(new Date())}). 상태 흐름:{" "}
        {Object.values(STATUS_LABELS).map((s) => s.ko).join(" → ")}
      </p>
    </div>
  );
}
