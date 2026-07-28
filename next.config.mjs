import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Windows에서 상위 폴더(예: C:\ 드라이브 루트)까지 파일 추적을 시도해
  // DumpStack.log.tmp / pagefile.sys 등에 EINVAL 오류를 내는 문제 방지.
  outputFileTracingRoot: __dirname
};

export default nextConfig;
