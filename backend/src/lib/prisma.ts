import net from "node:net";
if (net.setDefaultAutoSelectFamily) {
  net.setDefaultAutoSelectFamily(false);
}
import dns from "node:dns";
try {
  dns.setDefaultResultOrder("ipv4first");
} catch {}

import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";
import { Pool } from "pg";
import dotenv from "dotenv";

dotenv.config();

function cleanConnectionString(raw?: string): string {
  if (!raw) return "";
  let res = raw.trim();
  if (res.toLowerCase().startsWith("psql ")) {
    res = res.slice(5).trim();
  }
  if (
    (res.startsWith('"') && res.endsWith('"')) ||
    (res.startsWith("'") && res.endsWith("'"))
  ) {
    res = res.slice(1, -1).trim();
  }
  return res;
}

let connectionString =
  cleanConnectionString(process.env.DATABASE_URL) ||
  cleanConnectionString(process.env.DIRECT_URL) ||
  "postgresql://wiseman:sokolink_pass@localhost:5432/sokolink?schema=public";

if (connectionString.includes("sslmode=require") && !connectionString.includes("uselibpqcompat=")) {
  connectionString += connectionString.includes("?") ? "&uselibpqcompat=true" : "?uselibpqcompat=true";
}

const isNeonOrSsl =
  connectionString.includes("neon.tech") ||
  connectionString.includes("sslmode=require") ||
  process.env.NODE_ENV === "production";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
  pool: Pool | undefined;
};

const pool =
  globalForPrisma.pool ??
  new Pool({
    connectionString,
    ssl: isNeonOrSsl ? { rejectUnauthorized: false } : undefined,
  });
const adapter = new PrismaPg(pool);

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
  globalForPrisma.pool = pool;
}
