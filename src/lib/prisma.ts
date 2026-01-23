import "server-only";
import { PrismaClient } from "@prisma/client";
import { PrismaMariaDb } from "@prisma/adapter-mariadb";

const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient;
};

/**
 * Creates a singleton Prisma Client instance configured for MariaDB
 * Uses PrismaMariaDb adapter for MariaDB-specific connection handling
 */
function makePrismaClient() {
  // Get connection details from environment variables
  const host = process.env.DATABASE_HOST || process.env.MARIADB_HOST || "localhost";
  const port = Number(process.env.DATABASE_PORT || process.env.MARIADB_PORT || 3306);
  const user = process.env.DATABASE_USER || process.env.MARIADB_USER || "root";
  const password = process.env.DATABASE_PASSWORD || process.env.MARIADB_PASSWORD || "";
  const database = process.env.DATABASE_NAME || process.env.MARIADB_DATABASE || "mistika";

  if (!host || !user || !database) {
    throw new Error(
      "Missing required database configuration. Please check your .env file"
    );
  }

  console.log("[DB] MariaDB Connection", { host, port, user, database });

  // Use PrismaMariaDb adapter for MariaDB-specific optimizations
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

// Singleton pattern: reuse the same instance across requests
export const prisma = globalForPrisma.prisma ?? makePrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
