import { NextResponse } from "next/server";
import { prisma } from "../../../lib/prisma";

export async function GET() {
  try {
    const proyectos = await prisma.proyecto.findMany({
      where: {
        estado: {
          not: "eliminado",
        },
      },
      orderBy: {
        id_proyecto: "desc",
      },
    });

    return NextResponse.json({
      ok: true,
      proyectos,
    });
  } catch (error) {
    console.error("Error al obtener proyectos:", error);

    return NextResponse.json(
      {
        ok: false,
        message: "Error al obtener proyectos.",
      },
      {
        status: 500,
      }
    );
  }
}