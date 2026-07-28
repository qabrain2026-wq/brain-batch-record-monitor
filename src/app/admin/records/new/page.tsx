import { prisma } from "@/lib/db";
import { BulkRecordForm } from "@/components/BulkRecordForm";
import { createRecordsBulk } from "../../actions";

export const dynamic = "force-dynamic";

export default async function NewRecordPage() {
  const [teams, rules] = await Promise.all([
    prisma.team.findMany({ orderBy: { nameEn: "asc" } }),
    prisma.processDurationRule.findMany({ select: { documentNo: true, productName: true } })
  ]);

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-sm font-semibold text-[var(--text-secondary)]">제조기록서 발행 등록</h2>
        <p className="mt-1 text-sm text-[var(--text-muted)]">
          제조기록서를 한 번에 여러 건 등록합니다. 문서번호를 입력하면 상단의 &ldquo;BR 정보등록&rdquo;에 등록된
          제품명이 자동으로 채워지고, 제조일자를 넣으면 등록된 공정소요일로 공정완료일·반납기한까지 바로
          계산됩니다. 배포일·반납일은 여기서 다루지 않고, 실제로 그 일이 벌어진 뒤 각 부서 상세 화면에서
          QA가 입력합니다.
        </p>
      </div>
      <BulkRecordForm teams={teams} rules={rules} action={createRecordsBulk} />
    </div>
  );
}
