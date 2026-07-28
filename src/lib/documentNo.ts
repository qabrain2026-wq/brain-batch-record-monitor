// 제조기록서 문서번호 체계: GC-BR-NNNNN (뒤 5자리 숫자)
export function toDocumentNo(suffix: string) {
  const digits = suffix.trim().replace(/\D/g, "").slice(0, 5);
  return digits ? `GC-BR-${digits.padStart(5, "0")}` : "";
}

export function documentNoSuffix(documentNo: string) {
  return documentNo.replace(/^GC-BR-/, "");
}
