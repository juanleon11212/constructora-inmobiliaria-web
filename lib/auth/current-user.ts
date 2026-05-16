import { prisma } from "../prisma";
import { getSession } from "./session";

export async function getCurrentUser() {
  const session = await getSession();

  if (!session) return null;

  if (session.tipo_cuenta === "empresa" && session.id_usuario) {
    const user = await prisma.usuario.findUnique({
      where: {
        id_usuario: session.id_usuario,
      },
      include: {
        rol: true,
        empleado: true,
      },
    });

    if (!user || user.estado !== "activo") {
      return null;
    }

    return {
      tipo_cuenta: "empresa" as const,
      id_usuario: user.id_usuario,
      id_cliente: null,
      nombre_usuario: user.nombre_usuario,
      correo: user.correo,
      estado: user.estado,
      rol: user.rol,
      empleado: user.empleado,
      cliente: null,
      nombre_mostrar: user.empleado
        ? `${user.empleado.nombres} ${user.empleado.apellidos}`
        : user.nombre_usuario,
    };
  }

  if (session.tipo_cuenta === "cliente" && session.id_cliente) {
    const cliente = await prisma.cliente.findUnique({
      where: {
        id_cliente: session.id_cliente,
      },
      include: {
        rol: true,
      },
    });

    if (!cliente || cliente.estado_cuenta !== "activo") {
      return null;
    }

    return {
      tipo_cuenta: "cliente" as const,
      id_usuario: null,
      id_cliente: cliente.id_cliente,
      nombre_usuario: cliente.nombre_usuario ?? "",
      correo: cliente.correo,
      estado: cliente.estado_cuenta,
      rol: cliente.rol,
      empleado: null,
      cliente,
      nombre_mostrar:
        cliente.razon_social ??
        `${cliente.nombres ?? ""} ${cliente.apellidos ?? ""}`.trim(),
    };
  }

  return null;
}