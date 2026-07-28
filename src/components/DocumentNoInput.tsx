// "GC-BR-" 접두사는 고정해서 보여주고, 사용자는 뒤 5자리 숫자만 입력하면 되게 하는 입력 위젯.
// 실제 문서번호는 서버 액션에서 접두사 + 숫자로 재조합한다 (@/lib/documentNo의 toDocumentNo).
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
    <div
      className={`flex items-center rounded-md border border-[var(--gridline)] bg-[var(--surface-1)] ${className}`}
    >
      <span className="pl-2 text-sm text-[var(--text-muted)] select-none">GC-BR-</span>
      <input
        type="text"
        name={name}
        inputMode="numeric"
        pattern="[0-9]{1,5}"
        maxLength={5}
        placeholder="00011"
        defaultValue={defaultValue}
        className="w-16 min-w-0 flex-1 rounded-md bg-transparent px-1 py-1.5 text-sm outline-none"
        {...inputProps}
      />
    </div>
  );
}
