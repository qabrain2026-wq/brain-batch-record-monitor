import { PrismaClient } from "@prisma/client";
import fs from "node:fs";
import path from "node:path";

const prisma = new PrismaClient();

type ImportRow = {
  recordNo: string;
  productName: string;
  batchNo: string;
  teamId: string;
  status: string;
  issueDate: string;
};

async function main() {
  const jsonPath = path.join(process.cwd(), "scratch_import_data.json");
  const rows: ImportRow[] = JSON.parse(fs.readFileSync(jsonPath, "utf-8"));

  console.log(`불러온 실데이터: ${rows.length}건`);

  // 더미 데이터 정리 (Team/Part/Person/User/DashboardSettings는 유지)
  const deletedAccessLogs = await prisma.accessLog.deleteMany({});
  const deletedRecords = await prisma.batchRecord.deleteMany({});
  const deletedRuleLogs = await prisma.processDurationRuleLog.deleteMany({});
  const deletedRules = await prisma.processDurationRule.deleteMany({});
  const deletedAlertLogs = await prisma.alertLog.deleteMany({});
  console.log(
    `더미 데이터 삭제: BatchRecord ${deletedRecords.count}, AccessLog ${deletedAccessLogs.count}, ProcessDurationRule ${deletedRules.count}, ProcessDurationRuleLog ${deletedRuleLogs.count}, AlertLog ${deletedAlertLogs.count}`
  );

  const BATCH = 200;
  let inserted = 0;
  for (let i = 0; i < rows.length; i += BATCH) {
    const chunk = rows.slice(i, i + BATCH);
    await prisma.batchRecord.createMany({
      data: chunk.map((r) => ({
        recordNo: r.recordNo,
        productName: r.productName,
        batchNo: r.batchNo,
        teamId: r.teamId,
        status: r.status,
        issueDate: new Date(r.issueDate)
      }))
    });
    inserted += chunk.length;
    console.log(`  ${inserted}/${rows.length} 건 입력...`);
  }

  console.log("완료.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
