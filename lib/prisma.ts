import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaMssql } from "@prisma/adapter-mssql";
import { demoPrisma, isDemoMode } from "./demo-prisma";

/*
  CONEXIÓN A PRISMA

  Si DEMO_MODE=true:
  - No conecta a SQL Server.
  - Usa datos falsos de lib/demo-prisma.ts.

  Si DEMO_MODE no está activo:
  - Conecta normalmente a SQL Server.
*/

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function createRealPrismaClient() {
  const adapter = new PrismaMssql({
    server: process.env.DB_SERVER ?? "localhost",
    port: Number(process.env.DB_PORT ?? 1433),
    database: process.env.DB_NAME ?? "constructora_tbd",
    user: process.env.DB_USER ?? "constructora_user",
    password: process.env.DB_PASSWORD ?? "",
    options: {
      encrypt: true,
      trustServerCertificate: true,
    },
  });

  return new PrismaClient({ adapter });
}

export const prisma = isDemoMode()
  ? (demoPrisma as unknown as PrismaClient)
  : globalForPrisma.prisma ?? createRealPrismaClient();

if (!isDemoMode() && process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}