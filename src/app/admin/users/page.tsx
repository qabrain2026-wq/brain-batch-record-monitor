import { prisma } from "@/lib/db";
import { createUser, updateUser, deleteUser } from "../actions";

export const dynamic = "force-dynamic";

export default async function AdminUsersPage() {
  const [users, teams] = await Promise.all([
    prisma.user.findMany({ orderBy: { createdAt: "asc" }, include: { team: true } }),
    prisma.team.findMany({ orderBy: { nameEn: "asc" } })
  ]);

  return (
    <div className="space-y-6">
      <p className="text-sm text-[var(--text-muted)]">
        담당자 교체가 잦은 조직 특성상, 계정은 이 화면에서 직접 추가/비활성화합니다. 관리자(admin)는 전체 관리,
        일반(viewer)은 열람 전용입니다.
      </p>

      <div className="surface-card overflow-x-auto rounded-xl">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-[var(--gridline)] text-xs text-[var(--text-muted)]">
            <tr>
              <th className="px-4 py-3 font-medium">아이디</th>
              <th className="px-4 py-3 font-medium">이름</th>
              <th className="px-4 py-3 font-medium">권한</th>
              <th className="px-4 py-3 font-medium">소속 팀</th>
              <th className="px-4 py-3 font-medium">비밀번호 재설정</th>
              <th className="px-4 py-3 font-medium">활성</th>
              <th className="px-4 py-3 font-medium"></th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id} className="border-b border-[var(--gridline)] last:border-0">
                <td colSpan={7} className="p-0">
                  <form action={updateUser} className="grid grid-cols-7 items-center gap-2 px-4 py-2">
                    <input type="hidden" name="id" value={u.id} />
                    <span className="font-mono text-xs">{u.username}</span>
                    <input
                      name="displayName"
                      defaultValue={u.displayName}
                      className="rounded-md border border-[var(--gridline)] bg-[var(--surface-1)] px-2 py-1 text-sm"
                    />
                    <select
                      name="role"
                      defaultValue={u.role}
                      className="rounded-md border border-[var(--gridline)] bg-[var(--surface-1)] px-2 py-1 text-sm"
                    >
                      <option value="viewer">viewer</option>
                      <option value="admin">admin</option>
                    </select>
                    <select
                      name="teamId"
                      defaultValue={u.teamId ?? ""}
                      className="rounded-md border border-[var(--gridline)] bg-[var(--surface-1)] px-2 py-1 text-sm"
                    >
                      <option value="">(전체/무소속)</option>
                      {teams.map((t) => (
                        <option key={t.id} value={t.id}>
                          {t.nameEn}
                        </option>
                      ))}
                    </select>
                    <input
                      name="password"
                      type="password"
                      placeholder="새 비밀번호(선택)"
                      className="rounded-md border border-[var(--gridline)] bg-[var(--surface-1)] px-2 py-1 text-sm"
                    />
                    <label className="flex items-center gap-1 text-xs text-[var(--text-muted)]">
                      <input type="checkbox" name="active" defaultChecked={u.active} />
                      활성
                    </label>
                    <div className="flex gap-2">
                      <button
                        type="submit"
                        className="rounded-md bg-brand-600 px-2 py-1 text-xs font-semibold text-white hover:bg-brand-700"
                      >
                        저장
                      </button>
                    </div>
                  </form>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div>
        <h2 className="mb-3 text-sm font-semibold text-[var(--text-secondary)]">계정 삭제</h2>
        <div className="surface-card flex flex-wrap gap-2 rounded-xl p-4">
          {users.map((u) => (
            <form key={u.id} action={deleteUser}>
              <input type="hidden" name="id" value={u.id} />
              <button
                type="submit"
                className="rounded-md border border-[var(--border-hairline)] px-2 py-1 text-xs text-[var(--status-critical)]"
              >
                {u.username} 삭제
              </button>
            </form>
          ))}
        </div>
      </div>

      <div>
        <h2 className="mb-3 text-sm font-semibold text-[var(--text-secondary)]">새 계정 추가</h2>
        <form action={createUser} className="surface-card flex flex-wrap items-end gap-3 rounded-xl p-4">
          <Field label="아이디">
            <input
              name="username"
              required
              className="w-32 rounded-md border border-[var(--gridline)] bg-[var(--surface-1)] px-2 py-1.5 text-sm"
            />
          </Field>
          <Field label="이름">
            <input
              name="displayName"
              required
              className="w-32 rounded-md border border-[var(--gridline)] bg-[var(--surface-1)] px-2 py-1.5 text-sm"
            />
          </Field>
          <Field label="초기 비밀번호">
            <input
              name="password"
              type="password"
              required
              className="w-32 rounded-md border border-[var(--gridline)] bg-[var(--surface-1)] px-2 py-1.5 text-sm"
            />
          </Field>
          <Field label="권한">
            <select
              name="role"
              className="w-28 rounded-md border border-[var(--gridline)] bg-[var(--surface-1)] px-2 py-1.5 text-sm"
            >
              <option value="viewer">viewer</option>
              <option value="admin">admin</option>
            </select>
          </Field>
          <Field label="소속 팀">
            <select
              name="teamId"
              className="w-48 rounded-md border border-[var(--gridline)] bg-[var(--surface-1)] px-2 py-1.5 text-sm"
            >
              <option value="">(전체/무소속)</option>
              {teams.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.nameEn}
                </option>
              ))}
            </select>
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
