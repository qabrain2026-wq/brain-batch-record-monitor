import { prisma } from "@/lib/db";
import { createPerson, updatePerson, deletePerson } from "../actions";

export const dynamic = "force-dynamic";

function DeleteButton({ id }: { id: string }) {
  return (
    <form action={deletePerson}>
      <input type="hidden" name="id" value={id} />
      <button type="submit" className="text-xs text-[var(--status-critical)] hover:underline">
        삭제
      </button>
    </form>
  );
}

export default async function AdminPeoplePage() {
  const teams = await prisma.team.findMany({
    orderBy: { nameEn: "asc" },
    include: { people: { orderBy: { name: "asc" } } }
  });

  return (
    <div className="space-y-6">
      <p className="text-sm text-[var(--text-muted)]">
        각 부서에서 기한임박 알림 메일을 받을 담당자를 등록합니다. 담당자가 바뀌면 여기서 바로 갱신하세요.
      </p>

      {teams.map((team) => (
        <div key={team.id} className="surface-card rounded-xl p-4">
          <p className="mb-3 font-semibold">
            {team.nameEn} <span className="ml-1 text-xs font-normal text-[var(--text-muted)]">{team.nameKo}</span>
          </p>

          <div className="space-y-2">
            {team.people.map((p) => (
              <form key={p.id} action={updatePerson} className="flex flex-wrap items-center gap-2 text-sm">
                <input type="hidden" name="id" value={p.id} />
                <input
                  name="name"
                  defaultValue={p.name}
                  className="w-32 rounded-md border border-[var(--gridline)] bg-[var(--surface-1)] px-2 py-1 text-sm"
                />
                <input
                  name="email"
                  type="email"
                  defaultValue={p.email}
                  className="w-56 rounded-md border border-[var(--gridline)] bg-[var(--surface-1)] px-2 py-1 text-sm"
                />
                <label className="flex items-center gap-1 text-xs text-[var(--text-muted)]">
                  <input type="checkbox" name="active" defaultChecked={p.active} />
                  수신 활성화
                </label>
                <button type="submit" className="text-xs font-medium text-brand-600 hover:underline">
                  저장
                </button>
                <DeleteButton id={p.id} />
              </form>
            ))}
            {team.people.length === 0 && (
              <p className="text-xs text-[var(--text-muted)]">등록된 수신자가 없습니다.</p>
            )}
          </div>

          <form action={createPerson} className="mt-3 flex flex-wrap items-center gap-2 border-t border-[var(--gridline)] pt-3">
            <input type="hidden" name="teamId" value={team.id} />
            <input
              name="name"
              placeholder="이름"
              required
              className="w-32 rounded-md border border-[var(--gridline)] bg-[var(--surface-1)] px-2 py-1 text-sm"
            />
            <input
              name="email"
              type="email"
              placeholder="이메일"
              required
              className="w-56 rounded-md border border-[var(--gridline)] bg-[var(--surface-1)] px-2 py-1 text-sm"
            />
            <button type="submit" className="text-xs font-medium text-brand-600 hover:underline">
              + 담당자 추가
            </button>
          </form>
        </div>
      ))}
    </div>
  );
}
