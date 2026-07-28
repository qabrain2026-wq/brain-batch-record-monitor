"use client";

import { useState } from "react";
import { DocumentNoInput } from "@/components/DocumentNoInput";
import { toDocumentNo } from "@/lib/documentNo";

type TeamOption = { id: string; nameEn: string; nameKo: string };
type RuleLookup = { documentNo: string; productName: string };

let nextRowId = 0;

export function BulkRecordForm({
  teams,
  rules,
  action
}: {
  teams: TeamOption[];
  rules: RuleLookup[];
  action: (formData: FormData) => void;
}) {
  const [rowIds, setRowIds] = useState<number[]>(() => Array.from({ length: 5 }, () => nextRowId++));
  const [productNames, setProductNames] = useState<Record<number, string>>({});

  const productByDocumentNo = new Map(rules.map((r) => [r.documentNo, r.productName]));

  function handleSuffixChange(rowId: number, suffix: string) {
    const documentNo = toDocumentNo(suffix);
    const match = documentNo ? productByDocumentNo.get(documentNo) : undefined;
    if (match) {
      setProductNames((prev) => ({ ...prev, [rowId]: match }));
    }
  }

  function addRow() {
    setRowIds((prev) => [...prev, nextRowId++]);
  }

  function removeRow(rowId: number) {
    setRowIds((prev) => prev.filter((id) => id !== rowId));
  }

  return (
    <form action={action} className="space-y-4">
      <input type="hidden" name="rowCount" value={rowIds.length} />

      <div className="surface-card overflow-x-auto rounded-2xl">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-[var(--gridline)] text-xs text-[var(--text-muted)]">
            <tr>
              <th className="px-3 py-2 font-medium">부서</th>
              <th className="px-3 py-2 font-medium">문서번호</th>
              <th className="px-3 py-2 font-medium">제품명</th>
              <th className="px-3 py-2 font-medium">제조번호</th>
              <th className="px-3 py-2 font-medium">제조일자</th>
              <th className="px-3 py-2 font-medium">발행일</th>
              <th className="px-3 py-2 font-medium"></th>
            </tr>
          </thead>
          <tbody>
            {rowIds.map((rowId, i) => (
              <tr key={rowId} className="border-b border-[var(--gridline)] last:border-0">
                <td className="px-3 py-2">
                  <select
                    name={`teamId_${i}`}
                    className="w-40 rounded-md border border-[var(--gridline)] bg-[var(--surface-1)] px-2 py-1.5 text-sm"
                  >
                    <option value="">선택</option>
                    {teams.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.nameEn}
                      </option>
                    ))}
                  </select>
                </td>
                <td className="px-3 py-2">
                  <DocumentNoInput
                    name={`documentNoSuffix_${i}`}
                    inputProps={{
                      onChange: (e) => handleSuffixChange(rowId, e.target.value)
                    }}
                  />
                </td>
                <td className="px-3 py-2">
                  <input
                    name={`productName_${i}`}
                    value={productNames[rowId] ?? ""}
                    onChange={(e) => setProductNames((prev) => ({ ...prev, [rowId]: e.target.value }))}
                    placeholder="문서번호 입력 시 자동 표시"
                    className="w-44 rounded-md border border-[var(--gridline)] bg-[var(--surface-1)] px-2 py-1.5 text-sm"
                  />
                </td>
                <td className="px-3 py-2">
                  <input
                    name={`batchNo_${i}`}
                    placeholder="LOT..."
                    className="w-32 rounded-md border border-[var(--gridline)] bg-[var(--surface-1)] px-2 py-1.5 text-sm"
                  />
                </td>
                <td className="px-3 py-2">
                  <input
                    type="date"
                    name={`processStartDate_${i}`}
                    className="w-[9.5rem] rounded-md border border-[var(--gridline)] bg-[var(--surface-1)] px-2 py-1.5 text-sm"
                  />
                </td>
                <td className="px-3 py-2">
                  <input
                    type="date"
                    name={`issueDate_${i}`}
                    className="w-[9.5rem] rounded-md border border-[var(--gridline)] bg-[var(--surface-1)] px-2 py-1.5 text-sm"
                  />
                </td>
                <td className="px-3 py-2 text-right">
                  {rowIds.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeRow(rowId)}
                      className="text-xs text-[var(--status-critical)] hover:underline"
                    >
                      삭제
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={addRow}
          className="rounded-md border border-[var(--line)] px-3 py-1.5 text-xs font-medium text-[var(--text-secondary)] hover:border-[var(--navy)] hover:text-[var(--navy)]"
        >
          + 행 추가
        </button>
        <button
          type="submit"
          className="rounded-md bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700"
        >
          일괄 등록
        </button>
      </div>
    </form>
  );
}
