import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaMssql } from "@prisma/adapter-mssql";
import { demoPrisma, isDemoMode } from "./demo-prisma";

/*
  CONEXIÓN DE PRISMA

  Si DEMO_MODE=true:
  - Usa datos demo.
  - No necesita SQL Server.
  - Sirve para tus amigos.

  Si DEMO_MODE=false:
  - Usa SQL Server real.
  - Sirve para tu computadora.
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