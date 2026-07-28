import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import fs from "node:fs";
import path from "node:path";

const prisma = new PrismaClient();

type TeamSeed = {
  id: string;
  nameKo: string;
  nameEn: string;
  site?: string;
  parts: { nameKo: string; nameEn: string }[];
};

function addDays(base: Date, days: number) {
  const d = new Date(base);
  d.setDate(d.getDate() + days);
  return d;
}

// 팀마다 다른(하지만 재시드해도 항상 같은) 더미 데이터를 만들기 위한 결정론적 PRNG.
function mulberry32(seed: number) {
  return function random() {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
function hashStr(s: string) {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (Math.imul(h, 31) + s.charCodeAt(i)) | 0;
  return h;
}

const PRODUCTS = [
  "인플루엔자 백신 원액",
  "수두 백신 원액",
  "디프테리아-파상풍 백신",
  "탄저 백신",
  "BCG 백신",
  "혼합 백신 완제"
];

function pick<T>(arr: T[], i: number): T {
  return arr[i % arr.length];
}

async function main() {
  const dataPath = path.join(process.cwd(), "data", "teams-2025.json");
  const raw = fs.readFileSync(dataPath, "utf-8");
  const parsed = JSON.parse(raw) as { teams: TeamSeed[] };

  console.log(`Seeding ${parsed.teams.length} teams...`);

  let order = 0;
  for (const t of parsed.teams) {
    order += 1;
    await prisma.team.upsert({
      where: { id: t.id },
      update: {
        nameKo: t.nameKo,
        nameEn: t.nameEn,
        siteTag: t.site ?? null,
        order
      },
      create: {
        id: t.id,
        nameKo: t.nameKo,
        nameEn: t.nameEn,
        siteTag: t.site ?? null,
        order
      }
    });

    await prisma.part.deleteMany({ where: { teamId: t.id } });
    for (const p of t.parts) {
      await prisma.part.create({
        data: { teamId: t.id, nameKo: p.nameKo, nameEn: p.nameEn }
      });
    }
  }

  // --- 로그인 계정 (관리자 / 부서 담당자) ---
  const adminHash = await bcrypt.hash("admin1234!", 10);
  await prisma.user.upsert({
    where: { username: "admin" },
    update: { passwordHash: adminHash, role: "admin", displayName: "시스템 관리자" },
    create: {
      username: "admin",
      passwordHash: adminHash,
      displayName: "시스템 관리자",
      role: "admin"
    }
  });

  const sampleViewerTeam = parsed.teams.find((t) => t.id === "flu");
  if (sampleViewerTeam) {
    const viewerHash = await bcrypt.hash("flu1234!", 10);
    await prisma.user.upsert({
      where: { username: "flu" },
      update: { passwordHash: viewerHash, role: "viewer", teamId: "flu", displayName: "플루팀 담당자(샘플)" },
      create: {
        username: "flu",
        passwordHash: viewerHash,
        displayName: "플루팀 담당자(샘플)",
        role: "viewer",
        teamId: "flu"
      }
    });
  }

  // --- 부서별 알림 수신자(샘플) ---
  const mainTeams = parsed.teams.filter((t) => !t.site);
  for (const t of mainTeams) {
    const existing = await prisma.person.count({ where: { teamId: t.id } });
    if (existing === 0) {
      await prisma.person.createMany({
        data: [
          { teamId: t.id, name: `${t.nameKo} 담당자1`, email: `${t.id}.lead@gccorp.com` },
          { teamId: t.id, name: `${t.nameKo} 담당자2`, email: `${t.id}.member@gccorp.com` }
        ]
      });
    }
  }

  // --- 샘플 제조기록서 데이터 ---
  await prisma.accessLog.deleteMany({});
  await prisma.alertLog.deleteMany({});
  await prisma.processDurationRuleLog.deleteMany({});
  await prisma.processDurationRule.deleteMany({});
  await prisma.batchRecord.deleteMany({});

  const today = new Date();
  let seq = 1;

  type DraftRecord = {
    status: string;
    requestDate: Date | null;
    issueDate: Date | null;
    distributeDate: Date | null;
    processStartDate?: Date | null;
    writeCompleteDate: Date | null;
    dueDate: Date | null;
    returnDate: Date | null;
  };

  // 실제 제조기록서 번호 체계: GC-BR-NNNNN (전사 공통 일련번호)
  async function createRecord(teamId: string, draft: DraftRecord) {
    const record = await prisma.batchRecord.create({
      data: {
        recordNo: `GC-BR-${String(seq).padStart(5, "0")}`,
        productName: pick(PRODUCTS, seq),
        batchNo: `LOT${today.getFullYear()}${String(seq).padStart(5, "0")}`,
        teamId,
        ...draft
      }
    });
    seq += 1;
    return record;
  }

  const IN_USE_STATUSES = ["REQUESTED", "ISSUED", "DISTRIBUTED"];

  for (const t of mainTeams) {
    // 팀 id로 고정된 시드를 써서, 재시드해도 팀마다 항상 같은(그러나 서로 다른) 분포가 나오게 함
    const rng = mulberry32(hashStr(t.id) ^ 0x9e3779b9);
    const risk = rng(); // 이 팀이 반납을 얼마나 자주 지연시키는지 (0=매우 양호 ~ 1=위험)

    // 1) 과거에 정상적으로 반납 완료된 건들 (팀마다 건수가 다르게)
    const returnedCount = 2 + Math.floor(rng() * 8); // 2~9건
    for (let i = 0; i < returnedCount; i++) {
      const writeCompleteDate = addDays(today, -(10 + Math.floor(rng() * 60)));
      const requestDate = addDays(writeCompleteDate, -(5 + Math.floor(rng() * 3)));
      const issueDate = addDays(requestDate, 2);
      const distributeDate = addDays(issueDate, 1);
      const dueDate = addDays(writeCompleteDate, 5);
      // 반납은 했지만 기한을 넘겨서 늦게 반납한 이력도 팀 위험도에 비례해서 섞어준다
      const wasLate = rng() < risk * 0.4;
      const returnDate = wasLate
        ? addDays(writeCompleteDate, 6 + Math.floor(rng() * 5)) // 기한(+5일) 이후 반납
        : addDays(writeCompleteDate, 1 + Math.floor(rng() * 3)); // 기한 내 반납
      await createRecord(t.id, {
        status: "RETURNED",
        requestDate,
        issueDate,
        distributeDate,
        writeCompleteDate,
        dueDate,
        returnDate
      });
    }

    // 2) 현재 사용부서가 사용중인(아직 작성완료 전) 건들
    const inUseCount = 1 + Math.floor(rng() * 3); // 1~3건
    for (let i = 0; i < inUseCount; i++) {
      const status = IN_USE_STATUSES[i % IN_USE_STATUSES.length];
      const requestDate = addDays(today, -(1 + Math.floor(rng() * 4)));
      const issueDate = status === "REQUESTED" ? null : addDays(requestDate, 2);
      const distributeDate = status === "DISTRIBUTED" ? addDays(issueDate!, 1) : null;
      await createRecord(t.id, {
        status,
        requestDate,
        issueDate,
        distributeDate,
        writeCompleteDate: null,
        dueDate: null,
        returnDate: null
      });
    }

    // 3) 작성완료 후 반납 대기중인 건들 — risk가 높은 팀일수록 지연 비중이 커짐
    const activeCount = 1 + Math.floor(rng() * 3); // 1~3건
    for (let i = 0; i < activeCount; i++) {
      const roll = rng();
      let writeCompleteOffset: number;
      if (roll < risk * 0.55) {
        writeCompleteOffset = -(6 + Math.floor(rng() * 10)); // 지연 (기한 1~10일 경과)
      } else if (roll < risk * 0.55 + 0.3) {
        writeCompleteOffset = rng() < 0.5 ? -5 : -4; // 임박 (D-0 ~ D-1)
      } else {
        writeCompleteOffset = -(1 + Math.floor(rng() * 3)); // 여유
      }

      const writeCompleteDate = addDays(today, writeCompleteOffset);
      const requestDate = addDays(writeCompleteDate, -(5 + Math.floor(rng() * 3)));
      const issueDate = addDays(requestDate, 2);
      const distributeDate = addDays(issueDate, 1);
      const dueDate = addDays(writeCompleteDate, 5);
      // 문서번호별 공정소요일 등록 예시가 비어 보이지 않도록, 제조일자 + 소요일 조합을 같이 심어둔다
      const durationOffset = 1 + Math.floor(rng() * 4); // 1~4일
      const processStartDate = addDays(writeCompleteDate, -durationOffset);
      const record = await createRecord(t.id, {
        status: "WRITE_COMPLETE",
        requestDate,
        issueDate,
        distributeDate,
        processStartDate,
        writeCompleteDate,
        dueDate,
        returnDate: null
      });
      await prisma.processDurationRule.upsert({
        where: { documentNo: record.recordNo },
        update: {
          teamId: t.id,
          productName: record.productName,
          offsetDays: durationOffset,
          updatedByName: "QA 담당자(샘플)"
        },
        create: {
          documentNo: record.recordNo,
          teamId: t.id,
          productName: record.productName,
          offsetDays: durationOffset,
          updatedByName: "QA 담당자(샘플)"
        }
      });
      await prisma.processDurationRuleLog.create({
        data: {
          documentNo: record.recordNo,
          action: "UPSERT",
          offsetDays: durationOffset,
          changedByName: "QA 담당자(샘플)"
        }
      });
    }
  }

  console.log("Seed complete.");
  console.log("Login: admin / admin1234!  (관리자, 전체 관리)");
  console.log("Login: flu / flu1234!      (샘플 부서 담당자, 열람 전용)");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
