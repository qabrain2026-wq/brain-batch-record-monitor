import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const form = await req.formData();
  const mode = String(form.get("mode") ?? "writer") === "qa" ? "qa" : "writer";

  // 토글은 어느 페이지에서 눌러도 그 페이지에 그대로 머물러야 함 — referer로 돌아갈 위치를 잡고,
  // 같은 오리진이 아니면(또는 없으면) 안전하게 대시보드로 폴백
  const referer = req.headers.get("referer");
  let redirectTo = new URL("/", req.url);
  if (referer) {
    try {
      const refererUrl = new URL(referer);
      if (refererUrl.origin === new URL(req.url).origin) redirectTo = refererUrl;
    } catch {
      // 무시하고 기본값(대시보드) 사용
    }
  }

  const res = NextResponse.redirect(redirectTo, { status: 303 });
  res.cookies.set("view_mode", mode, {
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
    sameSite: "lax"
  });
  return res;
}
