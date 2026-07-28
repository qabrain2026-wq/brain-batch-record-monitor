"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { getReturnUrgency } from "@/lib/dates";
import { sendAlertMail, AlertRecordSummary } from "@/lib/mailer";
import { toDocumentNo } from "@/lib/documentNo";

async function assertAdmin() {
  const admin = await requireAdmin();
  if (!admin) throw new Error("관리자 권한이 필요합니다.");
  return admin;
}

function str(fd: FormData, key: string) {
  return String(fd.get(key) ?? "").trim();
}

function dateOrNull(fd: FormData, key: string) {
  const v = str(fd, key);
  return v ? new Date(v) : null;
}

// ---------- Teams ----------

export async function createTeam(formData: FormData) {
  await assertAdmin();
  const id = str(formData, "id");
  const nameKo = str(formData, "nameKo");
  const nameEn = str(formData, "nameEn");
  if (!id || !nameKo || !nameEn) return;

  const count = await prisma.team.count();
  await prisma.team.create({
    data: { id, nameKo, nameEn, order: count + 1 }
  });
  revalidatePath("/admin/teams");
  revalidatePath("/");
}

export async function updateTeam(formData: FormData) {
  await assertAdmin();
  const id = str(formData, "id");
  const nameKo = str(formData, "nameKo");
  const nameEn = str(formData, "nameEn");
  if (!id) return;

  await prisma.team.update({ where: { id }, data: { nameKo, nameEn } });
  revalidatePath("/admin/teams");
  revalidatePath("/");
}

export async function deleteTeam(formData: FormData) {
  await assertAdmin();
  const id = str(formData, "id");
  if (!id) return;
  await prisma.team.delete({ where: { id } }).catch(() => undefined);
  revalidatePath("/admin/teams");
  revalidatePath("/");
}

export async function createPart(formData: FormData) {
  await assertAdmin();
  const teamId = str(formData, "teamId");
  const nameKo = str(formData, "nameKo");
  const nameEn = str(formData, "nameEn");
  if (!teamId || !nameKo || !nameEn) return;

  await prisma.part.create({ data: { teamId, nameKo, nameEn } });
  revalidatePath("/admin/teams");
}

export async function updatePart(formData: FormData) {
  await assertAdmin();
  const id = str(formData, "id");
  const nameKo = str(formData, "nameKo");
  const nameEn = str(formData, "nameEn");
  if (!id) return;

  await prisma.part.update({ where: { id }, data: { nameKo, nameEn } });
  revalidatePath("/admin/teams");
}

export async function deletePart(formData: FormData) {
  await assertAdmin();
  const id = str(formData, "id");
  if (!id) return;
  await prisma.part.delete({ where: { id } }).catch(() => undefined);
  revalidatePath("/admin/teams");
}

// ---------- People (alert recipients) ----------

export async function createPerson(formData: FormData) {
  await assertAdmin();
  const teamId = str(formData, "teamId");
  const name = str(formData, "name");
  const email = str(formData, "email");
  if (!teamId || !name || !email) return;

  await prisma.person.create({ data: { teamId, name, email } });
  revalidatePath("/admin/people");
}

export async function updatePerson(formData: FormData) {
  await assertAdmin();
  const id = str(formData, "id");
  const name = str(formData, "name");
  const email = str(formData, "email");
  const active = formData.get("active") === "on";
  if (!id) return;

  await prisma.person.update({ where: { id }, data: { name, email, active } });
  revalidatePath("/admin/people");
}

export async function deletePerson(formData: FormData) {
  await assertAdmin();
  const id = str(formData, "id");
  if (!id) return;
  await prisma.person.delete({ where: { id } }).catch(() => undefined);
  revalidatePath("/admin/people");
}

// ---------- Users (login accounts) ----------

export async function createUser(formData: FormData) {
  await assertAdmin();
  const username = str(formData, "username");
  const password = str(formData, "password");
  const displayName = str(formData, "displayName");
  const role = str(formData, "role") === "admin" ? "admin" : "viewer";
  const teamId = str(formData, "teamId") || null;
  if (!username || !password || !displayName) return;

  const passwordHash = await bcrypt.hash(password, 10);
  await prisma.user.create({
    data: { username, passwordHash, displayName, role, teamId }
  });
  revalidatePath("/admin/users");
}

export async function updateUser(formData: FormData) {
  await assertAdmin();
  const id = str(formData, "id");
  const displayName = str(formData, "displayName");
  const role = str(formData, "role") === "admin" ? "admin" : "viewer";
  const teamId = str(formData, "teamId") || null;
  const active = formData.get("active") === "on";
  const newPassword = str(formData, "password");
  if (!id) return;

  const data: Record<string, unknown> = { displayName, role, teamId, active };
  if (newPassword) {
    data.passwordHash = await bcrypt.hash(newPassword, 10);
  }

  await prisma.user.update({ where: { id }, data });
  revalidatePath("/admin/users");
}

export async function deleteUser(formData: FormData) {
  await assertAdmin();
  const id = str(formData, "id");
  if (!id) return;
  await prisma.user.delete({ where: { id } }).catch(() => undefined);
  revalidatePath("/admin/users");
}

// ---------- Batch records ----------

// 문서번호(recordNo)에 등록된 공정소요일 규칙으로 공정완료일을 계산. 규칙이 없으면 null.
async function resolveWriteCompleteDate(recordNo: string, processStartDate: Date | null) {
  if (!processStartDate) return null;
  const rule = await prisma.processDurationRule.findUnique({ where: { documentNo: recordNo } });
  return rule ? addDays(processStartDate, rule.offsetDays) : null;
}

// 제조기록서 발행 등록 — 발행/작성완료 단계의 제조기록서를 여러 건 한 번에 등록.
// 제조일자를 넣으면 문서번호에 등록된 공정소요일로 공정완료일·반납기한까지 바로 계산된다.
// 배포일·반납일은 실제로 그 일이 벌어진 뒤 팀 상세 화면에서 QA가 입력한다.
export async function createRecordsBulk(formData: FormData) {
  await assertAdmin();
  const rowCount = Number(str(formData, "rowCount") || "0");

  for (let i = 0; i < rowCount; i++) {
    const teamId = str(formData, `teamId_${i}`);
    const recordNo = toDocumentNo(str(formData, `documentNoSuffix_${i}`));
    const productName = str(formData, `productName_${i}`);
    const batchNo = str(formData, `batchNo_${i}`);
    const processStartDate = dateOrNull(formData, `processStartDate_${i}`);
    const issueDate = dateOrNull(formData, `issueDate_${i}`);
    if (!teamId || !recordNo || !productName || !batchNo) continue;

    const writeCompleteDate = await resolveWriteCompleteDate(recordNo, processStartDate);
    const dueDate = writeCompleteDate ? addDays(writeCompleteDate, 5) : null;
    const status = writeCompleteDate ? "WRITE_COMPLETE" : issueDate ? "ISSUED" : "REQUESTED";

    await prisma.batchRecord.create({
      data: {
        teamId,
        recordNo,
        productName,
        batchNo,
        status,
        issueDate,
        processStartDate,
        writeCompleteDate,
        dueDate
      }
    });
  }

  revalidatePath("/admin/records");
  revalidatePath("/");
  redirect("/admin/records");
}

export async function updateRecord(formData: FormData) {
  await assertAdmin();
  const id = str(formData, "id");
  const teamId = str(formData, "teamId");
  const recordNo = str(formData, "recordNo");
  const productName = str(formData, "productName");
  const batchNo = str(formData, "batchNo");
  const status = str(formData, "status");
  const requestDate = dateOrNull(formData, "requestDate");
  const issueDate = dateOrNull(formData, "issueDate");
  const distributeDate = dateOrNull(formData, "distributeDate");
  const processStartDate = dateOrNull(formData, "processStartDate");
  const returnDate = dateOrNull(formData, "returnDate");
  if (!id) return;

  const writeCompleteDate = await resolveWriteCompleteDate(recordNo, processStartDate);
  const dueDate = writeCompleteDate ? addDays(writeCompleteDate, 5) : null;

  await prisma.batchRecord.update({
    where: { id },
    data: {
      teamId,
      recordNo,
      productName,
      batchNo,
      status,
      requestDate,
      issueDate,
      distributeDate,
      processStartDate,
      writeCompleteDate,
      dueDate,
      returnDate
    }
  });
  revalidatePath("/admin/records");
  revalidatePath("/");
  revalidatePath(`/record/${id}`);
}

export async function deleteRecord(formData: FormData) {
  await assertAdmin();
  const id = str(formData, "id");
  if (!id) return;
  await prisma.batchRecord.delete({ where: { id } }).catch(() => undefined);
  revalidatePath("/admin/records");
  revalidatePath("/");
}

function addDays(base: Date, days: number) {
  const d = new Date(base);
  d.setDate(d.getDate() + days);
  return d;
}

// 팀 상세 화면에서 QA가 전체 수정 폼을 열지 않고도 바로 저장할 수 있도록,
// 제조일자/반납일 두 개만 빠르게 업데이트하는 전용 액션 — 둘 다 제조부서가 아니라
// QA가 직접 확인하고 입력하는 값이다. 공정완료일은 문서번호별 등록된 소요일로 자동 계산되고,
// 반납기한 재계산 및 상태 전환도 같이 처리한다.
export async function updateProcessDates(formData: FormData) {
  await assertAdmin();
  const id = str(formData, "id");
  const teamId = str(formData, "teamId");
  const processStartDate = dateOrNull(formData, "processStartDate");
  const returnDate = dateOrNull(formData, "returnDate");
  if (!id) return;

  const record = await prisma.batchRecord.findUnique({ where: { id } });
  if (!record) return;

  const writeCompleteDate = await resolveWriteCompleteDate(record.recordNo, processStartDate);
  const dueDate = writeCompleteDate ? addDays(writeCompleteDate, 5) : null;

  const data: {
    processStartDate: Date | null;
    writeCompleteDate: Date | null;
    dueDate: Date | null;
    returnDate: Date | null;
    status?: string;
  } = { processStartDate, writeCompleteDate, dueDate, returnDate };

  // 반납일이 채워지면 반납완료로, 공정완료일만 계산되면 작성완료 상태로 전환
  if (returnDate) data.status = "RETURNED";
  else if (writeCompleteDate) data.status = "WRITE_COMPLETE";

  await prisma.batchRecord.update({ where: { id }, data });

  revalidatePath(`/team/${teamId}`);
  revalidatePath("/");
  revalidatePath(`/record/${id}`);
  revalidatePath("/admin/records");
}

// ---------- Alerts ----------

async function sendAlertForTeam(teamId: string, sentByName: string) {
  const team = await prisma.team.findUnique({ where: { id: teamId } });
  if (!team) return;

  const recipients = await prisma.person.findMany({ where: { teamId, active: true } });
  if (recipients.length === 0) return;

  const records = await prisma.batchRecord.findMany({ where: { teamId } });
  const targets = records.filter((r) => {
    const urgency = getReturnUrgency(r.status, r.dueDate);
    return urgency === "IMMINENT" || urgency === "OVERDUE";
  });
  if (targets.length === 0) return;

  const summaries: AlertRecordSummary[] = targets.map((r) => ({
    recordNo: r.recordNo,
    productName: r.productName,
    batchNo: r.batchNo,
    dueDate: r.dueDate,
    daysLeft: r.dueDate
      ? Math.round((new Date(r.dueDate).setHours(0, 0, 0, 0) - new Date().setHours(0, 0, 0, 0)) / 86400000)
      : null
  }));

  await sendAlertMail({
    to: recipients.map((p) => p.email),
    teamNameKo: team.nameKo,
    records: summaries
  });

  await prisma.alertLog.create({
    data: {
      teamId,
      sentBy: sentByName,
      recipients: recipients.map((p) => p.email).join(","),
      recordIds: targets.map((r) => r.id).join(",")
    }
  });
}

export async function sendTeamAlert(formData: FormData) {
  const admin = await assertAdmin();
  const teamId = str(formData, "teamId");
  if (!teamId) return;

  await sendAlertForTeam(teamId, admin.displayName);

  revalidatePath("/admin");
  revalidatePath("/admin/logs");
  revalidatePath("/");
}

// 임박·지연 건이 있는 모든 부서에 한 번에 발송
export async function sendAllTeamAlerts() {
  const admin = await assertAdmin();
  const teams = await prisma.team.findMany();
  for (const team of teams) {
    await sendAlertForTeam(team.id, admin.displayName);
  }

  revalidatePath("/admin");
  revalidatePath("/admin/logs");
  revalidatePath("/");
}

// ---------- Dashboard period ----------

export async function updateDashboardPeriod(formData: FormData) {
  const admin = await assertAdmin();
  const periodType = str(formData, "periodType") || "ALL";
  const customStart = dateOrNull(formData, "customStart");
  const customEnd = dateOrNull(formData, "customEnd");

  await prisma.dashboardSettings.upsert({
    where: { id: "singleton" },
    update: { periodType, customStart, customEnd, updatedByName: admin.displayName },
    create: { id: "singleton", periodType, customStart, customEnd, updatedByName: admin.displayName }
  });

  revalidatePath("/");
  revalidatePath("/teams");
  revalidatePath("/admin/period");
}
