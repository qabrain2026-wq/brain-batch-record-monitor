export default function LoginPage({
  searchParams
}: {
  searchParams: { error?: string; next?: string };
}) {
  const next = searchParams.next || "/";

  return (
    <div className="mx-auto max-w-sm">
      <h1 className="text-lg font-bold">본인인증 로그인</h1>
      <p className="mt-1 text-sm text-[var(--text-muted)]">
        로그인하면 마스킹된 제조번호를 열람할 수 있으며, 열람 이력이 기록됩니다.
      </p>

      {searchParams.error && (
        <p className="mt-4 rounded-md bg-[var(--status-critical)]/10 px-3 py-2 text-sm text-[var(--status-critical)]">
          아이디 또는 비밀번호가 올바르지 않습니다.
        </p>
      )}

      <form action="/api/auth/login" method="post" className="mt-4 space-y-3">
        <input type="hidden" name="next" value={next} />
        <div>
          <label className="mb-1 block text-sm text-[var(--text-secondary)]">아이디</label>
          <input
            name="username"
            required
            className="w-full rounded-md border border-[var(--gridline)] bg-[var(--surface-1)] px-3 py-2 text-sm outline-none focus:border-brand-500"
            autoComplete="username"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm text-[var(--text-secondary)]">비밀번호</label>
          <input
            type="password"
            name="password"
            required
            className="w-full rounded-md border border-[var(--gridline)] bg-[var(--surface-1)] px-3 py-2 text-sm outline-none focus:border-brand-500"
            autoComplete="current-password"
          />
        </div>
        <button
          type="submit"
          className="w-full rounded-md bg-brand-600 px-3 py-2 text-sm font-semibold text-white hover:bg-brand-700"
        >
          로그인
        </button>
      </form>

      <p className="mt-6 text-xs text-[var(--text-muted)]">
        계정이 없으신가요? 부서 관리자(QA)에게 발급을 요청하세요.
      </p>
    </div>
  );
}
