import { PrismaClient } from "@prisma/client";
import { PrismaMariaDb } from "@prisma/adapter-mariadb";

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

function makePrismaClient() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) throw new Error("DATABASE_URL is missing in .env");

  const u = new URL(databaseUrl);
  const host = u.hostname || "localhost";
  const port = u.port ? Number(u.port) : 3306;
  const user = decodeURIComponent(u.username || "root");
  const password = decodeURIComponent(u.password || "Mistika123");
  const database = (u.pathname || "/mistika").replace(/^\//, "") || "mistika";

  console.log("[DB]", { host, port, user, database });

  const adapter = new PrismaMariaDb({
    host,
    port,
    user,
    password,
    database,
    connectionLimit: 3, 
  });

  return new PrismaClient({ adapter, log: ["error"] });
}

export const prisma = globalForPrisma.prisma ?? makePrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
