import nodemailer from "nodemailer";
import { formatDate } from "@/lib/dates";

export type AlertRecordSummary = {
  recordNo: string;
  productName: string;
  batchNo: string;
  dueDate: Date | null;
  daysLeft: number | null;
};

function getTransport() {
  const host = process.env.SMTP_HOST;
  if (!host) return null;

  return nodemailer.createTransport({
    host,
    port: Number(process.env.SMTP_PORT ?? "587"),
    secure: process.env.SMTP_SECURE === "true",
    auth: process.env.SMTP_USER
      ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
      : undefined
  });
}

export function buildAlertEmailHtml(teamNameKo: string, records: AlertRecordSummary[]) {
  const rows = records
    .map((r) => {
      const dday =
        r.daysLeft === null
          ? "-"
          : r.daysLeft < 0
          ? `<span style="color:#d1372f;font-weight:600">D+${Math.abs(r.daysLeft)} 지연</span>`
          : r.daysLeft <= 1
          ? `<span style="color:#c9760a;font-weight:600">D-${r.daysLeft}</span>`
          : `D-${r.daysLeft}`;
      return `<tr>
        <td style="padding:6px 10px;border-bottom:1px solid #eee">${r.recordNo}</td>
        <td style="padding:6px 10px;border-bottom:1px solid #eee">${r.productName}</td>
        <td style="padding:6px 10px;border-bottom:1px solid #eee">${formatDate(r.dueDate)}</td>
        <td style="padding:6px 10px;border-bottom:1px solid #eee">${dday}</td>
      </tr>`;
    })
    .join("");

  return `
  <div style="font-family:Malgun Gothic,Arial,sans-serif;font-size:14px;color:#222">
    <p><b>[${teamNameKo}]</b> 제조기록서 반납기한 임박/초과 안내입니다.</p>
    <p>공정완료일로부터 5일 이내 QA로 반납이 필요합니다. 아래 목록을 확인하여 조속히 반납 부탁드립니다.</p>
    <table style="border-collapse:collapse;width:100%;margin-top:12px">
      <thead>
        <tr style="background:#f3f5fb">
          <th style="padding:6px 10px;text-align:left">문서번호</th>
          <th style="padding:6px 10px;text-align:left">제품명</th>
          <th style="padding:6px 10px;text-align:left">반납기한</th>
          <th style="padding:6px 10px;text-align:left">잔여일</th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>
    <p style="margin-top:16px;color:#666">본 메일은 제조기록서 반납 모니터링 시스템에서 자동 발송되었습니다.</p>
  </div>`;
}

export async function sendAlertMail(opts: {
  to: string[];
  teamNameKo: string;
  records: AlertRecordSummary[];
}) {
  const transport = getTransport();
  const subject = `[반납기한 알림] ${opts.teamNameKo} - 제조기록서 ${opts.records.length}건`;
  const html = buildAlertEmailHtml(opts.teamNameKo, opts.records);

  if (!transport) {
    // SMTP 미설정 시: 실제 발송 대신 콘솔 로그로 대체 (프로토타입 안전장치)
    console.warn("[mailer] SMTP_HOST가 설정되지 않아 실제 발송을 건너뜁니다.", {
      to: opts.to,
      subject
    });
    return { simulated: true };
  }

  await transport.sendMail({
    from: process.env.SMTP_FROM || "brain-monitor@gccorp.com",
    to: opts.to.join(","),
    subject,
    html
  });

  return { simulated: false };
}
