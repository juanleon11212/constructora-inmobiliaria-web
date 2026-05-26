import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    DEMO_MODE: process.env.DEMO_MODE ?? null,
    DB_SERVER: process.env.DB_SERVER ?? null,
    DB_PORT: process.env.DB_PORT ?? null,
    DB_NAME: process.env.DB_NAME ?? null,
    DB_USER: process.env.DB_USER ?? null,
    DB_PASSWORD_LENGTH: process.env.DB_PASSWORD?.length ?? 0,
    DATABASE_URL_HAS_PASSWORD: process.env.DATABASE_URL?.includes("password=") ?? false,
    DATABASE_URL_HAS_DB_PROD:
      process.env.DATABASE_URL?.includes("constructora_tbd_prod") ?? false,
    DATABASE_URL_HAS_USER:
      process.env.DATABASE_URL?.includes("adminconstructora") ?? false,
  });
}