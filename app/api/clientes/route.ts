import { NextResponse } from "next/server";
import { prisma } from "../../../lib/prisma";

export async function GET() {
  const clientes = await prisma.cliente.findMany({
    take: 10,
    orderBy: {
      id_cliente: "desc",
    },
  });

  return NextResponse.json(clientes);
}