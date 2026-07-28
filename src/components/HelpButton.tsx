"use client";

import { useEffect, useRef, useState } from "react";

export default function HelpButton() {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onClickOutside(e: MouseEvent) {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, [open]);

  return (
    <div className="relative" ref={rootRef}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label="도움말"
        aria-expanded={open}
        className="flex h-8 w-8 items-center justify-center rounded-full border border-[var(--line)] text-sm font-semibold text-[var(--text-secondary)] transition hover:border-[var(--navy)] hover:text-[var(--navy)]"
      >
        ?
      </button>

      {open && (
        <div className="absolute right-0 top-[calc(100%+0.6rem)] z-50 w-80 rounded-2xl border border-[var(--line)] bg-[var(--card)] p-4 text-sm shadow-xl">
          <p className="font-semibold text-[var(--ink)]">이용 안내</p>
          <ul className="mt-2 list-disc space-y-1.5 pl-4 text-[var(--ink-soft)]">
            <li>공정완료일(제조일자 + 등록된 공정소요일)로부터 5일 이내 QA 반납이 원칙입니다.</li>
            <li>부서 카드에 커서를 올리면 세부 현황이, 클릭하면 전체 목록이 보입니다.</li>
          </ul>

          <p className="mt-3 font-semibold text-[var(--ink)]">로그인</p>
          <ul className="mt-2 list-disc space-y-1.5 pl-4 text-[var(--ink-soft)]">
            <li>제조번호 등 주요 정보는 로그인 전에는 마스킹되어 표시됩니다.</li>
            <li>로그인하면 마스킹이 해제되며, 열람 이력이 자동으로 기록됩니다.</li>
            <li>계정 발급·재설정은 QA 관리자에게 문의해주세요.</li>
          </ul>

          <p className="mt-3 font-semibold text-[var(--ink)]">공정소요일 등록</p>
          <ul className="mt-2 list-disc space-y-1.5 pl-4 text-[var(--ink-soft)]">
            <li>문서번호(GC-BR-NNNNN)별로 제조일자 기준 공정소요일(±일수)을 등록해두면, 공정완료일이 자동 계산됩니다.</li>
            <li>QA 계정뿐 아니라 제조부서 계정도 로그인만 하면 등록·수정할 수 있습니다.</li>
            <li>등록·수정 시 로그인한 사람 이름이 &ldquo;최근 수정자&rdquo;로 남습니다.</li>
          </ul>
        </div>
      )}
    </div>
  );
}
