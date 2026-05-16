import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaMssql } from "@prisma/adapter-mssql";

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

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ?? new PrismaClient({ adapter });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}