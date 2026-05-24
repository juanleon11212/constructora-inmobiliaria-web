import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaMssql } from "@prisma/adapter-mssql";
import { demoPrisma, isDemoMode } from "./demo-prisma";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function requiredEnv(name: string) {
  const value = process.env[name];

  if (!value) {
    throw new Error(`Falta la variable de entorno: ${name}`);
  }

  return value;
}

function createRealPrismaClient() {
  const adapter = new PrismaMssql({
    server: requiredEnv("DB_SERVER"),
    port: Number(process.env.DB_PORT ?? 1433),
    database: requiredEnv("DB_NAME"),
    user: requiredEnv("DB_USER"),
    password: requiredEnv("DB_PASSWORD"),
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