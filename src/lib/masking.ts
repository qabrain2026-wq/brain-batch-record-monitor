/**
 * 미인증 사용자에게 노출되는 제조번호/문서번호 마스킹 처리.
 * 앞 3자만 노출하고 나머지는 별표 처리 (전체 길이 유추 방지 위해 최소 6자 고정).
 */
export function maskCode(value: string): string {
  if (!value) return "";
  const visible = value.slice(0, 3);
  return `${visible}${"*".repeat(Math.max(6, value.length - 3))}`;
}

export function maskProductName(value: string): string {
  if (!value) return "";
  if (value.length <= 2) return "*".repeat(value.length);
  return `${value.slice(0, 2)}${"*".repeat(value.length - 2)}`;
}
