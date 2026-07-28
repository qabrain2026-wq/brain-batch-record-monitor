"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { toDocumentNo } from "@/lib/documentNo";

async function assertLoggedIn() {
  const session = await getSession();
  if (!session) throw new Error("로그인이 필요합니다.");
  return session;
}

function addDays(base: Date, days: number) {
  const d = new Date(base);
  d.setDate(d.getDate() + days);
  return d;
}

// QA와 제조부서 계정 모두 등록/수정 가능 — 관리자 권한 아님, 로그인만 되어 있으면 됨.
// 저장 시 마지막 수정자 이름을 같이 남기고(로그 목적), 이미 존재하는 같은 문서번호의
// 배치기록이 있다면 공정완료일/반납기한을 즉시 재계산한다.
export async function upsertProcessDurationRule(formData: FormData) {
  const session = await assertLoggedIn();
  const documentNo = toDocumentNo(String(formData.get("documentNoSuffix") ?? ""));
  const teamId = String(formData.get("teamId") ?? "").trim();
  const productName = String(formData.get("productName") ?? "").trim();
  const offsetDaysRaw = String(formData.get("offsetDays") ?? "").trim();
  const offsetDays = Number(offsetDaysRaw);
  if (!documentNo || !teamId || !productName || !Number.isFinite(offsetDays)) return;

  await prisma.processDurationRule.upsert({
    where: { documentNo },
    update: { teamId, productName, offsetDays, updatedByName: session.displayName },
    create: { documentNo, teamId, productName, offsetDays, updatedByName: session.displayName }
  });

  await prisma.processDurationRuleLog.create({
    data: { documentNo, action: "UPSERT", offsetDays, changedByName: session.displayName }
  });

  const matches = await prisma.batchRecord.findMany({ where: { recordNo: documentNo } });
  for (const r of matches) {
    if (!r.processStartDate) continue;
    const writeCompleteDate = addDays(r.processStartDate, offsetDays);
    const dueDate = addDays(writeCompleteDate, 5);
    await prisma.batchRecord.update({
      where: { id: r.id },
      data: {
        writeCompleteDate,
        dueDate,
        status: r.status === "RETURNED" ? r.status : "WRITE_COMPLETE"
      }
    });
  }

  revalidatePath("/process-duration");
  revalidatePath("/");
  revalidatePath("/teams");
  revalidatePath("/admin/records");
}

export async function deleteProcessDurationRule(formData: FormData) {
  const session = await assertLoggedIn();
  const id = String(formData.get("id") ?? "");
  if (!id) return;

  const rule = await prisma.processDurationRule.findUnique({ where: { id } });
  if (!rule) return;

  await prisma.processDurationRule.delete({ where: { id } }).catch(() => undefined);
  await prisma.processDurationRuleLog.create({
    data: { documentNo: rule.documentNo, action: "DELETE", changedByName: session.displayName }
  });

  revalidatePath("/process-duration");
}
