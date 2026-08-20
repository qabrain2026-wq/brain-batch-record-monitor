// Veeva 문서번호 체계가 CC-GC-BR-01772-7-0-0016 처럼 다양한 형태라 접두사를 고정할 수 없다.
// 그래서 전체 문서번호를 그대로 입력받는다.
export function DocumentNoInput({
  name,
  defaultValue,
  className = "",
  inputProps
}: {
  name: string;
  defaultValue?: string;
  className?: string;
  inputProps?: React.InputHTMLAttributes<HTMLInputElement>;
}) {
  return (
    <input
      type="text"
      name={name}
      placeholder="예: CC-GC-BR-01772-7-0-0016"
      defaultValue={defaultValue}
      className={`w-56 rounded-md border border-[var(--gridline)] bg-[var(--surface-1)] px-2 py-1.5 text-sm font-mono ${className}`}
      {...inputProps}
    />
  );
}
