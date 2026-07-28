type OverdueTeam = { id: string; nameEn: string; overdue: number };

export default function WriterGuidance({ overdueTeams }: { overdueTeams: OverdueTeam[] }) {
  const hasOverdue = overdueTeams.length > 0;

  return (
    <section className="surface-card space-y-3 rounded-2xl p-5 text-base">
      <h2 className="text-lg font-semibold text-[var(--ink)]">
        {hasOverdue ? "반납기한 지연 부서" : "작성부서 안내"}
      </h2>

      {hasOverdue ? (
        <div className="flex flex-wrap gap-2">
          {overdueTeams.map((t) => (
            <span key={t.id} className="status-pill status-pill-lg status-critical">
              {t.nameEn} 지연 {t.overdue}
            </span>
          ))}
        </div>
      ) : (
        <p className="text-[var(--ink-soft)]">현재 반납기한이 지난 부서가 없습니다.</p>
      )}

      <p className="leading-relaxed text-[var(--ink-soft)]">
        <a
          href="https://gccorp-quality.veevavault.com/ui/#permalink=V190000000H3009"
          target="_blank"
          rel="noopener noreferrer"
          className="font-medium text-brand-600 hover:underline"
        >
          GC-WI-00597 &lsquo;제조 및 포장기록서 발행, 기록, 검토, 반납 및 보관 [화순]&rsquo;
        </a>
        에 따라, 반납 기한을 준수하지 못한 경우
      </p>
      <p className="leading-relaxed text-[var(--ink-soft)]">
        <a
          href="https://gccorp-quality.veevavault.com/ui/#permalink=V190000000H3008"
          target="_blank"
          rel="noopener noreferrer"
          className="font-medium text-brand-600 hover:underline"
        >
          GC-SOP-05102 &lsquo;이벤트관리 [화순]&rsquo;
        </a>
        에 명시된{" "}
        {hasOverdue ? (
          <span className="text-blink-critical">이벤트 발생보고를 해야 합니다.</span>
        ) : (
          <span>이벤트 발생보고를 해야 합니다.</span>
        )}
      </p>

      <p className="text-base text-[var(--ink-mute)]">
        이벤트 발생보고는{" "}
        <a
          href="http://qms.greencross.dom/qms/"
          target="_blank"
          rel="noopener noreferrer"
          className="font-medium text-brand-600 hover:underline"
        >
          QMS
        </a>
        를 통해 실시합니다.
      </p>
    </section>
  );
}
