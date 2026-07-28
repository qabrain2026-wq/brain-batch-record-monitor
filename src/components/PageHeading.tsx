// 어느 페이지에 있든 상단 바는 흔들림 없이 항상 같은 타이틀을 보여준다.
export default function PageHeading() {
  return (
    <h1 className="truncate text-center text-[24px] font-bold text-[var(--ink)] sm:text-[26px]">
      화순공장 제조기록서 반납 현황
    </h1>
  );
}
