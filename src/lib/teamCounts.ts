import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { getReturnUrgency } from "@/lib/dates";
import { PeriodRange } from "@/lib/dashboardPeriod";

export type TeamCounts = {
  overdue: number;
  imminent: number;
  safe: number;
  inProgress: number;
  returnedOnTime: number;
  returnedLate: number;
  total: number;
};

export function emptyCounts(): TeamCounts {
  return {
    overdue: 0,
    imminent: 0,
    safe: 0,
    inProgress: 0,
    returnedOnTime: 0,
    returnedLate: 0,
    total: 0
  };
}

// range를 주면 발행요청일(requestDate) 기준으로 집계 범위를 제한한다 (관리자 "집계 기간 설정").
export async function getTeamCountsMap(range?: PeriodRange): Promise<Map<string, TeamCounts>> {
  const where: Prisma.BatchRecordWhereInput = {};
  if (range?.start || range?.end) {
    where.requestDate = {
      ...(range.start ? { gte: range.start } : {}),
      ...(range.end ? { lte: range.end } : {})
    };
  }

  const records = await prisma.batchRecord.findMany({
    where,
    select: { teamId: true, status: true, dueDate: true, returnDate: true }
  });

  const map = new Map<string, TeamCounts>();
  for (const r of records) {
    if (!map.has(r.teamId)) map.set(r.teamId, emptyCounts());
    const counts = map.get(r.teamId)!;
    counts.total += 1;

    const urgency = getReturnUrgency(r.status, r.dueDate, r.returnDate);
    if (urgency === "OVERDUE") counts.overdue += 1;
    else if (urgency === "IMMINENT") counts.imminent += 1;
    else if (urgency === "SAFE") counts.safe += 1;
    else if (urgency === "NONE") counts.inProgress += 1;
    else if (urgency === "RETURNED_ON_TIME") counts.returnedOnTime += 1;
    else if (urgency === "RETURNED_LATE") counts.returnedLate += 1;
  }
  return map;
}
