import { STATUS_LABELS, formatDate } from "@/lib/dates";

type TeamOption = { id: string; nameEn: string; nameKo: string };

type RecordValues = {
  id?: string;
  teamId?: string;
  recordNo?: string;
  productName?: string;
  batchNo?: string;
  status?: string;
  requestDate?: Date | null;
  issueDate?: Date | null;
  distributeDate?: Date | null;
  processStartDate?: Date | null;
  writeCompleteDate?: Date | null;
  returnDate?: Date | null;
};

function toInputDate(d: Date | null | undefined) {
  if (!d) return "";
  return new Date(d).toISOString().slice(0, 10);
}

export function RecordForm({
  teams,
  record,
  action,
  submitLabel
}: {
  teams: TeamOption[];
  record?: RecordValues;
  action: (formData: FormData) => void;
  submitLabel: string;
}) {
  return (
    <form action={action} className="surface-card max-w-2xl space-y-4 rounded-xl p-6">
      {record?.id && <input type="hidden" name="id" value={record.id} />}

      <div className="grid grid-cols-2 gap-4">
        <Field label="부서">
          <select
            name="teamId"
            required
            defaultValue={record?.teamId}
            className="w-full rounded-md border border-[var(--gridline)] bg-[var(--surface-1)] px-2 py-1.5 text-sm"
          >
            <option value="" disabled>
              선택하세요
            </option>
            {teams.map((t) => (
              <option key={t.id} value={t.id}>
                {t.nameEn} ({t.nameKo})
              </option>
            ))}
          </select>
        </Field>

        <Field label="진행상태">
          <select
            name="status"
            defaultValue={record?.status ?? "REQUESTED"}
            className="w-full rounded-md border border-[var(--gridline)] bg-[var(--surface-1)] px-2 py-1.5 text-sm"
          >
            {Object.entries(STATUS_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label.ko}
              </option>
            ))}
          </select>
        </Field>

        <Field label="문서번호 (제조기록서 번호)">
          <input
            name="recordNo"
            required
            placeholder="예: CC-GC-BR-01772-7-0-0016"
            defaultValue={record?.recordNo}
            className="w-full rounded-md border border-[var(--gridline)] bg-[var(--surface-1)] px-2 py-1.5 text-sm"
          />
        </Field>

        <Field label="제품명">
          <input
            name="productName"
            required
            defaultValue={record?.productName}
            className="w-full rounded-md border border-[var(--gridline)] bg-[var(--surface-1)] px-2 py-1.5 text-sm"
          />
        </Field>

        <Field label="제조번호">
          <input
            name="batchNo"
            required
            defaultValue={record?.batchNo}
            className="w-full rounded-md border border-[var(--gridline)] bg-[var(--surface-1)] px-2 py-1.5 text-sm"
          />
        </Field>
      </div>

      <div className="border-t border-[var(--gridline)] pt-4">
        <p className="mb-2 text-xs font-medium text-[var(--text-muted)]">
          일자 (공정완료일은 제조일자 + 등록된 공정소요일로 자동 계산되고, 반납기한은 공정완료일 + 5일입니다)
        </p>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
          <Field label="발행요청일 (G-net)">
            <DateInput name="requestDate" value={record?.requestDate} />
          </Field>
          <Field label="발행일 (Veeva-EDMS)">
            <DateInput name="issueDate" value={record?.issueDate} />
          </Field>
          <Field label="배포일">
            <DateInput name="distributeDate" value={record?.distributeDate} />
          </Field>
          <Field label="제조일자">
            <DateInput name="processStartDate" value={record?.processStartDate} />
          </Field>
          <Field label="실반납일">
            <DateInput name="returnDate" value={record?.returnDate} />
          </Field>
        </div>
        <p className="mt-3 text-xs text-[var(--text-muted)]">
          공정완료일:{" "}
          <span className="tabular font-medium text-[var(--text-secondary)]">
            {formatDate(record?.writeCompleteDate)}
          </span>{" "}
          ·
          문서번호별 공정소요일은{" "}
          <a href="/process-duration" className="font-medium text-brand-600 hover:underline">
            공정소요일 등록
          </a>{" "}
          화면에서 관리하세요.
        </p>
      </div>

      <button
        type="submit"
        className="rounded-md bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700"
      >
        {submitLabel}
      </button>
    </form>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-xs text-[var(--text-muted)]">{label}</span>
      {children}
    </label>
  );
}

function DateInput({ name, value }: { name: string; value?: Date | null }) {
  return (
    <input
      type="date"
      name={name}
      defaultValue={toInputDate(value)}
      className="w-full rounded-md border border-[var(--gridline)] bg-[var(--surface-1)] px-2 py-1.5 text-sm"
    />
  );
}
