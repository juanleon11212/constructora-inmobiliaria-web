import { NextResponse } from "next/server";
import { prisma } from "../../../../lib/prisma";

function normalizar(texto: string) {
  return texto
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

const cargosPermitidosPorRol: Record<string, string[]> = {
  "encargado de obra": [
    "ingeniero civil",
    "arquitecto",
    "maestro de obra",
    "albanil",
    "electricista",
    "plomero",
    "topografo",
    "soldador",
    "operador de maquinaria",
    "encargado de seguridad",
    "ayudante de obra",
    "carpintero",
    "residente de obra",
    "pintor",
    "enfierrador",
  ],

  almacen: [
    "almacenero",
    "chofer",
    "auxiliar administrativo",
  ],

  contabilidad: [
    "contador",
    "asistente contable",
    "analista de costos",
  ],

  "recursos humanos": [
    "auxiliar administrativo",
    "encargado de seguridad",
  ],

  compras: [
    "jefe de compras",
    "analista de costos",
    "auxiliar administrativo",
    "chofer",
  ],
};

export async function GET() {
  const rolesEmpresa = await prisma.rol.findMany({
    where: {
      nombre_rol: {
        notIn: ["Administrador", "Cliente"],
      },
    },
    orderBy: {
      id_rol: "asc",
    },
  });

  const cargos = await prisma.cargo.findMany({
    orderBy: {
      id_cargo: "asc",
    },
  });

  const cargosPorRol = rolesEmpresa.map((rol) => {
    const nombreRolNormalizado = normalizar(rol.nombre_rol);
    const cargosPermitidos = cargosPermitidosPorRol[nombreRolNormalizado] ?? [];

    const cargosEmpleado = cargos.filter((cargo) =>
      cargosPermitidos.includes(normalizar(cargo.nombre_cargo))
    );

    return {
      id_rol: rol.id_rol,
      nombre_rol: rol.nombre_rol,
      cargosEmpleado,
    };
  });

  return NextResponse.json({
    rolesEmpresa,
    cargosPorRol,
  });
}