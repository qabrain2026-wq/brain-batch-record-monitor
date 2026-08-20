// Veeva 문서번호는 CC-GC-BR-01772-7-0-0016 처럼 형식이 다양해 고정 접두사로 재구성할 수 없다.
// 입력값 앞뒤 공백만 정리해서 그대로 사용한다.
export function normalizeDocumentNo(input: string) {
  return input.trim();
}
