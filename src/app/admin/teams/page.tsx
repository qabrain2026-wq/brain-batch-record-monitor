import { prisma } from "@/lib/db";
import { createTeam, updateTeam, deleteTeam, createPart, updatePart, deletePart } from "../actions";

export const dynamic = "force-dynamic";

export default async function AdminTeamsPage() {
  const teams = await prisma.team.findMany({
    orderBy: { nameEn: "asc" },
    include: { parts: true }
  });

  return (
    <div className="space-y-8">
      <div>
        <h2 className="mb-3 text-sm font-semibold text-[var(--text-secondary)]">
          팀 목록 ({teams.length}) — 조직 개편 시 이름을 바로 수정하세요
        </h2>
        <div className="space-y-4">
          {teams.map((team) => (
            <div key={team.id} className="surface-card rounded-xl p-4">
              <form action={updateTeam} className="flex flex-wrap items-end gap-3">
                <input type="hidden" name="id" value={team.id} />
                <Field label="팀 ID (내부용, 고정)">
                  <input
                    disabled
                    value={team.id}
                    className="w-40 rounded-md border border-[var(--gridline)] bg-transparent px-2 py-1.5 text-sm opacity-60"
                  />
                </Field>
                <Field label="팀명 (국문)">
                  <input
                    name="nameKo"
                    defaultValue={team.nameKo}
                    className="w-40 rounded-md border border-[var(--gridline)] bg-[var(--surface-1)] px-2 py-1.5 text-sm"
                  />
                </Field>
                <Field label="팀명 (영문)">
                  <input
                    name="nameEn"
                    defaultValue={team.nameEn}
                    className="w-64 rounded-md border border-[var(--gridline)] bg-[var(--surface-1)] px-2 py-1.5 text-sm"
                  />
                </Field>
                <button
                  type="submit"
                  className="rounded-md bg-brand-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-brand-700"
                >
                  저장
                </button>
                <form action={deleteTeam}>
                  <input type="hidden" name="id" value={team.id} />
                  <button
                    type="submit"
                    className="rounded-md border border-[var(--border-hairline)] px-3 py-1.5 text-xs text-[var(--status-critical)]"
                  >
                    팀 삭제
                  </button>
                </form>
              </form>

              <div className="mt-3 border-t border-[var(--gridline)] pt-3">
                <p className="mb-2 text-xs font-medium text-[var(--text-muted)]">파트</p>
                <div className="space-y-2">
                  {team.parts.map((part) => (
                    <form key={part.id} action={updatePart} className="flex flex-wrap items-center gap-2">
                      <input type="hidden" name="id" value={part.id} />
                      <input
                        name="nameKo"
                        defaultValue={part.nameKo}
                        className="w-32 rounded-md border border-[var(--gridline)] bg-[var(--surface-1)] px-2 py-1 text-xs"
                      />
                      <input
                        name="nameEn"
                        defaultValue={part.nameEn}
                        className="w-56 rounded-md border border-[var(--gridline)] bg-[var(--surface-1)] px-2 py-1 text-xs"
                      />
                      <button type="submit" className="text-xs text-brand-600 hover:underline">
                        저장
                      </button>
                      <FormButton action={deletePart} id={part.id} label="삭제" danger />
                    </form>
                  ))}
                </div>
                <form action={createPart} className="mt-2 flex flex-wrap items-center gap-2">
                  <input type="hidden" name="teamId" value={team.id} />
                  <input
                    name="nameKo"
                    placeholder="파트명(국문)"
                    required
                    className="w-32 rounded-md border border-[var(--gridline)] bg-[var(--surface-1)] px-2 py-1 text-xs"
                  />
                  <input
                    name="nameEn"
                    placeholder="Part name (EN)"
                    required
                    className="w-56 rounded-md border border-[var(--gridline)] bg-[var(--surface-1)] px-2 py-1 text-xs"
                  />
                  <button type="submit" className="text-xs font-medium text-brand-600 hover:underline">
                    + 파트 추가
                  </button>
                </form>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div>
        <h2 className="mb-3 text-sm font-semibold text-[var(--text-secondary)]">새 팀 추가</h2>
        <form action={createTeam} className="surface-card flex flex-wrap items-end gap-3 rounded-xl p-4">
          <Field label="팀 ID (영문 소문자-하이픈)">
            <input
              name="id"
              required
              placeholder="e.g. new-team"
              className="w-40 rounded-md border border-[var(--gridline)] bg-[var(--surface-1)] px-2 py-1.5 text-sm"
            />
          </Field>
          <Field label="팀명 (국문)">
            <input
              name="nameKo"
              required
              className="w-40 rounded-md border border-[var(--gridline)] bg-[var(--surface-1)] px-2 py-1.5 text-sm"
            />
          </Field>
          <Field label="팀명 (영문)">
            <input
              name="nameEn"
              required
              className="w-64 rounded-md border border-[var(--gridline)] bg-[var(--surface-1)] px-2 py-1.5 text-sm"
            />
          </Field>
          <button
            type="submit"
            className="rounded-md bg-brand-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-brand-700"
          >
            추가
          </button>
        </form>
      </div>
    </div>
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

function FormButton({
  action,
  id,
  label,
  danger
}: {
  action: (formData: FormData) => void;
  id: string;
  label: string;
  danger?: boolean;
}) {
  return (
    <form action={action}>
      <input type="hidden" name="id" value={id} />
      <button
        type="submit"
        className={`text-xs hover:underline ${danger ? "text-[var(--status-critical)]" : "text-brand-600"}`}
      >
        {label}
      </button>
    </form>
  );
}
